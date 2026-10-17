import { store, clampImpostorCount, normalizePlayerName } from '../store.js';
import { p2p } from './p2pRoomManager.js';
import { ACTIONS, MSG } from './protocol.js';
import { newClientId } from './ids.js';
import { getRandomWord } from '../words.js';
import { clearHostState, savePersistedScores } from '../persist.js';

let lastSeqApplied = 0;

export function isOnline(state = store.state) {
    return state.playMode === 'online';
}

export function isHost(state = store.state) {
    return isOnline(state) && state.onlineRole === 'host';
}

export function findMe(state = store.state) {
    const id = state.myClientId;
    if (!id || !Array.isArray(state.players)) return null;
    return state.players.find((p) => p && p.id === id) || null;
}

export function connectedPlayers(state = store.state) {
    return (state.players || []).filter((p) => p && typeof p === 'object' && p.connected);
}

function uniqueName(raw, players, exceptId) {
    const base = normalizePlayerName(raw).slice(0, 24);
    let name = base;
    let n = 2;
    while (players.some((p) => p.id !== exceptId && p.name === name)) {
        name = `${base} ${n++}`;
    }
    return name;
}

function connectingId(entry) {
    if (typeof entry === 'string') return entry;
    return entry && entry.id ? String(entry.id) : '';
}

function upsertConnecting(list, clientId, info) {
    const name = info && typeof info.name === 'string' ? info.name.trim() : '';
    const next = (list || []).filter((p) => connectingId(p) !== clientId);
    next.push({ id: clientId, name });
    return next;
}

function dropConnecting(list, clientId) {
    return (list || []).filter((p) => connectingId(p) !== clientId);
}

let joinWatchdog = null;

function clearJoinWatchdog() {
    if (joinWatchdog) {
        clearTimeout(joinWatchdog);
        joinWatchdog = null;
    }
}

export function buildPublicState(state = store.state) {
    const isResults = state.screen === 'results';
    const hasVoted = { ...(state.hasVoted || {}) };
    for (const id of Object.keys(state.votes || {})) {
        hasVoted[id] = true;
    }
    return {
        seq: state.seq || 0,
        screen: state.screen,
        roomCode: state.roomCode,
        impostorCount: state.impostorCount,
        language: state.language,
        firstPlayerIndex: state.firstPlayerIndex,
        selectedThemes: state.selectedThemes,
        players: (state.players || [])
            .filter((p) => p && typeof p === 'object' && p.id)
            .map((p) => ({
                id: p.id,
                name: p.name,
                connected: !!p.connected,
                ready: !!p.ready,
                ...(isResults && p.role ? { role: p.role } : {}),
            })),
        hasVoted,
        timer: null,
        ...(isResults
            ? {
                  word: state.word,
                  votes: state.votes,
                  detectives: state.detectives,
                  scores: state.scores,
              }
            : {}),
    };
}

function hostCommit(partial) {
    const seq = (store.state.seq || 0) + 1;
    store.setState({ ...partial, seq });
    p2p.broadcastPublicState(buildPublicState(store.state));
}

function hostHandlers() {
    return {
        onPeerConnecting(clientId, info) {
            if (clientId === 'host') return;
            store.setState({ connectingPeers: upsertConnecting(store.state.connectingPeers, clientId, info) });
        },
        onChannelOpen(clientId) {
            store.setState({ connectingPeers: dropConnecting(store.state.connectingPeers, clientId) });
        },
        onConnectFailed(clientId) {
            if (!isHost()) return;
            store.setState({ connectingPeers: dropConnecting(store.state.connectingPeers, clientId) });
        },
        onChannelClose(clientId) {
            if (!isHost()) return;
            const connectingPeers = dropConnecting(store.state.connectingPeers, clientId);
            if (store.state.screen === 'hostLobby') {
                hostCommit({
                    connectingPeers,
                    players: (store.state.players || []).filter((p) => p.id !== clientId),
                });
                return;
            }
            hostCommit({
                connectingPeers,
                players: (store.state.players || []).map((p) =>
                    p.id === clientId ? { ...p, connected: false } : p,
                ),
            });
        },
        onChannelError(clientId) {
            this.onChannelClose(clientId);
        },
        onMessage(clientId, msg) {
            if (!msg || msg.type !== MSG.INTENT) return;
            handleHostIntent(clientId, msg);
        },
    };
}

