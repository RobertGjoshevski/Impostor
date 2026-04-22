import { store } from '../store.js';
import { t } from '../i18n.js';

export const ResultsView = {
    render: (state) => {
        const impostors = state.players.filter(p => p.role === 'IMPOSTOR');

        // Convert scores to sorted array
        const sortedScores = Object.entries(state.scores).sort((a, b) => b[1] - a[1]);

        return `
        <header class="fixed w-full top-0 z-50 bg-[#0c0c1f]/80 backdrop-blur-xl shadow-[0_0_40px_rgba(208,149,255,0.08)] flex justify-between items-center px-6 py-4 transition-all">
            <h1 class="font-headline font-black tracking-widest text-[#d095ff] uppercase text-2xl mx-auto">
                IMPOSTOR
            </h1>
        </header>

        <main class="pt-32 pb-40 px-6 max-w-5xl mx-auto flex flex-col gap-10 animate-fade-in">
            <section class="flex flex-col gap-2">
                <h2 class="font-headline font-black text-6xl md:text-8xl tracking-tighter text-on-surface uppercase leading-none drop-shadow-[0_0_32px_rgba(208,149,255,0.15)]">
                    ${t(state.language, 'gameOver')}
                </h2>
                <p class="font-body text-xl text-on-surface-variant font-medium max-w-lg mt-2 leading-relaxed">
                    ${t(state.language, 'resultsSubtitle')}
                </p>
            </section>

            <section class="grid grid-cols-1 md:grid-cols-12 gap-6 relative">
                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-tertiary/5 blur-[120px] pointer-events-none rounded-full z-0"></div>
                
                <!-- Impostors Reveal Card -->
                <div class="col-span-1 md:col-span-8 bg-surface-container-highest rounded-xl p-8 relative overflow-hidden z-10 shadow-[0_0_64px_rgba(255,107,155,0.08)]">
                    <div class="absolute inset-0 bg-gradient-to-br from-tertiary/10 to-transparent pointer-events-none"></div>
                    <div class="flex justify-between items-start mb-8 relative z-20">
                        <h3 class="font-headline text-tertiary uppercase tracking-widest font-bold text-sm flex items-center gap-2">
                            <span class="material-symbols-outlined text-base">theater_comedy</span>
                            ${t(state.language, 'theImpostors')}
                        </h3>
                    </div>
                    <div class="flex flex-wrap gap-8 relative z-20">
                        ${impostors.map(imp => `
                            <div class="flex flex-col items-start gap-4">
                                <div class="relative group">
                                    <div class="w-20 h-20 rounded-full bg-surface-variant flex items-center justify-center text-tertiary font-bold text-3xl uppercase border-4 border-surface-container-highest shadow-[0_0_32px_rgba(255,107,155,0.3)] ring-4 ring-tertiary">
                                        ${imp.name.substring(0, 2)}
                                    </div>
                                    <div class="absolute -bottom-2 -right-2 bg-tertiary-container text-tertiary rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-2 border-surface-container-highest">
                                        <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">warning</span>
                                    </div>
                                </div>
                                <div>
                                    <p class="font-headline font-bold text-2xl text-on-surface">${imp.name}</p>
                                    <p class="font-body text-tertiary text-sm font-medium">${t(state.language, 'deceiver')}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Secret Word Card -->
                <div class="col-span-1 md:col-span-4 bg-surface-container-low rounded-xl p-8 flex flex-col justify-center items-start relative z-10 group">
                    <div class="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                    <h3 class="font-headline text-on-surface-variant uppercase tracking-widest font-bold text-sm mb-6 flex items-center gap-2">
                        <span class="material-symbols-outlined text-base">vpn_key</span>
                        ${t(state.language, 'secretWord')}
                    </h3>
                    <div class="font-headline font-black text-3xl lg:text-4xl text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary-container tracking-tighter">
                        ${state.word ? state.word.word : 'ERROR'}
                    </div>
                    <p class="mt-4 font-body text-sm text-on-surface-variant/70 leading-relaxed max-w-[200px]">
                        ${t(state.language, 'secretWordBlurb')}
                    </p>
                </div>

                <!-- Detectives Section -->
                <div class="col-span-1 md:col-span-6 bg-surface-container rounded-xl p-6 z-10">
                    <h3 class="font-headline text-primary uppercase tracking-widest font-bold text-sm mb-4 flex items-center gap-2">
                        <span class="material-symbols-outlined text-base">search</span>
                        ${t(state.language, 'detectives')}
                    </h3>
                    ${state.detectives && state.detectives.length > 0 ? `
                        <ul class="flex flex-wrap gap-2">
                            ${state.detectives.map(d => `
                                <li class="bg-surface-variant text-on-surface px-4 py-2 rounded-lg font-body text-sm font-medium">
                                    ${d}
                                </li>
                            `).join('')}
                        </ul>
                    ` : `
                        <p class="text-on-surface-variant text-sm oblique">${t(state.language, 'noDetectives')}</p>
                    `}
                </div>

                <!-- Lifetime Scoreboard Section -->
                <div class="col-span-1 md:col-span-6 bg-[#1a1a32] rounded-xl p-6 shadow-inner z-10 border border-outline-variant/10">
                    <h3 class="font-headline text-secondary uppercase tracking-widest font-bold text-sm mb-4 flex items-center gap-2">
                        <span class="material-symbols-outlined text-base">leaderboard</span>
                        ${t(state.language, 'lifetimeScores')}
                    </h3>
                    <ul class="lifetime-scoreboard flex flex-col gap-2 max-h-48 overflow-y-auto pr-2">
                        ${sortedScores.length > 0 ? sortedScores.map(([name, score], i) => `
                            <li class="flex justify-between items-center bg-surface-container-low p-3 rounded-lg">
                                <div class="flex items-center gap-3">
                                    <span class="font-headline font-bold text-on-surface-variant text-xs w-4">${i + 1}</span>
                                    <span class="font-body font-bold text-on-surface">${name}</span>
                                </div>
                                <span class="font-headline font-black text-on-surface tabular-nums">${score}</span>
                            </li>
                        `).join('') : `<p class="text-on-surface-variant text-sm">${t(state.language, 'noScoresYet')}</p>`}
                    </ul>
                </div>

            </section>
        </main>

        <div class="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md bg-surface-bright/50 backdrop-blur-2xl rounded-full p-2 flex gap-2 shadow-[0_0_64px_rgba(208,149,255,0.08)] z-50">
            <button id="replayBtn" class="flex-1 bg-gradient-to-br from-primary to-primary-container text-on-primary-container rounded-full py-4 px-6 text-center shadow-[0_0_24px_rgba(208,149,255,0.2)] font-headline font-bold text-sm uppercase tracking-widest transition-transform active:scale-95 flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-lg">replay</span>
                ${t(state.language, 'nextRound')}
            </button>
        </div>
        `;
    },
    mounted: (state) => {
        document.getElementById('replayBtn').addEventListener('click', () => {
            store.resetGame();
        });
    },
    update: (state) => { }
};
