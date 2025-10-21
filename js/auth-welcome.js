
const AuthSystem = {
  config: {
    storageKeys: {
      user: 'synk_user',
      hideWelcome: 'synk_hide_welcome'
    }
  },

  currentUser: null,

  init() {
    this.loadUser();
    this.setupAuthButtons();
    this.setupModalEvents();
    this.setupFormEvents();
    this.checkWelcomeModal();
  },

  loadUser() {
    const stored = localStorage.getItem(this.config.storageKeys.user);
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
        this.updateUI();
      } catch (e) {
        console.error('Error al cargar usuario:', e);
        localStorage.removeItem(this.config.storageKeys.user);
      }
    }
  },

  saveUser(user) {
    this.currentUser = user;
    localStorage.setItem(this.config.storageKeys.user, JSON.stringify(user));
    this.updateUI();
  },

  logout() {
    this.currentUser = null;
    localStorage.removeItem(this.config.storageKeys.user);
    this.updateUI();
    this.showMessage('Has cerrado sesión correctamente', 'success');
  },

  updateUI() {
    const nav = document.querySelector('.nav');
    if (!nav) return;

    const existingAuth = nav.querySelector('.auth-buttons');
    if (existingAuth) existingAuth.remove();

    const authButtons = document.createElement('div');
    authButtons.className = 'auth-buttons';

    if (this.currentUser) {
      authButtons.innerHTML = `
        <span class="user-name">👤 ${this.currentUser.name}</span>
        <button class="btn-logout">Cerrar Sesión</button>
      `;
      
      const logoutBtn = authButtons.querySelector('.btn-logout');
      logoutBtn.addEventListener('click', () => this.logout());
    } else {
      authButtons.innerHTML = `
        <button class="btn-login">Iniciar Sesión</button>
        <button class="btn-register">Registrarse</button>
      `;
      
      const loginBtn = authButtons.querySelector('.btn-login');
      const registerBtn = authButtons.querySelector('.btn-register');
      
      loginBtn.addEventListener('click', () => this.openAuthModal('login'));
      registerBtn.addEventListener('click', () => this.openAuthModal('register'));
    }

    nav.appendChild(authButtons);
  },

  setupAuthButtons() {
    this.updateUI();
  },

  openAuthModal(type = 'login') {
    const modal = document.getElementById('modal-auth');
    if (!modal) return;

    this.switchAuthForm(type);
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    const form = type === 'login' ? document.getElementById('form-login') : document.getElementById('form-register');
    const firstInput = form?.querySelector('input');
    if (firstInput) setTimeout(() => firstInput.focus(), 100);
  },

  closeAuthModal() {
    const modal = document.getElementById('modal-auth');
    if (!modal) return;

    modal.classList.remove('active');
    document.body.style.overflow = '';
    
    this.clearMessages();
  },

  switchAuthForm(type) {
    const loginForm = document.getElementById('form-login');
    const registerForm = document.getElementById('form-register');
    
    if (type === 'login') {
      loginForm?.classList.add('active');
      registerForm?.classList.remove('active');
    } else {
      registerForm?.classList.add('active');
      loginForm?.classList.remove('active');
    }
  },

  setupModalEvents() {
    const modal = document.getElementById('modal-auth');
    if (!modal) return;

    const closeBtn = modal.querySelector('.modal-auth-close');
    closeBtn?.addEventListener('click', () => this.closeAuthModal());

    const overlay = modal.querySelector('.modal-auth-overlay');
    overlay?.addEventListener('click', () => this.closeAuthModal());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        this.closeAuthModal();
      }
    });

    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');
    
    showRegister?.addEventListener('click', (e) => {
      e.preventDefault();
      this.switchAuthForm('register');
      this.clearMessages();
    });
    
    showLogin?.addEventListener('click', (e) => {
      e.preventDefault();
      this.switchAuthForm('login');
      this.clearMessages();
    });
  },


  setupFormEvents() {

    const loginForm = document.getElementById('login-form');
    loginForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin(new FormData(loginForm));
    });

    const registerForm = document.getElementById('register-form');
    registerForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleRegister(new FormData(registerForm));
    });
  },

  handleLogin(formData) {
    const email = formData.get('email')?.trim();
    const password = formData.get('password');

    if (!email || !password) {
      this.showMessage('Por favor completá todos los campos', 'error', 'login-msg');
      return;
    }

    if (!this.validateEmail(email)) {
      this.showMessage('El email no es válido', 'error', 'login-msg');
      return;
    }

    this.showMessage('Iniciando sesión...', 'info', 'login-msg');

    setTimeout(() => {
      const users = this.getAllUsers();
      const user = users.find(u => u.email === email);

      if (user && user.password === password) {
        this.saveUser({ name: user.name, email: user.email });
        this.showMessage('¡Bienvenido de nuevo!', 'success', 'login-msg');
        
        setTimeout(() => {
          this.closeAuthModal();
          document.getElementById('login-form')?.reset();
        }, 1000);
      } else {
        this.showMessage('Email o contraseña incorrectos', 'error', 'login-msg');
      }
    }, 500);
  },

  handleRegister(formData) {
    const name = formData.get('name')?.trim();
    const email = formData.get('email')?.trim();
    const password = formData.get('password');
    const password2 = formData.get('password2');

    if (!name || !email || !password || !password2) {
      this.showMessage('Por favor completá todos los campos', 'error', 'register-msg');
      return;
    }

    if (!this.validateEmail(email)) {
      this.showMessage('El email no es válido', 'error', 'register-msg');
      return;
    }

    if (password.length < 6) {
      this.showMessage('La contraseña debe tener al menos 6 caracteres', 'error', 'register-msg');
      return;
    }

    if (password !== password2) {
      this.showMessage('Las contraseñas no coinciden', 'error', 'register-msg');
      return;
    }

    const users = this.getAllUsers();
    if (users.find(u => u.email === email)) {
      this.showMessage('Este email ya está registrado', 'error', 'register-msg');
      return;
    }

    this.showMessage('Creando cuenta...', 'info', 'register-msg');

    setTimeout(() => {
      users.push({ name, email, password });
      localStorage.setItem('synk_all_users', JSON.stringify(users));

      this.saveUser({ name, email });
      this.showMessage('¡Cuenta creada con éxito!', 'success', 'register-msg');
      
      setTimeout(() => {
        this.closeAuthModal();
        document.getElementById('register-form')?.reset();
      }, 1000);
    }, 500);
  },


  checkWelcomeModal() {
    if (this.currentUser) return;

    const hideWelcome = localStorage.getItem(this.config.storageKeys.hideWelcome);
    if (hideWelcome === 'true') return;

    setTimeout(() => this.openWelcomeModal(), 1000);
  },

  openWelcomeModal() {
    const modal = document.getElementById('welcome-modal');
    if (!modal) return;

    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');

    this.setupWelcomeEvents();
  },

  closeWelcomeModal() {
    const modal = document.getElementById('welcome-modal');
    if (!modal) return;

    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');

    const hideCheckbox = document.getElementById('welcome-hide');
    if (hideCheckbox?.checked) {
      localStorage.setItem(this.config.storageKeys.hideWelcome, 'true');
    }
  },

