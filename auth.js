/* STACKLY authentication/session helpers (browser demo implementation) */
(function () {
  'use strict';

  const SESSION_KEY = 'stackly_session_v2';
  const USERS_KEY = 'stackly_users_v2';
  const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

  function storageAvailable() {
    try {
      const testKey = '__stackly_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  const canStore = storageAvailable();
  let memorySession = null;
  let memoryUsers = {};

  function parseJSON(value, fallback) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function readSession() {
    const raw = canStore ? window.localStorage.getItem(SESSION_KEY) : memorySession;
    return parseJSON(raw, null);
  }

  function writeSession(session) {
    if (canStore) {
      if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      else window.localStorage.removeItem(SESSION_KEY);
    } else {
      memorySession = session;
    }
  }

  function readUsers() {
    const raw = canStore ? window.localStorage.getItem(USERS_KEY) : memoryUsers;
    const parsed = typeof raw === 'string' ? parseJSON(raw, {}) : (raw || {});
    return parsed && typeof parsed === 'object' ? parsed : {};
  }

  function writeUsers(users) {
    if (canStore) window.localStorage.setItem(USERS_KEY, JSON.stringify(users || {}));
    else memoryUsers = users || {};
  }

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function normalizeRole(role) {
    return role === 'Travel Agent' ? 'Travel Agent' : 'Traveler';
  }

  function isSessionValid(session) {
    return Boolean(session && session.email && session.name && session.expiresAt && session.expiresAt > Date.now());
  }

  function setSession(name, email, role) {
    const session = {
      name: String(name || 'User').trim(),
      email: normalizeEmail(email),
      role: normalizeRole(role),
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_DURATION
    };
    writeSession(session);
    return session;
  }

  window.authIsLoggedIn = function authIsLoggedIn() {
    const session = readSession();
    if (!isSessionValid(session)) {
      writeSession(null);
      return false;
    }
    return true;
  };

  window.authGetUser = function authGetUser() {
    const session = readSession();
    return isSessionValid(session) ? session : null;
  };

  window.authLogin = function authLogin(name, email, role) {
    if (!email) return false;
    return Boolean(setSession(name || email.split('@')[0], email, role));
  };

  window.authSignup = function authSignup(name, email, role) {
    const normalizedEmail = normalizeEmail(email);
    if (!name || !normalizedEmail) return false;
    const users = readUsers();
    users[normalizedEmail] = {
      name: String(name).trim(),
      email: normalizedEmail,
      role: normalizeRole(role),
      createdAt: Date.now()
    };
    writeUsers(users);
    return true;
  };

  window.authLogout = function authLogout() {
    writeSession(null);
    if (window.showToast) window.showToast('You have been logged out.', 'success');
    window.setTimeout(function () {
      window.location.href = 'login.html';
    }, 250);
  };

  function updateAuthUI() {
    const user = window.authGetUser();

    document.querySelectorAll('.nav-login-btn').forEach(function (link) {
      if (user) {
        link.textContent = 'Dashboard';
        link.setAttribute('href', 'dashboard.html');
        link.setAttribute('aria-label', 'Open dashboard');
      } else {
        link.textContent = 'Login';
        link.setAttribute('href', 'login.html');
        link.removeAttribute('aria-label');
      }
    });

    const mobileLogin = document.querySelector('.mobile-login-wrap a');
    if (mobileLogin) {
      if (user) {
        mobileLogin.textContent = 'Open Dashboard';
        mobileLogin.setAttribute('href', 'dashboard.html');
      } else {
        mobileLogin.textContent = mobileLogin.textContent.includes('Account') ? 'Login to Your Account' : 'Login';
        mobileLogin.setAttribute('href', 'login.html');
      }
    }

    document.querySelectorAll('[data-role="traveler-only"]').forEach(function (element) {
      element.style.display = user && user.role !== 'Traveler' ? 'none' : '';
    });
    document.querySelectorAll('[data-role="agent-only"]').forEach(function (element) {
      element.style.display = user && user.role !== 'Travel Agent' ? 'none' : '';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateAuthUI);
  } else {
    updateAuthUI();
  }

  window.StacklyAuth = {
    isLoggedIn: window.authIsLoggedIn,
    getUser: window.authGetUser,
    login: window.authLogin,
    signup: window.authSignup,
    logout: window.authLogout
  };
})();