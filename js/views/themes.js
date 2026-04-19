import { store } from '../store.js';
import { t } from '../i18n.js';
import {
    canonicalToLocalizedKey,
    countPlayableLocales,
    getUnlockLocalePayload,
    isCanonicalFree,
    isCanonicalUnlocked,
    loadAdUnlockedCanonicals,
    localeKeyToCanonical,
    persistSelectionFromLocaleKeys,
    recordAdUnlockCanonical,
} from '../themeUnlock.js';
import { showRewardedAd } from '../rewardedAd.js';

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
                <p class="font-body text-on-surface-variant text-xs opacity-90">${t(state.language, 'themesIntroAds')}</p>
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
        const free = state.freeCanonicalThemes || [];
        const adUnlocked = loadAdUnlockedCanonicals();
        return state.availableThemes
            .map((theme) => {
                const canonical = localeKeyToCanonical(theme);
                const unlocked = isCanonicalUnlocked(canonical, adUnlocked, free);
                const isFreeDeck = isCanonicalFree(canonical, free);
                const isChecked = state.selectedThemes.includes(theme);

                if (unlocked) {
                    return `
                <li class="flex items-center justify-between bg-surface-container-low rounded-lg p-3 cursor-pointer group theme-toggle-row theme-unlocked-row" data-theme="${theme}">
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
                }

                return `
                <li class="flex items-center justify-between bg-surface-container-low rounded-lg p-3 theme-locked-row border border-outline-variant/20" data-canonical="${encodeURIComponent(canonical)}" data-theme="${encodeURIComponent(theme)}">
                    <div class="flex items-center gap-3 min-w-0 flex-1">
                        <span class="material-symbols-outlined text-on-surface-variant shrink-0">lock</span>
                        <span class="font-body text-sm font-medium text-on-surface opacity-60 truncate">${theme}</span>
                    </div>
                    <button type="button" class="watch-ad-btn shrink-0 ml-2 flex items-center gap-1.5 rounded-full bg-secondary-container text-on-secondary-container px-3 py-2 text-xs font-headline font-bold uppercase tracking-wide active:scale-95 transition-transform">
                        <span class="material-symbols-outlined text-[18px]">play_circle</span>
                        ${t(state.language, 'watchVideoToUnlock')}
                    </button>
                </li>`;
            })
            .join('');
    },

    mounted: (state) => {
        ThemesView.bindListeners(state);
    },

    bindListeners: (state) => {
        const free = state.freeCanonicalThemes || [];

        document.querySelectorAll('.theme-unlocked-row').forEach((row) => {
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

        document.querySelectorAll('.watch-ad-btn').forEach((btn) => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const row = btn.closest('.theme-locked-row');
                const rawCanon = row?.getAttribute('data-canonical');
                const canonical = rawCanon ? decodeURIComponent(rawCanon) : '';
                if (!canonical) return;

                const rewarded = await showRewardedAd(store.state.language);
                if (!rewarded) return;

                recordAdUnlockCanonical(canonical);
                const payload = getUnlockLocalePayload();
                const adUnlocked = loadAdUnlockedCanonicals();
                if (!payload) return;

                const rawTheme = row.getAttribute('data-theme');
                const themeFromRow = rawTheme ? decodeURIComponent(rawTheme) : '';
                const loc =
                    canonicalToLocalizedKey(payload, canonical) || themeFromRow;
                if (!loc) return;

                const cur = store.state.selectedThemes;
                const nextSel = cur.includes(loc) ? cur : [...cur, loc];
                const play = countPlayableLocales(payload, free, adUnlocked);

                store.setState({
                    selectedThemes: nextSel,
                    themePlayableCount: play,
                });
                persistSelectionFromLocaleKeys(nextSel);
            });
        });

        document.querySelectorAll('.theme-locked-row').forEach((row) => {
            row.addEventListener('click', (e) => {
                const el = e.target;
                if (!(el instanceof Element)) return;
                if (el.closest('.watch-ad-btn')) return;
                const innerBtn = row.querySelector('.watch-ad-btn');
                innerBtn?.dispatchEvent(new Event('click', { bubbles: false }));
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