function clientHandlers() {
    return {
        onChannelOpen() {
            clearJoinWatchdog();
            store.setState({ joinStatus: 'connected', joinError: null, hostDisconnected: false });
            p2p.sendToHost({
                action: ACTIONS.JOIN_LOBBY,
                payload: { name: store.state.myName },
            });
        },
        onConnectFailed() {
            if (store.state.joinStatus === 'connected') return;
            clearJoinWatchdog();
            store.setState({ joinStatus: 'error', joinError: 'connect-failed' });
        },
        onChannelClose() {
            clearJoinWatchdog();
            if (store.state.joinStatus !== 'connected') {
                store.setState({ joinStatus: 'error', joinError: 'connect-failed' });
                return;
            }
            store.setState({ hostDisconnected: true, joinStatus: 'error', joinError: 'disconnected' });
        },
        onChannelError() {
            if (store.state.joinStatus !== 'connected') return;
            this.onChannelClose();
        },
        onMessage(_from, msg) {
            if (!msg || typeof msg !== 'object') return;
            if (msg.type === MSG.PUBLIC_STATE) {
                applyPublicState(msg.payload);
            } else if (msg.type === MSG.PRIVATE_STATE) {
                if (msg.payload && typeof msg.payload === 'object') {
                    store.setState({ myPrivateState: msg.payload });
                }
            }
        },
    };
}

function applyPublicState(payload) {
    if (!payload || typeof payload !== 'object') return;
    const seq = Number(payload.seq) || 0;
    if (seq && seq <= lastSeqApplied) return;
    lastSeqApplied = seq;
    const keep = {
        playMode: 'online',
        onlineRole: 'client',
        myClientId: store.state.myClientId,
        myName: store.state.myName,
        myPrivateState: store.state.myPrivateState,
        language: store.state.language,
        availableThemes: store.state.availableThemes,
        joinStatus: 'connected',
        hostDisconnected: false,
    };
    /** @type {Record<string, unknown>} */
    const next = {
        ...keep,
        screen: payload.screen || store.state.screen,
        roomCode: payload.roomCode || store.state.roomCode,
        impostorCount: payload.impostorCount ?? store.state.impostorCount,
        firstPlayerIndex: payload.firstPlayerIndex ?? null,
        players: Array.isArray(payload.players) ? payload.players : store.state.players,
        hasVoted: payload.hasVoted && typeof payload.hasVoted === 'object' ? payload.hasVoted : {},
        seq,
        connectingPeers: [],
    };
    if (payload.screen === 'results') {
        if (payload.word) next.word = payload.word;
        if (payload.votes) next.votes = payload.votes;
        if (payload.detectives) next.detectives = payload.detectives;
        if (payload.scores) next.scores = payload.scores;
    } else {
        next.word = null;
        next.votes = {};
        next.detectives = [];
    }
    store.setState(next);
}

function handleHostIntent(clientId, msg) {
    const action = msg.action;
    const payload = msg.payload && typeof msg.payload === 'object' ? msg.payload : {};
    if (action === ACTIONS.JOIN_LOBBY) {
        if (store.state.screen !== 'hostLobby') return;
        const players = [...(store.state.players || [])];
        const name = uniqueName(payload.name, players, clientId);
        const existing = players.findIndex((p) => p.id === clientId);
        if (existing >= 0) {
            players[existing] = { ...players[existing], name, connected: true };
        } else {
            players.push({ id: clientId, name, connected: true, ready: false });
        }
        hostCommit({
            players,
            connectingPeers: dropConnecting(store.state.connectingPeers, clientId),
        });
        return;
    }
    if (action === ACTIONS.SET_READY) {
        const ready = !!payload.ready;
        const players = (store.state.players || []).map((p) => (p.id === clientId ? { ...p, ready } : p));
        if (store.state.screen === 'reveal') {
            const connected = players.filter((p) => p.connected);
            const allPeeked = connected.length > 0 && connected.every((p) => p.ready);
            if (allPeeked) {
                const pick = connected[Math.floor(Math.random() * connected.length)];
                const firstPlayerIndex = players.findIndex((p) => p.id === pick.id);
                hostCommit({ players, screen: 'firstPlayer', firstPlayerIndex });
                return;
            }
        }
        hostCommit({ players });
        return;
    }
    if (action === ACTIONS.CAST_VOTE) {
        if (store.state.screen !== 'round') return;
        const voter = (store.state.players || []).find((p) => p.id === clientId);
        if (!voter || !voter.connected) return;
        const suspectId = payload.suspectId;
        const suspect = (store.state.players || []).find((p) => p.id === suspectId);
        if (!suspect || suspect.id === clientId) return;
        const votes = { ...store.state.votes, [clientId]: suspectId };
        const hasVoted = { ...store.state.hasVoted, [clientId]: true };
        hostCommit({ votes, hasVoted });
    }
}

