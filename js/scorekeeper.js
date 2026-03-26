// ─── Scorekeeper Page ─────────────────────────────────────────────────────────
// Compact spreadsheet layout. Auto-saves to localStorage on every stat change.

let liveGame = null;
const LIVE_GAME_KEY = 'bball_live_game';

function emptyPlayerStats() {
  return {
    points: 0, assists: 0, rebounds: 0, steals: 0, blocks: 0,
    fouls: 0, turnovers: 0,
    fgMade: 0, fgAttempted: 0,
    ftMade: 0, ftAttempted: 0,
    threeMade: 0, threeAttempted: 0,
  };
}

// ─── Persistence ──────────────────────────────────────────────────────────────

function autoSave() {
  if (!liveGame) return;
  localStorage.setItem(LIVE_GAME_KEY, JSON.stringify(liveGame));
}

function saveUpdates() {
  if (!liveGame) return;
  autoSave();
  showToast('Score & updates saved!', 'success');
}

function clearSavedGame() {
  localStorage.removeItem(LIVE_GAME_KEY);
}

function loadSavedGame() {
  try {
    const raw = localStorage.getItem(LIVE_GAME_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ─── Page Entry Point ─────────────────────────────────────────────────────────

function renderScorekeeperPage() {
  const el = document.getElementById('page-scorekeeper');
  if (!el) return;

  if (!canScorekeep()) {
    el.innerHTML = `
      <div class="container">
        <div class="empty-state" style="margin-top:60px">
          <div class="empty-icon">🔒</div>
          <h3>Access Restricted</h3>
          <p>Sign in as a Scorekeeper or League Manager to access this page.</p>
          <button class="btn btn-primary btn-lg" onclick="openModal('modal-sign-in')">Sign In</button>
        </div>
      </div>`;
    return;
  }

  if (!liveGame) {
    el.innerHTML = renderGameSelector();
  } else {
    el.innerHTML = renderLiveScoreboard();
  }
}

// ─── Game Selector ────────────────────────────────────────────────────────────

function renderGameSelector() {
  const { games, teams } = getState();
  const upcoming = games
    .filter(g => g.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

  const saved = loadSavedGame();
  const savedGame = saved ? games.find(g => g.id === saved.gameId && g.status === 'scheduled') : null;

  return `
    <div class="container">
      <div class="page-header">
        <h1>Scorekeeper</h1>
        <p>Select a game to start live tracking</p>
      </div>

      ${savedGame ? (() => {
        const home = teams.find(t => t.id === saved.homeTeamId);
        const away = teams.find(t => t.id === saved.awayTeamId);
        return `
          <div class="card" style="margin-bottom:20px;border-color:var(--orange)">
            <div class="card-body" style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
              <div>
                <div style="font-size:13px;font-weight:700;color:var(--orange);margin-bottom:4px">⚡ Game in progress</div>
                <div style="font-weight:700">${escHtml(home?.name || '?')} ${saved.homeScore} – ${saved.awayScore} ${escHtml(away?.name || '?')} · ${saved.quarter <= 4 ? 'Q' + saved.quarter : 'OT'}</div>
              </div>
              <div style="display:flex;gap:8px">
                <button class="btn btn-primary" onclick="resumeGame()">Resume Game</button>
                <button class="btn btn-ghost btn-sm" onclick="discardSavedGame()">Discard</button>
              </div>
            </div>
          </div>`;
      })() : ''}

      ${upcoming.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>No scheduled games</h3>
          <p>Add games to the schedule first</p>
          <button class="btn btn-primary" onclick="navigateTo('schedule')">Go to Schedule</button>
        </div>
      ` : `
        <div class="game-list">
          ${upcoming.map(g => {
            const home = teams.find(t => t.id === g.homeTeamId);
            const away = teams.find(t => t.id === g.awayTeamId);
            const d = new Date(g.scheduledAt);
            const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            return `
              <div class="game-card">
                <div class="game-date">
                  <div class="day">${d.getDate()}</div>
                  <div class="month">${d.toLocaleDateString('en-US', { month: 'short' })}</div>
                </div>
                <div class="game-matchup">
                  <div class="game-teams">
                    <div class="game-team">
                      <span class="team-dot" style="background:${home?.color || '#888'}"></span>
                      <span>${escHtml(home?.name || 'TBD')}</span>
                    </div>
                    <span class="game-vs">vs</span>
                    <div class="game-team">
                      <span class="team-dot" style="background:${away?.color || '#888'}"></span>
                      <span>${escHtml(away?.name || 'TBD')}</span>
                    </div>
                  </div>
                  <div class="game-meta">${timeStr} · ${escHtml(g.location)}</div>
                </div>
                <div class="game-actions">
                  <button class="btn btn-primary" onclick="startGame('${g.id}')">▶ Start Tracking</button>
                </div>
              </div>`;
          }).join('')}
        </div>`}
    </div>`;
}

// ─── Start / Resume / Abandon ─────────────────────────────────────────────────

function startGame(gameId) {
  const { games, players } = getState();
  const game = games.find(g => g.id === gameId);
  if (!game) return;
  const gamePlayers = players.filter(p => p.teamId === game.homeTeamId || p.teamId === game.awayTeamId);
  liveGame = {
    gameId,
    homeTeamId: game.homeTeamId,
    awayTeamId: game.awayTeamId,
    homeScore: 0,
    awayScore: 0,
    quarter: 1,
    playerStats: Object.fromEntries(gamePlayers.map(p => [p.id, emptyPlayerStats()])),
    actionLog: [],
  };
  autoSave();
  renderScorekeeperPage();
}

function resumeGame() {
  const saved = loadSavedGame();
  if (!saved) return;
  liveGame = saved;
  renderScorekeeperPage();
}

function discardSavedGame() {
  if (!confirm('Discard the saved game progress?')) return;
  clearSavedGame();
  renderScorekeeperPage();
}

function abandonGame() {
  if (!confirm('Abandon this game? All live stats will be lost.')) return;
  liveGame = null;
  clearSavedGame();
  renderScorekeeperPage();
}

// ─── Action Bar (reused at top and bottom) ────────────────────────────────────

function renderActionBar() {
  const tied = liveGame.homeScore === liveGame.awayScore;
  const q = liveGame.quarter;
  const qLabel    = q <= 4 ? `Q${q}` : `OT${q - 4}`;
  const prevLabel = q === 1 ? null : q <= 4 ? `Q${q - 1}` : q === 5 ? 'Q4' : `OT${q - 5}`;
  const nextLabel = q < 4 ? `Q${q + 1}` : q === 4 ? 'OT' : `OT${q - 3}`;

  return `
    <div class="sk-action-bar">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        ${prevLabel ? `<button class="btn btn-secondary btn-sm" onclick="retreatQuarter()" title="Go back to ${prevLabel}">‹ ${prevLabel}</button>` : '<span style="width:0"></span>'}
        <span class="sk-quarter-pill">${qLabel}</span>
        <button class="btn btn-secondary btn-sm" onclick="advanceQuarter()">› ${nextLabel}</button>
        <button class="btn btn-ghost btn-sm" onclick="undoLastAction()">↩ Undo</button>
        <button class="btn btn-ghost btn-sm" style="color:var(--red)" onclick="abandonGame()">Abandon</button>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <button class="btn btn-save" onclick="saveUpdates()">💾 Save Changes</button>
        <button class="btn btn-primary" onclick="finalizeGame()" ${tied ? 'disabled title="Scores are tied"' : ''}>
          ✓ End Game & Finalize
        </button>
      </div>
    </div>`;
}

// ─── Live Scoreboard ──────────────────────────────────────────────────────────

function renderLiveScoreboard() {
  const { teams, players } = getState();
  const homeTeam = teams.find(t => t.id === liveGame.homeTeamId);
  const awayTeam = teams.find(t => t.id === liveGame.awayTeamId);
  const homePlayers = players.filter(p => p.teamId === liveGame.homeTeamId);
  const awayPlayers = players.filter(p => p.teamId === liveGame.awayTeamId);
  const isHomeWinning = liveGame.homeScore > liveGame.awayScore;
  const isAwayWinning = liveGame.awayScore > liveGame.homeScore;

  return `
    <div class="container" style="max-width:1300px">

      <!-- Scoreboard strip -->
      <div class="sk-scoreboard">
        <div class="sk-team-side">
          <div class="sk-team-name" style="color:${homeTeam?.color}">${escHtml(homeTeam?.abbr || 'HME')}</div>
          <div class="sk-score" style="color:${isHomeWinning ? 'var(--orange)' : 'var(--text)'}">${liveGame.homeScore}</div>
          <div style="font-size:12px;color:var(--text-muted)">${escHtml(homeTeam?.name || 'Home')}</div>
        </div>
        <div class="sk-quarter" style="text-align:center;flex:1">
          <span class="sk-quarter-num">${liveGame.quarter <= 4 ? 'Q' + liveGame.quarter : 'OT'}</span>
          Quarter
        </div>
        <div class="sk-team-side" style="text-align:right">
          <div class="sk-team-name" style="color:${awayTeam?.color}">${escHtml(awayTeam?.abbr || 'AWY')}</div>
          <div class="sk-score" style="color:${isAwayWinning ? 'var(--orange)' : 'var(--text)'}">${liveGame.awayScore}</div>
          <div style="font-size:12px;color:var(--text-muted)">${escHtml(awayTeam?.name || 'Away')}</div>
        </div>
      </div>

      <!-- Action bar (TOP) -->
      ${renderActionBar()}

      <!-- Stat tables -->
      ${renderTeamTable(homeTeam, homePlayers)}
      ${renderTeamTable(awayTeam, awayPlayers)}

      <!-- Action bar (BOTTOM) -->
      ${renderActionBar()}
    </div>`;
}

// ─── Compact Team Table ───────────────────────────────────────────────────────

function renderTeamTable(team, players) {
  if (!team) return '';
  return `
    <div class="card" style="margin-bottom:20px;overflow:visible">
      <div class="card-header" style="gap:10px">
        <div style="display:flex;align-items:center;gap:8px">
          <span class="team-dot" style="background:${team.color};width:12px;height:12px"></span>
          <h2>${escHtml(team.name)}</h2>
        </div>
        <span style="font-size:13px;color:var(--text-muted);font-weight:400">
          ${liveGame[team.id === liveGame.homeTeamId ? 'homeScore' : 'awayScore']} pts
        </span>
      </div>
      ${players.length === 0 ? `
        <div style="padding:20px;color:var(--text-muted);font-size:13px;text-align:center">No players on roster</div>
      ` : `
        <div class="table-wrap">
          <table class="sk-table">
            <thead>
              <tr>
                <th style="width:24px">#</th>
                <th style="min-width:130px">Player</th>
                <th style="width:40px">Pos</th>
                <th style="width:80px">Fouls</th>
                <th class="sk-th-stat" title="Points">PTS</th>
                <th class="sk-th-stat" title="Free Throw">FT</th>
                <th class="sk-th-stat" title="Field Goal (2pt)">FG</th>
                <th class="sk-th-stat" title="Three Pointer">3PT</th>
                <th class="sk-th-stat" title="Rebounds">REB</th>
                <th class="sk-th-stat" title="Assists">AST</th>
                <th class="sk-th-stat" title="Steals">STL</th>
                <th class="sk-th-stat" title="Blocks">BLK</th>
                <th class="sk-th-stat" title="Turnovers">TO</th>
              </tr>
            </thead>
            <tbody>
              ${players.map(p => renderPlayerRow(p)).join('')}
            </tbody>
          </table>
        </div>`}
    </div>`;
}

function renderPlayerRow(player) {
  const ps = liveGame.playerStats[player.id] || emptyPlayerStats();
  const fouledOut = ps.fouls >= 5;
  const pid = player.id;

  // Each stat cell: [−] count [+]
  const cell = (action, value) => {
    const blocked = fouledOut && action !== 'FOUL';
    return `
      <td class="sk-cell">
        <div class="sk-cell-inner">
          <button class="sk-dec" onclick="decrementStatAction('${pid}','${action}')"
                  ${value <= 0 ? 'disabled' : ''} title="Remove 1 ${action}">−</button>
          <span class="sk-cell-val">${value}</span>
          <button class="sk-inc" onclick="recordStatAction('${pid}','${action}')"
                  ${blocked ? 'disabled title="Fouled out"' : `title="Add 1 ${action}"`}>+</button>
        </div>
      </td>`;
  };

  return `
    <tr class="${fouledOut ? 'sk-row-fouled' : ''}">
      <td class="td-muted td-mono" style="font-size:12px">${player.number}</td>
      <td style="font-weight:600;font-size:13px;white-space:nowrap">
        ${fouledOut ? '<span style="color:var(--red)" title="Fouled out">⚠ </span>' : ''}
        ${escHtml(player.name)}
      </td>
      <td><span class="badge badge-pos" style="font-size:10px">${player.position}</span></td>
      <td>
        <div class="sk-foul-cell">
          <button class="sk-dec" onclick="decrementStatAction('${pid}','FOUL')"
                  ${ps.fouls <= 0 ? 'disabled' : ''} title="Remove foul">−</button>
          <div style="display:flex;gap:2px">${renderFoulDots(ps.fouls)}</div>
          <button class="sk-inc" onclick="recordStatAction('${pid}','FOUL')" title="Add foul">+</button>
        </div>
      </td>
      <td class="sk-cell-pts">
        <span class="sk-cell-val" style="color:var(--orange);font-size:15px">${ps.points}</span>
      </td>
      ${cell('FT',  ps.ftMade)}
      ${cell('FG',  ps.fgMade)}
      ${cell('3PT', ps.threeMade)}
      ${cell('REB', ps.rebounds)}
      ${cell('AST', ps.assists)}
      ${cell('STL', ps.steals)}
      ${cell('BLK', ps.blocks)}
      ${cell('TO',  ps.turnovers)}
    </tr>`;
}

function renderFoulDots(fouls) {
  return Array.from({ length: 5 }, (_, i) => {
    const filled = i < fouls;
    const color = fouls >= 5 ? 'var(--red)' : fouls >= 3 ? 'var(--gold)' : 'var(--orange)';
    return `<span class="foul-dot" style="background:${filled ? color : 'var(--bg-elevated)'}"></span>`;
  }).join('');
}

// ─── Stat Actions ─────────────────────────────────────────────────────────────

function recordStatAction(playerId, action) {
  if (!liveGame) return;
  const ps = liveGame.playerStats[playerId];
  if (!ps) return;

  const isHome = getState().players.find(p => p.id === playerId)?.teamId === liveGame.homeTeamId;
  const addScore = n => { if (isHome) liveGame.homeScore += n; else liveGame.awayScore += n; };

  liveGame.actionLog.push({
    playerId, action,
    homeScore: liveGame.homeScore,
    awayScore: liveGame.awayScore,
    statsBefore: { ...ps },
  });

  switch (action) {
    case 'FT':   ps.points += 1; ps.ftMade++;    ps.ftAttempted++;    addScore(1); break;
    case 'FG':   ps.points += 2; ps.fgMade++;    ps.fgAttempted++;    addScore(2); break;
    case '3PT':  ps.points += 3; ps.threeMade++; ps.threeAttempted++; addScore(3); break;
    case 'REB':  ps.rebounds++;  break;
    case 'AST':  ps.assists++;   break;
    case 'STL':  ps.steals++;    break;
    case 'BLK':  ps.blocks++;    break;
    case 'TO':   ps.turnovers++; break;
    case 'FOUL': ps.fouls++;     break;
  }

  autoSave();
  renderScorekeeperPage();
}

function decrementStatAction(playerId, action) {
  if (!liveGame) return;
  const ps = liveGame.playerStats[playerId];
  if (!ps) return;

  const isHome = getState().players.find(p => p.id === playerId)?.teamId === liveGame.homeTeamId;
  const subScore = n => {
    if (isHome) liveGame.homeScore = Math.max(0, liveGame.homeScore - n);
    else liveGame.awayScore = Math.max(0, liveGame.awayScore - n);
  };

  switch (action) {
    case 'FT':
      if (ps.ftMade <= 0) return;
      ps.points = Math.max(0, ps.points - 1);
      ps.ftMade--; ps.ftAttempted = Math.max(0, ps.ftAttempted - 1);
      subScore(1); break;
    case 'FG':
      if (ps.fgMade <= 0) return;
      ps.points = Math.max(0, ps.points - 2);
      ps.fgMade--; ps.fgAttempted = Math.max(0, ps.fgAttempted - 1);
      subScore(2); break;
    case '3PT':
      if (ps.threeMade <= 0) return;
      ps.points = Math.max(0, ps.points - 3);
      ps.threeMade--; ps.threeAttempted = Math.max(0, ps.threeAttempted - 1);
      subScore(3); break;
    case 'REB':  if (ps.rebounds  > 0) ps.rebounds--;  break;
    case 'AST':  if (ps.assists   > 0) ps.assists--;   break;
    case 'STL':  if (ps.steals    > 0) ps.steals--;    break;
    case 'BLK':  if (ps.blocks    > 0) ps.blocks--;    break;
    case 'TO':   if (ps.turnovers > 0) ps.turnovers--; break;
    case 'FOUL': if (ps.fouls     > 0) ps.fouls--;     break;
  }

  autoSave();
  renderScorekeeperPage();
}

function undoLastAction() {
  if (!liveGame || liveGame.actionLog.length === 0) {
    showToast('Nothing to undo', 'info'); return;
  }
  const last = liveGame.actionLog.pop();
  liveGame.homeScore = last.homeScore;
  liveGame.awayScore = last.awayScore;
  Object.assign(liveGame.playerStats[last.playerId], last.statsBefore);
  autoSave();
  showToast('Last action undone', 'info');
  renderScorekeeperPage();
}

function advanceQuarter() {
  if (!liveGame) return;
  liveGame.quarter++;
  autoSave();
  renderScorekeeperPage();
}

function retreatQuarter() {
  if (!liveGame || liveGame.quarter <= 1) return;
  liveGame.quarter--;
  autoSave();
  renderScorekeeperPage();
}

// ─── Finalize ─────────────────────────────────────────────────────────────────

function finalizeGame() {
  if (!liveGame) return;
  if (liveGame.homeScore === liveGame.awayScore) {
    showToast('Scores are tied — cannot finalize a tie', 'error'); return;
  }
  if (!confirm('End the game and save all stats permanently?')) return;

  const statLines = Object.entries(liveGame.playerStats).map(([playerId, ps]) => ({ playerId, ...ps }));
  recordResult(liveGame.gameId, liveGame.homeScore, liveGame.awayScore, statLines);
  clearSavedGame();
  liveGame = null;
  showToast('Game finalized and saved!', 'success');
  renderScorekeeperPage();
}
