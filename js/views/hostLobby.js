import { store } from '../store.js';
import { t } from '../i18n.js';
import { escapeHtml } from '../net/ids.js';
import {
    clientSendReady,
    connectedPlayers,
    hostCreateRoom,
    hostStartGame,
    hostToggleReady,
    isHost,
    leaveSession,
} from '../net/onlineSession.js';

function badgeClass(connected, connecting) {
    if (connecting) return 'bg-primary/20 text-primary';
    if (connected) return 'bg-secondary/20 text-secondary';
    return 'bg-error/20 text-error';
}

function badgeLabel(lang, connected, connecting) {
    if (connecting) return t(lang, 'p2pConnecting');
    if (connected) return t(lang, 'p2pConnected');
    return t(lang, 'p2pDropped');
}

export const HostLobbyView = {
    render: (state) => {
        const host = isHost(state);
        const code = state.roomCode;
        const connected = connectedPlayers(state).length;
        const canStart = host && connected >= 3;
        return `
        <header class="bg-[#0c0c1f]/80 backdrop-blur-xl docked full-width top-0 z-50 shadow-[0_0_40px_rgba(208,149,255,0.08)] flex justify-between items-center w-full px-6 py-4 absolute">
            <button type="button" id="leaveRoomBtn" class="text-on-surface-variant hover:text-error flex items-center gap-1">
                <span class="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <h1 class="font-headline font-bold tracking-tighter text-xl font-black tracking-widest text-[#d095ff] uppercase">IMPOSTOR</h1>
            <span class="w-8"></span>
        </header>

        <main class="flex-1 flex flex-col px-6 pt-24 pb-12 max-w-md mx-auto w-full gap-6">
            ${code ? HostLobbyView.renderLobby(state, host, canStart, connected) : HostLobbyView.renderCreate(state)}
        </main>
        `;
    },

    renderCreate: (state) => `
        <div class="space-y-2">
            <h2 class="font-headline text-3xl font-bold text-on-surface tracking-tight">${t(state.language, 'hostARoom')}</h2>
            <p class="font-body text-on-surface-variant text-sm">${t(state.language, 'hostARoomDesc')}</p>
        </div>
        <section class="bg-surface-container-high rounded-xl p-5 flex flex-col gap-4">
            <label class="font-body text-sm text-on-surface-variant" for="hostNameInput">${t(state.language, 'yourName')}</label>
            <input id="hostNameInput" class="w-full bg-surface-container-low border-none rounded-lg text-on-surface placeholder:text-on-surface-variant/50 focus:ring-1 focus:ring-primary px-4 py-3 font-body text-sm" placeholder="${t(state.language, 'hostNamePlaceholder')}" type="text" maxlength="24" value="${escapeHtml(state.myName || '')}"/>
            <p id="hostCreateError" class="text-error text-xs hidden"></p>
            <button type="button" id="createRoomBtn" class="w-full rounded-full py-4 px-8 font-headline font-bold text-lg text-on-primary-container bg-gradient-to-br from-primary to-primary-container shadow-[0_0_40px_rgba(208,149,255,0.15)] hover:from-primary-dim active:scale-95 flex items-center justify-center gap-3">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">meeting_room</span>
                ${t(state.language, 'createRoom')}
            </button>
        </section>
    `,

    renderLobby: (state, host, canStart, connected) => {
        const me = state.myClientId;
        const players = state.players || [];
        const connecting = (state.connectingPeers || []).filter((id) => !players.some((p) => p.id === id));
        return `
            <div class="text-center space-y-2">
                <p class="font-label text-on-surface-variant text-xs tracking-widest uppercase">${t(state.language, 'roomCode')}</p>
                <div class="flex items-center justify-center gap-3">
                    <p id="roomCodeDisplay" class="p2p-room-code font-headline text-5xl font-black tracking-[0.35em] text-primary">${escapeHtml(state.roomCode)}</p>
                    <button type="button" id="copyCodeBtn" class="bg-surface-container-highest text-on-surface rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider">${t(state.language, 'copyCode')}</button>
                </div>
                <p class="text-on-surface-variant text-xs">${host ? t(state.language, 'youAreHost') : t(state.language, 'waitingForHost')}</p>
            </div>

            <section class="bg-surface-container-high rounded-xl p-5 flex flex-col gap-3">
                <div class="flex items-center justify-between">
                    <h3 class="font-headline text-lg font-semibold text-primary">${t(state.language, 'playersInRoom')}</h3>
                    <span id="onlinePlayerCount" class="bg-surface-container-low text-on-surface-variant text-xs font-bold px-3 py-1 rounded-full">${connected}</span>
                </div>
                <ul id="onlinePlayerList" class="flex flex-col gap-2">
                    ${players
                        .map((p) => {
                            const mine = p.id === me;
                            return `
                        <li class="flex items-center justify-between bg-surface-container-low rounded-lg p-3">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-primary font-bold text-xs uppercase">${escapeHtml((p.name || '?').charAt(0))}</div>
                                <div>
                                    <p class="font-body text-sm font-medium text-on-surface">${escapeHtml(p.name)}${mine ? ` <span class="text-on-surface-variant text-xs">(${t(state.language, 'you')})</span>` : ''}</p>
                                    <p class="text-[10px] uppercase tracking-wider ${p.ready ? 'text-secondary' : 'text-on-surface-variant'}">${p.ready ? t(state.language, 'ready') : t(state.language, 'notReady')}</p>
                                </div>
                            </div>
                            <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${badgeClass(p.connected, false)}">${badgeLabel(state.language, p.connected, false)}</span>
                        </li>`;
                        })
                        .join('')}
                    ${connecting
                        .map(
                            (id) => `
                        <li class="flex items-center justify-between bg-surface-container-low rounded-lg p-3 opacity-80">
                            <p class="font-body text-sm text-on-surface-variant">${escapeHtml(id.slice(0, 8))}…</p>
                            <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${badgeClass(false, true)}">${badgeLabel(state.language, false, true)}</span>
                        </li>`,
                        )
                        .join('')}
                </ul>
            </section>

            ${host ? HostLobbyView.renderHostControls(state, canStart) : HostLobbyView.renderClientWait(state)}
        `;
    },

    renderHostControls: (state, canStart) => `
        <section class="bg-surface-container-high rounded-xl p-5 flex flex-col gap-4">
            <h3 class="font-headline text-lg font-semibold text-primary">${t(state.language, 'gameSettings')}</h3>
            <div class="flex items-center justify-between bg-surface-container-low rounded-lg p-4 cursor-pointer hover:bg-surface-container-highest transition-colors active:scale-95" id="openThemesBtn">
                <div class="flex flex-col">
                    <span class="font-body text-base font-semibold text-on-surface">${t(state.language, 'categories')}</span>
                    <span class="font-body text-xs text-on-surface-variant">${t(state.language, 'themesSelected', { sel: state.selectedThemes.length, total: state.availableThemes.length })}</span>
                </div>
                <span class="material-symbols-outlined text-on-surface text-[20px]">chevron_right</span>
            </div>
            <div class="flex items-center justify-between bg-surface-container-low rounded-lg p-4">
                <div class="flex flex-col">
                    <span class="font-body text-base font-semibold text-on-surface">${t(state.language, 'impostors')}</span>
                    <span class="font-body text-xs text-on-surface-variant">${t(state.language, 'impostorsRecommended')}</span>
                </div>
                <div class="flex items-center gap-4 bg-surface rounded-full px-2 py-1">
                    <button type="button" id="decImpostorsBtn" class="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center hover:bg-surface-bright active:scale-90">
                        <span class="material-symbols-outlined text-[20px]">remove</span>
                    </button>
                    <span class="font-headline text-xl font-bold text-tertiary w-4 text-center">${state.impostorCount}</span>
                    <button type="button" id="incImpostorsBtn" class="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center hover:bg-surface-bright active:scale-90">
                        <span class="material-symbols-outlined text-[20px]">add</span>
                    </button>
                </div>
            </div>
        </section>
        <button type="button" id="toggleReadyBtn" class="w-full py-3 rounded-lg border border-outline-variant/40 text-on-surface text-sm font-semibold hover:bg-surface-container-high">
            ${t(state.language, 'imReadyLobby')}
        </button>
        <div id="startSectionOnline">
            <button type="button" id="startOnlineBtn" class="w-full rounded-full py-4 px-8 font-headline font-bold text-lg text-on-primary-container bg-gradient-to-br from-primary to-primary-container shadow-[0_0_40px_rgba(208,149,255,0.15)] hover:from-primary-dim active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50" ${canStart ? '' : 'disabled'}>
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
                ${t(state.language, 'startOnlineGame')}
            </button>
            ${canStart ? '' : `<p class="text-error text-xs mt-2 text-center">${t(state.language, 'needOnlinePlayers')}</p>`}
        </div>
    `,

    renderClientWait: (state) => {
        const me = (state.players || []).find((p) => p.id === state.myClientId);
        const ready = me && me.ready;
        return `
            <button type="button" id="toggleReadyBtn" class="w-full rounded-full py-4 px-8 font-headline font-bold text-lg ${ready ? 'bg-secondary/20 text-secondary' : 'text-on-primary-container bg-gradient-to-br from-primary to-primary-container'} flex items-center justify-center gap-3">
                ${ready ? t(state.language, 'ready') : t(state.language, 'imReadyLobby')}
            </button>
            <p class="text-center text-on-surface-variant text-sm">${t(state.language, 'waitingForHost')}</p>
        `;
    },

    bindLobby: (state) => {
        const leave = document.getElementById('leaveRoomBtn');
        if (leave) leave.addEventListener('click', () => leaveSession());

        const copyBtn = document.getElementById('copyCodeBtn');
        if (copyBtn && state.roomCode) {
            copyBtn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(state.roomCode);
                    copyBtn.textContent = t(state.language, 'codeCopied');
                } catch {
                    copyBtn.textContent = state.roomCode;
                }
            });
        }

        const createBtn = document.getElementById('createRoomBtn');
        const nameInput = document.getElementById('hostNameInput');
        if (createBtn && nameInput) {
            const go = async () => {
                const errEl = document.getElementById('hostCreateError');
                createBtn.disabled = true;
                try {
                    await hostCreateRoom(nameInput.value);
                } catch (err) {
                    if (errEl) {
                        errEl.textContent = err && err.message ? err.message : t(state.language, 'connectionFailed');
                        errEl.classList.remove('hidden');
                    }
                    createBtn.disabled = false;
                }
            };
            createBtn.addEventListener('click', go);
            nameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') go();
            });
        }

        const readyBtn = document.getElementById('toggleReadyBtn');
        if (readyBtn) {
            readyBtn.dataset.bound = '1';
            readyBtn.addEventListener('click', () => {
                if (isHost(store.state)) hostToggleReady();
                else {
                    const me = (store.state.players || []).find((p) => p.id === store.state.myClientId);
                    clientSendReady(!(me && me.ready));
                }
            });
        }

        const themes = document.getElementById('openThemesBtn');
        if (themes) {
            themes.addEventListener('click', () => {
                store.setState({ screen: 'themes', themesReturnScreen: 'hostLobby' });
            });
        }
        const dec = document.getElementById('decImpostorsBtn');
        if (dec) dec.addEventListener('click', () => store.setImpostorCount(store.state.impostorCount - 1));
        const inc = document.getElementById('incImpostorsBtn');
        if (inc) inc.addEventListener('click', () => store.setImpostorCount(store.state.impostorCount + 1));

        const startBtn = document.getElementById('startOnlineBtn');
        if (startBtn) startBtn.addEventListener('click', () => hostStartGame());
    },

    mounted: (state) => {
        HostLobbyView.bindLobby(state);
    },

    update: (state) => {
        const list = document.getElementById('onlinePlayerList');
        if (!list || !state.roomCode) {
            const app = document.getElementById('app');
            if (!app) return;
            app.innerHTML = HostLobbyView.render(state);
            HostLobbyView.bindLobby(state);
            return;
        }
        const host = isHost(state);
        const connected = connectedPlayers(state).length;
        const canStart = host && connected >= 3;
        const section = HostLobbyView.renderLobby(state, host, canStart, connected);
        const tmp = document.createElement('div');
        tmp.innerHTML = section;
        const nextList = tmp.querySelector('#onlinePlayerList');
        if (nextList) list.innerHTML = nextList.innerHTML;
        const count = document.getElementById('onlinePlayerCount');
        if (count) count.textContent = String(connected);
        const startWrap = document.getElementById('startSectionOnline');
        const nextStart = tmp.querySelector('#startSectionOnline');
        if (startWrap && nextStart) {
            startWrap.innerHTML = nextStart.innerHTML;
            document.getElementById('startOnlineBtn')?.addEventListener('click', () => hostStartGame());
        }
        const readyBtn = document.getElementById('toggleReadyBtn');
        if (readyBtn && !host) {
            const me = (state.players || []).find((p) => p.id === state.myClientId);
            readyBtn.textContent = me && me.ready ? t(state.language, 'ready') : t(state.language, 'imReadyLobby');
        }
    },
};