export async function hostCreateRoom(name) {
    const hostId = newClientId();
    const display = normalizePlayerName(name);
    lastSeqApplied = 0;
    p2p.setHandlers(hostHandlers());
    const code = await p2p.createRoom(hostId);
    store.setState({
        playMode: 'online',
        onlineRole: 'host',
        roomCode: code,
        myClientId: hostId,
        myName: display,
        players: [{ id: hostId, name: display, connected: true, ready: false }],
        connectingPeers: [],
        screen: 'hostLobby',
        seq: 0,
        votes: {},
        hasVoted: {},
        myPrivateState: null,
        word: null,
        joinError: null,
        joinStatus: 'connected',
        hostDisconnected: false,
        detectives: [],
        firstPlayerIndex: null,
        currentPlayerIndex: 0,
    });
}

export async function restoreHostSession(saved) {
    lastSeqApplied = Number(saved.seq) || 0;
    p2p.setHandlers(hostHandlers());
    store.setState({
        ...saved,
        playMode: 'online',
        onlineRole: 'host',
        hostDisconnected: false,
    });
    if (saved.screen === 'hostLobby' && saved.roomCode && saved.myClientId) {
        try {
            await p2p.createRoom(saved.myClientId, saved.roomCode);
        } catch (err) {
            console.warn('Host signaling restore failed', err);
        }
    }
}

export async function clientJoinRoom(code, name) {
    const clientId = newClientId();
    const display = normalizePlayerName(name);
    lastSeqApplied = 0;
    clearJoinWatchdog();
    p2p.setHandlers(clientHandlers());
    store.setState({
        playMode: 'online',
        onlineRole: 'client',
        myClientId: clientId,
        myName: display,
        roomCode: String(code || '')
            .trim()
            .toUpperCase(),
        screen: 'joinRoom',
        joinStatus: 'connecting',
        joinError: null,
        hostDisconnected: false,
        players: [],
        myPrivateState: null,
        votes: {},
        hasVoted: {},
        word: null,
    });
    joinWatchdog = setTimeout(() => {
        if (store.state.joinStatus === 'connecting') {
            store.setState({ joinStatus: 'error', joinError: 'connect-failed' });
        }
    }, 20000);
    try {
        await p2p.joinRoom(code, clientId, { name: display });
    } catch (err) {
        clearJoinWatchdog();
        store.setState({
            joinStatus: 'error',
            joinError: err && err.message ? err.message : 'Join failed',
        });
    }
}

export function hostToggleReady() {
    if (!isHost()) return;
    handleHostIntent(store.state.myClientId, {
        type: MSG.INTENT,
        action: ACTIONS.SET_READY,
        payload: { ready: !findMe()?.ready },
    });
}

export function hostPeekDone() {
    if (!isHost()) return;
    handleHostIntent(store.state.myClientId, {
        type: MSG.INTENT,
        action: ACTIONS.SET_READY,
        payload: { ready: true },
    });
}

export function clientPeekDone() {
    p2p.sendToHost({ action: ACTIONS.SET_READY, payload: { ready: true } });
    const players = (store.state.players || []).map((p) =>
        p.id === store.state.myClientId ? { ...p, ready: true } : p,
    );
    store.setState({ players });
}

export function hostCastVote(suspectId) {
    if (!isHost()) return;
    handleHostIntent(store.state.myClientId, {
        type: MSG.INTENT,
        action: ACTIONS.CAST_VOTE,
        payload: { suspectId },
    });
}

export function clientCastVote(suspectId) {
    p2p.sendToHost({ action: ACTIONS.CAST_VOTE, payload: { suspectId } });
    store.setState({
        hasVoted: { ...store.state.hasVoted, [store.state.myClientId]: true },
        votes: { ...store.state.votes, [store.state.myClientId]: suspectId },
    });
}

