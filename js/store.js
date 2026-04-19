/** Player roster entries are strings on the setup screen and { name, ... } during play. */
export function normalizePlayerName(entry) {
    if (typeof entry === 'string') {
        const s = entry.trim();
        return s || 'Player';
    }
    if (!entry || typeof entry !== 'object') return 'Player';
    if (typeof entry.name === 'string') {
        const s = entry.name.trim();
        return s || 'Player';
    }
    if (entry.name && typeof entry.name === 'object') {
        return normalizePlayerName(entry.name);
    }
    return 'Player';
}

export const store = {
    state: {
        screen: 'setup', // 'setup', 'transition', 'reveal', 'round', 'results'
        players: ["Alpha", "Bravo", "Charlie"], // List of player objects: { id, name, role, revealed }
        impostorCount: 1,
        revealRolesOnDeath: true,
        word: null, // { word, hint }
        currentPlayerIndex: 0,
        scores: {}, // Persistent across rounds
        votes: {}, // Current round votes
        detectives: [], // Innocents who guessed right
        language: 'en',
        availableThemes: [],
        selectedThemes: [],
        /** English ids of the default starter decks (top word counts in `data/en.json`). */
        freeCanonicalThemes: [],
    },
    
    listeners: [],

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    },

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    },

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notify();
    },

    // Action Helpers
    addPlayer(name) {
        if (!name.trim()) return;
        const newPlayers = [...this.state.players, name.trim()];
        this.setState({ players: newPlayers });
    },

    removePlayer(index) {
        const newPlayers = this.state.players.filter((_, i) => i !== index);
        // Adjust impostor count if needed
        let iCount = this.state.impostorCount;
        if (iCount >= newPlayers.length && newPlayers.length > 0) {
            iCount = newPlayers.length - 1;
        }
        this.setState({ players: newPlayers, impostorCount: iCount });
    },

    setImpostorCount(count) {
        if (count >= 1 && count < this.state.players.length) {
            this.setState({ impostorCount: count });
        }
    },

    toggleRevealRoles() {
        this.setState({ revealRolesOnDeath: !this.state.revealRolesOnDeath });
    },

    startGame(wordObj) {
        if (this.state.players.length < 3) return; // Need at least 3 players
        
        // Assign roles
        const shuffledIndices = this.state.players.map((_, i) => i).sort(() => Math.random() - 0.5);
        const impostorIndices = new Set(shuffledIndices.slice(0, this.state.impostorCount));
        
        const playerObjects = this.state.players.map((entry, index) => ({
            id: index,
            name: normalizePlayerName(entry),
            role: impostorIndices.has(index) ? 'IMPOSTOR' : 'INNOCENT',
            revealed: false,
        }));

        this.setState({
            players: playerObjects,
            word: wordObj,
            currentPlayerIndex: 0,
            screen: 'transition',
            votes: {},
            detectives: []
        });
    },

    nextPlayerReveal() {
        // Mark current as revealed
        const updatedPlayers = [...this.state.players];
        updatedPlayers[this.state.currentPlayerIndex].revealed = true;
        
        const nextIndex = this.state.currentPlayerIndex + 1;
        if (nextIndex < this.state.players.length) {
            this.setState({
                players: updatedPlayers,
                currentPlayerIndex: nextIndex,
                screen: 'transition'
            });
        } else {
            // All revealed, go to round
            this.setState({
                players: updatedPlayers,
                screen: 'round'
            });
        }
    },

    castVote(voterName, suspectName) {
        const newVotes = { ...this.state.votes, [voterName]: suspectName };
        this.setState({ votes: newVotes });
    },

    endGame() {
        const impostorNames = new Set(this.state.players.filter(p => p.role === 'IMPOSTOR').map(p => p.name));
        const newScores = { ...this.state.scores };
        const detectives = [];

        // 1. Innocents +1 if correct
        for (const [voter, suspect] of Object.entries(this.state.votes)) {
            const voterPlayer = this.state.players.find(p => p.name === voter);
            if (voterPlayer && voterPlayer.role === 'INNOCENT' && impostorNames.has(suspect)) {
                newScores[voter] = (newScores[voter] || 0) + 1;
                detectives.push(voter);
            }
        }

        // 2. Impostors +2 if surviving (not sole max votes)
        const voteCounts = {};
        Object.values(this.state.votes).forEach(suspect => {
            voteCounts[suspect] = (voteCounts[suspect] || 0) + 1;
        });
        const maxVotes = Math.max(0, ...Object.values(voteCounts));

        this.state.players.filter(p => p.role === 'IMPOSTOR').forEach(imp => {
            const votesReceived = voteCounts[imp.name] || 0;
            const tiedForMost = Object.values(voteCounts).filter(v => v === maxVotes).length > 1;
            const survived = votesReceived < maxVotes || (votesReceived === maxVotes && tiedForMost) || maxVotes === 0;
            
            if (survived) {
                newScores[imp.name] = (newScores[imp.name] || 0) + 2;
            }
        });

        this.setState({ 
            screen: 'results',
            scores: newScores,
            detectives: detectives
        });
    },

    resetGame() {
        // Keeps player names, resets roles and game state
        const names = this.state.players.map((p) => normalizePlayerName(p));
        this.setState({
            players: names,
            word: null,
            currentPlayerIndex: 0,
            screen: 'setup',
            votes: {},
            detectives: []
        });
    }
};
