import { store } from './store.js';

let wordsDatabase = {};

export async function loadLanguageData(langCode) {
    try {
        const response = await fetch(`data/${langCode}.json`);
        if (!response.ok) throw new Error("Network response was not ok");
        wordsDatabase = await response.json();
        
        const themes = Object.keys(wordsDatabase);
        // By default, select all themes if loading for the very first time,
        // or just keep previously selected themes if they still exist.
        // For simplicity, let's select all available themes when language changes:
        store.setState({ 
            language: langCode,
            availableThemes: themes,
            selectedThemes: themes
        });
    } catch (e) {
        console.error("Failed to load dictionary data:", e);
    }
}

export function getRandomWord() {
    const selectedThemes = store.state.selectedThemes;
    let pool = [];
    
    selectedThemes.forEach(theme => {
        if(wordsDatabase[theme]) {
            pool = pool.concat(wordsDatabase[theme]);
        }
    });

    if (pool.length === 0) {
        // Fallback
        return { word: "Missing Config", hint: "Check Themes" };
    }

    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
}
