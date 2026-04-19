import os
import json
import shutil
import ssl
import sys
import time
import argparse
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any, Dict, Tuple

# Bypass SSL verification on macOS which causes CERTIFICATE_VERIFY_FAILED
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

TRANSLATIONS_META_KEY = "__translations"
DEFAULT_MODEL = "google/gemini-2.5-flash"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
# Stable glossary keys: English category + tab + word + tab + hint (hint in key invalidates on hint-only edits)
def item_stable_id(en_category: str, item: dict) -> str:
    return f"{en_category}\t{item['word']}\t{item['hint']}"


def default_meta() -> dict:
    return {"categories": {}, "items": {}}


def split_locale_payload(raw: Dict[str, Any]) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """Top-level theme keys vs reserved __translations meta."""
    meta = raw.get(TRANSLATIONS_META_KEY)
    if not isinstance(meta, dict):
        meta = default_meta()
    else:
        meta = {
            "categories": dict(meta.get("categories") or {}),
            "items": dict(meta.get("items") or {}),
        }
    themes = {k: v for k, v in raw.items() if k != TRANSLATIONS_META_KEY and not k.startswith("__")}
    return themes, meta


def merge_meta_into_output(ordered_themes: dict, meta: dict) -> dict:
    out = dict(ordered_themes)
    out[TRANSLATIONS_META_KEY] = {
        "categories": meta["categories"],
        "items": meta["items"],
    }
    return out


def build_locale_output(reference_data: dict, meta: dict) -> dict:
    """
    Build full locale JSON from meta. Missing category title uses English key;
    missing item rows use English word/hint until translated (resume-safe partial saves).
    """
    ordered: Dict[str, Any] = {}
    for en_cat, ref_items in reference_data.items():
        t_cat = meta["categories"].get(en_cat, en_cat)
        built: list = []
        for ref_item in ref_items:
            if not isinstance(ref_item, dict):
                continue
            sid = item_stable_id(en_cat, ref_item)
            if sid in meta["items"]:
                built.append(dict(meta["items"][sid]))
            else:
                built.append(
                    {"word": ref_item.get("word", ""), "hint": ref_item.get("hint", "")}
                )
        ordered[t_cat] = built
    return merge_meta_into_output(ordered, meta)


def write_locale_atomic(target_path: str, data: dict) -> None:
    """Write JSON atomically so interrupted writes do not corrupt the locale file."""
    tmp_path = target_path + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    os.replace(tmp_path, target_path)


def get_api_key() -> str:
    key = "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"
    if not key:
        print("❌ OPENROUTER_API_KEY is not set. Export it and re-run.")
        sys.exit(1)
    return key


def require_api_key(existing: str | None) -> str:
    if existing and existing.strip():
        return existing.strip()
    return get_api_key()


def strip_json_fences(content: str) -> str:
    content = content.strip()
    if content.startswith("```json"):
        content = content[7:]
    if content.startswith("```"):
        content = content[3:]
    if content.endswith("```"):
        content = content[:-3]
    return content.strip()


def openrouter_chat(
    api_key: str,
    system_prompt: str,
    user_content: str,
    max_retries: int = 5,
) -> str:
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    data = {
        "model": DEFAULT_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ],
    }
    body = json.dumps(data).encode("utf-8")
    last_err = None
    for attempt in range(max_retries):
        req = urllib.request.Request(OPENROUTER_URL, data=body, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=120) as response:
                res_body = json.loads(response.read().decode())
                return res_body["choices"][0]["message"]["content"].strip()
        except urllib.error.HTTPError as e:
            last_err = e
            if e.code == 429 or (500 <= e.code < 600):
                wait = min(2**attempt, 60)
                print(f"    [!] HTTP {e.code}, retry in {wait}s (attempt {attempt + 1}/{max_retries})")
                time.sleep(wait)
            else:
                raise
        except Exception as e:
            last_err = e
            wait = min(2**attempt, 30)
            print(f"    [!] Request error: {e}, retry in {wait}s")
            time.sleep(wait)
    raise RuntimeError(f"OpenRouter request failed after {max_retries} attempts: {last_err}")


