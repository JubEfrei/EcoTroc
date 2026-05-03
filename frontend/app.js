// EcoTroc - Application JavaScript minimaliste
const API_URL = '/api';
const DEFAULT_FETCH_OPTIONS = { credentials: 'same-origin' };
let currentPage = 1;
let currentCategory = '';

// État de l'utilisateur
let currentUser = null;

// Annonce sélectionnée pour l'échange
let selectedAnnouncement = null;

// Cache des annonces chargées (id → objet)
const announcementCache = {};

// Vérifier l'authentification au chargement
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadAnnouncements();
});

// Vérifier si l'utilisateur est connecté
async function checkAuth() {
  try {
    const response = await fetch(`${API_URL}/users/me`, DEFAULT_FETCH_OPTIONS);
    if (response.ok) {
      currentUser = await response.json();
      updateNavBar();
    }
  } catch (error) {
    console.log('Utilisateur non connecté');
  }
}

// Mettre à jour la barre de navigation
function updateNavBar() {
  const authNav = document.getElementById('nav-auth');
  const userNav = document.getElementById('nav-user');
  const getStartedBtn = document.querySelector('header .btn-primary');
  
  if (currentUser) {
    authNav.style.display = 'none';
    userNav.style.display = 'block';
    if (getStartedBtn) {
      getStartedBtn.textContent = 'Mettre une nouvelle annonce';
    }
  } else {
    authNav.style.display = 'block';
    userNav.style.display = 'none';
    if (getStartedBtn) {
      getStartedBtn.textContent = 'Commencer';
    }
  }
}

// Ouvrir la modal d'authentification
function openLoginModal(event) {
  if (event) event.preventDefault();
  document.getElementById('auth-modal').style.display = 'flex';
}

// Fermer la modal
function closeAuthModal() {
  document.getElementById('auth-modal').style.display = 'none';
}

// Gérer le bouton "Commencer" intelligemment
function handleGetStarted() {
  if (currentUser) {
    // Utilisateur connecté → rediriger vers création d'annonce
    window.location.href = '/dashboard.html?section=new-announcement';
  } else {
    // Utilisateur non connecté → ouvrir modal de connexion
    openLoginModal();
  }
}

// Changer les onglets auth
function switchAuthTab(tab) {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const tabs = document.querySelectorAll('.tab-button');

  if (tab === 'login') {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    tabs[0].classList.add('active');
    tabs[1].classList.remove('active');
  } else {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    tabs[0].classList.remove('active');
    tabs[1].classList.add('active');
  }
}

// Gérer la connexion
async function handleLogin(event) {
  event.preventDefault();
  const form = event.target;
  const email = form.querySelector('input[type="email"]').value;
  const password = form.querySelector('input[type="password"]').value;

  try {
    const response = await fetch(`${API_URL}/users/login`, {
      ...DEFAULT_FETCH_OPTIONS,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    const messageDiv = document.getElementById('auth-message');

    if (response.ok) {
      messageDiv.textContent = 'Connexion réussie!';
      messageDiv.className = 'message success';
      setTimeout(async () => {
        const meRes = await fetch(`${API_URL}/users/me`, DEFAULT_FETCH_OPTIONS);
        currentUser = meRes.ok ? await meRes.json() : { id: data.userId, email };
        updateNavBar();
        closeAuthModal();
        loadAnnouncements();
        form.reset();
      }, 500);
    } else {
      messageDiv.textContent = data.error || 'Erreur lors de la connexion';
      messageDiv.className = 'message error';
    }
  } catch (error) {
    console.error('Erreur:', error);
    document.getElementById('auth-message').textContent = 'Erreur réseau';
    document.getElementById('auth-message').className = 'message error';
  }
}

// Gérer l'inscription
async function handleRegister(event) {
  event.preventDefault();
  const form = event.target;
  const username = form.querySelector('input[type="text"]').value;
  const email = form.querySelector('input[type="email"]').value;
  const password = form.querySelector('input[type="password"]').value;

  try {
    const response = await fetch(`${API_URL}/users/register`, {
      ...DEFAULT_FETCH_OPTIONS,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password })
    });

    const data = await response.json();
    const messageDiv = document.getElementById('auth-message');

    if (response.ok) {
      messageDiv.textContent = 'Inscription réussie! Vous êtes connecté.';
      messageDiv.className = 'message success';
      setTimeout(() => {
        currentUser = { id: data.userId, email, username };
        updateNavBar();
        closeAuthModal();
        loadAnnouncements();
        form.reset();
      }, 500);
    } else {
      messageDiv.textContent = data.error || 'Erreur lors de l\'inscription';
      messageDiv.className = 'message error';
    }
  } catch (error) {
    console.error('Erreur:', error);
    document.getElementById('auth-message').textContent = 'Erreur réseau';
    document.getElementById('auth-message').className = 'message error';
  }
}

