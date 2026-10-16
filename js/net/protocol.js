/** P2P JSON message types and client intent actions. */

export const MSG = {
    INTENT: 'INTENT',
    PUBLIC_STATE: 'PUBLIC_STATE',
    PRIVATE_STATE: 'PRIVATE_STATE',
};

export const ACTIONS = {
    JOIN_LOBBY: 'JOIN_LOBBY',
    SET_READY: 'SET_READY',
    CAST_VOTE: 'CAST_VOTE',
};

/**
 * @param {string} type
 * @param {Record<string, unknown>} [fields]
 */
export function envelope(type, fields = {}) {
    return { type, ...fields };
}
