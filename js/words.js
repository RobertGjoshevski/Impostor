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
        wordsDatabase = await response.json();

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
