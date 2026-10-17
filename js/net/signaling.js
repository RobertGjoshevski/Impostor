import { getMqtt } from './mqtt.js';

const LOCAL_CHANNEL = 'impostor-p2p-signal';
const MQTT_PREFIX = 'impostor/rgsoft/v1';

function mqttTopic(code, ...rest) {
    return [MQTT_PREFIX, code, ...rest].join('/');
}

function parseMqttTopic(topic) {
    const parts = String(topic || '').split('/');
    if (parts.length < 4 || parts[0] !== 'impostor' || parts[1] !== 'rgsoft' || parts[2] !== 'v1') return null;
    return { code: parts[3], rest: parts.slice(4) };
}

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
    /** @type {Map<string, { name?: string }>} */
    const lastHello = new Map();
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
        if ((msg.t === 'offer' || msg.t === 'client-join') && msg.code && msg.clientId) {
            lastHello.set(connKey(msg.code, msg.clientId), { name: msg.name || '' });
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
                /* ignore */
            }
        }
    };

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
                }, 1200);
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
            const deliver = (clientId, info) => {
                if (!clientId) return;
                const first = !seen.has(clientId);
                seen.add(clientId);
                if (first || (info && info.name)) cb(clientId, info || {});
            };
            for (const [key, info] of lastHello) {
                if (key.startsWith(`${code}:`)) deliver(key.slice(code.length + 1), info);
            }
            for (const key of lastOffer.keys()) {
                if (key.startsWith(`${code}:`)) {
                    deliver(key.slice(code.length + 1), lastHello.get(key) || {});
                }
            }
            return onMessage((msg) => {
                if ((msg.t === 'offer' || msg.t === 'client-join') && msg.code === code) {
                    deliver(msg.clientId, { name: msg.name });
                }
            });
        },

        async writeHello(code, clientId, extra = {}) {
            const hello = { name: extra.name || '' };
            lastHello.set(connKey(code, clientId), hello);
            bc.postMessage({ t: 'client-join', code, clientId, name: hello.name });
        },

        async writeOffer(code, clientId, offer, extra = {}) {
            lastOffer.set(connKey(code, clientId), offer);
            lastHello.set(connKey(code, clientId), { name: extra.name || '' });
            bc.postMessage({ t: 'client-join', code, clientId, name: extra.name || '' });
            bc.postMessage({ t: 'offer', code, clientId, offer, name: extra.name || '' });
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

function createMqttSignaling() {
    /** @type {Array<(topic: string, payload: string) => void>} */
    const watchers = [];
    /** @type {Map<string, object>} */
    const lastOffer = new Map();
    /** @type {Map<string, object>} */
    const lastAnswer = new Map();
    /** @type {Map<string, object[]>} */
    const iceByKey = new Map();
    /** @type {Map<string, { name?: string }>} */
    const lastHello = new Map();
    let hooked = false;

    function connKey(code, clientId) {
        return `${code}:${clientId}`;
    }

    function iceKey(code, clientId, side) {
        return `${code}:${clientId}:${side}`;
    }

    async function ready() {
        const mqtt = await getMqtt();
        if (!hooked) {
            hooked = true;
            mqtt.onMessage((topic, payload) => {
                for (const fn of watchers) {
                    try {
                        fn(topic, payload);
                    } catch {
                        /* ignore */
                    }
                }
            });
        }
        return mqtt;
    }

    function onTopic(filterFn) {
        watchers.push(filterFn);
        return () => {
            const i = watchers.indexOf(filterFn);
            if (i >= 0) watchers.splice(i, 1);
        };
    }

    function parseJson(payload) {
        try {
            return JSON.parse(payload);
        } catch {
            return null;
        }
    }

    return {
        kind: 'mqtt',

        async createRoom(code, meta) {
            const mqtt = await ready();
            mqtt.subscribe(mqttTopic(code, '#'));
            mqtt.publish(mqttTopic(code, 'meta'), JSON.stringify({ ...meta, status: 'lobby' }), { retain: true });
            return true;
        },

        async roomExists(code) {
            const mqtt = await ready();
            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    unsub();
                    resolve(false);
                }, 4000);
                const unsub = onTopic((topic, payload) => {
                    const parsed = parseMqttTopic(topic);
                    if (!parsed || parsed.code !== code) return;
                    if (parsed.rest[0] === 'meta' && payload) {
                        const meta = parseJson(payload);
                        if (meta && meta.status !== 'closed') {
                            clearTimeout(timeout);
                            unsub();
                            resolve(true);
                        }
                    }
                });
                mqtt.subscribe(mqttTopic(code, '#'));
            });
        },

        async deleteRoom(code) {
            try {
                const mqtt = await ready();
                mqtt.publish(mqttTopic(code, 'meta'), JSON.stringify({ status: 'closed' }), { retain: true });
            } catch {
                /* ignore */
            }
        },

        watchConnections(code, cb) {
            /** @type {Set<string>} */
            const seen = new Set();
            const deliver = (clientId, info) => {
                if (!clientId) return;
                const first = !seen.has(clientId);
                seen.add(clientId);
                const payload = info || lastHello.get(connKey(code, clientId)) || {};
                if (first || payload.name) cb(clientId, payload);
            };
            ready()
                .then((mqtt) => mqtt.subscribe(mqttTopic(code, '#')))
                .catch(() => {});
            for (const [key, info] of lastHello) {
                if (key.startsWith(`${code}:`)) deliver(key.slice(code.length + 1), info);
            }
            for (const key of lastOffer.keys()) {
                if (key.startsWith(`${code}:`)) deliver(key.slice(code.length + 1), lastHello.get(key) || {});
            }
            return onTopic((topic, payload) => {
                const parsed = parseMqttTopic(topic);
                if (!parsed || parsed.code !== code || !payload) return;
                const [a, b] = parsed.rest;
                if (a === 'hello' && b) {
                    const info = parseJson(payload) || {};
                    lastHello.set(connKey(code, b), info);
                    deliver(b, info);
                }
                if (a === 'c' && parsed.rest[2] === 'offer') {
                    const offer = parseJson(payload);
                    if (offer) lastOffer.set(connKey(code, b), offer);
                    deliver(b, lastHello.get(connKey(code, b)));
                }
            });
        },

        async writeHello(code, clientId, extra = {}) {
            const mqtt = await ready();
            mqtt.subscribe(mqttTopic(code, '#'));
            const hello = { clientId, name: extra.name || '' };
            lastHello.set(connKey(code, clientId), hello);
            mqtt.publish(mqttTopic(code, 'hello', clientId), JSON.stringify(hello), { retain: true });
        },

        async writeOffer(code, clientId, offer, extra = {}) {
            const mqtt = await ready();
            mqtt.subscribe(mqttTopic(code, '#'));
            lastOffer.set(connKey(code, clientId), offer);
            const hello = { clientId, name: extra.name || '' };
            lastHello.set(connKey(code, clientId), hello);
            mqtt.publish(mqttTopic(code, 'hello', clientId), JSON.stringify(hello), { retain: true });
            mqtt.publish(mqttTopic(code, 'c', clientId, 'offer'), JSON.stringify(offer), { retain: true });
        },

        watchOffer(code, clientId, cb) {
            let fired = false;
            const deliver = (offer) => {
                if (fired || !offer) return;
                fired = true;
                cb(offer);
            };
            deliver(lastOffer.get(connKey(code, clientId)));
            return onTopic((topic, payload) => {
                const parsed = parseMqttTopic(topic);
                if (!parsed || parsed.code !== code) return;
                if (parsed.rest[0] === 'c' && parsed.rest[1] === clientId && parsed.rest[2] === 'offer') {
                    const offer = parseJson(payload);
                    if (offer) {
                        lastOffer.set(connKey(code, clientId), offer);
                        deliver(offer);
                    }
                }
            });
        },

        async writeAnswer(code, clientId, answer) {
            const mqtt = await ready();
            lastAnswer.set(connKey(code, clientId), answer);
            mqtt.publish(mqttTopic(code, 'c', clientId, 'answer'), JSON.stringify(answer), { retain: true });
        },

        watchAnswer(code, clientId, cb) {
            let fired = false;
            const deliver = (answer) => {
                if (fired || !answer) return;
                fired = true;
                cb(answer);
            };
            deliver(lastAnswer.get(connKey(code, clientId)));
            return onTopic((topic, payload) => {
                const parsed = parseMqttTopic(topic);
                if (!parsed || parsed.code !== code) return;
                if (parsed.rest[0] === 'c' && parsed.rest[1] === clientId && parsed.rest[2] === 'answer') {
                    const answer = parseJson(payload);
                    if (answer) {
                        lastAnswer.set(connKey(code, clientId), answer);
                        deliver(answer);
                    }
                }
            });
        },

        async writeIce(code, clientId, side, candidate) {
            const mqtt = await ready();
            const k = iceKey(code, clientId, side);
            const list = iceByKey.get(k) || [];
            list.push(candidate);
            iceByKey.set(k, list);
            const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
            mqtt.publish(mqttTopic(code, 'c', clientId, 'ice', side, id), JSON.stringify(candidate));
        },

        watchIce(code, clientId, side, cb) {
            const k = iceKey(code, clientId, side);
            const existing = iceByKey.get(k) || [];
            for (const candidate of existing) cb(candidate);
            return onTopic((topic, payload) => {
                const parsed = parseMqttTopic(topic);
                if (!parsed || parsed.code !== code) return;
                if (
                    parsed.rest[0] === 'c' &&
                    parsed.rest[1] === clientId &&
                    parsed.rest[2] === 'ice' &&
                    parsed.rest[3] === side
                ) {
                    const candidate = parseJson(payload);
                    if (candidate) {
                        const list = iceByKey.get(k) || [];
                        list.push(candidate);
                        iceByKey.set(k, list);
                        cb(candidate);
                    }
                }
            });
        },
    };
}

