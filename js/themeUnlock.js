/** Canonical theme ids = English category names from `data/en.json`. */

const STORAGE_AD_UNLOCKED = 'impostor_ad_unlocked_canonical_themes';
const STORAGE_SELECTED = 'impostor_selected_canonical_themes';

const FREE_COUNT = 5;

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
 * @returns {string[]}
 */
export function computeFreeCanonicalThemes(enData) {
    const themes = listLocaleThemeKeys(enData);
    const ranked = themes.map((name, fileIndex) => {
        const bucket = enData[name];
        const n = Array.isArray(bucket) ? bucket.length : 0;
        return { name, n, fileIndex };
    });
    ranked.sort((a, b) => b.n - a.n || a.fileIndex - b.fileIndex);
    return ranked.slice(0, FREE_COUNT).map((r) => r.name);
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

export function loadAdUnlockedCanonicals() {
    return new Set(readJsonStorage(STORAGE_AD_UNLOCKED, []));
}

function saveAdUnlockedCanonicals(set) {
    localStorage.setItem(STORAGE_AD_UNLOCKED, JSON.stringify([...set]));
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
 * @param {string} canonical
 * @param {Set<string>} adUnlocked
 * @param {string[]} freeCanonical
 */
export function isCanonicalUnlocked(canonical, adUnlocked, freeCanonical) {
    const free = new Set(freeCanonical);
    return free.has(canonical) || adUnlocked.has(canonical);
}

/**
 * @param {string} canonical
 * @param {string[]} freeCanonical
 */
export function isCanonicalFree(canonical, freeCanonical) {
    return new Set(freeCanonical).has(canonical);
}

/**
 * @param {string} canonical
 */
export function recordAdUnlockCanonical(canonical) {
    const s = loadAdUnlockedCanonicals();
    s.add(canonical);
    saveAdUnlockedCanonicals(s);
}

/**
 * @param {Record<string, unknown>} localeData
 * @param {Set<string>} adUnlocked
 * @param {string[]} freeCanonical
 */
export function resolveThemeSelectionForLocale(localeData, adUnlocked, freeCanonical) {
    const allThemeKeys = listLocaleThemeKeys(localeData);
    const unlockedCanonical = new Set(freeCanonical);
    adUnlocked.forEach((c) => unlockedCanonical.add(c));

    const persisted = loadPersistedSelectedCanonicals();
    let selectedCanonical = /** @type {string[]} */ (
        Array.isArray(persisted) ? [...persisted] : [...freeCanonical]
    );
    selectedCanonical = selectedCanonical.filter((c) => unlockedCanonical.has(c));
    if (selectedCanonical.length === 0) {
        selectedCanonical = [...freeCanonical];
    }

    const selectedLocaleKeys = [];
    for (const c of selectedCanonical) {
        const loc = canonicalToLocalizedKey(localeData, c);
        if (loc && allThemeKeys.includes(loc)) {
            selectedLocaleKeys.push(loc);
        }
    }

    if (selectedLocaleKeys.length === 0) {
        selectedCanonical = [...freeCanonical];
        for (const c of freeCanonical) {
            const loc = canonicalToLocalizedKey(localeData, c);
            if (loc && allThemeKeys.includes(loc)) {
                selectedLocaleKeys.push(loc);
            }
        }
    }

    const playableCount = countPlayableLocales(localeData, freeCanonical, adUnlocked);

    savePersistedSelectedCanonicals(selectedCanonical);

    return {
        allThemeKeys,
        selectedLocaleKeys,
        playableCount,
        freeCanonical,
    };
}

/**
 * @param {Record<string, unknown>} localeData
 * @param {string[]} freeCanonical
 * @param {Set<string>} adUnlocked
 */
export function countPlayableLocales(localeData, freeCanonical, adUnlocked) {
    const allThemeKeys = listLocaleThemeKeys(localeData);
    return allThemeKeys.filter((k) => {
        const c = localizedKeyToCanonical(localeData, k);
        return isCanonicalUnlocked(c, adUnlocked, freeCanonical);
    }).length;
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
