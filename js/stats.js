// ─── Player Stats Page ────────────────────────────────────────────────────────

let playerSortKey = 'ppg';
let playerSortDir = 'desc';
let expandedPlayer = null;

function renderPlayerStatsPage() {
  const { teams, players } = getState();

  const filterTeamId = document.getElementById('ps-filter-team')?.value || '';
  const filterSearch = document.getElementById('ps-filter-search')?.value.toLowerCase() || '';

  // Compute averages for all players
  let rows = players.map(p => {
    const team = teams.find(t => t.id === p.teamId);
    const avg = getPlayerAverages(p.id);
    return { ...p, team, ...avg, ppgNum: parseFloat(avg.ppg), apgNum: parseFloat(avg.apg), rpgNum: parseFloat(avg.rpg), spgNum: parseFloat(avg.spg), bpgNum: parseFloat(avg.bpg) };
  });

  // Filter
  if (filterTeamId) rows = rows.filter(r => r.teamId === filterTeamId);
  if (filterSearch) rows = rows.filter(r => r.name.toLowerCase().includes(filterSearch));

  // Sort
  const sortKeyMap = { ppg: 'ppgNum', apg: 'apgNum', rpg: 'rpgNum', spg: 'spgNum', bpg: 'bpgNum', gp: 'gp', name: 'name' };
  const sk = sortKeyMap[playerSortKey] || 'ppgNum';
  rows.sort((a, b) => {
    if (typeof a[sk] === 'number') return playerSortDir === 'desc' ? b[sk] - a[sk] : a[sk] - b[sk];
    return playerSortDir === 'desc' ? b[sk].localeCompare(a[sk]) : a[sk].localeCompare(b[sk]);
  });

  const html = `
    <div class="container">
      <div class="page-header">
        <h1>Player Stats</h1>
        <p>Individual performance averages across all games</p>
      </div>

      <div class="stat-filter-bar">
        <input class="form-control" id="ps-filter-search" placeholder="Search player..." value="${filterSearch}"
               oninput="renderPlayerStatsPage()">
        <select class="form-control" id="ps-filter-team" onchange="renderPlayerStatsPage()">
          <option value="">All Teams</option>
          ${teams.map(t => `<option value="${t.id}" ${t.id === filterTeamId ? 'selected' : ''}>${t.name}</option>`).join('')}
        </select>
      </div>

      <div class="card">
        ${rows.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">📊</div>
            <h3>No players found</h3>
            <p>Try adjusting your search or filter</p>
          </div>
        ` : `
          <div class="table-wrap">
            <table id="player-stats-table">
              <thead>
                <tr>
                  <th onclick="sortPlayerStats('name')" class="sortable ${playerSortKey==='name'?playerSortDir:''}">Player</th>
                  <th>Team</th>
                  <th>Pos</th>
                  <th onclick="sortPlayerStats('gp')" class="sortable ${playerSortKey==='gp'?playerSortDir:''}">GP</th>
                  <th onclick="sortPlayerStats('ppg')" class="sortable ${playerSortKey==='ppg'?playerSortDir:''}">PPG</th>
                  <th onclick="sortPlayerStats('rpg')" class="sortable ${playerSortKey==='rpg'?playerSortDir:''}">RPG</th>
                  <th onclick="sortPlayerStats('apg')" class="sortable ${playerSortKey==='apg'?playerSortDir:''}">APG</th>
                  <th onclick="sortPlayerStats('spg')" class="sortable ${playerSortKey==='spg'?playerSortDir:''}">SPG</th>
                  <th onclick="sortPlayerStats('bpg')" class="sortable ${playerSortKey==='bpg'?playerSortDir:''}">BPG</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${rows.map(p => renderPlayerStatRow(p)).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    </div>
  `;

  document.getElementById('page-player-stats').innerHTML = html;
}

function renderPlayerStatRow(p) {
  const isExpanded = expandedPlayer === p.id;
  const teamDot = p.team ? `<span class="team-dot" style="background:${p.team.color}"></span>` : '';
  const gameLog = isExpanded ? getPlayerGameLog(p.id) : [];

  let logRows = '';
  if (isExpanded) {
    if (gameLog.length === 0) {
      logRows = `<tr class="game-log-row"><td colspan="10" class="text-muted" style="padding:12px 14px;font-size:13px">No game data recorded yet</td></tr>`;
    } else {
      logRows = gameLog.map(gl => {
        const home = gl.homeTeam?.abbr || '?';
        const away = gl.awayTeam?.abbr || '?';
        const date = gl.game ? formatDate(gl.game.scheduledAt, true) : '-';
        return `
          <tr class="game-log-row">
            <td colspan="2" style="padding:10px 14px;font-size:13px;color:var(--text-muted)">${date} · ${home} vs ${away}</td>
            <td></td>
            <td></td>
            <td class="td-highlight" style="font-size:13px">${gl.points}</td>
            <td style="font-size:13px">${gl.rebounds}</td>
            <td style="font-size:13px">${gl.assists}</td>
            <td style="font-size:13px">${gl.steals}</td>
            <td style="font-size:13px">${gl.blocks}</td>
            <td></td>
          </tr>
        `;
      }).join('');
    }
  }

  return `
    <tr onclick="togglePlayerLog('${p.id}')" style="cursor:pointer">
      <td style="font-weight:600">${escHtml(p.name)}</td>
      <td>
        <div class="flex-center gap-8">
          ${teamDot}
          <span class="td-muted">${p.team?.abbr || '-'}</span>
        </div>
      </td>
      <td><span class="badge badge-pos">${p.position}</span></td>
      <td class="td-muted td-mono">${p.gp}</td>
      <td class="td-highlight td-mono">${p.ppg}</td>
      <td class="td-mono">${p.rpg}</td>
      <td class="td-mono">${p.apg}</td>
      <td class="td-mono">${p.spg}</td>
      <td class="td-mono">${p.bpg}</td>
      <td style="color:var(--text-dim)">${isExpanded ? '▲' : '▼'}</td>
    </tr>
    ${logRows}
  `;
}