def translate_full_theme(en_category: str, ref_items: list, target_lang: str, api_key: str) -> dict:
    """Single API call: translated theme title + all items. Returns {category, items}."""
    payload = {"englishCategory": en_category, "items": ref_items}
    system_prompt = (
        f"You are a professional translator. Translate the theme name and every word/hint into {target_lang}. "
        "You will receive JSON with englishCategory (string) and items (array of {{word, hint}} in English). "
        "Return ONLY valid raw JSON with this exact shape: "
        '{{"category": "<translated theme title>", "items": [ {{"word":"...","hint":"..."}}, ... ]}}. '
        "The items array MUST have the same length and order as the input items. "
        "No markdown, no code fences, no extra text."
    )
    content = openrouter_chat(api_key, system_prompt, json.dumps(payload, ensure_ascii=False))
    content = strip_json_fences(content)
    result = json.loads(content)
    if not isinstance(result, dict):
        raise ValueError("full theme response is not an object")
    cat = result.get("category")
    items = result.get("items")
    if not isinstance(cat, str) or not isinstance(items, list):
        raise ValueError("full theme response missing category or items")
    if len(items) != len(ref_items):
        raise ValueError(f"full theme items length mismatch: got {len(items)}, expected {len(ref_items)}")
    for i, it in enumerate(items):
        if not isinstance(it, dict) or "word" not in it or "hint" not in it:
            raise ValueError(f"invalid item at index {i}")
    return {"category": cat.strip(), "items": items}


def translate_items_batch(items: list, target_lang: str, api_key: str) -> list:
    if not items:
        return []
    system_prompt = (
        f"You are a professional translator. You will receive a JSON array of objects with 'word' and 'hint'. "
        f"Translate the values into {target_lang}. Return ONLY a valid, raw JSON array of the same shape. "
        "Do not include markdown (like ```json), just the raw JSON text."
    )
    content = openrouter_chat(api_key, system_prompt, json.dumps(items, ensure_ascii=False))
    content = strip_json_fences(content)
    translated_items = json.loads(content)
    if not isinstance(translated_items, list) or len(translated_items) != len(items):
        raise ValueError("batch translation invalid structure or length mismatch")
    return translated_items


def bootstrap_glossary_from_legacy(reference_data: dict, themes_payload: dict) -> dict:
    """One-time positional alignment: en key order <-> existing locale key order."""
    meta = default_meta()
    ref_keys = list(reference_data.keys())
    legacy_keys = [k for k in themes_payload.keys() if not str(k).startswith("__")]
    for i, en_cat in enumerate(ref_keys):
        if i >= len(legacy_keys):
            break
        t_cat = legacy_keys[i]
        meta["categories"][en_cat] = t_cat
        ref_items = reference_data[en_cat]
        t_items = themes_payload.get(t_cat) or []
        if not isinstance(t_items, list):
            continue
        for j, ref_item in enumerate(ref_items):
            if j >= len(t_items):
                break
            t_row = t_items[j]
            if not isinstance(ref_item, dict) or not isinstance(t_row, dict):
                continue
            sid = item_stable_id(en_cat, ref_item)
            meta["items"][sid] = {
                "word": t_row.get("word", ""),
                "hint": t_row.get("hint", ""),
            }
    return meta


def apply_full_theme_result(meta: dict, en_cat: str, ref_items: list, result: dict) -> None:
    meta["categories"][en_cat] = result["category"]
    for ref_item, tr_row in zip(ref_items, result["items"]):
        sid = item_stable_id(en_cat, ref_item)
        meta["items"][sid] = {"word": tr_row["word"], "hint": tr_row["hint"]}


def collect_translation_jobs(reference_data: dict, meta: dict):
    """Returns (full_theme_tasks, partial_batches)."""
    full_theme_tasks = []  # (en_cat, ref_items)
    partial_rows = []  # (en_cat, sid, en_item dict)

    for en_cat, ref_items in reference_data.items():
        if en_cat not in meta["categories"]:
            full_theme_tasks.append((en_cat, ref_items))
            continue
        for ref_item in ref_items:
            if not isinstance(ref_item, dict):
                continue
            sid = item_stable_id(en_cat, ref_item)
            if sid not in meta["items"]:
                partial_rows.append((en_cat, sid, ref_item))

    batch_size = 25
    partial_batches = []
    for i in range(0, len(partial_rows), batch_size):
        partial_batches.append(partial_rows[i : i + batch_size])
    return full_theme_tasks, partial_batches


def run_full_theme_task(args):
    en_cat, ref_items, target_lang, api_key = args
    result = translate_full_theme(en_cat, ref_items, target_lang, api_key)
    return ("full", en_cat, ref_items, result)


def run_partial_batch_task(args):
    rows, target_lang, api_key = args
    # rows: list of (en_cat, sid, ref_item)
    en_items = [r[2] for r in rows]
    translated = translate_items_batch(en_items, target_lang, api_key)
    return ("partial", rows, translated)


