const STORAGE_PLAYERS = 'impostor_players';
const STORAGE_SCORES = 'impostor_scores';

/**
 * @returns {{ players: string[]; scores: Record<string, number> } | null}
 */
export function loadPersistedProfile() {
    try {
        const rawP = localStorage.getItem(STORAGE_PLAYERS);
        const rawS = localStorage.getItem(STORAGE_SCORES);
        if (!rawP && !rawS) return null;

        /** @type {string[]} */
        let players = [];
        if (rawP) {
            const p = JSON.parse(rawP);
            if (Array.isArray(p) && p.every((x) => typeof x === 'string')) {
                players = p.map((s) => String(s).trim()).filter(Boolean);
            }
        }

        /** @type {Record<string, number>} */
        const scores = {};
        if (rawS) {
            const s = JSON.parse(rawS);
            if (s && typeof s === 'object' && !Array.isArray(s)) {
                for (const [k, v] of Object.entries(s)) {
                    if (typeof k === 'string' && typeof v === 'number' && Number.isFinite(v)) {
                        scores[k] = v;
                    }
                }
            }
        }

        if (players.length < 1 && Object.keys(scores).length === 0) return null;
        return { players, scores };
    } catch {
        return null;
    }
}

/**
 * @param {string[]} names
 */
export function savePersistedPlayers(names) {
    try {
        localStorage.setItem(STORAGE_PLAYERS, JSON.stringify([...names]));
    } catch {
        /* quota or private mode */
    }
}

/**
 * @param {Record<string, number>} scores
 */
export function savePersistedScores(scores) {
    try {
        localStorage.setItem(STORAGE_SCORES, JSON.stringify({ ...scores }));
    } catch {
        /* quota or private mode */
    }
}

export function clearPersistedProfile() {
    try {
        localStorage.removeItem(STORAGE_PLAYERS);
        localStorage.removeItem(STORAGE_SCORES);
    } catch {
        /* ignore */
    }
}
