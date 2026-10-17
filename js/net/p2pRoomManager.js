import { envelope, MSG } from './protocol.js';
import { generateRoomCode } from './ids.js';
import { getSignaling } from './signaling.js';

const ICE_SERVERS = [
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    {
        urls: [
            'turn:openrelay.metered.ca:80',
            'turn:openrelay.metered.ca:443',
            'turn:openrelay.metered.ca:443?transport=tcp',
        ],
        username: 'openrelayproject',
        credential: 'openrelayproject',
    },
];
const CHANNEL_LABEL = 'impostor_game';
const CHANNEL_INIT = { ordered: true };
const ICE_GATHER_MS = 5000;

/**
 * @typedef {object} P2PHandlers
 * @property {(clientId: string, info?: { name?: string }) => void} [onPeerConnecting]
 * @property {(clientId: string) => void} [onChannelOpen]
 * @property {(clientId: string) => void} [onChannelClose]
 * @property {(clientId: string) => void} [onConnectFailed]
 * @property {(clientId: string, err: Error) => void} [onChannelError]
 * @property {(clientId: string, msg: object) => void} [onMessage]
 */

function iceJson(candidate) {
    const j = candidate.toJSON();
    return {
        candidate: j.candidate,
        sdpMid: j.sdpMid,
        sdpMLineIndex: j.sdpMLineIndex,
        usernameFragment: j.usernameFragment,
    };
}

function waitForIceGathering(pc, timeoutMs = ICE_GATHER_MS) {
    if (!pc || pc.iceGatheringState === 'complete') return Promise.resolve();
    return new Promise((resolve) => {
        const done = () => {
            pc.removeEventListener('icegatheringstatechange', onChange);
            clearTimeout(timer);
            resolve();
        };
        const onChange = () => {
            if (pc.iceGatheringState === 'complete') done();
        };
        const timer = setTimeout(done, timeoutMs);
        pc.addEventListener('icegatheringstatechange', onChange);
        if (pc.iceGatheringState === 'complete') done();
    });
}

function localSdp(pc) {
    const desc = pc.localDescription;
    if (!desc) return null;
    return { type: desc.type, sdp: desc.sdp };
}

export class P2PRoomManager {
    constructor() {
        /** @type {'host' | 'client' | null} */
        this.role = null;
        this.roomCode = null;
        this.myId = null;
        /** @type {Map<string, RTCDataChannel>} */
        this.channels = new Map();
        /** @type {Map<string, { pc: RTCPeerConnection, channel: RTCDataChannel | null, unsubs: Array<() => void>, pendingIce: RTCIceCandidateInit[], remoteSet: boolean, didOpen: boolean, notifiedDead: boolean }>} */
        this.peers = new Map();
        /** @type {Array<() => void>} */
        this.roomUnsubs = [];
        /** @type {P2PHandlers} */
        this.handlers = {};
        this.signalingStopped = false;
    }

    /** @param {P2PHandlers} handlers */
    setHandlers(handlers) {
        this.handlers = handlers || {};
    }

    /**
     * @param {string} hostId
     * @param {string} [preferredCode]
     * @returns {Promise<string>}
     */
    async createRoom(hostId, preferredCode) {
        this.resetLocal();
        this.role = 'host';
        this.myId = hostId;
        this.signalingStopped = false;
        const signaling = getSignaling();

        let code = preferredCode && /^[A-Z]{4}$/.test(preferredCode) ? preferredCode : generateRoomCode();
        for (let attempt = 0; attempt < 12; attempt++) {
            const created = await signaling.createRoom(code, { hostId });
            if (created) {
                this.roomCode = code;
                this.attachHostListener();
                return code;
            }
            if (preferredCode) {
                // Room already exists (host refresh in lobby) — reuse and listen.
                this.roomCode = preferredCode;
                this.attachHostListener();
                return preferredCode;
            }
            code = generateRoomCode();
        }
        throw new Error('Could not allocate a room code');
    }

