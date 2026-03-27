// ─── Data Layer ──────────────────────────────────────────────────────────────
// All state lives here. Persisted to localStorage on every mutation.

const STORAGE_KEY = 'bball_league_v1';

const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'];

function uuid() {
  return crypto.randomUUID();
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

function buildSeedData() {
  const teams = [
    { id: 't1', name: 'Chicago Bulls',      abbr: 'CHI', color: '#CE1141', wins: 5, losses: 3 },
    { id: 't2', name: 'Golden State Warriors', abbr: 'GSW', color: '#1D428A', wins: 6, losses: 2 },
    { id: 't3', name: 'Miami Heat',         abbr: 'MIA', color: '#98002E', wins: 4, losses: 4 },
    { id: 't4', name: 'Boston Celtics',     abbr: 'BOS', color: '#007A33', wins: 3, losses: 5 },
  ];

  const players = [
    // Chicago Bulls
    { id: 'p1',  name: 'Marcus Webb',    number: 1,  position: 'PG', teamId: 't1', isActive: true },
    { id: 'p2',  name: 'Dante Rivers',   number: 23, position: 'SF', teamId: 't1', isActive: true },
    { id: 'p3',  name: 'Jerome King',    number: 7,  position: 'PF', teamId: 't1', isActive: true },
    { id: 'p4',  name: 'Lamont Cruz',    number: 12, position: 'C',  teamId: 't1', isActive: true },
    { id: 'p5',  name: 'Tyler Brooks',   number: 3,  position: 'SG', teamId: 't1', isActive: true },
    // Golden State Warriors
    { id: 'p6',  name: 'Andre Mason',    number: 30, position: 'PG', teamId: 't2', isActive: true },
    { id: 'p7',  name: 'Devon Park',     number: 11, position: 'SG', teamId: 't2', isActive: true },
    { id: 'p8',  name: 'Carlos Vega',    number: 4,  position: 'SF', teamId: 't2', isActive: true },
    { id: 'p9',  name: 'Shaun Lee',      number: 9,  position: 'PF', teamId: 't2', isActive: true },
    { id: 'p10', name: 'Big Rob Torres', number: 50, position: 'C',  teamId: 't2', isActive: true },
    // Miami Heat
    { id: 'p11', name: 'Felix Grant',    number: 6,  position: 'PG', teamId: 't3', isActive: true },
    { id: 'p12', name: 'Malik Stone',    number: 22, position: 'SG', teamId: 't3', isActive: true },
    { id: 'p13', name: 'Isaiah Pena',    number: 14, position: 'SF', teamId: 't3', isActive: true },
    { id: 'p14', name: 'Victor Holt',    number: 2,  position: 'PF', teamId: 't3', isActive: true },
    { id: 'p15', name: 'Nathan Wells',   number: 35, position: 'C',  teamId: 't3', isActive: true },
    // Boston Celtics
    { id: 'p16', name: 'Troy Simmons',   number: 8,  position: 'PG', teamId: 't4', isActive: true },
    { id: 'p17', name: 'Darius Cole',    number: 18, position: 'SG', teamId: 't4', isActive: true },
    { id: 'p18', name: 'Marcus Bell',    number: 5,  position: 'SF', teamId: 't4', isActive: true },
    { id: 'p19', name: 'Elijah Ford',    number: 44, position: 'PF', teamId: 't4', isActive: true },
    { id: 'p20', name: 'Antoine Cross',  number: 0,  position: 'C',  teamId: 't4', isActive: true },
  ];

  // Past games
  const games = [
    { id: 'g1', homeTeamId: 't1', awayTeamId: 't2', scheduledAt: '2026-03-01T19:00', status: 'final', homeScore: 108, awayScore: 115, location: 'United Center' },
    { id: 'g2', homeTeamId: 't3', awayTeamId: 't4', scheduledAt: '2026-03-03T20:00', status: 'final', homeScore: 102, awayScore:  89, location: 'Kaseya Center' },
    { id: 'g3', homeTeamId: 't2', awayTeamId: 't3', scheduledAt: '2026-03-06T19:30', status: 'final', homeScore: 121, awayScore: 110, location: 'Chase Center' },
    { id: 'g4', homeTeamId: 't4', awayTeamId: 't1', scheduledAt: '2026-03-08T18:00', status: 'final', homeScore:  95, awayScore: 101, location: 'TD Garden' },
    { id: 'g5', homeTeamId: 't1', awayTeamId: 't3', scheduledAt: '2026-03-12T19:00', status: 'final', homeScore: 114, awayScore: 103, location: 'United Center' },
    { id: 'g6', homeTeamId: 't2', awayTeamId: 't4', scheduledAt: '2026-03-15T20:00', status: 'final', homeScore: 133, awayScore: 118, location: 'Chase Center' },
    // Upcoming games
    { id: 'g7', homeTeamId: 't3', awayTeamId: 't1', scheduledAt: '2026-03-28T19:00', status: 'scheduled', homeScore: null, awayScore: null, location: 'Kaseya Center' },
    { id: 'g8', homeTeamId: 't4', awayTeamId: 't2', scheduledAt: '2026-03-30T17:30', status: 'scheduled', homeScore: null, awayScore: null, location: 'TD Garden' },
    { id: 'g9', homeTeamId: 't1', awayTeamId: 't4', scheduledAt: '2026-04-03T19:00', status: 'scheduled', homeScore: null, awayScore: null, location: 'United Center' },
    { id: 'g10', homeTeamId: 't2', awayTeamId: 't3', scheduledAt: '2026-04-05T20:00', status: 'scheduled', homeScore: null, awayScore: null, location: 'Chase Center' },
  ];

  // Stat lines (one per player per past game they played in)
  const statLines = [
    // g1 CHI vs GSW
    { id: uuid(), playerId: 'p1', gameId: 'g1', points: 18, assists: 7, rebounds: 4, steals: 2, blocks: 0 },
    { id: uuid(), playerId: 'p2', gameId: 'g1', points: 24, assists: 3, rebounds: 6, steals: 1, blocks: 1 },
    { id: uuid(), playerId: 'p3', gameId: 'g1', points: 15, assists: 2, rebounds: 9, steals: 0, blocks: 2 },
    { id: uuid(), playerId: 'p4', gameId: 'g1', points: 12, assists: 1, rebounds: 11, steals: 0, blocks: 3 },
    { id: uuid(), playerId: 'p5', gameId: 'g1', points: 20, assists: 4, rebounds: 3, steals: 3, blocks: 0 },
    { id: uuid(), playerId: 'p6', gameId: 'g1', points: 29, assists: 9, rebounds: 5, steals: 2, blocks: 0 },
    { id: uuid(), playerId: 'p7', gameId: 'g1', points: 22, assists: 2, rebounds: 4, steals: 1, blocks: 0 },
    { id: uuid(), playerId: 'p8', gameId: 'g1', points: 18, assists: 5, rebounds: 7, steals: 2, blocks: 1 },
    { id: uuid(), playerId: 'p9', gameId: 'g1', points: 16, assists: 1, rebounds: 8, steals: 0, blocks: 2 },
    { id: uuid(), playerId: 'p10', gameId: 'g1', points: 14, assists: 0, rebounds: 14, steals: 1, blocks: 4 },
    // g2 MIA vs BOS
    { id: uuid(), playerId: 'p11', gameId: 'g2', points: 21, assists: 8, rebounds: 4, steals: 3, blocks: 0 },
    { id: uuid(), playerId: 'p12', gameId: 'g2', points: 19, assists: 2, rebounds: 3, steals: 2, blocks: 0 },
    { id: uuid(), playerId: 'p13', gameId: 'g2', points: 17, assists: 3, rebounds: 7, steals: 1, blocks: 1 },
    { id: uuid(), playerId: 'p14', gameId: 'g2', points: 14, assists: 1, rebounds: 8, steals: 0, blocks: 2 },
    { id: uuid(), playerId: 'p15', gameId: 'g2', points: 12, assists: 0, rebounds: 12, steals: 0, blocks: 3 },
    { id: uuid(), playerId: 'p16', gameId: 'g2', points: 15, assists: 6, rebounds: 3, steals: 1, blocks: 0 },
    { id: uuid(), playerId: 'p17', gameId: 'g2', points: 22, assists: 3, rebounds: 4, steals: 2, blocks: 0 },
    { id: uuid(), playerId: 'p18', gameId: 'g2', points: 14, assists: 2, rebounds: 6, steals: 1, blocks: 0 },
    { id: uuid(), playerId: 'p19', gameId: 'g2', points: 11, assists: 1, rebounds: 7, steals: 0, blocks: 2 },
    { id: uuid(), playerId: 'p20', gameId: 'g2', points:  9, assists: 0, rebounds: 9,  steals: 0, blocks: 2 },
    // g3 GSW vs MIA
    { id: uuid(), playerId: 'p6', gameId: 'g3', points: 35, assists: 8, rebounds: 6, steals: 3, blocks: 0 },
    { id: uuid(), playerId: 'p7', gameId: 'g3', points: 26, assists: 3, rebounds: 5, steals: 2, blocks: 1 },
    { id: uuid(), playerId: 'p8', gameId: 'g3', points: 22, assists: 6, rebounds: 8, steals: 1, blocks: 0 },
    { id: uuid(), playerId: 'p9', gameId: 'g3', points: 18, assists: 2, rebounds: 10, steals: 0, blocks: 3 },
    { id: uuid(), playerId: 'p10', gameId: 'g3', points: 15, assists: 1, rebounds: 15, steals: 1, blocks: 5 },
    { id: uuid(), playerId: 'p11', gameId: 'g3', points: 28, assists: 7, rebounds: 5, steals: 2, blocks: 0 },
    { id: uuid(), playerId: 'p12', gameId: 'g3', points: 24, assists: 2, rebounds: 3, steals: 3, blocks: 0 },
    { id: uuid(), playerId: 'p13', gameId: 'g3', points: 19, assists: 4, rebounds: 8, steals: 1, blocks: 1 },
    { id: uuid(), playerId: 'p14', gameId: 'g3', points: 15, assists: 1, rebounds: 9, steals: 0, blocks: 2 },
    { id: uuid(), playerId: 'p15', gameId: 'g3', points: 12, assists: 0, rebounds: 13, steals: 0, blocks: 3 },
    // g4 BOS vs CHI
    { id: uuid(), playerId: 'p16', gameId: 'g4', points: 12, assists: 5, rebounds: 3, steals: 1, blocks: 0 },
    { id: uuid(), playerId: 'p17', gameId: 'g4', points: 18, assists: 2, rebounds: 4, steals: 2, blocks: 0 },
    { id: uuid(), playerId: 'p18', gameId: 'g4', points: 22, assists: 3, rebounds: 7, steals: 0, blocks: 1 },
    { id: uuid(), playerId: 'p19', gameId: 'g4', points: 14, assists: 1, rebounds: 9, steals: 1, blocks: 3 },
    { id: uuid(), playerId: 'p20', gameId: 'g4', points: 11, assists: 0, rebounds: 11, steals: 0, blocks: 2 },
    { id: uuid(), playerId: 'p1', gameId: 'g4', points: 22, assists: 9, rebounds: 5, steals: 3, blocks: 0 },
    { id: uuid(), playerId: 'p2', gameId: 'g4', points: 28, assists: 4, rebounds: 7, steals: 2, blocks: 1 },
    { id: uuid(), playerId: 'p3', gameId: 'g4', points: 16, assists: 1, rebounds: 10, steals: 0, blocks: 3 },
    { id: uuid(), playerId: 'p4', gameId: 'g4', points: 14, assists: 2, rebounds: 12, steals: 0, blocks: 4 },
    { id: uuid(), playerId: 'p5', gameId: 'g4', points: 19, assists: 3, rebounds: 4, steals: 2, blocks: 0 },
    // g5 CHI vs MIA
    { id: uuid(), playerId: 'p1', gameId: 'g5', points: 25, assists: 8, rebounds: 4, steals: 2, blocks: 0 },
    { id: uuid(), playerId: 'p2', gameId: 'g5', points: 30, assists: 3, rebounds: 8, steals: 1, blocks: 2 },
    { id: uuid(), playerId: 'p3', gameId: 'g5', points: 18, assists: 2, rebounds: 11, steals: 0, blocks: 2 },
    { id: uuid(), playerId: 'p4', gameId: 'g5', points: 16, assists: 1, rebounds: 13, steals: 0, blocks: 4 },
    { id: uuid(), playerId: 'p5', gameId: 'g5', points: 22, assists: 5, rebounds: 3, steals: 3, blocks: 0 },
    { id: uuid(), playerId: 'p11', gameId: 'g5', points: 24, assists: 6, rebounds: 4, steals: 3, blocks: 0 },
    { id: uuid(), playerId: 'p12', gameId: 'g5', points: 18, assists: 2, rebounds: 3, steals: 2, blocks: 0 },
    { id: uuid(), playerId: 'p13', gameId: 'g5', points: 20, assists: 4, rebounds: 7, steals: 1, blocks: 1 },
    { id: uuid(), playerId: 'p14', gameId: 'g5', points: 13, assists: 1, rebounds: 8, steals: 0, blocks: 1 },
    { id: uuid(), playerId: 'p15', gameId: 'g5', points: 11, assists: 0, rebounds: 10, steals: 0, blocks: 2 },
    // g6 GSW vs BOS
    { id: uuid(), playerId: 'p6', gameId: 'g6', points: 38, assists: 11, rebounds: 7, steals: 4, blocks: 0 },
    { id: uuid(), playerId: 'p7', gameId: 'g6', points: 29, assists: 4, rebounds: 5, steals: 2, blocks: 0 },
    { id: uuid(), playerId: 'p8', gameId: 'g6', points: 25, assists: 5, rebounds: 9, steals: 1, blocks: 2 },
    { id: uuid(), playerId: 'p9', gameId: 'g6', points: 21, assists: 2, rebounds: 11, steals: 0, blocks: 3 },
    { id: uuid(), playerId: 'p10', gameId: 'g6', points: 18, assists: 0, rebounds: 16, steals: 1, blocks: 6 },
    { id: uuid(), playerId: 'p16', gameId: 'g6', points: 20, assists: 8, rebounds: 4, steals: 2, blocks: 0 },
    { id: uuid(), playerId: 'p17', gameId: 'g6', points: 25, assists: 3, rebounds: 5, steals: 2, blocks: 0 },
    { id: uuid(), playerId: 'p18', gameId: 'g6', points: 19, assists: 2, rebounds: 8, steals: 1, blocks: 1 },
    { id: uuid(), playerId: 'p19', gameId: 'g6', points: 22, assists: 1, rebounds: 10, steals: 0, blocks: 3 },
    { id: uuid(), playerId: 'p20', gameId: 'g6', points: 14, assists: 0, rebounds: 12, steals: 0, blocks: 4 },
  ];

  return { teams, players, games, statLines, activeTeamId: 't1', pendingItems: [] };
}

// ─── State Management ─────────────────────────────────────────────────────────

let state = null;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      state = JSON.parse(raw);
      // Migrations for existing stored data
      if (!state.pendingItems) state.pendingItems = [];
    } else {
      state = buildSeedData();
      saveState();
    }
  } catch (e) {
    state = buildSeedData();
    saveState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getState() {
  return state;
}

// ─── Team Actions ─────────────────────────────────────────────────────────────

function addTeam({ name, abbr, color, email }) {
  const team = { id: uuid(), name, abbr: abbr.toUpperCase().slice(0, 3), color, wins: 0, losses: 0, email: email || '' };
  state.teams.push(team);
  state.activeTeamId = team.id;
  saveState();
  return team;
}

function updateTeam(id, fields) {
  const team = state.teams.find(t => t.id === id);
  if (team) Object.assign(team, fields);
  saveState();
}

function deleteTeam(id) {
  state.teams = state.teams.filter(t => t.id !== id);
  state.players = state.players.filter(p => p.teamId !== id);
  // Remove stat lines for those players
  const removedPlayerIds = state.players.filter(p => p.teamId === id).map(p => p.id);
  state.statLines = state.statLines.filter(s => !removedPlayerIds.includes(s.playerId));
  if (state.activeTeamId === id) {
    state.activeTeamId = state.teams[0]?.id || null;
  }
  saveState();
}

function setActiveTeam(id) {
  state.activeTeamId = id;
  saveState();
}

// ─── Player Actions ───────────────────────────────────────────────────────────

function addPlayer({ name, number, position, teamId, email }) {
  const player = { id: uuid(), name, number: parseInt(number), position, teamId, isActive: true, email: email || '' };
  state.players.push(player);
  saveState();
  return player;
}

function updatePlayer(id, fields) {
  const player = state.players.find(p => p.id === id);
  if (player) Object.assign(player, fields);
  saveState();
}

function removePlayer(id) {
  state.players = state.players.filter(p => p.id !== id);
  state.statLines = state.statLines.filter(s => s.playerId !== id);
  saveState();
}

// ─── Game Actions ─────────────────────────────────────────────────────────────

function addGame({ homeTeamId, awayTeamId, scheduledAt, location }) {
  const game = { id: uuid(), homeTeamId, awayTeamId, scheduledAt, location, status: 'scheduled', homeScore: null, awayScore: null };
  state.games.push(game);
  saveState();
  return game;
}

function recordResult(gameId, homeScore, awayScore, newStatLines) {
  const game = state.games.find(g => g.id === gameId);
  if (!game) return;
  game.status = 'final';
  game.homeScore = parseInt(homeScore);
  game.awayScore = parseInt(awayScore);

  // Update team records
  const homeTeam = state.teams.find(t => t.id === game.homeTeamId);
  const awayTeam = state.teams.find(t => t.id === game.awayTeamId);
  if (homeTeam && awayTeam) {
    if (game.homeScore > game.awayScore) {
      homeTeam.wins++;
      awayTeam.losses++;
    } else {
      awayTeam.wins++;
      homeTeam.losses++;
    }
  }

  // Remove existing stat lines for this game
  state.statLines = state.statLines.filter(s => s.gameId !== gameId);
  // Add new stat lines
  newStatLines.forEach(sl => {
    state.statLines.push({ id: uuid(), ...sl, gameId });
  });

  saveState();
}

// ─── Computed/Derived ─────────────────────────────────────────────────────────

function getPlayerAverages(playerId) {
  const lines = state.statLines.filter(s => s.playerId === playerId);
  const gp = lines.length;
  if (gp === 0) return { gp: 0, ppg: 0, apg: 0, rpg: 0, spg: 0, bpg: 0 };
  const sum = key => lines.reduce((a, l) => a + (l[key] || 0), 0);
  return {
    gp,
    ppg: (sum('points') / gp).toFixed(1),
    apg: (sum('assists') / gp).toFixed(1),
    rpg: (sum('rebounds') / gp).toFixed(1),
    spg: (sum('steals') / gp).toFixed(1),
    bpg: (sum('blocks') / gp).toFixed(1),
  };
}

function getTeamAverages(teamId) {
  const players = state.players.filter(p => p.teamId === teamId);
  const lines = state.statLines.filter(s => players.some(p => p.id === s.playerId));
  const gp = state.games.filter(g =>
    (g.homeTeamId === teamId || g.awayTeamId === teamId) && g.status === 'final'
  ).length;
  if (gp === 0 || lines.length === 0) return { gp, ppg: 0, apg: 0, rpg: 0, spg: 0, bpg: 0 };

  // Sum all stats then divide by games played
  const gameIds = [...new Set(lines.map(l => l.gameId))];
  const byGame = gameIds.map(gid => {
    const gl = lines.filter(l => l.gameId === gid);
    return {
      points:   gl.reduce((a, l) => a + l.points, 0),
      assists:  gl.reduce((a, l) => a + l.assists, 0),
      rebounds: gl.reduce((a, l) => a + l.rebounds, 0),
      steals:   gl.reduce((a, l) => a + l.steals, 0),
      blocks:   gl.reduce((a, l) => a + l.blocks, 0),
    };
  });

  const games = byGame.length || 1;
  const avg = key => (byGame.reduce((a, g) => a + g[key], 0) / games).toFixed(1);
  return {
    gp,
    ppg: avg('points'),
    apg: avg('assists'),
    rpg: avg('rebounds'),
    spg: avg('steals'),
    bpg: avg('blocks'),
  };
}

function getPlayerGameLog(playerId) {
  return state.statLines
    .filter(s => s.playerId === playerId)
    .map(s => {
      const game = state.games.find(g => g.id === s.gameId);
      const homeTeam = state.teams.find(t => t.id === game?.homeTeamId);
      const awayTeam = state.teams.find(t => t.id === game?.awayTeamId);
      return { ...s, game, homeTeam, awayTeam };
    })
    .sort((a, b) => new Date(b.game?.scheduledAt) - new Date(a.game?.scheduledAt));
}

function resetData() {
  state = buildSeedData();
  saveState();
}

// ─── Pending Approval Queue ───────────────────────────────────────────────────

function submitPendingItem(type, payload) {
  state.pendingItems.push({ id: uuid(), type, payload, submittedAt: new Date().toISOString() });
  saveState();
}

function getPendingItems() {
  return state.pendingItems || [];
}

function approvePendingItem(id) {
  const item = state.pendingItems.find(i => i.id === id);
  if (!item) return;
  if (item.type === 'team') {
    const team = addTeam(item.payload);
    // Also add any players that were bundled with the team request
    if (item.payload.players && item.payload.players.length > 0) {
      item.payload.players.forEach(p => addPlayer({ ...p, teamId: team.id }));
    }
  } else if (item.type === 'player') {
    addPlayer(item.payload);
  }
  state.pendingItems = state.pendingItems.filter(i => i.id !== id);
  saveState();
}

function rejectPendingItem(id) {
  state.pendingItems = state.pendingItems.filter(i => i.id !== id);
  saveState();
}

// Initialize on load
loadState();
