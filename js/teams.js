// ─── Team Manager Page ────────────────────────────────────────────────────────

const TEAM_COLORS = [
  '#1565C0', // deep blue
  '#00B0FF', // sky blue
  '#00C853', // bright green
  '#76FF03', // lime green
  '#FF1744', // bright red
  '#FF6D00', // deep orange
  '#FFAB40', // amber
  '#FFD600', // yellow
  '#AA00FF', // vivid purple
  '#7C4DFF', // violet
];

function renderTeamsPage() {
  const { teams, players, statLines, activeTeamId } = getState();
  const activeTeam = teams.find(t => t.id === activeTeamId) || teams[0];
  const pending = getPendingItems();

  let html = `
    <div class="container">
      <div class="page-header">
        <h1>Team Manager</h1>
        <p>Build and manage your teams in the league</p>
      </div>

      ${isLeagueManager() && pending.length > 0 ? renderPendingApprovalSection(pending, teams) : ''}

      <!-- Team Selector -->
      <div class="team-selector">
        ${teams.map(t => `
          <button class="team-selector-card ${t.id === activeTeam?.id ? 'active' : ''}"
                  onclick="selectTeam('${t.id}')">
            <div class="team-color-bar" style="background:${t.color}"></div>
            <div>
              <div style="font-size:14px;font-weight:700;color:#fff">${t.abbr}</div>
              <div style="font-size:12px;color:var(--text-muted)">${t.wins}W - ${t.losses}L</div>
            </div>
          </button>
        `).join('')}
        <button class="btn btn-primary" onclick="openNewTeamModal()">
          + New Team
        </button>
      </div>

      ${activeTeam ? renderTeamDetail(activeTeam, players, statLines) : `
        <div class="empty-state">
          <div class="empty-icon">🏀</div>
          <h3>No teams yet</h3>
          <p>Create your first team to get started</p>
          <button class="btn btn-primary btn-lg" onclick="openNewTeamModal()">Create Team</button>
        </div>
      `}
    </div>

    ${renderNewTeamModal()}
    ${renderAddPlayerModal()}
    ${activeTeam ? renderEditTeamModal(activeTeam) : ''}
  `;

  document.getElementById('page-teams').innerHTML = html;
}

// ─── Pending Approval Section (League Manager only) ───────────────────────────

