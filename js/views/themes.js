import { store } from '../store.js';
import { t } from '../i18n.js';
import {
    isCanonicalFree,
    localeKeyToCanonical,
    persistSelectionFromLocaleKeys,
} from '../themeUnlock.js';

export const ThemesView = {
    render: (state) => {
        return `
        <header class="bg-[#0c0c1f]/80 backdrop-blur-xl docked full-width top-0 z-50 shadow-[0_0_40px_rgba(208,149,255,0.08)] flex justify-between items-center w-full px-6 py-4 absolute">
            <h1 class="font-headline font-bold tracking-tighter text-2xl font-black tracking-widest text-[#d095ff] uppercase mx-auto">${t(state.language, 'themesTitle')}</h1>
        </header>

        <main class="flex-1 flex flex-col px-6 pt-24 pb-32 max-w-md mx-auto w-full gap-8 animate-fade-in relative">
            <div class="space-y-2">
                <h2 class="font-headline text-3xl font-bold text-on-surface tracking-tight">${t(state.language, 'activeDecks')}</h2>
                <p class="font-body text-on-surface-variant text-sm">${t(state.language, 'themesIntro')}</p>
            </div>

            <section class="bg-surface-container-high rounded-xl p-5 shadow-[0_0_32px_rgba(208,149,255,0.04)] flex flex-col gap-4">
                <ul id="themeList" class="flex flex-col gap-3">
                    ${ThemesView.renderThemeCheckboxes(state)}
                </ul>
            </section>
        </main>

        <div class="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md bg-surface-bright/50 backdrop-blur-2xl rounded-full p-2 flex gap-2 shadow-[0_0_64px_rgba(208,149,255,0.08)] z-50">
            <button id="saveThemesBtn" class="flex-1 bg-gradient-to-br from-primary to-primary-container text-on-primary-container rounded-full py-4 px-6 text-center shadow-[0_0_24px_rgba(208,149,255,0.2)] font-headline font-bold text-sm uppercase tracking-widest transition-transform active:scale-95 flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-lg">save</span>
                ${t(state.language, 'done')}
            </button>
        </div>
        `;
    },

    renderThemeCheckboxes: (state) => {
        if (state.availableThemes.length === 0) {
            return `<p class="text-xs text-on-surface-variant">${t(state.language, 'loadingThemes')}</p>`;
        }
        const starter = state.freeCanonicalThemes || [];
        return state.availableThemes
            .map((theme) => {
                const canonical = localeKeyToCanonical(theme);
                const isFreeDeck = isCanonicalFree(canonical, starter);
                const isChecked = state.selectedThemes.includes(theme);

                return `
                <li class="flex items-center justify-between bg-surface-container-low rounded-lg p-3 cursor-pointer group theme-toggle-row" data-theme="${theme}">
                    <div class="flex items-center gap-3 min-w-0">
                        <span class="material-symbols-outlined text-primary group-hover:text-tertiary transition-colors shrink-0">
                            ${isChecked ? 'check_box' : 'check_box_outline_blank'}
                        </span>
                        <div class="flex flex-col min-w-0">
                            <span class="font-body text-sm font-medium text-on-surface ${isChecked ? '' : 'opacity-50'} truncate">${theme}</span>
                            ${isFreeDeck ? `<span class="font-body text-[10px] uppercase tracking-wider text-primary/80">${t(state.language, 'themeFreeBadge')}</span>` : ''}
                        </div>
                    </div>
                </li>`;
            })
            .join('');
    },

    mounted: (state) => {
        ThemesView.bindListeners(state);
    },

    bindListeners: (state) => {
        document.querySelectorAll('.theme-toggle-row').forEach((row) => {
            row.addEventListener('click', () => {
                const themeVal = row.getAttribute('data-theme');
                if (!themeVal) return;
                const selected = store.state.selectedThemes;
                let newSelected;
                if (selected.includes(themeVal)) {
                    if (selected.length <= 1) {
                        alert(t(store.state.language, 'minOneTheme'));
                        return;
                    }
                    newSelected = selected.filter((x) => x !== themeVal);
                } else {
                    newSelected = [...selected, themeVal];
                }
                store.setState({ selectedThemes: newSelected });
                persistSelectionFromLocaleKeys(newSelected);
            });
        });

        const btn = document.getElementById('saveThemesBtn');
        if (btn) {
            btn.addEventListener('click', () => {
                persistSelectionFromLocaleKeys(store.state.selectedThemes);
                store.setState({ screen: 'setup' });
            });
        }
    },

    update: (state) => {
        const list = document.getElementById('themeList');
        if (list) {
            list.innerHTML = ThemesView.renderThemeCheckboxes(state);
            ThemesView.bindListeners(state);
        }
    },
};
