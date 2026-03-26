// ─── Auth (PIN-based role system) ─────────────────────────────────────────────
// Roles: viewer (default), scorekeeper, league_manager
// Stored in sessionStorage — resets when the tab/browser closes.

const AUTH_KEY = 'bball_auth_role';

const PINS = {
  league_manager: '1234',
  scorekeeper: '5678',
};

function getCurrentRole() {
  return sessionStorage.getItem(AUTH_KEY) || 'viewer';
}

function setRole(role) {
  sessionStorage.setItem(AUTH_KEY, role);
}

function signOut() {
  sessionStorage.removeItem(AUTH_KEY);
}

function canScorekeep() {
  const r = getCurrentRole();
  return r === 'scorekeeper' || r === 'league_manager';
}

function isLeagueManager() {
  return getCurrentRole() === 'league_manager';
}

function isViewer() {
  return getCurrentRole() === 'viewer';
}

function getRoleLabel(role) {
  if (role === 'league_manager') return 'League Manager';
  if (role === 'scorekeeper') return 'Scorekeeper';
  return 'Viewer';
}

// ─── Sign-in logic ────────────────────────────────────────────────────────────

function attemptSignIn(pin) {
  if (pin === PINS.league_manager) { setRole('league_manager'); return 'league_manager'; }
  if (pin === PINS.scorekeeper)    { setRole('scorekeeper');    return 'scorekeeper'; }
  return null;
}

// ─── Sign-in modal ────────────────────────────────────────────────────────────

function renderSignInModal() {
  return `
    <div class="modal-overlay" id="modal-sign-in">
      <div class="modal" style="max-width:380px">
        <div class="modal-header">
          <h3>Sign In</h3>
          <button class="modal-close" onclick="closeModal('modal-sign-in')">×</button>
        </div>
        <div class="modal-body">
          <p style="color:var(--text-muted);font-size:13px;margin-bottom:16px">
            Enter your PIN to access scorekeeper or league manager features.
          </p>
          <div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;margin-bottom:16px;font-size:13px;color:var(--text-muted)">
            <div style="margin-bottom:4px">🏆 League Manager PIN: <strong style="color:var(--text)">1234</strong></div>
            <div>📋 Scorekeeper PIN: <strong style="color:var(--text)">5678</strong></div>
          </div>
          <div class="form-group">
            <label class="form-label">PIN</label>
            <input class="form-control" id="auth-pin" type="password" placeholder="Enter PIN"
                   maxlength="10" onkeydown="if(event.key==='Enter') submitSignIn()">
          </div>
          <div id="auth-error" style="color:var(--red);font-size:13px;display:none;margin-top:8px">
            ✕ Incorrect PIN — please try again
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal('modal-sign-in')">Cancel</button>
          <button class="btn btn-primary" onclick="submitSignIn()">Sign In</button>
        </div>
      </div>
    </div>
  `;
}

function submitSignIn() {
  const pin = document.getElementById('auth-pin')?.value || '';
  const role = attemptSignIn(pin.trim());

  if (!role) {
    const err = document.getElementById('auth-error');
    if (err) err.style.display = 'block';
    const input = document.getElementById('auth-pin');
    if (input) input.value = '';
    return;
  }

  const err = document.getElementById('auth-error');
  if (err) err.style.display = 'none';
  closeModal('modal-sign-in');

  const label = getRoleLabel(role);
  showToast(`Signed in as ${label}`, 'success');

  updateNavAuth();
  renderNavTabs();

  // Re-render current page so role-gated content (e.g. approval queue) appears immediately
  if (typeof currentPage !== 'undefined' && typeof pages !== 'undefined' && pages[currentPage]) {
    pages[currentPage].render();
  }
}
