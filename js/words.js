import { store } from './store.js';
import {
    computeDefaultStarterCanonicalThemes,
    resolveThemeSelectionForLocale,
    setUnlockLocalePayload,
} from './themeUnlock.js';

let wordsDatabase = {};

/** @type {Record<string, unknown> | null} */
let enWordsCache = null;

function isReservedThemeKey(key) {
    return typeof key === 'string' && key.startsWith('__');
}

/**
 * When a locale JSON only has `__translations` and no top-level theme arrays,
 * rebuild buckets from English structure + translated category titles and items.
 * @param {Record<string, unknown>} enData
 * @param {Record<string, unknown>} rawLocale
 * @returns {Record<string, unknown>}
 */
function expandLocaleFromEnglishBase(enData, rawLocale) {
    const meta = rawLocale.__translations;
    if (!meta || typeof meta !== 'object') return /** @type {Record<string, unknown>} */ (rawLocale);
    const categories =
        meta.categories && typeof meta.categories === 'object'
            ? /** @type {Record<string, string>} */ (meta.categories)
            : {};
    const items =
        meta.items && typeof meta.items === 'object'
            ? /** @type {Record<string, { word?: string; hint?: string }>} */ (meta.items)
            : {};
    /** @type {Record<string, unknown>} */
    const out = {};
    for (const enCat of Object.keys(enData)) {
        if (isReservedThemeKey(enCat)) continue;
        const refItems = enData[enCat];
        if (!Array.isArray(refItems)) continue;
        const tCat = categories[enCat] ?? enCat;
        const built = [];
        for (const refItem of refItems) {
            if (!refItem || typeof refItem !== 'object') continue;
            const w = /** @type {{ word?: string; hint?: string }} */ (refItem);
            const sid = `${enCat}\t${w.word ?? ''}\t${w.hint ?? ''}`;
            if (Object.prototype.hasOwnProperty.call(items, sid)) {
                built.push({ ...items[sid] });
            } else {
                built.push({ word: w.word ?? '', hint: w.hint ?? '' });
            }
        }
        out[tCat] = built;
    }
    out.__translations = {
        categories: { ...categories },
        items: { ...items },
    };
    return out;
}

async function loadEnWords() {
    if (enWordsCache) return enWordsCache;
    const response = await fetch('data/en.json');
    if (!response.ok) throw new Error('Failed to load en.json');
    enWordsCache = await response.json();
    return enWordsCache;
}

export async function loadLanguageData(langCode) {
    try {
        const [response, enData] = await Promise.all([
            fetch(`data/${langCode}.json`),
            loadEnWords(),
        ]);
        if (!response.ok) throw new Error('Network response was not ok');
        const raw = await response.json();
        const themeKeyCount = Object.keys(raw).filter((k) => !isReservedThemeKey(k)).length;
        wordsDatabase =
            themeKeyCount === 0 && raw.__translations && typeof raw.__translations === 'object'
                ? expandLocaleFromEnglishBase(enData, /** @type {Record<string, unknown>} */ (raw))
                : raw;

        const starterCanonical = computeDefaultStarterCanonicalThemes(enData);
        const resolved = resolveThemeSelectionForLocale(wordsDatabase, starterCanonical);

        setUnlockLocalePayload(wordsDatabase);

        store.setState({
            language: langCode,
            availableThemes: resolved.allThemeKeys,
            selectedThemes: resolved.selectedLocaleKeys,
            freeCanonicalThemes: resolved.freeCanonical,
        });
    } catch (e) {
        console.error('Failed to load dictionary data:', e);
    }
}

export function getRandomWord() {
    const selectedThemes = store.state.selectedThemes;
    let pool = [];

    selectedThemes.forEach((theme) => {
        if (isReservedThemeKey(theme)) return;
        if (wordsDatabase[theme]) {
            pool = pool.concat(wordsDatabase[theme]);
        }
    });

    if (pool.length === 0) {
        return { word: 'Missing Config', hint: 'Check Themes' };
    }

    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
}
