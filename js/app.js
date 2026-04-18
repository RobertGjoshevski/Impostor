import { store } from './store.js';
import { SetupView } from './views/setup.js';
import { TransitionView } from './views/transition.js';
import { RevealView } from './views/reveal.js';
import { RoundView } from './views/round.js';
import { ResultsView } from './views/results.js';

const views = {
    'setup': SetupView,
    'transition': TransitionView,
    'reveal': RevealView,
    'round': RoundView,
    'results': ResultsView
};

const appContainer = document.getElementById('app');
let currentScreen = null;

function render(state) {
    const view = views[state.screen];
    if (!view) return;

    if (currentScreen !== state.screen) {
        appContainer.innerHTML = view.render(state);
        setTimeout(() => view.mounted(state), 0);
        currentScreen = state.screen;
    } else if (view.update) {
        view.update(state);
    } else {
        appContainer.innerHTML = view.render(state);
        setTimeout(() => view.mounted(state), 0);
    }
}

store.subscribe(render);
render(store.state);
