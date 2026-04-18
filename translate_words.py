import os
import json
import shutil
import re
import urllib.request
import urllib.parse
import time
import ssl

# Bypass SSL verification on macOS which causes CERTIFICATE_VERIFY_FAILED
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context
def translate_text(text, target_lang):
    if not text:
        return text
    
    api_key = "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"

    if not api_key:
        print("  [!] OPENROUTER_API_KEY not found in environment or .env file! Falling back to basic Google Translate...")
        return translate_with_google(text, target_lang)
        
    return translate_with_openrouter(text, target_lang, api_key)

def translate_with_openrouter(text, target_lang, api_key):
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # We want exact translation. No extra text, no quotes.
    system_prompt = f"You are a professional translator. Translate this text accurately into {target_lang}. Reply ONLY with the translated text itself, no conversational text or quotation marks."
    
    data = {
        "model": "google/gemini-2.5-flash", # You mentioned AI, using gemini flash or similar fast/cheap openrouter model.
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text}
        ]
    }
    
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as response:
            res_body = json.loads(response.read().decode())
            return res_body["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"    [!] AI Translation failed for '{text}': {e}")
        raise Exception(f"Halting translation to prevent English fallback. Fix the issue and try again.")

def translate_with_google(text, target_lang):
    try:
        time.sleep(0.5)
        url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl={target_lang}&dt=t&q={urllib.parse.quote(text)}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            translated = "".join([d[0] for d in data[0] if d[0]])
            return translated
    except Exception as e:
        print(f"    [!] Google Translation failed for '{text}': {e}")
        raise Exception(f"Halting translation to prevent English fallback. Fix the issue and try again.")

def translate_items_batch(items, target_lang):
    if not items:
        return []
    
    api_key = os.environ.get("OPENROUTER_API_KEY", "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")
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    system_prompt = f"You are a professional translator. You will receive a JSON array of objects with 'word' and 'hint'. Translate the values into {target_lang}. Return ONLY a valid, raw JSON array of the same shape. Do not include markdown (like ```json), just the raw JSON text."
    
    data = {
        "model": "google/gemini-2.5-flash",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": json.dumps(items, ensure_ascii=False)}
        ]
    }
    
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as response:
            res_body = json.loads(response.read().decode())
            content = res_body["choices"][0]["message"]["content"].strip()
            
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
            
            translated_items = json.loads(content)
            if not isinstance(translated_items, list) or len(translated_items) != len(items):
                raise Exception("AI returned invalid structure")
                
            return translated_items
    except Exception as e:
        print(f"    [!] AI Batch Translation failed: {e}")
        raise Exception(f"Halting translation to prevent incomplete arrays. Fix the issue and try again.")

def perform_sanitary_cleanup(content):
    return content, 0

