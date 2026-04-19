import { store } from './store.js';
import { SetupView } from './views/setup.js';
import { TransitionView } from './views/transition.js';
import { RevealView } from './views/reveal.js';
import { RoundView } from './views/round.js';
import { ResultsView } from './views/results.js';
import { ThemesView } from './views/themes.js';
import { loadLanguageData } from './words.js';

const views = {
    'setup': SetupView,
    'transition': TransitionView,
    'reveal': RevealView,
    'round': RoundView,
    'results': ResultsView,
    'themes': ThemesView
};

const appContainer = document.getElementById('app');

function clearImpostorAdHost() {
    const host = document.getElementById('impostor-ad-host');
    if (!host) return;
    host.innerHTML = '';
    host.classList.add('hidden');
}

let currentScreen = null;
let lastLanguage = store.state.language;

function render(state) {
    const view = views[state.screen];
    if (!view) return;

    const previousScreen = currentScreen;
    const navigated = currentScreen !== state.screen;
    const languageChanged = lastLanguage !== state.language;

    if (previousScreen === 'round' && state.screen !== 'round') {
        clearImpostorAdHost();
    }

    if (navigated) {
        currentScreen = state.screen;
        appContainer.innerHTML = view.render(state);
        setTimeout(() => view.mounted(state), 0);
    } else if (languageChanged) {
        appContainer.innerHTML = view.render(state);
        setTimeout(() => view.mounted(state), 0);
    } else if (view.update) {
        view.update(state);
    } else {
        appContainer.innerHTML = view.render(state);
        setTimeout(() => view.mounted(state), 0);
    }
    lastLanguage = state.language;
}

store.subscribe(render);
render(store.state);

// Load initial language pack (Default 'en')
loadLanguageData(store.state.language);
