// Shared auth wiring for the "Join Community" modal, used identically by
// index.html, detail.html and category.html.
//
// Two independent sign-in paths feed one unified "logged in" state:
//  - Google: handled entirely client-side via Google Identity Services (GIS),
//    verified server-side by functions/api/auth-session.js, which mints our
//    own long-lived session token (functions/_lib/session.js). Stored in
//    localStorage. Chosen over Supabase's hosted OAuth redirect specifically
//    so the Google "Sign in" screen shows ifai.pages.dev, not a supabase.co
//    subdomain.
//  - Email magic link: still handled by Supabase Auth directly (signInWithOtp)
//    — no branding downside there, so no reason to replace it.
//
// Requires the supabase-js CDN script and the Google Identity Services script
// to be loaded earlier on the page, and the auth modal markup (same ids on
// every page) to be present in the DOM.
(function () {
  const SUPABASE_URL = 'https://qayckglxfmtrjqtghitx.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_qf2j0vC_6D63ziteKUflCQ_u-rYaIgd';
  const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const GOOGLE_CLIENT_ID = '214234294300-jc5nboj26s1s1hkee3j70041tsg3uvgj.apps.googleusercontent.com';
  const GOOGLE_SESSION_KEY = 'ifai_google_session';

  let supabaseUser = null;
  let googleUser = null;
  const listeners = [];
  function notify() { listeners.forEach((cb) => cb(getUser())); }
  function getUser() {
    if (supabaseUser) return { name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email, email: supabaseUser.email, picture: supabaseUser.user_metadata?.avatar_url || null };
    if (googleUser) return { name: googleUser.name, email: googleUser.email, picture: googleUser.picture };
    return null;
  }

  function base64UrlToJson(base64url) {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(decodeURIComponent(atob(padded).split('').map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')));
  }

  function readLocalGoogleSession() {
    const token = localStorage.getItem(GOOGLE_SESSION_KEY);
    if (!token) return null;
    try {
      const payload = base64UrlToJson(token.split('.')[1]);
      if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) {
        localStorage.removeItem(GOOGLE_SESSION_KEY);
        return null;
      }
      return payload;
    } catch (e) {
      localStorage.removeItem(GOOGLE_SESSION_KEY);
      return null;
    }
  }

  const Auth = {
    onChange(cb) { listeners.push(cb); cb(getUser()); },
    getUser,
    signInWithEmail(email) {
      return sb.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.href } });
    },
    signOut() {
      googleUser = null;
      localStorage.removeItem(GOOGLE_SESSION_KEY);
      if (window.google && google.accounts && google.accounts.id) google.accounts.id.disableAutoSelect();
      sb.auth.signOut();
      notify();
    }
  };
  window.IFAI_AUTH = Auth;

  googleUser = readLocalGoogleSession();

  sb.auth.getSession().then(({ data: { session } }) => {
    supabaseUser = session ? session.user : null;
    notify();
  });
  sb.auth.onAuthStateChange((_event, session) => {
    supabaseUser = session ? session.user : null;
    notify();
  });

  function t(key, fallback) {
    const lang = window.IFAI_I18N ? window.IFAI_I18N.getLang() : 'en';
    const dict = window.IFAI_I18N && window.IFAI_I18N.dict && window.IFAI_I18N.dict[lang];
    return (dict && dict[key] != null) ? dict[key] : fallback;
  }

  document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('auth-modal');
    const backdrop = document.getElementById('auth-modal-backdrop');
    const closeBtn = document.getElementById('auth-modal-close');
    const joinBtn = document.getElementById('join-community-btn');
    const joinLabel = document.getElementById('join-community-label');
    const logoutDesktop = document.getElementById('auth-logout-desktop');
    const logoutMobile = document.getElementById('auth-logout-mobile');
    const googleBtnContainer = document.getElementById('google-signin-btn');
    const emailForm = document.getElementById('auth-email-form');
    const emailInput = document.getElementById('auth-email-input');
    const submitBtn = document.getElementById('auth-email-submit');
    const statusMsg = document.getElementById('auth-status-msg');

    if (!modal || !joinBtn) return; // page doesn't have the auth modal (shouldn't happen, but stay safe)

    function openModal() {
      statusMsg.classList.add('hidden');
      emailForm.reset();
      modal.classList.remove('hidden');
    }
    function closeModal() { modal.classList.add('hidden'); }

    joinBtn.addEventListener('click', function () {
      if (joinBtn.dataset.authed === 'true') return; // already a member — no-op for now
      openModal();
    });
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', closeModal);

    async function handleGoogleCredential(response) {
      try {
        const res = await fetch('/api/auth-session', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ idToken: response.credential })
        });
        const profile = await res.json();
        if (!res.ok) throw new Error(profile.error || 'Google sign-in failed');
        localStorage.setItem(GOOGLE_SESSION_KEY, profile.sessionToken);
        googleUser = profile;
        notify();
      } catch (err) {
        statusMsg.classList.remove('hidden');
        statusMsg.textContent = err.message || 'Google sign-in failed, please try again.';
        statusMsg.className = 'text-xs text-center mt-4 text-red-400';
      }
    }

    function initGoogleButton() {
      if (!googleBtnContainer || !window.google || !google.accounts || !google.accounts.id) return;
      google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleGoogleCredential });
      googleBtnContainer.innerHTML = '';
      google.accounts.id.renderButton(googleBtnContainer, { theme: 'outline', size: 'large', width: 320, text: 'continue_with' });
    }
    initGoogleButton();
    window.addEventListener('load', initGoogleButton);

    if (emailForm) {
      emailForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const email = emailInput.value.trim();
        if (!email) return;
        submitBtn.disabled = true;
        const { error } = await Auth.signInWithEmail(email);
        submitBtn.disabled = false;
        statusMsg.classList.remove('hidden');
        if (error) {
          statusMsg.textContent = error.message;
          statusMsg.className = 'text-xs text-center mt-4 text-red-400';
        } else {
          statusMsg.textContent = t('auth.linkSent', 'Check your email for the login link.');
          statusMsg.className = 'text-xs text-center mt-4 text-emerald-400';
          emailForm.reset();
        }
      });
    }

    function handleLogout() { Auth.signOut(); }
    if (logoutDesktop) logoutDesktop.addEventListener('click', handleLogout);
    if (logoutMobile) logoutMobile.addEventListener('click', handleLogout);

    function renderAuthState() {
      const user = Auth.getUser();
      if (user) {
        const name = user.name || (user.email ? user.email.split('@')[0] : 'Member');
        joinLabel.textContent = name;
        joinBtn.dataset.authed = 'true';
        joinBtn.classList.add('cursor-default');
        if (logoutDesktop) logoutDesktop.style.display = '';
        if (logoutMobile) logoutMobile.style.display = '';
        closeModal();
      } else {
        joinLabel.textContent = t('nav.join', 'Join Community');
        joinBtn.dataset.authed = 'false';
        joinBtn.classList.remove('cursor-default');
        if (logoutDesktop) logoutDesktop.style.display = 'none';
        if (logoutMobile) logoutMobile.style.display = 'none';
      }
    }

    Auth.onChange(renderAuthState);
    window.addEventListener('ifai:langchange', renderAuthState);
    if (logoutDesktop) logoutDesktop.textContent = t('auth.logout', 'Log Out');
    if (logoutMobile) logoutMobile.textContent = t('auth.logout', 'Log Out');
    window.addEventListener('ifai:langchange', function () {
      if (logoutDesktop) logoutDesktop.textContent = t('auth.logout', 'Log Out');
      if (logoutMobile) logoutMobile.textContent = t('auth.logout', 'Log Out');
    });
  });
})();
