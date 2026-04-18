import { store } from '../store.js';

export const TransitionView = {
    render: (state) => {
        const player = state.players[state.currentPlayerIndex];
        return `
        <!-- Ambient Background Glows -->
        <div class="absolute inset-0 pointer-events-none overflow-hidden z-0">
            <div class="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-primary/10 blur-[120px]"></div>
            <div class="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-tertiary/10 blur-[150px]"></div>
        </div>
        
        <main class="relative z-10 w-full max-w-md px-6 flex flex-col items-center animate-fade-in mx-auto h-full justify-center">
            <div class="mb-12 flex items-center gap-2 opacity-60">
                <span class="material-symbols-outlined text-primary text-xl" style="font-variation-settings: 'FILL' 1;">theater_comedy</span>
                <span class="font-headline font-black tracking-[0.25em] text-xs text-primary uppercase">Impostor</span>
            </div>
            
            <div class="relative w-full bg-surface-bright/40 backdrop-blur-2xl rounded-[2rem] p-8 shadow-[0_0_64px_rgba(208,149,255,0.08)] ring-1 ring-outline-variant/20">
                <div class="pt-6">
                    <p class="font-label text-primary font-bold text-[10px] tracking-[0.25em] uppercase mb-3 flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        Transfer Required
                    </p>
                    <h1 class="font-headline text-5xl md:text-6xl font-black text-on-surface leading-[1.05] tracking-tighter">
                        Pass<br>Device<br>
                        <span class="text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary-container">To ${player.name}</span>
                    </h1>
                    <p class="mt-6 text-on-surface-variant text-sm font-medium leading-relaxed max-w-[200px]">
                        Ensure you are alone before viewing your role assignment.
                    </p>
                </div>
                
                <div class="mt-10">
                    <button id="readyBtn" class="w-full py-5 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary-container font-headline font-extrabold text-lg shadow-[0_0_32px_rgba(208,149,255,0.15)] hover:shadow-[0_0_48px_rgba(208,149,255,0.25)] transition-all active:scale-95 flex items-center justify-center gap-3 group">
                        <span class="material-symbols-outlined transition-transform duration-300 group-hover:scale-110" style="font-variation-settings: 'FILL' 1;">touch_app</span>
                        I'm Ready
                    </button>
                </div>
            </div>
        </main>
    `},
    mounted: (state) => {
        document.getElementById('readyBtn').addEventListener('click', () => {
            store.setState({ screen: 'reveal' });
        });
    }
};
