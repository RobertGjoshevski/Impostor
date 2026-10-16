import { getFirebase, shouldUseLocalSignaling } from '../firebase-config.js';

const LOCAL_CHANNEL = 'impostor-p2p-signal';

function createLocalSignaling() {
    const bc = new BroadcastChannel(LOCAL_CHANNEL);
    /** @type {Set<string>} */
    const ownedRooms = new Set();
    /** @type {Map<string, (msg: object) => void>} */
    const listeners = new Map();
    /** @type {Map<string, object>} */
    const lastOffer = new Map();
    /** @type {Map<string, object>} */
    const lastAnswer = new Map();
    /** @type {Map<string, object[]>} */
    const iceByKey = new Map();
    let seq = 0;

    function connKey(code, clientId) {
        return `${code}:${clientId}`;
    }

    function iceKey(code, clientId, side) {
        return `${code}:${clientId}:${side}`;
    }

    bc.onmessage = (ev) => {
        const msg = ev.data;
        if (!msg || typeof msg !== 'object') return;
        if (msg.t === 'room-exists-q' && ownedRooms.has(msg.code)) {
            bc.postMessage({ t: 'room-exists-ok', id: msg.id, code: msg.code });
        }
        if (msg.t === 'offer' && msg.code && msg.clientId) {
            lastOffer.set(connKey(msg.code, msg.clientId), msg.offer);
        }
        if (msg.t === 'answer' && msg.code && msg.clientId) {
            lastAnswer.set(connKey(msg.code, msg.clientId), msg.answer);
        }
        if (msg.t === 'ice' && msg.code && msg.clientId && msg.side) {
            const k = iceKey(msg.code, msg.clientId, msg.side);
            const list = iceByKey.get(k) || [];
            list.push(msg.candidate);
            iceByKey.set(k, list);
        }
        if (msg.t === 'room-delete' && msg.code) {
            ownedRooms.delete(msg.code);
        }
        for (const fn of listeners.values()) {
            try {
                fn(msg);
            } catch {
                /* ignore listener errors */
            }
        }
    };

    /**
     * @param {(msg: object) => void} filterFn
     * @returns {() => void}
     */
    function onMessage(filterFn) {
        const id = `l${seq++}`;
        listeners.set(id, filterFn);
        return () => listeners.delete(id);
    }

    return {
        kind: 'local',

        async createRoom(code, meta) {
            ownedRooms.add(code);
            bc.postMessage({ t: 'room-created', code, meta });
            return true;
        },

        async roomExists(code) {
            if (ownedRooms.has(code)) return true;
            return new Promise((resolve) => {
                const id = `q${seq++}`;
                const timeout = setTimeout(() => {
                    unsub();
                    resolve(false);
                }, 1600);
                const unsub = onMessage((msg) => {
                    if (msg.t === 'room-exists-ok' && msg.id === id) {
                        clearTimeout(timeout);
                        unsub();
                        resolve(true);
                    }
                });
                bc.postMessage({ t: 'room-exists-q', code, id });
            });
        },

        async deleteRoom(code) {
            ownedRooms.delete(code);
            bc.postMessage({ t: 'room-delete', code });
        },

        watchConnections(code, cb) {
            /** @type {Set<string>} */
            const seen = new Set();
            const deliver = (clientId) => {
                if (!clientId || seen.has(clientId)) return;
                seen.add(clientId);
                cb(clientId);
            };
            for (const key of lastOffer.keys()) {
                if (key.startsWith(`${code}:`)) deliver(key.slice(code.length + 1));
            }
            return onMessage((msg) => {
                if ((msg.t === 'offer' || msg.t === 'client-join') && msg.code === code) {
                    deliver(msg.clientId);
                }
            });
        },

        async writeOffer(code, clientId, offer) {
            lastOffer.set(connKey(code, clientId), offer);
            bc.postMessage({ t: 'client-join', code, clientId });
            bc.postMessage({ t: 'offer', code, clientId, offer });
        },

        watchOffer(code, clientId, cb) {
            let fired = false;
            const deliver = (offer) => {
                if (fired || !offer) return;
                fired = true;
                cb(offer);
            };
            deliver(lastOffer.get(connKey(code, clientId)));
            return onMessage((msg) => {
                if (msg.t === 'offer' && msg.code === code && msg.clientId === clientId) {
                    deliver(msg.offer);
                }
            });
        },

        async writeAnswer(code, clientId, answer) {
            lastAnswer.set(connKey(code, clientId), answer);
            bc.postMessage({ t: 'answer', code, clientId, answer });
        },

        watchAnswer(code, clientId, cb) {
            let fired = false;
            const deliver = (answer) => {
                if (fired || !answer) return;
                fired = true;
                cb(answer);
            };
            deliver(lastAnswer.get(connKey(code, clientId)));
            return onMessage((msg) => {
                if (msg.t === 'answer' && msg.code === code && msg.clientId === clientId) {
                    deliver(msg.answer);
                }
            });
        },

        async writeIce(code, clientId, side, candidate) {
            const k = iceKey(code, clientId, side);
            const list = iceByKey.get(k) || [];
            list.push(candidate);
            iceByKey.set(k, list);
            bc.postMessage({ t: 'ice', code, clientId, side, candidate });
        },

        watchIce(code, clientId, side, cb) {
            const k = iceKey(code, clientId, side);
            const existing = iceByKey.get(k) || [];
            for (const candidate of existing) cb(candidate);
            return onMessage((msg) => {
                if (msg.t === 'ice' && msg.code === code && msg.clientId === clientId && msg.side === side) {
                    cb(msg.candidate);
                }
            });
        },
    };
}