function renderPendingApprovalSection(pending, teams) {
  return `
    <div class="card" style="margin-bottom:24px;border-color:var(--orange)">
      <div class="card-header" style="background:var(--orange-glow)">
        <h2 style="color:var(--orange)">⏳ Pending Approvals <span style="font-weight:400;font-size:13px;color:var(--text-muted)">(${pending.length})</span></h2>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Name</th>
              <th>Details</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${pending.map(item => {
              const existingTeam = item.type === 'player' ? teams.find(t => t.id === item.payload.teamId) : null;
              const dateStr = new Date(item.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
              const bundledPlayers = item.type === 'team' && item.payload.players?.length > 0 ? item.payload.players : [];
              const emailHtml = item.payload.email
                ? `<div style="font-size:12px;margin-top:3px"><a href="mailto:${escHtml(item.payload.email)}" style="color:var(--orange)">${escHtml(item.payload.email)}</a></div>`
                : '';
              const bundledHtml = bundledPlayers.length > 0
                ? `<div style="margin-top:6px;padding-top:6px;border-top:1px solid var(--border)">
                     <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Roster (${bundledPlayers.length})</div>
                     ${bundledPlayers.map(p => `<div style="font-size:12px;color:var(--text-dim)">#${escHtml(String(p.number))} ${escHtml(p.name)} · ${escHtml(p.position)}</div>`).join('')}
                   </div>`
                : '';
              return `
                <tr>
                  <td>
                    <span class="badge ${item.type === 'team' ? 'badge-scheduled' : 'badge-pos'}">
                      ${item.type === 'team' ? 'Team' : 'Player'}
                    </span>
                  </td>
                  <td style="font-weight:600">${escHtml(item.payload.name)}</td>
                  <td class="td-muted">
                    ${item.type === 'team'
                      ? `<div>${escHtml(item.payload.abbr)} · <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${item.payload.color};vertical-align:middle"></span></div>${emailHtml}${bundledHtml}`
                      : `<div>#${item.payload.number} ${item.payload.position} · ${escHtml(existingTeam?.name || 'Unknown Team')}</div>${emailHtml}`
                    }
                  </td>
                  <td class="td-muted" style="font-size:12px">${dateStr}</td>
                  <td>
                    <div style="display:flex;gap:6px">
                      <button class="btn btn-primary btn-sm" onclick="approvePending('${item.id}')">✓ Approve</button>
                      <button class="btn btn-danger btn-sm" onclick="rejectPending('${item.id}')">✕ Reject</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderTeamDetail(team, allPlayers, statLines) {
  const roster = allPlayers.filter(p => p.teamId === team.id);

  return `
    <div class="card" style="margin-bottom:24px">
      <div class="team-info-header">
        <div class="team-abbr-badge" style="background:${team.color}">${team.abbr}</div>
        <div style="flex:1">
          <div class="team-info-name">${team.name}</div>
          <div class="team-info-record">${team.wins}W – ${team.losses}L · ${roster.length} Players</div>
        </div>
        <div style="display:flex;gap:8px">
          ${isLeagueManager() ? `<button class="btn btn-secondary btn-sm" onclick="openEditTeamModal('${team.id}')">Edit Team</button>` : ''}
          ${isLeagueManager() ? `<button class="btn btn-danger btn-sm" onclick="confirmDeleteTeam('${team.id}')">Delete</button>` : ''}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2>Roster <span class="text-muted" style="font-weight:400;font-size:13px">(${roster.length} players)</span></h2>
        <button class="btn btn-primary btn-sm" onclick="openAddPlayerModal('${team.id}')">+ Add Player</button>
      </div>
      ${roster.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">👤</div>
          <h3>No players yet</h3>
          <p>Add players to build your roster</p>
          <button class="btn btn-primary" onclick="openAddPlayerModal('${team.id}')">Add First Player</button>
        </div>
      ` : `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Position</th>
                <th>GP</th>
                <th>PPG</th>
                <th>RPG</th>
                <th>APG</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${roster.map(p => {
                const avg = getPlayerAverages(p.id);
                return `
                  <tr>
                    <td class="td-muted td-mono">${p.number}</td>
                    <td style="font-weight:600">${escHtml(p.name)}</td>
                    <td><span class="badge badge-pos">${p.position}</span></td>
                    <td class="td-muted">${avg.gp}</td>
                    <td class="td-highlight">${avg.ppg}</td>
                    <td class="td-mono">${avg.rpg}</td>
                    <td class="td-mono">${avg.apg}</td>
                    <td>
                      ${isLeagueManager() ? `<button class="btn btn-ghost btn-sm" onclick="confirmRemovePlayer('${p.id}','${escHtml(p.name)}')" title="Remove player">✕</button>` : ''}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;
}

function renderNewTeamModal() {
  const viewerNote = !isLeagueManager()
    ? `<div style="background:var(--orange-glow);border:1px solid var(--orange);border-radius:var(--radius-sm);padding:10px 12px;font-size:13px;color:var(--text-muted);margin-bottom:16px">
         📋 Your request will be submitted for <strong style="color:var(--orange)">League Manager approval</strong> before going live.
       </div>`
    : '';

  const posOptions = POSITIONS.map(p => `<option value="${p}">${p}</option>`).join('');

  return `
    <div class="modal-overlay" id="modal-new-team">
      <div class="modal" style="max-width:580px">
        <div class="modal-header">
          <h3>${isLeagueManager() ? 'Create New Team' : 'Request New Team'}</h3>
          <button class="modal-close" onclick="closeModal('modal-new-team')">×</button>
        </div>
        <div class="modal-body">
          ${viewerNote}

          <!-- Team Details -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Team Name</label>
              <input class="form-control" id="nt-name" placeholder="e.g. Chicago Bulls" maxlength="40">
            </div>
            <div class="form-group">
              <label class="form-label">Abbreviation</label>
              <input class="form-control" id="nt-abbr" placeholder="CHI" maxlength="3" style="text-transform:uppercase">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Contact Email</label>
            <input class="form-control" id="nt-email" type="email" placeholder="your@email.com" maxlength="100">
          </div>
          <div class="form-group">
            <label class="form-label">Team Color</label>
            <div class="color-options" id="nt-color-options">
              ${TEAM_COLORS.map((c, i) => `
                <div class="color-swatch ${i === 0 ? 'selected' : ''}" data-color="${c}"
                     style="background:${c}" onclick="selectColor(this,'nt-color-options')"></div>
              `).join('')}
            </div>
            <input type="hidden" id="nt-color" value="${TEAM_COLORS[0]}">
          </div>

          <!-- Divider -->
          <div style="border-top:1px solid var(--border);margin:20px 0 16px"></div>

          <!-- Players -->
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <div style="font-size:13px;font-weight:700;color:var(--text)">Players <span id="nt-player-count" style="color:var(--text-muted);font-weight:400">(0)</span></div>
            <button class="btn btn-secondary btn-sm" type="button" onclick="addNewTeamPlayerRow()">+ Add Player</button>
          </div>

          <div id="nt-players-list" style="display:flex;flex-direction:column;gap:8px">
            <!-- Player rows added dynamically -->
          </div>

          <div id="nt-players-empty" style="text-align:center;padding:16px;color:var(--text-dim);font-size:13px;border:1px dashed var(--border);border-radius:var(--radius-sm)">
            No players added yet — click "+ Add Player" to build your roster
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal('modal-new-team')">Cancel</button>
          <button class="btn btn-primary" onclick="submitNewTeam()">
            ${isLeagueManager() ? 'Create Team' : 'Submit for Approval'}
          </button>
        </div>
      </div>
    </div>
  `;
}

// ─── Dynamic player rows for New Team modal ───────────────────────────────────

let _ntPlayerRowId = 0;

function addNewTeamPlayerRow() {
  const id = ++_ntPlayerRowId;
  const list = document.getElementById('nt-players-list');
  const empty = document.getElementById('nt-players-empty');
  if (!list) return;

  if (empty) empty.style.display = 'none';

  const posOptions = POSITIONS.map(p => `<option value="${p}">${p}</option>`).join('');

  const row = document.createElement('div');
  row.id = `nt-player-row-${id}`;
  row.style.cssText = 'display:grid;grid-template-columns:1fr 64px 80px auto;gap:8px;align-items:center';
  row.innerHTML = `
    <input class="form-control" placeholder="Player name" maxlength="40"
           data-nt-field="name" data-nt-row="${id}" style="font-size:13px;padding:7px 10px">
    <input class="form-control" type="number" placeholder="#" min="0" max="99"
           data-nt-field="number" data-nt-row="${id}" style="font-size:13px;padding:7px 8px;text-align:center">
    <select class="form-control" data-nt-field="position" data-nt-row="${id}" style="font-size:13px;padding:7px 8px">
      ${posOptions}
    </select>
    <button type="button" class="btn btn-ghost btn-sm" onclick="removeNewTeamPlayerRow(${id})" title="Remove" style="padding:7px 10px;color:var(--text-dim)">✕</button>
  `;
  list.appendChild(row);
  updateNewTeamPlayerCount();
  row.querySelector('input[data-nt-field="name"]').focus();
}

function removeNewTeamPlayerRow(id) {
  const row = document.getElementById(`nt-player-row-${id}`);
  if (row) row.remove();
  updateNewTeamPlayerCount();
  const list = document.getElementById('nt-players-list');
  const empty = document.getElementById('nt-players-empty');
  if (empty && list && list.children.length === 0) empty.style.display = '';
}

function updateNewTeamPlayerCount() {
  const list = document.getElementById('nt-players-list');
  const counter = document.getElementById('nt-player-count');
  if (list && counter) counter.textContent = `(${list.children.length})`;
}

function collectNewTeamPlayers() {
  const rows = document.querySelectorAll('#nt-players-list > div[id^="nt-player-row-"]');
  const players = [];
  for (const row of rows) {
    const name   = row.querySelector('[data-nt-field="name"]')?.value.trim();
    const number = row.querySelector('[data-nt-field="number"]')?.value;
    const position = row.querySelector('[data-nt-field="position"]')?.value;
    if (name) players.push({ name, number: number || '0', position });
  }
  return players;
}

function renderEditTeamModal(team) {
  return `
    <div class="modal-overlay" id="modal-edit-team">
      <div class="modal">
        <div class="modal-header">
          <h3>Edit Team</h3>
          <button class="modal-close" onclick="closeModal('modal-edit-team')">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Team Name</label>
            <input class="form-control" id="et-name" value="${escHtml(team.name)}" maxlength="40">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Abbreviation</label>
              <input class="form-control" id="et-abbr" value="${escHtml(team.abbr)}" maxlength="3" style="text-transform:uppercase">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Team Color</label>
            <div class="color-options" id="et-color-options">
              ${TEAM_COLORS.map(c => `
                <div class="color-swatch ${c === team.color ? 'selected' : ''}" data-color="${c}"
                     style="background:${c}" onclick="selectColor(this,'et-color-options')"></div>
              `).join('')}
            </div>
            <input type="hidden" id="et-color" value="${team.color}">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal('modal-edit-team')">Cancel</button>
          <button class="btn btn-primary" onclick="submitEditTeam('${team.id}')">Save Changes</button>
        </div>
      </div>
    </div>
  `;
}

function renderAddPlayerModal() {
  const { teams } = getState();
  const viewerNote = !isLeagueManager()
    ? `<div style="background:var(--orange-glow);border:1px solid var(--orange);border-radius:var(--radius-sm);padding:10px 12px;font-size:13px;color:var(--text-muted);margin-bottom:16px">
         📋 Your request will be submitted for <strong style="color:var(--orange)">League Manager approval</strong> before going live.
       </div>`
    : '';

  return `
    <div class="modal-overlay" id="modal-add-player">
      <div class="modal">
        <div class="modal-header">
          <h3>${isLeagueManager() ? 'Add Player' : 'Request to Add Player'}</h3>
          <button class="modal-close" onclick="closeModal('modal-add-player')">×</button>
        </div>
        <div class="modal-body">
          ${viewerNote}
          <div class="form-group">
            <label class="form-label">Player Name</label>
            <input class="form-control" id="ap-name" placeholder="Full name" maxlength="40">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Jersey Number</label>
              <input class="form-control" id="ap-number" type="number" placeholder="23" min="0" max="99">
            </div>
            <div class="form-group">
              <label class="form-label">Position</label>
              <select class="form-control" id="ap-position">
                ${POSITIONS.map(p => `<option value="${p}">${p}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Contact Email</label>
            <input class="form-control" id="ap-email" type="email" placeholder="your@email.com" maxlength="100">
          </div>
          <input type="hidden" id="ap-team-id">
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal('modal-add-player')">Cancel</button>
          <button class="btn btn-primary" onclick="submitAddPlayer()">
            ${isLeagueManager() ? 'Add Player' : 'Submit for Approval'}
          </button>
        </div>
      </div>
    </div>
  `;
}

// ─── Team Actions ──────────────────────────────────────────────────────────────

function selectTeam(id) {
  setActiveTeam(id);
  renderTeamsPage();
}

function openNewTeamModal() {
  openModal('modal-new-team');
}

function openEditTeamModal(id) {
  openModal('modal-edit-team');
}

function openAddPlayerModal(teamId) {
  document.getElementById('ap-team-id').value = teamId;
  document.getElementById('ap-name').value = '';
  document.getElementById('ap-number').value = '';
  document.getElementById('ap-email').value = '';
  openModal('modal-add-player');
}

function selectColor(el, groupId) {
  document.querySelectorAll(`#${groupId} .color-swatch`).forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  const colorInput = el.closest('.form-group').querySelector('input[type="hidden"]');
  if (colorInput) colorInput.value = el.dataset.color;
}

function submitNewTeam() {
  const name  = document.getElementById('nt-name').value.trim();
  const abbr  = document.getElementById('nt-abbr').value.trim();
  const color = document.getElementById('nt-color').value;
  const email = document.getElementById('nt-email').value.trim();

  if (!name) return showToast('Team name is required', 'error');
  if (!abbr) return showToast('Abbreviation is required', 'error');

  const { teams, players: allPlayers } = getState();
  const abbrUpper = abbr.toUpperCase();
  const abbrConflict = teams.find(t => t.abbr.toUpperCase() === abbrUpper);
  if (abbrConflict) return showToast(`Abbreviation "${abbrUpper}" is already used by ${abbrConflict.name}`, 'error');

  const players = collectNewTeamPlayers();

  // Check for duplicate jersey numbers within the submitted roster
  const nums = players.map(p => String(p.number));
  if (nums.length !== new Set(nums).size) return showToast('Two players share the same jersey number', 'error');

  if (!isLeagueManager()) {
    // Bundle players into the team request so the manager sees them as one grouped item
    submitPendingItem('team', { name, abbr, color, email, players });
    closeModal('modal-new-team');
    const msg = players.length > 0
      ? `Team + ${players.length} player${players.length > 1 ? 's' : ''} submitted for approval!`
      : 'Team request submitted for approval!';
    showToast(msg, 'info');
    return;
  }

  const team = addTeam({ name, abbr, color });
  players.forEach(p => addPlayer({ ...p, teamId: team.id }));

  closeModal('modal-new-team');
  const msg = players.length > 0
    ? `${name} created with ${players.length} player${players.length > 1 ? 's' : ''}!`
    : `${name} created!`;
  showToast(msg, 'success');
  renderTeamsPage();

}

function submitEditTeam(id) {
  const name = document.getElementById('et-name').value.trim();
  const abbr = document.getElementById('et-abbr').value.trim();
  const color = document.getElementById('et-color').value;

  if (!name) return showToast('Team name is required', 'error');
  if (!abbr) return showToast('Abbreviation is required', 'error');

  const abbrUpper = abbr.toUpperCase();
  const abbrConflict = getState().teams.find(t => t.id !== id && t.abbr.toUpperCase() === abbrUpper);
  if (abbrConflict) return showToast(`Abbreviation "${abbrUpper}" is already used by ${abbrConflict.name}`, 'error');

  updateTeam(id, { name, abbr, color });
  closeModal('modal-edit-team');
  showToast('Team updated!', 'success');
  renderTeamsPage();

}

function confirmDeleteTeam(id) {
  const team = getState().teams.find(t => t.id === id);
  if (!team) return;
  if (!confirm(`Delete ${team.name}? This will also remove all their players and stats.`)) return;
  deleteTeam(id);
  showToast(`${team.name} deleted`, 'info');
  renderTeamsPage();

}

function submitAddPlayer() {
  const name = document.getElementById('ap-name').value.trim();
  const number = document.getElementById('ap-number').value;
  const position = document.getElementById('ap-position').value;
  const teamId = document.getElementById('ap-team-id').value;
  const email = document.getElementById('ap-email').value.trim();

  if (!name) return showToast('Player name is required', 'error');
  if (number === '' || isNaN(number)) return showToast('Valid jersey number required', 'error');

  const teamRoster = getState().players.filter(p => p.teamId === teamId);
  if (teamRoster.some(p => String(p.number) === String(number))) {
    return showToast(`Jersey #${number} is already taken on this team`, 'error');
  }

  if (!isLeagueManager()) {
    submitPendingItem('player', { name, number, position, teamId, email });
    closeModal('modal-add-player');
    showToast('Player request submitted for approval!', 'info');
    return;
  }

  addPlayer({ name, number, position, teamId });
  closeModal('modal-add-player');
  showToast(`${name} added to roster!`, 'success');
  renderTeamsPage();
}

function confirmRemovePlayer(id, name) {
  if (!confirm(`Remove ${name} from the roster?`)) return;
  removePlayer(id);
  showToast(`${name} removed`, 'info');
  renderTeamsPage();
}

// ─── Approval Actions (League Manager) ───────────────────────────────────────

function approvePending(id) {
  approvePendingItem(id);
  showToast('Approved and added to the league!', 'success');
  renderTeamsPage();

  updatePendingBadge();
}

function rejectPending(id) {
  rejectPendingItem(id);
  showToast('Request rejected', 'info');
  renderTeamsPage();
  updatePendingBadge();
}