setupWelcomeEvents() {
  const modal = document.getElementById('welcome-modal');
  if (!modal) return;

  const loginBtn = document.getElementById('welcome-login');
  const registerBtn = document.getElementById('welcome-register');
  const guestBtn = document.getElementById('welcome-guest');
  
  if (loginBtn) {
    loginBtn.className = 'btn-modal';
    loginBtn.addEventListener('click', () => {
      this.closeWelcomeModal();
      setTimeout(() => this.openAuthModal('login'), 300);
    });
  }

  if (registerBtn) {
    registerBtn.className = 'btn-modal';
    registerBtn.addEventListener('click', () => {
      this.closeWelcomeModal();
      setTimeout(() => this.openAuthModal('register'), 300);
    });
  }

  if (guestBtn) {
    guestBtn.className = 'btn-modal';
    guestBtn.addEventListener('click', () => {
      this.closeWelcomeModal();
    });
  }

  const closeBtn = document.getElementById('welcome-close');
  closeBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    this.closeWelcomeModal();
  });
},

  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  getAllUsers() {
    try {
      const stored = localStorage.getItem('synk_all_users');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },

  showMessage(text, type = 'info', elementId = null) {
    const msgElement = elementId ? document.getElementById(elementId) : null;
    if (!msgElement) return;

    msgElement.textContent = text;
    msgElement.className = `auth-msg auth-msg-${type}`;
  },

  clearMessages() {
    const messages = document.querySelectorAll('.auth-msg');
    messages.forEach(msg => {
      msg.textContent = '';
      msg.className = 'auth-msg';
    });

    document.getElementById('login-form')?.reset();
    document.getElementById('register-form')?.reset();
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => AuthSystem.init());
} else {
  AuthSystem.init();
}