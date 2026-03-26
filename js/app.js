// ─── App Shell ────────────────────────────────────────────────────────────────

let currentPage = 'teams';

const pages = {
  teams:          { id: 'page-teams',        label: 'Teams',        render: renderTeamsPage },
  'player-stats': { id: 'page-player-stats', label: 'Player Stats',  render: renderPlayerStatsPage },
  'team-stats':   { id: 'page-team-stats',   label: 'Team Stats',    render: renderTeamStatsPage },
  schedule:       { id: 'page-schedule',     label: 'Schedule',      render: renderSchedulePage },
  scorekeeper:    { id: 'page-scorekeeper',  label: 'Scorekeeper',   render: renderScorekeeperPage },
};

function navigateTo(page) {
  if (!pages[page]) return;

  // Guard restricted pages
  if (page === 'scorekeeper' && !canScorekeep()) {
    showToast('Sign in as Scorekeeper or League Manager to access this page', 'error');
    return;
  }

  currentPage = page;

  // Show/hide pages
  Object.keys(pages).forEach(key => {
    const el = document.getElementById(pages[key].id);
    if (el) el.classList.toggle('active', key === page);
  });

  renderNavTabs();
  pages[page].render();
  window.scrollTo(0, 0);
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function renderNavTabs() {
  const tabContainer = document.querySelector('.nav-tabs');
  if (!tabContainer) return;

  const role = getCurrentRole();
  const visiblePages = ['teams', 'player-stats', 'team-stats', 'schedule'];
  if (canScorekeep()) visiblePages.push('scorekeeper');

  const pendingCount = isLeagueManager() ? getPendingItems().length : 0;

  tabContainer.innerHTML = visiblePages.map(key => {
    const label = key === 'teams' && pendingCount > 0
      ? `${pages[key].label} <span class="pending-badge">${pendingCount}</span>`
      : pages[key].label;
    return `
      <button class="nav-tab ${currentPage === key ? 'active' : ''}" data-page="${key}"
              onclick="navigateTo('${key}')">
        ${label}
      </button>
    `;
  }).join('');
}

function updateNavBadge() {
  const { teams, activeTeamId } = getState();
  const activeTeam = teams.find(t => t.id === activeTeamId);
  const badge = document.getElementById('nav-team-badge');
  if (badge) {
    if (activeTeam) {
      badge.innerHTML = `
        <span class="team-dot" style="background:${activeTeam.color}"></span>
        <span>${escHtml(activeTeam.name)}</span>
      `;
    } else {
      badge.innerHTML = `<span style="color:var(--text-muted)">No Team</span>`;
    }
  }
}

function updateNavAuth() {
  const role = getCurrentRole();
  const el = document.getElementById('nav-auth-btn');
  if (!el) return;

  const brandRole = document.getElementById('brand-role');
  if (brandRole) brandRole.textContent = getRoleLabel(role);

  if (role === 'viewer') {
    el.textContent = 'Sign In';
    el.className = 'btn btn-secondary btn-sm';
    el.onclick = () => openModal('modal-sign-in');
  } else {
    const label = role === 'league_manager' ? '🏆 League Manager' : '📋 Scorekeeper';
    el.innerHTML = `${label} <span style="color:var(--text-dim);font-weight:400;margin-left:4px">· Sign Out</span>`;
    el.className = 'btn btn-secondary btn-sm';
    el.onclick = () => {
      signOut();
      updateNavAuth();
      renderNavTabs();
      showToast('Signed out', 'info');
      if (currentPage === 'scorekeeper') navigateTo('teams');
      if (currentPage === 'teams') renderTeamsPage(); // re-render to hide manager controls
    };
  }
}

function updatePendingBadge() {
  renderNavTabs();
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(isoStr, short = false) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  if (short) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('open');
    setTimeout(() => {
      const input = el.querySelector('input:not([type="hidden"]):not([type="color"]), select');
      if (input) input.focus();
    }, 150);
  }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

// Close modals on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

// Close modals on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(el => el.classList.remove('open'));
  }
});

// ─── Toast Notifications ──────────────────────────────────────────────────────

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || ''}</span> ${escHtml(message)}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'opacity 0.3s, transform 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function init() {
  // Append sign-in modal once
  document.body.insertAdjacentHTML('beforeend', renderSignInModal());

  updateNavBadge();
  updateNavAuth();
  navigateTo('teams');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