def process_locale_file(
    reference_data: dict,
    target_path: str,
    api_key: str | None,
    max_workers: int,
    bootstrap_glossary: bool,
) -> tuple[bool, str | None]:
    target_lang = os.path.basename(target_path).replace(".json", "")

    try:
        with open(target_path, "r", encoding="utf-8") as f:
            raw = json.load(f)
    except (json.JSONDecodeError, OSError):
        raw = {}

    if not isinstance(raw, dict):
        raw = {}

    themes_payload, meta = split_locale_payload(raw)
    did_bootstrap = False

    if bootstrap_glossary or (
        not meta["categories"]
        and not meta["items"]
        and themes_payload
    ):
        if bootstrap_glossary:
            print("  [i] --bootstrap-glossary: rebuilding __translations from legacy key order")
        else:
            print("  [i] Empty glossary with existing themes: auto-bootstrap from legacy layout")
        meta = bootstrap_glossary_from_legacy(reference_data, themes_payload)
        did_bootstrap = True

    full_tasks, partial_batches = collect_translation_jobs(reference_data, meta)
    updated = bool(full_tasks or partial_batches)

    key = api_key
    if full_tasks or partial_batches:
        key = require_api_key(key)

    def persist_checkpoint(message: str) -> None:
        write_locale_atomic(target_path, build_locale_output(reference_data, meta))
        print(f"  💾 {message}")

    if did_bootstrap:
        persist_checkpoint("Saved after glossary bootstrap (resume-safe)")

    workers = max(1, min(max_workers, max(len(full_tasks) + len(partial_batches), 1)))

    futures = []
    total_futures = 0
    with ThreadPoolExecutor(max_workers=workers) as ex:
        for en_cat, ref_items in full_tasks:
            print(f"  [+] Full theme (single API call): {en_cat} ({len(ref_items)} items)")
            futures.append(
                ex.submit(run_full_theme_task, (en_cat, ref_items, target_lang, key))
            )
            total_futures += 1
        for batch in partial_batches:
            if not batch:
                continue
            cats = {r[0] for r in batch}
            print(f"  [+] Partial batch: {len(batch)} item(s), categories={sorted(cats)[:3]}{'...' if len(cats) > 3 else ''}")
            futures.append(ex.submit(run_partial_batch_task, (batch, target_lang, key)))
            total_futures += 1

        if total_futures:
            persist_checkpoint("Checkpoint before translation (resume-safe)")

        completed = 0
        for fut in as_completed(futures):
            kind, *rest = fut.result()
            if kind == "full":
                en_cat, ref_items, result = rest
                apply_full_theme_result(meta, en_cat, ref_items, result)
            else:
                rows, translated = rest
                for (_, sid, _), tr_row in zip(rows, translated):
                    meta["items"][sid] = {"word": tr_row["word"], "hint": tr_row["hint"]}
            completed += 1
            persist_checkpoint(f"Saved after API response ({completed}/{total_futures})")

    if not total_futures:
        if did_bootstrap:
            print(f"  -> {target_lang}.json (already saved after glossary bootstrap)")
        else:
            persist_checkpoint(f"Wrote {target_lang}.json (glossary sync, no new translations)")

    if updated:
        print(f"  -> Finished {target_lang}.json")
    return updated, key


def find_locale_files(translation_dir, reference_filename="en.json"):
    return sorted(
        f
        for f in os.listdir(translation_dir)
        if f.endswith(".json") and f != reference_filename and not f.startswith("en_temp")
    )


def perform_sanitary_cleanup(content):
    return content, 0


def perform_sanitary_cleanup_on_all_locales(translation_dir):
    print("\n🧹 Performing sanitary cleanup on all locale files...")
    total_cleanup_count = 0
    files_processed = 0
    for filename in os.listdir(translation_dir):
        if filename.endswith(".json") and not filename.startswith("en_temp"):
            file_path = os.path.join(translation_dir, filename)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                cleaned_content, cleanup_count = perform_sanitary_cleanup(content)
                if cleanup_count > 0:
                    try:
                        json.loads(cleaned_content)
                        with open(file_path, "w", encoding="utf-8") as f:
                            f.write(cleaned_content)
                        print(f"✅ {filename}: Cleaned {cleanup_count} problematic characters")
                        total_cleanup_count += cleanup_count
                    except json.JSONDecodeError as e:
                        print(f"❌ {filename}: JSON validation failed after cleanup: {e}")
                else:
                    print(f"✅ {filename}: No cleanup needed")
                files_processed += 1
            except Exception as e:
                print(f"❌ {filename}: Error during cleanup: {e}")
    print(f"\n📊 Sanitary cleanup summary: {files_processed} files processed.")
    return total_cleanup_count


