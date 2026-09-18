// Shared Supabase Auth wiring for the "Join Community" modal, used identically
// by index.html, detail.html and category.html. Requires the supabase-js CDN
// script to be loaded earlier on the page, and the auth modal markup (same
// ids on every page) to be present in the DOM.
(function () {
  const SUPABASE_URL = 'https://qayckglxfmtrjqtghitx.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_qf2j0vC_6D63ziteKUflCQ_u-rYaIgd';
  const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  let currentUser = null;
  const listeners = [];
  function notify() { listeners.forEach((cb) => cb(currentUser)); }

  const Auth = {
    onChange(cb) { listeners.push(cb); cb(currentUser); },
    getUser() { return currentUser; },
    signInWithGoogle() {
      return sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } });
    },
    signInWithEmail(email) {
      return sb.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.href } });
    },
    signOut() { return sb.auth.signOut(); }
  };
  window.IFAI_AUTH = Auth;

  sb.auth.getSession().then(({ data: { session } }) => {
    currentUser = session ? session.user : null;
    notify();
  });
  sb.auth.onAuthStateChange((_event, session) => {
    currentUser = session ? session.user : null;
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
    const googleBtn = document.getElementById('auth-google-btn');
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

    if (googleBtn) googleBtn.addEventListener('click', function () { Auth.signInWithGoogle(); });

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
        const name = (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name))
          || (user.email ? user.email.split('@')[0] : 'Member');
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
