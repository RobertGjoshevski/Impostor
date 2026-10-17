/** Tiny MQTT 3.1.1 client over WebSocket. Used only for the WebRTC handshake. */

const BROKERS = [
    'wss://broker.emqx.io:8084/mqtt',
    'wss://test.mosquitto.org:8081',
];

function encodeRemain(n) {
    const out = [];
    do {
        let enc = n % 128;
        n = Math.floor(n / 128);
        if (n > 0) enc |= 0x80;
        out.push(enc);
    } while (n > 0);
    return out;
}

function utf8(str) {
    return new TextEncoder().encode(str);
}

function concat(chunks) {
    const size = chunks.reduce((n, c) => n + c.length, 0);
    const out = new Uint8Array(size);
    let o = 0;
    for (const c of chunks) {
        out.set(c, o);
        o += c.length;
    }
    return out;
}

function withLen(bytes) {
    const hi = (bytes.length >> 8) & 0xff;
    const lo = bytes.length & 0xff;
    return concat([new Uint8Array([hi, lo]), bytes]);
}

function packet(typeFlags, payload) {
    return concat([new Uint8Array([typeFlags, ...encodeRemain(payload.length)]), payload]);
}

function parseRemain(buf, start) {
    let multiplier = 1;
    let value = 0;
    let i = start;
    let encoded;
    do {
        if (i >= buf.length) return null;
        encoded = buf[i++];
        value += (encoded & 127) * multiplier;
        multiplier *= 128;
        if (multiplier > 128 * 128 * 128) return null;
    } while (encoded & 128);
    return { value, next: i };
}

function readUtf8(view, offset) {
    const len = (view[offset] << 8) | view[offset + 1];
    const start = offset + 2;
    const end = start + len;
    return {
        text: new TextDecoder().decode(view.subarray(start, end)),
        next: end,
    };
}

export class MqttClient {
    constructor() {
        this.ws = null;
        this.buf = new Uint8Array(0);
        this.connected = false;
        this.packetId = 1;
        /** @type {Set<(topic: string, payload: string) => void>} */
        this.listeners = new Set();
        /** @type {Map<number, string>} */
        this.pendingSubs = new Map();
        this.pingTimer = null;
        this.url = '';
    }

    /**
     * @param {string} [preferred]
     */
    async connect(preferred) {
        if (this.connected) return;
        const urls = preferred ? [preferred, ...BROKERS] : BROKERS;
        let lastErr = new Error('No MQTT broker');
        for (const url of urls) {
            try {
                await this.open(url);
                this.url = url;
                return;
            } catch (err) {
                lastErr = err;
            }
        }
        throw lastErr;
    }

    /**
     * @param {string} url
     */
    open(url) {
        return new Promise((resolve, reject) => {
            let ws;
            try {
                ws = new WebSocket(url, 'mqtt');
            } catch {
                ws = new WebSocket(url);
            }
            ws.binaryType = 'arraybuffer';
            const timer = setTimeout(() => {
                ws.close();
                reject(new Error('MQTT connect timeout'));
            }, 8000);
            ws.onopen = () => {
                const id = utf8(`imp${Math.random().toString(36).slice(2, 10)}`);
                const payload = concat([
                    withLen(utf8('MQTT')),
                    new Uint8Array([4, 0x02, 0x00, 0x1e]),
                    withLen(id),
                ]);
                ws.send(packet(0x10, payload));
            };
            ws.onerror = () => {
                clearTimeout(timer);
                reject(new Error('MQTT socket error'));
            };
            ws.onclose = () => {
                this.connected = false;
                if (this.pingTimer) clearInterval(this.pingTimer);
            };
            this._onConnack = (ok) => {
                clearTimeout(timer);
                if (!ok) {
                    ws.close();
                    reject(new Error('MQTT CONNACK refused'));
                    return;
                }
                this.connected = true;
                this.ws = ws;
                this.pingTimer = setInterval(() => {
                    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                        this.ws.send(packet(0xc0, new Uint8Array(0)));
                    }
                }, 20000);
                resolve();
            };
            ws.onmessage = (ev) => {
                this.push(new Uint8Array(ev.data));
            };
        });
    }

    /**
     * @param {Uint8Array} chunk
     */
    push(chunk) {
        this.buf = concat([this.buf, chunk]);
        while (this.buf.length >= 2) {
            const remain = parseRemain(this.buf, 1);
            if (!remain) break;
            const total = remain.next + remain.value;
            if (this.buf.length < total) break;
            const pkt = this.buf.subarray(0, total);
            this.buf = this.buf.subarray(total);
            this.handle(pkt);
        }
    }

    /**
     * @param {Uint8Array} pkt
     */
    handle(pkt) {
        const type = pkt[0] >> 4;
        const remain = parseRemain(pkt, 1);
        if (!remain) return;
        const payload = pkt.subarray(remain.next);
        if (type === 2) {
            const rc = payload.length > 1 ? payload[1] : 1;
            this._onConnack?.(rc === 0);
            this._onConnack = null;
            return;
        }
        if (type === 3) {
            const retain = pkt[0] & 0x01;
            const qos = (pkt[0] >> 1) & 0x03;
            let off = 0;
            const topic = readUtf8(payload, off);
            off = topic.next;
            if (qos > 0) off += 2;
            const body = new TextDecoder().decode(payload.subarray(off));
            for (const fn of this.listeners) {
                try {
                    fn(topic.text, body, retain);
                } catch {
                    /* ignore */
                }
            }
        }
    }

    /**
     * @param {string} topic
     * @param {string} payload
     * @param {{ retain?: boolean }} [opts]
     */
    publish(topic, payload, opts = {}) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        const flags = 0x30 | (opts.retain ? 0x01 : 0);
        const body = concat([withLen(utf8(topic)), utf8(payload)]);
        this.ws.send(packet(flags, body));
    }

    /**
     * @param {string} topic
     */
    subscribe(topic) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        const id = this.packetId++ & 0xffff;
        const payload = concat([new Uint8Array([id >> 8, id & 0xff]), withLen(utf8(topic)), new Uint8Array([0])]);
        this.ws.send(packet(0x82, payload));
    }

    /**
     * @param {(topic: string, payload: string) => void} fn
     * @returns {() => void}
     */
    onMessage(fn) {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }

    close() {
        if (this.pingTimer) clearInterval(this.pingTimer);
        this.connected = false;
        try {
            this.ws?.close();
        } catch {
            /* ignore */
        }
    }
}

/** @type {MqttClient | null} */
let shared = null;
/** @type {Promise<MqttClient> | null} */
let connecting = null;

export function getMqtt() {
    if (shared && shared.connected) return Promise.resolve(shared);
    if (connecting) return connecting;
    connecting = (async () => {
        const client = new MqttClient();
        await client.connect();
        shared = client;
        connecting = null;
        return client;
    })();
    connecting.catch(() => {
        connecting = null;
    });
    return connecting;
}
