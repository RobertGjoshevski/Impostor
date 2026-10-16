import { store } from '../store.js';
import { t } from '../i18n.js';
import { escapeHtml } from '../net/ids.js';
import {
    allConnectedVoted,
    clientCastVote,
    hostCastVote,
    hostEndRound,
    isHost,
} from '../net/onlineSession.js';

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
    ins.style.width = '100%';
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

function allPlayersVoted(state) {
    return state.players.length > 0 && state.players.every((p) => Boolean(state.votes[p.name]));
}

function playerVoted(state, playerId) {
    return Boolean((state.hasVoted && state.hasVoted[playerId]) || (state.votes && state.votes[playerId]));
}

/** Keeps tally CTA + per-player vote trigger styling in sync without re-rendering (avoids select flicker). */
function syncRoundVoteUi(state) {
    const endBtn = document.getElementById('endRoundBtn');
    if (endBtn) {
        const ready = state.playMode === 'online' ? allConnectedVoted(state) : allPlayersVoted(state);
        endBtn.disabled = !ready;
        endBtn.classList.toggle('end-round-btn--ready', ready);
        endBtn.classList.toggle('end-round-btn--locked', !ready);
    }
    document.querySelectorAll('select.vote-select').forEach((sel) => {
        const voter = sel.getAttribute('data-voter');
        const voted =
            state.playMode === 'online' ? playerVoted(state, voter) : Boolean(state.votes[voter]);
        sel.classList.toggle('vote-select--voted', voted);
    });
}

function renderOnlineRound(state) {
    const meId = state.myClientId;
    const myVote = state.votes && state.votes[meId];
    const tallyReady = allConnectedVoted(state);
    const host = isHost(state);
    const players = (state.players || []).filter((p) => p && p.id);
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
                    <p class="mt-2 text-primary text-xs">${t(state.language, 'secretBallot')}</p>
                </div>
            </section>

            <section class="w-full mt-4">
                <div class="flex justify-between items-end mb-4">
                    <h4 class="font-headline text-lg font-bold text-on-surface">${t(state.language, 'playersInRoom')}</h4>
                </div>
                <div class="bg-surface-container-low rounded-xl p-4 shadow-sm">
                    <div class="flex flex-col gap-3">
                        ${players
                            .map((p) => {
                                const voted = playerVoted(state, p.id);
                                return `
                            <div class="flex items-center justify-between p-3 rounded-lg bg-surface-container">
                                <div class="flex items-center gap-4">
                                    <div class="w-10 h-10 flex-shrink-0 rounded-full bg-surface-variant flex items-center justify-center text-primary font-bold text-sm uppercase">
                                        ${escapeHtml((p.name || '?').substring(0, 2))}
                                    </div>
                                    <p class="font-bold text-sm text-on-surface">${escapeHtml(p.name)}${p.id === meId ? ` <span class="text-on-surface-variant text-xs">(${t(state.language, 'you')})</span>` : ''}</p>
                                </div>
                                <span class="text-[10px] font-bold uppercase tracking-wider ${voted ? 'text-secondary' : 'text-on-surface-variant'}">${voted ? t(state.language, 'ready') : t(state.language, 'waitingForVotes')}</span>
                            </div>`;
                            })
                            .join('')}
                    </div>
                </div>
            </section>

            <section class="w-full">
                <h4 class="font-headline text-lg font-bold text-on-surface mb-3">${t(state.language, 'voteAs')}</h4>
                <select id="myVoteSelect" data-voter="${escapeHtml(meId || '')}" class="vote-select ${myVote ? 'vote-select--voted' : ''} w-full max-w-full text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer">
                    <option value="" disabled ${!myVote ? 'selected' : ''}>${t(state.language, 'voteEllipsis')}</option>
                    ${players
                        .filter((target) => target.id !== meId)
                        .map(
                            (target) => `
                        <option value="${escapeHtml(target.id)}" ${myVote === target.id ? 'selected' : ''}>
                            ${escapeHtml(target.name)}
                        </option>`,
                        )
                        .join('')}
                </select>
            </section>

            <section class="mt-4 flex flex-col items-center gap-3">
                ${
                    host
                        ? `
                <button id="endRoundBtn" type="button" class="end-round-btn font-headline ${tallyReady ? 'end-round-btn--ready' : 'end-round-btn--locked'}" ${tallyReady ? '' : 'disabled'}>
                    <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">done_all</span>
                    ${t(state.language, 'finishTally')}
                </button>`
                        : `<p class="text-on-surface-variant text-sm text-center">${t(state.language, 'waitingForVotes')}</p>`
                }
            </section>
        </main>
        `;
}

export const RoundView = {
    render: (state) => {
        if (state.playMode === 'online') return renderOnlineRound(state);
        const tallyReady = allPlayersVoted(state);
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
                                <select data-voter="${p.name}" class="vote-select ${state.votes[p.name] ? 'vote-select--voted' : ''} flex-shrink-0 text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer">
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

            <section class="mt-8 flex flex-col items-center gap-3">
                <button id="endRoundBtn" type="button" class="end-round-btn font-headline ${tallyReady ? 'end-round-btn--ready' : 'end-round-btn--locked'}" ${tallyReady ? '' : 'disabled'}>
                    <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">done_all</span>
                    ${t(state.language, 'finishTally')}
                </button>
            </section>
        </main>
        `;
    },
    mounted: (state) => {
        if (state.playMode === 'online') {
            const sel = document.getElementById('myVoteSelect');
            if (sel) {
                sel.addEventListener('change', (e) => {
                    const suspectId = e.target.value;
                    if (isHost(state)) hostCastVote(suspectId);
                    else clientCastVote(suspectId);
                });
            }
            const endBtn = document.getElementById('endRoundBtn');
            if (endBtn) {
                endBtn.addEventListener('click', () => {
                    if (endBtn.disabled) return;
                    hostEndRound();
                });
            }
            mountVoteScreenAd();
            return;
        }

        document.querySelectorAll('.vote-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const voter = e.target.getAttribute('data-voter');
                const suspect = e.target.value;
                store.castVote(voter, suspect);
            });
        });

        document.getElementById('endRoundBtn').addEventListener('click', () => {
            const btn = document.getElementById('endRoundBtn');
            if (!btn || btn.disabled) return;
            store.endGame();
        });

        mountVoteScreenAd();
    },
    update: (state) => {
        if (state.playMode === 'online') {
            const app = document.getElementById('app');
            if (!app) return;
            const sel = document.getElementById('myVoteSelect');
            const keepValue = sel ? sel.value : '';
            app.innerHTML = RoundView.render(state);
            RoundView.mounted(state);
            const next = document.getElementById('myVoteSelect');
            if (next && keepValue) next.value = keepValue;
            return;
        }
        syncRoundVoteUi(state);
    }
};
