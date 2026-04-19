import { store, normalizePlayerName } from '../store.js';
import { t } from '../i18n.js';

export const RevealView = {
    render: (state) => {
        const player = state.players[state.currentPlayerIndex];
        const displayName = normalizePlayerName(player);
        const isImpostor = player.role === 'IMPOSTOR';
        const roleLabel = t(state.language, isImpostor ? 'roleImpostor' : 'roleInnocent');

        return `
        <!-- Ambient Background Glows -->
        <div class="absolute inset-0 pointer-events-none overflow-hidden z-0">
            <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-tertiary/10 rounded-full blur-[120px]"></div>
            <div class="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]"></div>
        </div>
        
        <main class="z-10 w-full max-w-md px-6 flex flex-col items-center gap-12 animate-fade-in mx-auto justify-center h-full">
            <header class="flex flex-col items-center gap-4 text-center mt-12">
                <div class="relative group">
                    <div class="absolute inset-0 bg-tertiary rounded-full blur-md opacity-30"></div>
                    <div class="relative w-20 h-20 rounded-full bg-surface-variant flex items-center justify-center text-primary font-bold text-2xl uppercase border-4 border-surface shadow-[0_0_30px_rgba(255,107,155,0.15)] ring-2 ring-tertiary/50">
                        ${displayName.substring(0, 2)}
                    </div>
                </div>
                <div>
                    <h2 class="font-headline text-2xl font-bold tracking-tight text-on-surface">${displayName}</h2>
                    <p class="text-on-surface-variant text-sm tracking-widest uppercase mt-1">${t(state.language, 'identityCheck')}</p>
                </div>
            </header>
            
            <section id="revealCard" class="w-full bg-surface-bright/40 backdrop-blur-2xl rounded-[32px] p-8 flex flex-col items-center text-center relative border border-outline-variant/20 shadow-[0_0_64px_rgba(255,107,155,0.08)] cursor-pointer select-none transition-all active:scale-95 group">
                <div class="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-gradient-to-r from-transparent via-tertiary to-transparent rounded-b-full opacity-50"></div>
                
                <div id="hiddenState" class="flex flex-col items-center py-8">
                    <span class="material-symbols-outlined text-4xl text-on-surface-variant mb-4" style="font-variation-settings: 'FILL' 1;">visibility_off</span>
                    <h3 class="font-headline text-2xl font-bold text-on-surface">${t(state.language, 'pressHold')}</h3>
                    <p class="text-on-surface-variant text-sm mt-2">${t(state.language, 'revealSecretHint')}</p>
                </div>

                <div id="revealedState" class="hidden flex-col items-center w-full">
                    <p class="text-on-surface-variant font-bold tracking-[0.2em] text-xs uppercase mb-6 flex items-center gap-2">
                        <span class="material-symbols-outlined text-[16px] text-${isImpostor ? 'tertiary' : 'secondary'}" style="font-variation-settings: 'FILL' 1;">
                            ${isImpostor ? 'warning' : 'verified'}
                        </span>
                        ${t(state.language, 'youAreThe')}
                    </p>
                    <h1 class="font-headline text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br ${isImpostor ? 'from-tertiary to-tertiary-dim' : 'from-secondary to-secondary-dim'} tracking-tighter mb-8 drop-shadow-[0_0_20px_rgba(255,107,155,0.2)]">
                        ${roleLabel}
                    </h1>
                    <div class="w-full bg-surface-container-highest/60 rounded-2xl p-5 border border-outline-variant/10 shadow-inner">
                        <p class="text-xs text-on-surface-variant uppercase tracking-wider mb-2">${isImpostor ? t(state.language, 'categoryHint') : t(state.language, 'secretWord')}</p>
                        <p class="font-headline text-xl font-bold text-inverse-surface tracking-tight">
                            ${isImpostor ? state.word.hint : state.word.word}
                        </p>
                    </div>
                </div>
            </section>
            
            <div class="w-full flex flex-col items-center gap-4 mt-4">
                <button id="doneBtn" class="w-full rounded-full bg-surface-variant text-on-surface-variant font-headline font-bold text-lg py-5 opacity-50 cursor-not-allowed transition-all duration-200 flex justify-center items-center gap-3" disabled>
                    <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">task_alt</span>
                    ${t(state.language, 'donePeeking')}
                </button>
                <p class="text-on-surface-variant text-sm text-center flex items-center gap-1.5 opacity-80">
                    <span class="material-symbols-outlined text-[16px]">sync</span>
                    ${t(state.language, 'passDeviceBack')}
                </p>
            </div>
        </main>
        `;
    },
    mounted: (state) => {
        const card = document.getElementById('revealCard');
        const hiddenState = document.getElementById('hiddenState');
        const revealedState = document.getElementById('revealedState');
        const doneBtn = document.getElementById('doneBtn');
        let hasPeeked = false;

        const showReveal = (e) => {
            e.preventDefault();
            hiddenState.classList.add('hidden');
            revealedState.classList.remove('hidden');
            revealedState.classList.add('flex');
            hasPeeked = true;
        };

        const hideReveal = (e) => {
            e.preventDefault();
            hiddenState.classList.remove('hidden');
            revealedState.classList.add('hidden');
            revealedState.classList.remove('flex');
            
            if (hasPeeked) {
                // Enable Done button with its proper styling
                doneBtn.disabled = false;
                doneBtn.className = "w-full rounded-full bg-gradient-to-br from-tertiary to-tertiary-container text-on-tertiary-container font-headline font-bold text-lg py-5 shadow-[0_0_40px_rgba(255,107,155,0.15)] hover:shadow-[0_0_50px_rgba(255,107,155,0.25)] active:scale-[0.98] transition-all duration-200 flex justify-center items-center gap-3 border border-tertiary/20";
            }
        };

        // touch events for mobile, mouse for desktop
        card.addEventListener('mousedown', showReveal);
        card.addEventListener('touchstart', showReveal);
        
        window.addEventListener('mouseup', hideReveal);
        window.addEventListener('touchend', hideReveal);

        doneBtn.addEventListener('click', () => {
            if (!doneBtn.disabled) {
                // Remove window listeners
                window.removeEventListener('mouseup', hideReveal);
                window.removeEventListener('touchend', hideReveal);
                store.nextPlayerReveal();
            }
        });
    }
};