// Déconnexion
async function logout(event) {
  event.preventDefault();
  try {
    await fetch(`${API_URL}/users/logout`, { ...DEFAULT_FETCH_OPTIONS, method: 'POST' });
    currentUser = null;
    updateNavBar();
    loadAnnouncements();
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Charger les annonces
async function loadAnnouncements() {
  try {
    const url = new URL(`${API_URL}/announcements`, window.location.origin);
    url.searchParams.append('page', currentPage);
    if (currentCategory) {
      url.searchParams.append('category', currentCategory);
    }

    const response = await fetch(url, DEFAULT_FETCH_OPTIONS);
    if (!response.ok) {
      console.error('Erreur API annonces', response.status);
      const data = await response.json().catch(() => ({}));
      displayAnnouncements([]);
      return;
    }

    const data = await response.json();

    displayAnnouncements(data.announcements || []);
    displayPagination(data.pagination || { page: 1, pages: 0 });
  } catch (error) {
    console.error('Erreur lors du chargement:', error);
  }
}

// Afficher les annonces
function displayAnnouncements(announcements) {
  const list = document.getElementById('announcements-list');

  if (announcements.length === 0) {
    list.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Aucune annonce trouvée.</p>';
    return;
  }

  try {
    list.innerHTML = announcements.map(ann => {
      announcementCache[ann.id] = ann;

      const isOwn = currentUser && Number(currentUser.id) === Number(ann.user_id);
      const exchangeLabel = ann.exchange_type === 'troc'
        ? `Troc${ann.desired_exchange ? ' — recherche : ' + escapeHtml(String(ann.desired_exchange)) : ''}`
        : `${ann.points_value} point(s)`;

      const tradeBtn = !isOwn
        ? `<button class="btn btn-primary" style="margin-top:0.75rem; width:100%;"
             onclick="openTradeModal(${ann.id})">
             ${ann.exchange_type === 'troc' ? 'Proposer un échange' : `Obtenir (${ann.points_value} pts)`}
           </button>`
        : '';

      const desc = ann.description ? escapeHtml(String(ann.description).substring(0, 100)) : '';
      const imageUrl = typeof ann.image_url === 'string' && ann.image_url ? ann.image_url : null;
      const imgHtml = imageUrl
        ? `<img src="${imageUrl}" alt="${escapeHtml(String(ann.title))}" style="width:100%; height:200px; object-fit:cover; border-radius:0.25rem; margin-bottom:1rem;" onerror="this.style.display='none'">`
        : '';

      return `
      <div class="announcement-card">
        ${imgHtml}
        <h3>${escapeHtml(String(ann.title))}</h3>
        <div class="announcement-meta">
          <strong>${escapeHtml(String(ann.username || ''))}</strong>
          <span class="announcement-category">${escapeHtml(String(ann.category))}</span>
        </div>
        <p class="announcement-description">${desc}${desc.length >= 100 ? '…' : ''}</p>
        <div class="announcement-exchange">${exchangeLabel}</div>
        ${tradeBtn}
      </div>`;
    }).join('');
  } catch (err) {
    console.error('Erreur affichage annonces:', err);
    list.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: red;">Erreur lors de l\'affichage des annonces.</p>';
  }
}

// Afficher la pagination
function displayPagination(pagination) {
  const paginationDiv = document.getElementById('pagination');
  
  if (pagination.pages <= 1) {
    paginationDiv.innerHTML = '';
    return;
  }

  let html = '';
  
  if (currentPage > 1) {
    html += `<button onclick="changePage(${currentPage - 1})">← Précédent</button>`;
  }

  for (let i = 1; i <= pagination.pages; i++) {
    html += `<button class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
  }

  if (currentPage < pagination.pages) {
    html += `<button onclick="changePage(${currentPage + 1})">Suivant →</button>`;
  }

  paginationDiv.innerHTML = html;
}

// Changer de page
function changePage(page) {
  currentPage = page;
  loadAnnouncements();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Filtrer les annonces
function filterAnnouncements() {
  currentCategory = document.getElementById('category-filter').value;
  currentPage = 1;
  loadAnnouncements();
}

// Ouvrir la modal d'échange
function openTradeModal(id) {
  if (!currentUser) {
    openLoginModal();
    return;
  }
  const ann = announcementCache[id];
  if (!ann) return;
  selectedAnnouncement = ann;
  document.getElementById('trade-message').textContent = '';
  document.getElementById('trade-message').className = 'message';
  document.getElementById('trade-offer-input').value = '';

  document.getElementById('trade-modal-title').textContent = ann.title;

  if (ann.exchange_type === 'points') {
    document.getElementById('trade-modal-info').textContent =
      `Coût : ${ann.points_value} point(s). Vos points : ${currentUser.points !== undefined ? currentUser.points : '…'}`;
    document.getElementById('trade-offer-field').style.display = 'none';
    document.getElementById('trade-confirm-btn').textContent = `Obtenir pour ${ann.points_value} pt(s)`;
  } else {
    document.getElementById('trade-modal-info').textContent = ann.desired_exchange
      ? `Le propriétaire recherche : ${ann.desired_exchange}`
      : 'Le propriétaire recherche un échange.';
    document.getElementById('trade-offer-field').style.display = 'block';
    document.getElementById('trade-confirm-btn').textContent = 'Envoyer ma proposition';
  }

  document.getElementById('trade-modal').style.display = 'flex';
}

function closeTradeModal() {
  document.getElementById('trade-modal').style.display = 'none';
  selectedAnnouncement = null;
}

async function confirmTrade() {
  if (!selectedAnnouncement) return;

  const msgDiv = document.getElementById('trade-message');
  const body = { announcement_id: selectedAnnouncement.id };

  if (selectedAnnouncement.exchange_type === 'troc') {
    const offerItem = document.getElementById('trade-offer-input').value.trim();
    if (!offerItem) {
      msgDiv.textContent = 'Veuillez décrire ce que vous proposez.';
      msgDiv.className = 'message error';
      return;
    }
    body.offer_item = offerItem;
  }

  try {
    const response = await fetch(`${API_URL}/exchanges`, {
      ...DEFAULT_FETCH_OPTIONS,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (response.ok) {
      msgDiv.textContent = data.message;
      msgDiv.className = 'message success';
      if (selectedAnnouncement.exchange_type === 'points' && currentUser) {
        currentUser.points = (Number(currentUser.points) || 0) - Number(selectedAnnouncement.points_value);
      }
      setTimeout(() => { closeTradeModal(); loadAnnouncements(); }, 1500);
    } else {
      msgDiv.textContent = data.error || "Erreur lors de l'échange";
      msgDiv.className = 'message error';
    }
  } catch (err) {
    msgDiv.textContent = 'Erreur réseau';
    msgDiv.className = 'message error';
  }
}

// Fonction pour échapper les caractères HTML (sécurité)
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