function sortPlayerStats(key) {
  if (playerSortKey === key) {
    playerSortDir = playerSortDir === 'desc' ? 'asc' : 'desc';
  } else {
    playerSortKey = key;
    playerSortDir = 'desc';
  }
  renderPlayerStatsPage();
}

function togglePlayerLog(playerId) {
  expandedPlayer = expandedPlayer === playerId ? null : playerId;
  renderPlayerStatsPage();
}

// ─── Team Stats Page ──────────────────────────────────────────────────────────

function renderTeamStatsPage() {
  const { teams } = getState();

  // Compute stats for all teams
  const teamData = teams.map(t => ({
    ...t,
    avg: getTeamAverages(t.id),
  }));

  // Find league max for each stat (for bar scaling)
  const maxPpg = Math.max(...teamData.map(t => parseFloat(t.avg.ppg) || 0), 1);
  const maxRpg = Math.max(...teamData.map(t => parseFloat(t.avg.rpg) || 0), 1);
  const maxApg = Math.max(...teamData.map(t => parseFloat(t.avg.apg) || 0), 1);
  const maxSpg = Math.max(...teamData.map(t => parseFloat(t.avg.spg) || 0), 1);
  const maxBpg = Math.max(...teamData.map(t => parseFloat(t.avg.bpg) || 0), 1);

  // Sort by win % then total wins
  teamData.sort((a, b) => {
    const wPctA = a.wins / (a.wins + a.losses || 1);
    const wPctB = b.wins / (b.wins + b.losses || 1);
    return wPctB - wPctA || b.wins - a.wins;
  });

  const html = `
    <div class="container">
      <div class="page-header">
        <h1>Team Stats</h1>
        <p>League standings and team performance averages</p>
      </div>

      ${teams.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">🏆</div>
          <h3>No teams yet</h3>
          <p>Create teams and record games to see stats here</p>
        </div>
      ` : `
        <!-- Standings Table -->
        <div class="card" style="margin-bottom:24px">
          <div class="card-header"><h2>League Standings</h2></div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Team</th>
                  <th>W</th>
                  <th>L</th>
                  <th>PCT</th>
                  <th>PPG</th>
                  <th>RPG</th>
                  <th>APG</th>
                </tr>
              </thead>
              <tbody>
                ${teamData.map((t, i) => {
                  const total = t.wins + t.losses;
                  const pct = total > 0 ? (t.wins / total).toFixed(3).replace('0.', '.') : '.000';
                  return `
                    <tr>
                      <td class="td-muted">${i + 1}</td>
                      <td>
                        <div class="flex-center gap-8">
                          <span class="team-dot" style="background:${t.color}"></span>
                          <span style="font-weight:600">${escHtml(t.name)}</span>
                        </div>
                      </td>
                      <td class="td-highlight td-mono">${t.wins}</td>
                      <td class="td-muted td-mono">${t.losses}</td>
                      <td class="td-mono">${pct}</td>
                      <td class="td-mono">${t.avg.ppg}</td>
                      <td class="td-mono">${t.avg.rpg}</td>
                      <td class="td-mono">${t.avg.apg}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Team Cards Grid -->
        <div class="team-stats-grid">
          ${teamData.map(t => renderTeamStatCard(t, { maxPpg, maxRpg, maxApg, maxSpg, maxBpg })).join('')}
        </div>
      `}
    </div>
  `;

  document.getElementById('page-team-stats').innerHTML = html;
}

function renderTeamStatCard(team, maxes) {
  const { avg } = team;
  const total = team.wins + team.losses;
  const winPct = total > 0 ? Math.round(team.wins / total * 100) : 0;

  const statBar = (label, value, max, color) => `
    <div class="stat-row">
      <div class="stat-label">${label}</div>
      <div class="stat-bar-wrap">
        <div class="stat-bar-fill" style="width:${Math.min(100, (parseFloat(value)/max)*100)}%;background:${color}"></div>
      </div>
      <div class="stat-value">${value}</div>
    </div>
  `;

  return `
    <div class="team-stat-card">
      <div class="team-stat-header">
        <div class="team-abbr-badge" style="background:${team.color};width:44px;height:44px;font-size:14px">${team.abbr}</div>
        <div style="flex:1;min-width:0">
          <div class="team-stat-name">${escHtml(team.name)}</div>
          <div class="team-stat-record">${team.wins}W – ${team.losses}L · ${winPct}%</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:22px;font-weight:800;color:var(--orange)">${avg.gp}</div>
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px">Games</div>
        </div>
      </div>
      <div class="team-stat-body">
        ${statBar('PPG', avg.ppg, maxes.maxPpg, team.color)}
        ${statBar('RPG', avg.rpg, maxes.maxRpg, team.color)}
        ${statBar('APG', avg.apg, maxes.maxApg, team.color)}
        ${statBar('SPG', avg.spg, maxes.maxSpg, team.color)}
        ${statBar('BPG', avg.bpg, maxes.maxBpg, team.color)}
      </div>
    </div>
  `;
}
