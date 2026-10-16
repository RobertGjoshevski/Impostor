import { store } from '../store.js';
import { loadLanguageData } from '../words.js';
import { t } from '../i18n.js';

export const HomeView = {
    render: (state) => {
        const online = state.homePanel === 'online';
        return `
        <header class="bg-[#0c0c1f]/80 backdrop-blur-xl docked full-width top-0 z-50 shadow-[0_0_40px_rgba(208,149,255,0.08)] flex justify-between items-center w-full px-6 py-4 absolute">
            <h1 class="font-headline font-bold tracking-tighter text-2xl font-black tracking-widest text-[#d095ff] uppercase">IMPOSTOR</h1>
            <select id="languageSelect" class="bg-surface-container border border-outline-variant/30 text-on-surface-variant text-xs rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-primary shadow-inner text-ellipsis cursor-pointer">
                <option value="en" ${state.language==='en'?'selected':''}>English</option>
                <option value="de" ${state.language==='de'?'selected':''}>Deutsch</option>
                <option value="id" ${state.language==='id'?'selected':''}>Bahasa Indonesia</option>
                <option value="mk" ${state.language==='mk'?'selected':''}>Македонски</option>
                <option value="es" ${state.language==='es'?'selected':''}>Español</option>
                <option value="it" ${state.language==='it'?'selected':''}>Italiano</option>
            </select>
        </header>

        <main class="flex-1 flex flex-col px-6 pt-24 pb-12 max-w-md mx-auto w-full gap-8">
            <div class="space-y-2">
                <h2 class="font-headline text-3xl font-bold text-on-surface tracking-tight">${t(state.language, 'chooseMode')}</h2>
                <p class="font-body text-on-surface-variant text-sm">${t(state.language, 'chooseModeDesc')}</p>
            </div>

            ${online ? HomeView.renderOnlinePanel(state) : HomeView.renderModePanel(state)}

            <p class="text-center pb-8">
                <a href="privacy-policy.html" class="text-on-surface-variant text-xs underline underline-offset-2 hover:text-primary transition-colors">${t(state.language, 'privacyPolicy')}</a>
            </p>
        </main>
    `;
    },

    renderModePanel: (state) => `
        <button type="button" id="playLocalBtn" class="text-left bg-surface-container-high rounded-xl p-5 shadow-[0_0_32px_rgba(208,149,255,0.04)] flex flex-col gap-2 hover:bg-surface-container-highest transition-colors active:scale-[0.99]">
            <span class="material-symbols-outlined text-primary text-3xl" style="font-variation-settings: 'FILL' 1;">phone_iphone</span>
            <h3 class="font-headline text-xl font-bold text-on-surface">${t(state.language, 'playPassAndPlay')}</h3>
            <p class="font-body text-on-surface-variant text-sm">${t(state.language, 'playPassAndPlayDesc')}</p>
        </button>
        <button type="button" id="playOnlineBtn" class="text-left bg-surface-container-high rounded-xl p-5 shadow-[0_0_32px_rgba(208,149,255,0.04)] flex flex-col gap-2 hover:bg-surface-container-highest transition-colors active:scale-[0.99] ring-1 ring-primary/30">
            <span class="material-symbols-outlined text-tertiary text-3xl" style="font-variation-settings: 'FILL' 1;">wifi_tethering</span>
            <h3 class="font-headline text-xl font-bold text-on-surface">${t(state.language, 'playOnline')}</h3>
            <p class="font-body text-on-surface-variant text-sm">${t(state.language, 'playOnlineDesc')}</p>
        </button>
    `,

    renderOnlinePanel: (state) => `
        <button type="button" id="homeBackBtn" class="self-start text-on-surface-variant text-sm flex items-center gap-1 hover:text-primary">
            <span class="material-symbols-outlined text-[18px]">arrow_back</span>
            ${t(state.language, 'back')}
        </button>
        <button type="button" id="hostRoomBtn" class="text-left bg-surface-container-high rounded-xl p-5 flex flex-col gap-2 hover:bg-surface-container-highest transition-colors active:scale-[0.99]">
            <span class="material-symbols-outlined text-primary text-3xl" style="font-variation-settings: 'FILL' 1;">add_circle</span>
            <h3 class="font-headline text-xl font-bold text-on-surface">${t(state.language, 'hostARoom')}</h3>
            <p class="font-body text-on-surface-variant text-sm">${t(state.language, 'hostARoomDesc')}</p>
        </button>
        <button type="button" id="joinRoomBtn" class="text-left bg-surface-container-high rounded-xl p-5 flex flex-col gap-2 hover:bg-surface-container-highest transition-colors active:scale-[0.99]">
            <span class="material-symbols-outlined text-secondary text-3xl" style="font-variation-settings: 'FILL' 1;">login</span>
            <h3 class="font-headline text-xl font-bold text-on-surface">${t(state.language, 'joinARoom')}</h3>
            <p class="font-body text-on-surface-variant text-sm">${t(state.language, 'joinARoomDesc')}</p>
        </button>
    `,

    mounted: (state) => {
        const langSelect = document.getElementById('languageSelect');
        if (langSelect) {
            langSelect.addEventListener('change', (e) => {
                loadLanguageData(e.target.value);
            });
        }
        const localBtn = document.getElementById('playLocalBtn');
        if (localBtn) {
            localBtn.addEventListener('click', () => {
                store.setState({ playMode: 'local', screen: 'setup', homePanel: 'choose' });
            });
        }
        const onlineBtn = document.getElementById('playOnlineBtn');
        if (onlineBtn) {
            onlineBtn.addEventListener('click', () => {
                store.setState({ homePanel: 'online' });
            });
        }
        const backBtn = document.getElementById('homeBackBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                store.setState({ homePanel: 'choose' });
            });
        }
        const hostBtn = document.getElementById('hostRoomBtn');
        if (hostBtn) {
            hostBtn.addEventListener('click', () => {
                store.setState({
                    playMode: 'online',
                    onlineRole: 'host',
                    screen: 'hostLobby',
                    roomCode: null,
                    homePanel: 'choose',
                });
            });
        }
        const joinBtn = document.getElementById('joinRoomBtn');
        if (joinBtn) {
            joinBtn.addEventListener('click', () => {
                store.setState({
                    playMode: 'online',
                    onlineRole: 'client',
                    screen: 'joinRoom',
                    joinStatus: null,
                    joinError: null,
                    homePanel: 'choose',
                });
            });
        }
    },

    update: (state) => {
        const app = document.getElementById('app');
        if (!app) return;
        app.innerHTML = HomeView.render(state);
        HomeView.mounted(state);
    },
};
