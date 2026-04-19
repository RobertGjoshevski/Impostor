import { store, normalizePlayerName } from '../store.js';
import { getRandomWord, loadLanguageData } from '../words.js';
import { t } from '../i18n.js';

export const SetupView = {
    render: (state) => `
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

        <main class="flex-1 flex flex-col px-6 pt-24 pb-12 max-w-md mx-auto w-full gap-8 animate-fade-in">
            <div class="space-y-2">
                <h2 class="font-headline text-3xl font-bold text-on-surface tracking-tight">${t(state.language, 'configureGame')}</h2>
                <p class="font-body text-on-surface-variant text-sm">${t(state.language, 'configureGameDesc')}</p>
            </div>
            
            <!-- Add Player Section -->
            <section class="bg-surface-container-high rounded-xl p-5 shadow-[0_0_32px_rgba(208,149,255,0.04)] flex flex-col gap-4 relative overflow-hidden">
                <div class="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
                <div class="flex items-center justify-between">
                    <h3 class="font-headline text-lg font-semibold text-primary">${t(state.language, 'crewRoster')}</h3>
                    <span id="playerCountSpan" class="bg-surface-container-low text-on-surface-variant text-xs font-bold px-3 py-1 rounded-full">${t(state.language, 'playersCount', { count: state.players.length })}</span>
                </div>
                <div class="flex gap-3">
                    <input id="playerNameInput" class="flex-1 bg-surface-container-low border-none rounded-lg text-on-surface placeholder:text-on-surface-variant/50 focus:ring-1 focus:ring-primary px-4 py-3 font-body text-sm transition-shadow" placeholder="${t(state.language, 'playerPlaceholder')}" type="text"/>
                    <button id="addPlayerBtn" class="bg-surface-container-highest text-primary rounded-lg px-4 flex items-center justify-center hover:bg-surface-bright transition-colors active:scale-95 duration-200">
                        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">add</span>
                    </button>
                </div>
                <ul id="playerList" class="flex flex-col gap-2 mt-2 max-h-48 overflow-y-auto">
                    ${SetupView.renderPlayerList(state.players)}
                </ul>
            </section>

            <!-- Game Settings -->
            <section class="bg-surface-container-high rounded-xl p-5 shadow-[0_0_32px_rgba(208,149,255,0.04)] flex flex-col gap-6">
                <h3 class="font-headline text-lg font-semibold text-primary">${t(state.language, 'gameSettings')}</h3>
                
                <!-- Theme Editor -->
                <div class="flex items-center justify-between bg-surface-container-low rounded-lg p-4 cursor-pointer hover:bg-surface-container-highest transition-colors active:scale-95" id="openThemesBtn">
                    <div class="flex flex-col">
                        <span class="font-body text-base font-semibold text-on-surface">${t(state.language, 'categories')}</span>
                        <span id="themesCountSpan" class="font-body text-xs text-on-surface-variant">${t(state.language, 'themesSelected', { sel: state.selectedThemes.length, play: state.themePlayableCount ?? 0, total: state.availableThemes.length })}</span>
                    </div>
                    <span class="material-symbols-outlined text-on-surface text-[20px]">chevron_right</span>
                </div>

                <!-- Impostor Stepper -->
                <div class="flex items-center justify-between bg-surface-container-low rounded-lg p-4">
                    <div class="flex flex-col">
                        <span class="font-body text-base font-semibold text-on-surface">${t(state.language, 'impostors')}</span>
                        <span class="font-body text-xs text-on-surface-variant">${t(state.language, 'impostorsRecommended')}</span>
                    </div>
                    <div class="flex items-center gap-4 bg-surface rounded-full px-2 py-1">
                        <button id="decImpostorsBtn" class="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center hover:bg-surface-bright active:scale-90 transition-all">
                            <span class="material-symbols-outlined text-[20px]">remove</span>
                        </button>
                        <span id="impostorCountSpan" class="font-headline text-xl font-bold text-tertiary w-4 text-center">${state.impostorCount}</span>
                        <button id="incImpostorsBtn" class="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center hover:bg-surface-bright active:scale-90 transition-all">
                            <span class="material-symbols-outlined text-[20px]">add</span>
                        </button>
                    </div>
                </div>
            </section>

            <!-- Start Game CTA -->
            <div id="startSection" class="mt-4 pb-8">
                ${SetupView.renderStartButton(state, state.players.length)}
            </div>
        </main>
    `,

    renderPlayerList: (players) => {
        return players.map((p, index) => {
            const label = normalizePlayerName(p);
            const initial = label.charAt(0) || '?';
            return `
            <li class="flex items-center justify-between bg-surface-container-low rounded-lg p-3 group">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-primary font-bold text-xs uppercase border border-outline-variant/20">
                        ${initial}
                    </div>
                    <span class="font-body text-sm font-medium text-on-surface">${label}</span>
                </div>
                <button data-index="${index}" class="remove-player-btn text-on-surface-variant md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:text-error active:scale-90">
                    <span class="material-symbols-outlined text-[20px]">close</span>
                </button>
            </li>
        `;
        }).join('');
    },

    renderStartButton: (state, playerCount) => {
        const disabled = playerCount < 3 ? 'disabled' : '';
        const warning = playerCount < 3 ? `<p class="text-error text-xs mt-2 text-center">${t(state.language, 'needPlayersWarning')}</p>` : '';
        return `
            <button id="startGameBtn" class="w-full rounded-full py-4 px-8 font-headline font-bold text-lg text-on-primary-container bg-gradient-to-br from-primary to-primary-container shadow-[0_0_40px_rgba(208,149,255,0.15)] hover:shadow-[0_0_60px_rgba(208,149,255,0.25)] hover:from-primary-dim hover:to-primary-fixed transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50" ${disabled}>
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
                ${t(state.language, 'startSession')}
            </button>
            ${warning}
        `;
    },

    bindRemoveButtons: () => {
        document.querySelectorAll('.remove-player-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.getAttribute('data-index'));
                store.removePlayer(idx);
            });
        });
    },

    bindStartButton: () => {
        const startBtn = document.getElementById('startGameBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                const word = getRandomWord();
                store.startGame(word);
            });
        }
    },

    mounted: (state) => {
        const input = document.getElementById('playerNameInput');
        const addBtn = document.getElementById('addPlayerBtn');
        
        const addPlayer = () => {
            if (input.value) {
                store.addPlayer(input.value);
                input.value = ''; 
            }
        };

        addBtn.addEventListener('click', addPlayer);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addPlayer();
        });

        SetupView.bindRemoveButtons();

        document.getElementById('decImpostorsBtn').addEventListener('click', () => {
            store.setImpostorCount(store.state.impostorCount - 1);
        });

        document.getElementById('incImpostorsBtn').addEventListener('click', () => {
            store.setImpostorCount(store.state.impostorCount + 1);
        });

        document.getElementById('openThemesBtn').addEventListener('click', () => {
            store.setState({ screen: 'themes' });
        });

        const langSelect = document.getElementById('languageSelect');
        if(langSelect) {
            langSelect.addEventListener('change', (e) => {
                const lang = e.target.value;
                loadLanguageData(lang);
            });
        }

        SetupView.bindStartButton();
    },

    update: (state) => {
        document.getElementById('playerCountSpan').innerText = t(state.language, 'playersCount', { count: state.players.length });
        document.getElementById('themesCountSpan').innerText = t(state.language, 'themesSelected', { sel: state.selectedThemes.length, play: state.themePlayableCount ?? 0, total: state.availableThemes.length });
        document.getElementById('impostorCountSpan').innerText = state.impostorCount;
        
        document.getElementById('playerList').innerHTML = SetupView.renderPlayerList(state.players);
        SetupView.bindRemoveButtons();

        document.getElementById('startSection').innerHTML = SetupView.renderStartButton(state, state.players.length);
        SetupView.bindStartButton();
    }
};
