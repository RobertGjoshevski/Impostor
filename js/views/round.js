import { store } from '../store.js';
import { t } from '../i18n.js';

const VOTE_SCREEN_AD_CLIENT = 'ca-pub-2604520815931185';
const VOTE_SCREEN_AD_SLOT = '8497570176';

function mountVoteScreenAd() {
    const host = document.getElementById('impostor-ad-host');
    if (!host) return;

    host.innerHTML = '';
    host.classList.remove('hidden');

    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', VOTE_SCREEN_AD_CLIENT);
    ins.setAttribute('data-ad-slot', VOTE_SCREEN_AD_SLOT);
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');
    host.appendChild(ins);

    const runPush = () => {
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (_) {
            /* ad blocker or script blocked */
        }
    };
    requestAnimationFrame(() => {
        requestAnimationFrame(runPush);
    });
}

export const RoundView = {
    render: (state) => {
        return `
        <header class="docked full-width top-0 z-50 bg-[#0c0c1f]/80 backdrop-blur-xl shadow-[0_0_40px_rgba(208,149,255,0.08)] flex justify-center items-center w-full px-6 py-4 fixed">
            <h1 class="font-headline font-bold tracking-tighter text-2xl font-black tracking-widest text-[#d095ff] uppercase">IMPOSTOR</h1>
        </header>
        
        <main class="flex-grow pt-24 pb-32 px-6 flex flex-col gap-8 max-w-3xl mx-auto w-full relative z-10 animate-fade-in">
            <section class="flex flex-col items-center justify-center pt-4">
                <p class="font-label text-on-surface-variant text-sm tracking-widest uppercase mb-2">${t(state.language, 'discussionRound')}</p>
                <div class="text-center mt-4">
                    <h2 class="font-headline text-5xl font-extrabold text-primary drop-shadow-[0_0_15px_rgba(208,149,255,0.3)]">${t(state.language, 'active')}</h2>
                    <p class="mt-4 text-on-surface-variant text-sm leading-relaxed max-w-[280px]">
                        ${t(state.language, 'roundIntro')}
                    </p>
                </div>
            </section>

            <section class="w-full mt-4">
                <div class="flex justify-between items-end mb-4">
                    <h4 class="font-headline text-lg font-bold text-on-surface">${t(state.language, 'castVotes')}</h4>
                </div>
                <div class="bg-surface-container-low rounded-xl p-4 shadow-sm">
                    <div class="flex flex-col gap-4">
                        ${state.players.map(p => `
                            <div class="flex items-center justify-between p-3 rounded-lg bg-surface-container hover:bg-surface-container-highest transition-colors">
                                <div class="flex items-center gap-4">
                                    <div class="w-10 h-10 flex-shrink-0 rounded-full bg-surface-variant flex items-center justify-center text-primary font-bold text-sm uppercase">
                                        ${p.name.substring(0, 2)}
                                    </div>
                                    <div>
                                        <p class="font-bold text-sm text-on-surface">${p.name}</p>
                                    </div>
                                </div>
                                <select data-voter="${p.name}" class="vote-select bg-surface bg-opacity-50 text-on-surface text-sm rounded-lg pl-3 pr-9 py-2 outline-none focus:ring-1 focus:ring-primary border border-outline-variant/30 max-w-[140px] shadow-inner text-ellipsis cursor-pointer">
                                    <option value="" disabled ${!state.votes[p.name] ? 'selected' : ''}>${t(state.language, 'voteEllipsis')}</option>
                                    ${state.players.filter(target => target.name !== p.name).map(target => `
                                        <option value="${target.name}" ${state.votes[p.name] === target.name ? 'selected' : ''}>
                                            ${target.name}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>

            <section class="mt-8 flex justify-center">
                <button id="endRoundBtn" class="w-full md:w-auto bg-gradient-to-br from-[#ff6e84] to-[#d73357] text-[#490013] font-headline font-bold text-lg py-4 px-12 rounded-full shadow-[0_0_32px_rgba(255,110,132,0.15)] hover:opacity-90 active:scale-95 transition-all duration-200 flex items-center justify-center gap-3">
                    <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">done_all</span>
                    ${t(state.language, 'finishTally')}
                </button>
            </section>
        </main>
        `;
    },
    mounted: (state) => {
        document.querySelectorAll('.vote-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const voter = e.target.getAttribute('data-voter');
                const suspect = e.target.value;
                store.castVote(voter, suspect);
            });
        });

        document.getElementById('endRoundBtn').addEventListener('click', () => {
            // Confirm if not everyone voted? (Optional enhancement)
            const votedCount = Object.keys(store.state.votes).length;
            if (votedCount < store.state.players.length) {
                if (!confirm(t(store.state.language, 'confirmEndRound'))) return;
            }
            store.endGame();
        });

        mountVoteScreenAd();
    },
    update: (state) => {
        // We do not physically touch the DOM on vote changes to avoid select-flashing,
        // The elements' native state acts as the source of truth for UI here since we sync it.
        // It's sufficient because "castVote" only updates votes.
    }
};
