/** Canonical theme ids = English category names from `data/en.json`. */

const STORAGE_SELECTED = 'impostor_selected_canonical_themes';

/** @type {Record<string, unknown> | null} */
let localePayload = null;

/**
 * @param {unknown} key
 * @returns {boolean}
 */
function isReservedThemeKey(key) {
    return typeof key === 'string' && key.startsWith('__');
}

/**
 * @param {Record<string, unknown>} data
 * @returns {string[]}
 */
export function listLocaleThemeKeys(data) {
    return Object.keys(data).filter((k) => !isReservedThemeKey(k));
}

/**
 * @param {Record<string, unknown>} localeData
 * @param {string} localeKey
 * @returns {string}
 */
export function localizedKeyToCanonical(localeData, localeKey) {
    const cat = localeData?.__translations?.categories;
    if (cat && typeof cat === 'object') {
        for (const [canonical, localized] of Object.entries(cat)) {
            if (localized === localeKey) return canonical;
        }
    }
    return localeKey;
}

/**
 * @param {Record<string, unknown>} localeData
 * @param {string} canonical
 * @returns {string | null}
 */
export function canonicalToLocalizedKey(localeData, canonical) {
    const cat = localeData?.__translations?.categories;
    if (cat && typeof cat === 'object' && cat[canonical]) {
        return /** @type {string} */ (cat[canonical]);
    }
    if (localeData && Object.prototype.hasOwnProperty.call(localeData, canonical)) {
        return canonical;
    }
    const keys = listLocaleThemeKeys(localeData);
    return keys.includes(canonical) ? canonical : null;
}

/**
 * @param {Record<string, unknown>} enData
 * @returns {{ name: string; n: number; fileIndex: number }[]}
 */
function rankCanonicalThemesByWordCount(enData) {
    const themes = listLocaleThemeKeys(enData);
    const ranked = themes.map((name, fileIndex) => {
        const bucket = enData[name];
        const n = Array.isArray(bucket) ? bucket.length : 0;
        return { name, n, fileIndex };
    });
    ranked.sort((a, b) => b.n - a.n || a.fileIndex - b.fileIndex);
    return ranked;
}

/**
 * All categories (canonical ids from `en.json`), stable order by word count — default selection when nothing is persisted.
 * @param {Record<string, unknown>} enData
 * @returns {string[]}
 */
export function computeDefaultSelectedCanonicalThemes(enData) {
    return rankCanonicalThemesByWordCount(enData).map((r) => r.name);
}

function readJsonStorage(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        const v = JSON.parse(raw);
        return Array.isArray(v) ? v : fallback;
    } catch {
        return fallback;
    }
}

export function loadPersistedSelectedCanonicals() {
    return readJsonStorage(STORAGE_SELECTED, null);
}

export function savePersistedSelectedCanonicals(canonicals) {
    localStorage.setItem(STORAGE_SELECTED, JSON.stringify([...canonicals]));
}

/**
 * @param {Record<string, unknown>} localeData
 */
export function setUnlockLocalePayload(localeData) {
    localePayload = localeData;
}

/**
 * @param {string} localeKey
 * @returns {string}
 */
export function localeKeyToCanonical(localeKey) {
    if (!localePayload) return localeKey;
    return localizedKeyToCanonical(localePayload, localeKey);
}

/**
 * @param {Record<string, unknown>} localeData
 * @param {string[]} defaultSelectedCanonical — all categories selected when nothing persisted
 */
export function resolveThemeSelectionForLocale(localeData, defaultSelectedCanonical) {
    const allThemeKeys = listLocaleThemeKeys(localeData);
    const validCanonical = new Set(allThemeKeys.map((k) => localizedKeyToCanonical(localeData, k)));

    const persisted = loadPersistedSelectedCanonicals();
    let selectedCanonical = /** @type {string[]} */ (
        Array.isArray(persisted) ? [...persisted] : [...defaultSelectedCanonical]
    );
    selectedCanonical = selectedCanonical.filter((c) => validCanonical.has(c));
    if (selectedCanonical.length === 0) {
        selectedCanonical = [...defaultSelectedCanonical];
    }

    const selectedLocaleKeys = [];
    for (const c of selectedCanonical) {
        const loc = canonicalToLocalizedKey(localeData, c);
        if (loc && allThemeKeys.includes(loc)) {
            selectedLocaleKeys.push(loc);
        }
    }

    if (selectedLocaleKeys.length === 0) {
        selectedCanonical = [...defaultSelectedCanonical];
        for (const c of defaultSelectedCanonical) {
            const loc = canonicalToLocalizedKey(localeData, c);
            if (loc && allThemeKeys.includes(loc)) {
                selectedLocaleKeys.push(loc);
            }
        }
    }

    savePersistedSelectedCanonicals(selectedCanonical);

    return {
        allThemeKeys,
        selectedLocaleKeys,
    };
}

/** @returns {Record<string, unknown> | null} */
export function getUnlockLocalePayload() {
    return localePayload;
}

/**
 * @param {string[]} selectedLocaleKeys
 */
export function persistSelectionFromLocaleKeys(selectedLocaleKeys) {
    if (!localePayload) return;
    const canonicals = selectedLocaleKeys.map((k) => localizedKeyToCanonical(localePayload, k));
    savePersistedSelectedCanonicals(canonicals);
}
