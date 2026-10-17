import { store } from '../store.js';
import { t } from '../i18n.js';
import { escapeHtml } from '../net/ids.js';
import { clientJoinRoom, leaveSession } from '../net/onlineSession.js';

export const JoinRoomView = {
    render: (state) => {
        const status = state.joinStatus;
        const busy = status === 'connecting';
        return `
        <header class="bg-[#0c0c1f]/80 backdrop-blur-xl docked full-width top-0 z-50 shadow-[0_0_40px_rgba(208,149,255,0.08)] flex justify-between items-center w-full px-6 py-4 absolute">
            <button type="button" id="leaveRoomBtn" class="text-on-surface-variant hover:text-error flex items-center gap-1">
                <span class="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <h1 class="font-headline font-bold tracking-tighter text-xl font-black tracking-widest text-[#d095ff] uppercase">IMPOSTOR</h1>
            <span class="w-8"></span>
        </header>

        <main class="flex-1 flex flex-col px-6 pt-24 pb-12 max-w-md mx-auto w-full gap-6 animate-fade-in">
            <div class="space-y-2">
                <h2 class="font-headline text-3xl font-bold text-on-surface tracking-tight">${t(state.language, 'joinARoom')}</h2>
                <p class="font-body text-on-surface-variant text-sm">${t(state.language, 'joinARoomDesc')}</p>
            </div>

            <section class="bg-surface-container-high rounded-xl p-5 flex flex-col gap-4">
                <label class="font-body text-sm text-on-surface-variant" for="joinNameInput">${t(state.language, 'yourName')}</label>
                <input id="joinNameInput" class="w-full bg-surface-container-low border-none rounded-lg text-on-surface placeholder:text-on-surface-variant/50 focus:ring-1 focus:ring-primary px-4 py-3 font-body text-sm" placeholder="${t(state.language, 'joinNamePlaceholder')}" type="text" maxlength="24" value="${escapeHtml(state.myName || '')}" ${busy ? 'disabled' : ''}/>
                <label class="font-body text-sm text-on-surface-variant" for="joinCodeInput">${t(state.language, 'roomCode')}</label>
                <input id="joinCodeInput" class="w-full bg-surface-container-low border-none rounded-lg text-on-surface placeholder:text-on-surface-variant/50 focus:ring-1 focus:ring-primary px-4 py-3 font-headline text-2xl tracking-[0.4em] uppercase text-center" placeholder="${t(state.language, 'roomCodePlaceholder')}" type="text" maxlength="4" value="${escapeHtml(state.roomCode || '')}" ${busy ? 'disabled' : ''}/>
                ${state.joinError ? `<p class="text-error text-xs">${escapeHtml(JoinRoomView.errorText(state))}</p>` : ''}
                <button type="button" id="joinRoomSubmitBtn" class="w-full rounded-full py-4 px-8 font-headline font-bold text-lg text-on-primary-container bg-gradient-to-br from-primary to-primary-container shadow-[0_0_40px_rgba(208,149,255,0.15)] hover:from-primary-dim active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50" ${busy ? 'disabled' : ''}>
                    <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">login</span>
                    ${busy ? t(state.language, 'connectingToHost') : t(state.language, 'joinRoomCta')}
                </button>
            </section>
        </main>
        `;
    },

    errorText: (state) => {
        const err = String(state.joinError || '');
        if (err.toLowerCase().includes('not found')) return t(state.language, 'roomNotFound');
        if (err === 'disconnected') return t(state.language, 'disconnectedFromHost');
        if (err === 'connect-failed') return t(state.language, 'connectionFailed');
        if (err === 'Invalid room code') return t(state.language, 'roomNotFound');
        return t(state.language, 'connectionFailed');
    },

    mounted: (state) => {
        document.getElementById('leaveRoomBtn')?.addEventListener('click', () => leaveSession());
        const nameInput = document.getElementById('joinNameInput');
        const codeInput = document.getElementById('joinCodeInput');
        const btn = document.getElementById('joinRoomSubmitBtn');
        if (codeInput) {
            codeInput.addEventListener('input', () => {
                codeInput.value = codeInput.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
            });
        }
        const go = () => {
            if (!nameInput || !codeInput) return;
            clientJoinRoom(codeInput.value, nameInput.value);
        };
        btn?.addEventListener('click', go);
        nameInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') go();
        });
        codeInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') go();
        });
    },

    update: (state) => {
        const app = document.getElementById('app');
        if (!app) return;
        app.innerHTML = JoinRoomView.render(state);
        JoinRoomView.mounted(state);
    },
};