export async function hostStartGame() {
    if (!isHost()) return;
    const connected = connectedPlayers();
    if (connected.length < 3) return;
    await p2p.closeSignaling();

    const word = getRandomWord();
    const impostorN = clampImpostorCount(connected.length, store.state.impostorCount);
    const shuffled = [...connected].sort(() => Math.random() - 0.5);
    const impostorIds = new Set(shuffled.slice(0, impostorN).map((p) => p.id));

    const players = (store.state.players || [])
        .filter((p) => p.connected)
        .map((p) => ({
            ...p,
            role: impostorIds.has(p.id) ? 'IMPOSTOR' : 'INNOCENT',
            revealed: false,
            ready: false,
        }));

    const me = players.find((p) => p.id === store.state.myClientId);
    const myPrivateState =
        me && me.role === 'IMPOSTOR'
            ? { role: 'IMPOSTOR', hint: word.hint }
            : { role: 'INNOCENT', secretWord: word.word };

    store.setState({
        players,
        word,
        votes: {},
        hasVoted: {},
        detectives: [],
        currentPlayerIndex: 0,
        firstPlayerIndex: null,
        screen: 'reveal',
        myPrivateState,
        connectingPeers: [],
        impostorCount: impostorN,
        seq: (store.state.seq || 0) + 1,
    });

    for (const p of players) {
        if (p.id === store.state.myClientId) continue;
        const payload =
            p.role === 'IMPOSTOR'
                ? { role: 'IMPOSTOR', hint: word.hint }
                : { role: 'INNOCENT', secretWord: word.word };
        p2p.sendPrivateState(p.id, payload);
    }
    p2p.broadcastPublicState(buildPublicState(store.state));
}

export function hostContinueToRound() {
    if (!isHost()) return;
    if (store.state.screen !== 'firstPlayer') return;
    hostCommit({ screen: 'round' });
}

export function hostEndRound() {
    if (!isHost()) return;
    if (store.state.screen !== 'round') return;
    const players = store.state.players || [];
    const connected = players.filter((p) => p.connected);
    const votes = store.state.votes || {};
    if (!connected.every((p) => votes[p.id])) return;

    const impostorIds = new Set(players.filter((p) => p.role === 'IMPOSTOR').map((p) => p.id));
    const newScores = { ...store.state.scores };
    const detectives = [];

    for (const [voterId, suspectId] of Object.entries(votes)) {
        const voter = players.find((p) => p.id === voterId);
        if (voter && voter.role === 'INNOCENT' && impostorIds.has(suspectId)) {
            newScores[voter.name] = (newScores[voter.name] || 0) + 1;
            detectives.push(voter.name);
        }
    }

    const voteCounts = {};
    Object.values(votes).forEach((suspectId) => {
        voteCounts[suspectId] = (voteCounts[suspectId] || 0) + 1;
    });
    const maxVotes = Math.max(0, ...Object.values(voteCounts));

    players
        .filter((p) => p.role === 'IMPOSTOR')
        .forEach((imp) => {
            const votesReceived = voteCounts[imp.id] || 0;
            const tiedForMost = Object.values(voteCounts).filter((v) => v === maxVotes).length > 1;
            const survived =
                votesReceived < maxVotes || (votesReceived === maxVotes && tiedForMost) || maxVotes === 0;
            if (survived) {
                newScores[imp.name] = (newScores[imp.name] || 0) + 2;
            }
        });

    savePersistedScores(newScores);
    hostCommit({
        screen: 'results',
        scores: newScores,
        detectives,
    });
}

export function hostNextRound() {
    if (!isHost()) return;
    const players = (store.state.players || []).map((p) => ({
        id: p.id,
        name: p.name,
        connected: !!p.connected,
        ready: false,
        role: null,
        revealed: false,
    }));
    hostCommit({
        players,
        word: null,
        myPrivateState: null,
        votes: {},
        hasVoted: {},
        detectives: [],
        firstPlayerIndex: null,
        currentPlayerIndex: 0,
        screen: 'hostLobby',
    });
}

export async function leaveSession() {
    clearJoinWatchdog();
    try {
        await p2p.closeRoom();
    } catch {
        /* ignore */
    }
    clearHostState();
    lastSeqApplied = 0;
    store.resetToHome();
}

export function clientSendReady(ready) {
    const on = !!ready;
    p2p.sendToHost({ action: ACTIONS.SET_READY, payload: { ready: on } });
    store.setState({
        players: (store.state.players || []).map((p) =>
            p.id === store.state.myClientId ? { ...p, ready: on } : p,
        ),
    });
}

export function allConnectedVoted(state = store.state) {
    const connected = connectedPlayers(state);
    if (connected.length === 0) return false;
    const voted = state.hasVoted || {};
    const votes = state.votes || {};
    return connected.every((p) => voted[p.id] || votes[p.id]);
}