function fanOut(local, remote) {
    const both = async (method, args) => {
        const tasks = [local[method](...args)];
        tasks.push(
            remote[method](...args).catch((err) => {
                console.warn('cross-device signaling', err);
                return method === 'roomExists' ? false : undefined;
            }),
        );
        const results = await Promise.all(tasks);
        if (method === 'roomExists' || method === 'createRoom') {
            return results[0] || results[1];
        }
        return results[0];
    };

    return {
        kind: 'p2p',
        createRoom: (code, meta) => both('createRoom', [code, meta]),
        roomExists(code) {
            return new Promise((resolve) => {
                let left = 2;
                const done = (value) => {
                    if (value) resolve(true);
                    else if (--left <= 0) resolve(false);
                };
                local.roomExists(code).then(done).catch(() => done(false));
                remote.roomExists(code).then(done).catch(() => done(false));
            });
        },
        deleteRoom: (code) => both('deleteRoom', [code]),
        watchConnections(code, cb) {
            const a = local.watchConnections(code, cb);
            const b = remote.watchConnections(code, cb);
            return () => {
                a();
                b();
            };
        },
        writeHello: (code, clientId, extra) => both('writeHello', [code, clientId, extra]),
        writeOffer: (code, clientId, offer, extra) => both('writeOffer', [code, clientId, offer, extra]),
        watchOffer(code, clientId, cb) {
            const a = local.watchOffer(code, clientId, cb);
            const b = remote.watchOffer(code, clientId, cb);
            return () => {
                a();
                b();
            };
        },
        writeAnswer: (code, clientId, answer) => both('writeAnswer', [code, clientId, answer]),
        watchAnswer(code, clientId, cb) {
            const a = local.watchAnswer(code, clientId, cb);
            const b = remote.watchAnswer(code, clientId, cb);
            return () => {
                a();
                b();
            };
        },
        writeIce: (code, clientId, side, candidate) => both('writeIce', [code, clientId, side, candidate]),
        watchIce(code, clientId, side, cb) {
            const a = local.watchIce(code, clientId, side, cb);
            const b = remote.watchIce(code, clientId, side, cb);
            return () => {
                a();
                b();
            };
        },
    };
}

/** @type {ReturnType<typeof fanOut> | null} */
let instance = null;

export function getSignaling() {
    if (!instance) {
        instance = fanOut(createLocalSignaling(), createMqttSignaling());
    }
    return instance;
}

export function signalingKind() {
    return getSignaling().kind;
}

export function resetSignalingForTests() {
    instance = null;
}
