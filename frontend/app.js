// EcoTroc - Application JavaScript minimaliste
const API_URL = '/api';
let currentPage = 1;
let currentCategory = '';

// État de l'utilisateur
let currentUser = null;

// Vérifier l'authentification au chargement
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadAnnouncements();
});

// Vérifier si l'utilisateur est connecté
async function checkAuth() {
  try {
    const response = await fetch(`${API_URL}/users/me`);
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    const messageDiv = document.getElementById('auth-message');

    if (response.ok) {
      messageDiv.textContent = 'Connexion réussie!';
      messageDiv.className = 'message success';
      setTimeout(() => {
        currentUser = { id: data.userId, email };
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
    await fetch(`${API_URL}/users/logout`, { method: 'POST' });
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

    const response = await fetch(url);
    const data = await response.json();

    displayAnnouncements(data.announcements);
    displayPagination(data.pagination);
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

  list.innerHTML = announcements.map(ann => `
    <div class="announcement-card">
      ${ann.image_url ? `<img src="${ann.image_url}" alt="${escapeHtml(ann.title)}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 0.25rem; margin-bottom: 1rem;">` : ''}
      <h3>${escapeHtml(ann.title)}</h3>
      <div class="announcement-meta">
        <strong>${escapeHtml(ann.username)}</strong>
        <span class="announcement-category">${escapeHtml(ann.category)}</span>
      </div>
      <p class="announcement-description">${escapeHtml(ann.description.substring(0, 100))}...</p>
      <div class="announcement-exchange">
        ${ann.exchange_type === 'troc' ? 'Échange' : 'Points: ' + ann.points_value}
      </div>
      ${ann.desired_exchange ? `<p><small>Recherche: ${escapeHtml(ann.desired_exchange)}</small></p>` : ''}
    </div>
  `).join('');
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