    /**
     * @param {string} roomCode
     * @param {string} clientId
     * @param {{ name?: string }} [extra]
     */
    async joinRoom(roomCode, clientId, extra = {}) {
        this.resetLocal();
        this.role = 'client';
        this.myId = clientId;
        this.roomCode = String(roomCode || '')
            .trim()
            .toUpperCase();
        this.signalingStopped = false;
        if (!/^[A-Z]{4}$/.test(this.roomCode)) {
            throw new Error('Invalid room code');
        }

        const signaling = getSignaling();
        const exists = await signaling.roomExists(this.roomCode);
        if (!exists) {
            throw new Error('Room not found');
        }

        // Announce the joiner name before ICE so the host can show it immediately.
        await signaling.writeHello(this.roomCode, clientId, extra);

        const peer = this.makePeer(this.roomCode, clientId, 'host');
        const channel = peer.pc.createDataChannel(CHANNEL_LABEL, CHANNEL_INIT);
        this.bindChannel('host', channel, peer);

        this.handlers.onPeerConnecting?.('host', extra);

        peer.unsubs.push(
            signaling.watchAnswer(this.roomCode, clientId, async (answer) => {
                if (peer.remoteSet) return;
                await peer.pc.setRemoteDescription(new RTCSessionDescription(answer));
                peer.remoteSet = true;
                await this.flushIce(peer);
            }),
        );
        peer.unsubs.push(
            signaling.watchIce(this.roomCode, clientId, 'answer', async (candidate) => {
                await this.addIce(peer, candidate);
            }),
        );
        peer.pc.onicecandidate = (ev) => {
            if (!ev.candidate || this.signalingStopped) return;
            signaling.writeIce(this.roomCode, clientId, 'offer', iceJson(ev.candidate)).catch(() => {});
        };

        const offer = await peer.pc.createOffer();
        await peer.pc.setLocalDescription(offer);
        await waitForIceGathering(peer.pc);
        const desc = localSdp(peer.pc);
        if (!desc || this.signalingStopped) return;
        await signaling.writeOffer(this.roomCode, clientId, desc, extra);
    }

    attachHostListener() {
        const signaling = getSignaling();
        const unsub = signaling.watchConnections(this.roomCode, (clientId, info) => {
            if (this.signalingStopped) return;
            if (this.peers.has(clientId)) {
                this.handlers.onPeerConnecting?.(clientId, info);
                return;
            }
            this.acceptClient(clientId, info);
        });
        this.roomUnsubs.push(unsub);
    }

    /**
     * @param {string} clientId
     * @param {{ name?: string }} [info]
     */
    acceptClient(clientId, info = {}) {
        const signaling = getSignaling();
        const peer = this.makePeer(this.roomCode, clientId, clientId);
        this.handlers.onPeerConnecting?.(clientId, info);

        peer.pc.ondatachannel = (ev) => {
            if (ev.channel && ev.channel.label === CHANNEL_LABEL) {
                this.bindChannel(clientId, ev.channel, peer);
            }
        };
        peer.pc.onicecandidate = (ev) => {
            if (!ev.candidate || this.signalingStopped) return;
            signaling.writeIce(this.roomCode, clientId, 'answer', iceJson(ev.candidate)).catch(() => {});
        };

        peer.unsubs.push(
            signaling.watchOffer(this.roomCode, clientId, async (offer) => {
                if (peer.remoteSet) return;
                await peer.pc.setRemoteDescription(new RTCSessionDescription(offer));
                peer.remoteSet = true;
                await this.flushIce(peer);
                const answer = await peer.pc.createAnswer();
                await peer.pc.setLocalDescription(answer);
                await waitForIceGathering(peer.pc);
                const desc = localSdp(peer.pc);
                if (!desc || this.signalingStopped) return;
                await signaling.writeAnswer(this.roomCode, clientId, desc);
            }),
        );
        peer.unsubs.push(
            signaling.watchIce(this.roomCode, clientId, 'offer', async (candidate) => {
                await this.addIce(peer, candidate);
            }),
        );
    }

    /**
     * @param {string} roomCode
     * @param {string} peerKey
     * @param {string} mapKey
     */
    makePeer(roomCode, peerKey, mapKey) {
        const pc = new RTCPeerConnection({
            iceServers: ICE_SERVERS,
            iceCandidatePoolSize: 8,
        });
        const peer = {
            pc,
            channel: null,
            unsubs: [],
            pendingIce: [],
            remoteSet: false,
            didOpen: false,
            notifiedDead: false,
            peerKey,
            roomCode,
        };
        this.peers.set(mapKey, peer);
        pc.onconnectionstatechange = () => {
            const st = pc.connectionState;
            if (st === 'failed' || st === 'closed') {
                this.notifyDead(mapKey, peer);
            }
        };
        return peer;
    }

    /**
     * @param {string} mapKey
     * @param {ReturnType<P2PRoomManager['makePeer']>} peer
     */
    notifyDead(mapKey, peer) {
        if (!peer || peer.notifiedDead) return;
        if (this.peers.get(mapKey) !== peer) return;
        peer.notifiedDead = true;
        if (peer.didOpen) {
            this.handlers.onChannelClose?.(mapKey);
        } else {
            this.handlers.onConnectFailed?.(mapKey);
        }
    }