def process_locale_file(reference_data, target_path, temp_reference_data):
    # Lang mapping cleanup, e.g. "mk" for macedonian
    target_lang = os.path.basename(target_path).replace(".json", "")
    
    with open(target_path, "r", encoding="utf-8") as f:
        try:
            target_data = json.load(f)
        except json.JSONDecodeError:
            target_data = {}
            
    ref_keys = list(reference_data.keys())
    target_keys = list(target_data.keys())
    updated = False
    
    for i, category in enumerate(ref_keys):
        # Determine if category is completely new for this target file
        # Check 1: was it missing from target_keys?
        is_missing_category = (i >= len(target_keys))
        
        # Check 2: is it brand new from temp_reference?
        is_new_category = False
        if temp_reference_data and category not in temp_reference_data:
            is_new_category = True
            
        if is_missing_category or is_new_category:
            if category not in target_keys: 
                # Avoid inserting if we just missed length logic but key exists some other way
                print(f"  [+] Translating new/missing category: {category}")
                translated_cat = translate_text(category, target_lang)
                target_data[translated_cat] = []
                target_keys.insert(i, translated_cat)
                updated = True
            
        if i < len(target_keys):
            t_cat = target_keys[i]
        else:
            t_cat = category
            target_data[t_cat] = []
            target_keys.insert(i, t_cat)
            
        ref_items = reference_data[category]
        t_items = target_data.get(t_cat, [])
        
        # IMPORTANT FIX: Always check lengths to rebuild deleted target data arrays.
        if len(ref_items) > len(t_items):
            missing_items = ref_items[len(t_items):]
            print(f"  [+] Batch translating {len(missing_items)} missing items for {category}")
            translated_slice = translate_items_batch(missing_items, target_lang)
            t_items.extend(translated_slice)
            updated = True
                
        # Also, check if temp_reference detects changed items exactly:
        elif temp_reference_data and category in temp_reference_data:
            temp_items = temp_reference_data[category]
            changed_items = []
            changed_indices = []
            for j, item in enumerate(ref_items):
                # If an item was modified/new in en.json AND we somehow haven't added it above
                if item not in temp_items:
                    if j < len(t_items):
                        changed_items.append(item)
                        changed_indices.append(j)
                        
            if changed_items:
                print(f"  [+] Batch translating {len(changed_items)} modified items for {category}")
                translated_changed = translate_items_batch(changed_items, target_lang)
                for idx, translated_item in zip(changed_indices, translated_changed):
                    t_items[idx] = translated_item
                updated = True

        target_data[t_cat] = t_items
        
    if updated:
        # Save while preserving key order
        new_target = {}
        for i, category in enumerate(ref_keys):
            if i < len(target_keys):
                t_cat = target_keys[i]
                new_target[t_cat] = target_data.get(t_cat, [])
            else:
                new_target[category] = target_data.get(category, [])
                
        with open(target_path, "w", encoding="utf-8") as f:
            json.dump(new_target, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print(f"  -> Updated {target_lang}.json")
    else:
        print(f"  -> No updates needed")

def find_locale_files(translation_dir, reference_filename="en.json"):
    return [
        f for f in os.listdir(translation_dir)
        if f.endswith(".json") and f != reference_filename and not f.startswith("en_temp")
    ]

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

def fix_double_braces_in_all_locales(translation_dir):
    print("\n🔧 Fixing double braces in all locale files...")
    files_changed = 0
    for filename in os.listdir(translation_dir):
        if not filename.endswith(".json") or filename.startswith("en_temp"):
            continue
        file_path = os.path.join(translation_dir, filename)
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            original = content
            passes = 0
            while ("{{" in content or "}}" in content) and passes < 10000:
                content = content.replace("{{", "{").replace("}}", "}")
                passes += 1
            if content != original:
                try:
                    json.loads(content)
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(content)
                    print(f"✅ {filename}: Normalized double braces ({passes} pass(es))")
                    files_changed += 1
                except json.JSONDecodeError:
                    print(f"❌ {filename}: invalid JSON after brace fix")
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

    temp_reference_data = None
    if os.path.exists(temp_reference_path):
        print(f"📋 Found previous en.json backup, checking for modified keys...")
        with open(temp_reference_path, "r", encoding="utf-8") as f:
            temp_reference_data = json.load(f)
    else:
        print(f"📋 No previous backup found, will only process missing keys...")

    locale_files = find_locale_files(translation_dir)

    for locale_file in locale_files:
        target_path = os.path.join(translation_dir, locale_file)
        print(f"\n🌐 Processing {locale_file}...")
        process_locale_file(reference_data, target_path, temp_reference_data)

    print(f"\n💾 Saving current en.json as backup...")
    shutil.copy2(reference_path, temp_reference_path)
    print(f"✅ Backup saved as en_temp.json")
    
    perform_sanitary_cleanup_on_all_locales(translation_dir)
    fix_double_braces_in_all_locales(translation_dir)

def run_sanitary_cleanup_only():
    base_path = os.path.dirname(__file__)
    translation_dir = os.path.join(base_path, "data")
    if os.path.exists(translation_dir):
        perform_sanitary_cleanup_on_all_locales(translation_dir)
        fix_double_braces_in_all_locales(translation_dir)

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--cleanup-only":
        run_sanitary_cleanup_only()
    else:
        main()
