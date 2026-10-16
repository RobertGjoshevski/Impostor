import { clampImpostorCount, store } from './store.js';
import { HomeView } from './views/home.js';
import { SetupView } from './views/setup.js';
import { HostLobbyView } from './views/hostLobby.js';
import { JoinRoomView } from './views/joinRoom.js';
import { TransitionView } from './views/transition.js';
import { RevealView } from './views/reveal.js';
import { FirstPlayerView } from './views/firstPlayer.js';
import { RoundView } from './views/round.js';
import { ResultsView } from './views/results.js';
import { ThemesView } from './views/themes.js';
import { loadHostState, loadPersistedProfile } from './persist.js';
import { restoreHostSession } from './net/onlineSession.js';
import { loadLanguageData } from './words.js';

const persisted = loadPersistedProfile();
if (persisted) {
    if (persisted.players.length >= 1) {
        store.state.players = persisted.players;
    }
    store.state.scores = persisted.scores;
    store.state.impostorCount = clampImpostorCount(
        store.state.players.length,
        store.state.impostorCount,
    );
}

const hostSaved = loadHostState();
if (hostSaved) {
    restoreHostSession(hostSaved);
}

const views = {
    'home': HomeView,
    'setup': SetupView,
    'hostLobby': HostLobbyView,
    'joinRoom': JoinRoomView,
    'transition': TransitionView,
    'reveal': RevealView,
    'firstPlayer': FirstPlayerView,
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
