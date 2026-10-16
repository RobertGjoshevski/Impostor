/**
 * Public Firebase web config used only for room codes + WebRTC SDP/ICE handshake.
 * Restrict writes with database.rules.json in the Firebase console.
 *
 * Replace these values with the project's Firebase console web app config
 * if rooms fail to create (Realtime Database must be enabled).
 */
export const firebaseConfig = {
    apiKey: 'AIzaSyB8vKqImpostorWebP2pSignaling01',
    authDomain: 'impostor-rgsoft.firebaseapp.com',
    databaseURL: 'https://impostor-rgsoft-default-rtdb.europe-west1.firebasedatabase.app',
    projectId: 'impostor-rgsoft',
    storageBucket: 'impostor-rgsoft.firebasestorage.app',
    messagingSenderId: '1049382716401',
    appId: '1:1049382716401:web:7c2e0a1b9d4f6e8a0c3d5e',
};

/** Set true after pasting a real Firebase web app config above. */
export const FIREBASE_CONFIGURED = false;

const FIREBASE_APP_URL = 'https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js';
const FIREBASE_DB_URL = 'https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js';

let dbPromise = null;

export function shouldUseLocalSignaling() {
    const host = typeof location !== 'undefined' ? location.hostname : '';
    if (host === 'localhost' || host === '127.0.0.1' || host === '') return true;
    try {
        return new URLSearchParams(location.search).get('signal') === 'local';
    } catch {
        return false;
    }
}

/**
 * @returns {Promise<{
 *   db: import('https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js').Database,
 *   mod: typeof import('https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js'),
 * }>}
 */
export function getFirebase() {
    if (dbPromise) return dbPromise;
    dbPromise = (async () => {
        const appMod = await import(FIREBASE_APP_URL);
        const mod = await import(FIREBASE_DB_URL);
        const app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(firebaseConfig);
        const db = mod.getDatabase(app);
        return { db, mod };
    })();
    return dbPromise;
}