    /**
     * @param {string} mapKey
     * @param {RTCDataChannel} channel
     * @param {ReturnType<P2PRoomManager['makePeer']>} peer
     */
    bindChannel(mapKey, channel, peer) {
        peer.channel = channel;
        this.channels.set(mapKey, channel);
        channel.onopen = () => {
            peer.didOpen = true;
            this.detachPeerSignaling(peer);
            this.handlers.onChannelOpen?.(mapKey);
        };
        channel.onclose = () => {
            this.channels.delete(mapKey);
            this.notifyDead(mapKey, peer);
        };
        channel.onerror = () => {
            if (!peer.didOpen) return;
            this.handlers.onChannelError?.(mapKey, new Error('Data channel error'));
        };
        channel.onmessage = (ev) => {
            try {
                const msg = JSON.parse(String(ev.data));
                if (msg && typeof msg === 'object') this.handlers.onMessage?.(mapKey, msg);
            } catch {
                /* ignore malformed */
            }
        };
    }

    /**
     * @param {{ remoteSet: boolean, pendingIce: RTCIceCandidateInit[], pc: RTCPeerConnection }} peer
     * @param {RTCIceCandidateInit} candidate
     */
    async addIce(peer, candidate) {
        if (!candidate) return;
        if (!peer.remoteSet) {
            peer.pendingIce.push(candidate);
            return;
        }
        try {
            await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch {
            /* candidate may be outdated */
        }
    }

    async flushIce(peer) {
        const queued = peer.pendingIce.splice(0, peer.pendingIce.length);
        for (const candidate of queued) {
            try {
                await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch {
                /* ignore */
            }
        }
    }

    detachPeerSignaling(peer) {
        for (const u of peer.unsubs) {
            try {
                u();
            } catch {
                /* ignore */
            }
        }
        peer.unsubs = [];
        peer.pc.onicecandidate = null;
    }

    detachAllSignaling() {
        for (const u of this.roomUnsubs) {
            try {
                u();
            } catch {
                /* ignore */
            }
        }
        this.roomUnsubs = [];
        for (const peer of this.peers.values()) {
            this.detachPeerSignaling(peer);
        }
    }

    /** Stop handshake signaling but keep open data channels (match start). */
    async closeSignaling() {
        this.signalingStopped = true;
        const code = this.roomCode;
        this.detachAllSignaling();
        if (this.role === 'host' && code) {
            try {
                await getSignaling().deleteRoom(code);
            } catch {
                /* room may already be gone */
            }
        }
    }

    /**
     * @param {object} action
     */
    sendToHost(action) {
        const ch = this.channels.get('host');
        if (!ch || ch.readyState !== 'open') return false;
        ch.send(JSON.stringify(envelope(MSG.INTENT, action)));
        return true;
    }

    /**
     * @param {object} publicState
     */
    broadcastPublicState(publicState) {
        const payload = JSON.stringify(envelope(MSG.PUBLIC_STATE, { payload: publicState }));
        for (const ch of this.channels.values()) {
            if (ch.readyState === 'open') ch.send(payload);
        }
    }

    /**
     * @param {string} clientId
     * @param {object} privateState
     */
    sendPrivateState(clientId, privateState) {
        const ch = this.channels.get(clientId);
        if (!ch || ch.readyState !== 'open') return false;
        ch.send(JSON.stringify(envelope(MSG.PRIVATE_STATE, { payload: privateState })));
        return true;
    }

    async closeRoom() {
        this.signalingStopped = true;
        const code = this.roomCode;
        const role = this.role;
        for (const ch of this.channels.values()) {
            try {
                ch.close();
            } catch {
                /* ignore */
            }
        }
        for (const peer of this.peers.values()) {
            peer.notifiedDead = true;
            this.detachPeerSignaling(peer);
            try {
                peer.pc.close();
            } catch {
                /* ignore */
            }
        }
        this.detachAllSignaling();
        this.channels.clear();
        this.peers.clear();
        if (role === 'host' && code) {
            try {
                await getSignaling().deleteRoom(code);
            } catch {
                /* ignore */
            }
        }
        this.role = null;
        this.roomCode = null;
        this.myId = null;
        this.signalingStopped = false;
    }

    resetLocal() {
        for (const ch of this.channels.values()) {
            try {
                ch.close();
            } catch {
                /* ignore */
            }
        }
        for (const peer of this.peers.values()) {
            peer.notifiedDead = true;
            this.detachPeerSignaling(peer);
            try {
                peer.pc.close();
            } catch {
                /* ignore */
            }
        }
        this.detachAllSignaling();
        this.channels.clear();
        this.peers.clear();
        this.role = null;
        this.roomCode = null;
        this.myId = null;
        this.signalingStopped = false;
    }
}

export const p2p = new P2PRoomManager();
