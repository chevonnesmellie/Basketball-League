// ─── Schedule Page ────────────────────────────────────────────────────────────

let scheduleTab = 'upcoming'; // 'upcoming' | 'results'

function renderSchedulePage() {
  const { teams, games } = getState();

  const upcoming = games
    .filter(g => g.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

  const results = games
    .filter(g => g.status === 'final')
    .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));

  const html = `
    <div class="container">
      <div class="page-header" style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap">
        <div>
          <h1>Schedule</h1>
          <p>Upcoming games and past results</p>
        </div>
        <button class="btn btn-primary" onclick="openAddGameModal()">+ Add Game</button>
      </div>

      <div class="schedule-tabs">
        <button class="sched-tab ${scheduleTab === 'upcoming' ? 'active' : ''}" onclick="switchSchedTab('upcoming')">
          Upcoming <span style="color:var(--text-dim)">(${upcoming.length})</span>
        </button>
        <button class="sched-tab ${scheduleTab === 'results' ? 'active' : ''}" onclick="switchSchedTab('results')">
          Results <span style="color:var(--text-dim)">(${results.length})</span>
        </button>
      </div>

      ${scheduleTab === 'upcoming' ? renderUpcoming(upcoming, teams) : renderResults(results, teams)}
    </div>

    ${renderAddGameModal(teams)}
  `;

  document.getElementById('page-schedule').innerHTML = html;
}

function switchSchedTab(tab) {
  scheduleTab = tab;
  renderSchedulePage();
}

function renderUpcoming(games, teams) {
  if (games.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-icon">📅</div>
        <h3>No upcoming games</h3>
        <p>Add games to the schedule</p>
        <button class="btn btn-primary" onclick="openAddGameModal()">Add Game</button>
      </div>
    `;
  }

  return `
    <div class="game-list">
      ${games.map(g => {
        const home = teams.find(t => t.id === g.homeTeamId);
        const away = teams.find(t => t.id === g.awayTeamId);
        const d = new Date(g.scheduledAt);
        const day = d.getDate();
        const month = d.toLocaleDateString('en-US', { month: 'short' });
        const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

        return `
          <div class="game-card">
            <div class="game-date">
              <div class="day">${day}</div>
              <div class="month">${month}</div>
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
              <div class="game-meta">${time} · ${escHtml(g.location)}</div>
            </div>
            <div class="game-actions">
              <span class="badge badge-scheduled">Scheduled</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderResults(games, teams) {
  if (games.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-icon">🏆</div>
        <h3>No results yet</h3>
        <p>Record game results from the Upcoming tab</p>
      </div>
    `;
  }

  return `
    <div class="game-list">
      ${games.map(g => {
        const home = teams.find(t => t.id === g.homeTeamId);
        const away = teams.find(t => t.id === g.awayTeamId);
        const homeWon = g.homeScore > g.awayScore;
        const d = new Date(g.scheduledAt);
        const day = d.getDate();
        const month = d.toLocaleDateString('en-US', { month: 'short' });
        const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        return `
          <div class="game-card">
            <div class="game-date">
              <div class="day">${day}</div>
              <div class="month">${month}</div>
            </div>
            <div class="game-matchup">
              <div class="game-teams">
                <div class="game-team">
                  <span class="team-dot" style="background:${home?.color || '#888'}"></span>
                  <span style="${homeWon ? 'color:var(--text)' : 'color:var(--text-muted)'}">${escHtml(home?.abbr || '?')}</span>
                </div>
                <div class="game-score">
                  <span class="${homeWon ? 'winner' : 'loser'}">${g.homeScore}</span>
                  <span class="sep">–</span>
                  <span class="${!homeWon ? 'winner' : 'loser'}">${g.awayScore}</span>
                </div>
                <div class="game-team">
                  <span class="team-dot" style="background:${away?.color || '#888'}"></span>
                  <span style="${!homeWon ? 'color:var(--text)' : 'color:var(--text-muted)'}">${escHtml(away?.abbr || '?')}</span>
                </div>
              </div>
              <div class="game-meta">${date} · ${escHtml(g.location)}</div>
            </div>
            <div class="game-actions">
              <span class="badge badge-win">Final</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ─── Add Game Modal ────────────────────────────────────────────────────────────

function renderAddGameModal(teams) {
  const today = new Date().toISOString().slice(0, 16);
  return `
    <div class="modal-overlay" id="modal-add-game">
      <div class="modal">
        <div class="modal-header">
          <h3>Add Game</h3>
          <button class="modal-close" onclick="closeModal('modal-add-game')">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Home Team</label>
              <select class="form-control" id="ag-home">
                ${teams.map(t => `<option value="${t.id}">${escHtml(t.name)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Away Team</label>
              <select class="form-control" id="ag-away">
                ${teams.map((t, i) => `<option value="${t.id}" ${i === 1 ? 'selected' : ''}>${escHtml(t.name)}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Date & Time</label>
            <input class="form-control" type="datetime-local" id="ag-date" value="${today}">
          </div>
          <div class="form-group">
            <label class="form-label">Location / Arena</label>
            <input class="form-control" id="ag-location" placeholder="e.g. United Center">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal('modal-add-game')">Cancel</button>
          <button class="btn btn-primary" onclick="submitAddGame()">Add Game</button>
        </div>
      </div>
    </div>
  `;
}

function openAddGameModal() {
  openModal('modal-add-game');
}

function submitAddGame() {
  const homeTeamId = document.getElementById('ag-home').value;
  const awayTeamId = document.getElementById('ag-away').value;
  const scheduledAt = document.getElementById('ag-date').value;
  const location = document.getElementById('ag-location').value.trim();

  if (homeTeamId === awayTeamId) return showToast('Home and away teams must be different', 'error');
  if (!scheduledAt) return showToast('Date and time required', 'error');
  if (!location) return showToast('Location required', 'error');

  addGame({ homeTeamId, awayTeamId, scheduledAt, location });
  closeModal('modal-add-game');
  showToast('Game added to schedule!', 'success');
  renderSchedulePage();
}