function createFirebaseSignaling() {
    async function pathRefs(code, clientId) {
        const { db, mod } = await getFirebase();
        const roomRef = mod.ref(db, `rooms/${code}`);
        const connRef = clientId ? mod.child(roomRef, `connections/${clientId}`) : null;
        return { db, mod, roomRef, connRef };
    }

    return {
        kind: 'firebase',

        async createRoom(code, meta) {
            const { mod, roomRef } = await pathRefs(code);
            const snap = await mod.get(roomRef);
            if (snap.exists()) return false;
            await mod.set(roomRef, {
                hostId: meta.hostId,
                createdAt: Date.now(),
                status: 'lobby',
            });
            return true;
        },

        async roomExists(code) {
            const { mod, roomRef } = await pathRefs(code);
            const snap = await mod.get(roomRef);
            return snap.exists();
        },

        async deleteRoom(code) {
            const { mod, roomRef } = await pathRefs(code);
            await mod.remove(roomRef);
        },

        watchConnections(code, cb) {
            let unsub = () => {};
            /** @type {Set<string>} */
            const seen = new Set();
            pathRefs(code).then(({ mod, roomRef }) => {
                const conns = mod.child(roomRef, 'connections');
                unsub = mod.onChildAdded(conns, (snap) => {
                    const clientId = snap.key;
                    if (!clientId || seen.has(clientId)) return;
                    seen.add(clientId);
                    cb(clientId);
                });
            });
            return () => {
                try {
                    unsub();
                } catch {
                    /* ignore */
                }
            };
        },

        async writeOffer(code, clientId, offer) {
            const { mod, connRef } = await pathRefs(code, clientId);
            await mod.set(mod.child(connRef, 'offer'), offer);
        },

        watchOffer(code, clientId, cb) {
            let unsub = () => {};
            let fired = false;
            pathRefs(code, clientId).then(({ mod, connRef }) => {
                unsub = mod.onValue(mod.child(connRef, 'offer'), (snap) => {
                    const offer = snap.val();
                    if (!offer || fired) return;
                    fired = true;
                    cb(offer);
                });
            });
            return () => {
                try {
                    unsub();
                } catch {
                    /* ignore */
                }
            };
        },

        async writeAnswer(code, clientId, answer) {
            const { mod, connRef } = await pathRefs(code, clientId);
            await mod.set(mod.child(connRef, 'answer'), answer);
        },

        watchAnswer(code, clientId, cb) {
            let unsub = () => {};
            let fired = false;
            pathRefs(code, clientId).then(({ mod, connRef }) => {
                unsub = mod.onValue(mod.child(connRef, 'answer'), (snap) => {
                    const answer = snap.val();
                    if (!answer || fired) return;
                    fired = true;
                    cb(answer);
                });
            });
            return () => {
                try {
                    unsub();
                } catch {
                    /* ignore */
                }
            };
        },

        async writeIce(code, clientId, side, candidate) {
            const { mod, connRef } = await pathRefs(code, clientId);
            const key = side === 'offer' ? 'offerCandidates' : 'answerCandidates';
            await mod.push(mod.child(connRef, key), candidate);
        },

        watchIce(code, clientId, side, cb) {
            let unsub = () => {};
            pathRefs(code, clientId).then(({ mod, connRef }) => {
                const key = side === 'offer' ? 'offerCandidates' : 'answerCandidates';
                unsub = mod.onChildAdded(mod.child(connRef, key), (snap) => {
                    const candidate = snap.val();
                    if (candidate) cb(candidate);
                });
            });
            return () => {
                try {
                    unsub();
                } catch {
                    /* ignore */
                }
            };
        },
    };
}

/** @type {ReturnType<typeof createLocalSignaling> | ReturnType<typeof createFirebaseSignaling> | null} */
let instance = null;

export function getSignaling() {
    if (!instance) {
        instance = shouldUseLocalSignaling() ? createLocalSignaling() : createFirebaseSignaling();
    }
    return instance;
}

export function signalingKind() {
    return getSignaling().kind;
}

export function resetSignalingForTests() {
    instance = null;
}