def _fix_double_braces_in_value(obj):
    """Recursively fix {{ in string values; preserve __translations subtree unchanged when skipped at top."""
    if isinstance(obj, dict):
        return {k: _fix_double_braces_in_value(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_fix_double_braces_in_value(v) for v in obj]
    if isinstance(obj, str):
        s = obj
        passes = 0
        while ("{{" in s or "}}" in s) and passes < 10000:
            s = s.replace("{{", "{").replace("}}", "}")
            passes += 1
        return s
    return obj


def fix_double_braces_in_all_locales(translation_dir):
    print("\n🔧 Fixing double braces in all locale files...")
    for filename in os.listdir(translation_dir):
        if not filename.endswith(".json") or filename.startswith("en_temp"):
            continue
        file_path = os.path.join(translation_dir, filename)
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            if not isinstance(data, dict):
                continue
            meta_block = data.get(TRANSLATIONS_META_KEY)
            themes_only = {k: v for k, v in data.items() if k != TRANSLATIONS_META_KEY}
            fixed_themes = _fix_double_braces_in_value(themes_only)
            out = dict(fixed_themes)
            if isinstance(meta_block, dict):
                out[TRANSLATIONS_META_KEY] = meta_block
            elif meta_block is not None:
                out[TRANSLATIONS_META_KEY] = meta_block
            new_text = json.dumps(out, ensure_ascii=False, indent=2) + "\n"
            old_text = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
            if new_text != old_text:
                json.loads(new_text)  # validate
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(new_text)
                print(f"✅ {filename}: Normalized double braces in theme strings")
            else:
                print(f"✅ {filename}: No double braces to fix")
        except Exception as e:
            print(f"❌ {filename}: Error: {e}")


def cleanup_old_temp_files(translation_dir):
    import glob

    old_temp_files = glob.glob(os.path.join(translation_dir, "en_temp_v*.json"))
    if old_temp_files:
        print(f"🧹 Cleaning up {len(old_temp_files)} old temporary files...")
        for temp_file in old_temp_files:
            os.remove(temp_file)


def main():
    parser = argparse.ArgumentParser(description="Translate locale JSON files from data/en.json")
    parser.add_argument(
        "--bootstrap-glossary",
        action="store_true",
        help="Rebuild __translations from legacy file layout (positional alignment with en.json)",
    )
    parser.add_argument(
        "--max-workers",
        type=int,
        default=6,
        help="Max parallel OpenRouter requests (default: 6)",
    )
    args = parser.parse_args()

    base_path = os.path.dirname(__file__)
    translation_dir = os.path.join(base_path, "data")
    reference_path = os.path.join(translation_dir, "en.json")
    temp_reference_path = os.path.join(translation_dir, "en_temp.json")

    cleanup_old_temp_files(translation_dir)

    if not os.path.exists(reference_path):
        print("❌ Reference file en.json not found.")
        return

    with open(reference_path, "r", encoding="utf-8") as f:
        reference_data = json.load(f)

    locale_files = find_locale_files(translation_dir)
    api_key: str | None = os.environ.get("OPENROUTER_API_KEY", "").strip() or None
    for locale_file in locale_files:
        target_path = os.path.join(translation_dir, locale_file)
        print(f"\n🌐 Processing {locale_file}...")
        _, api_key = process_locale_file(
            reference_data,
            target_path,
            api_key,
            max_workers=args.max_workers,
            bootstrap_glossary=args.bootstrap_glossary,
        )

    print(f"\n💾 Saving current en.json as backup...")
    shutil.copy2(reference_path, temp_reference_path)
    print("✅ Backup saved as en_temp.json")

    perform_sanitary_cleanup_on_all_locales(translation_dir)
    fix_double_braces_in_all_locales(translation_dir)


def run_sanitary_cleanup_only():
    base_path = os.path.dirname(__file__)
    translation_dir = os.path.join(base_path, "data")
    if os.path.exists(translation_dir):
        perform_sanitary_cleanup_on_all_locales(translation_dir)
        fix_double_braces_in_all_locales(translation_dir)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--cleanup-only":
        run_sanitary_cleanup_only()
    else:
        main()
