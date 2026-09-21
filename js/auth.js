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
  // Supabase's auth client keeps a BroadcastChannel open for cross-tab
  // session sync, and Chrome evicts a bfcache-parked page the instant a
  // message arrives on any channel it holds — which happens on every
  // page's own boot. That forces every back/forward navigation into a
  // full reload instead of an instant restore. Closing it right before
  // the page is parked/unloaded lets bfcache work; the (rare) cost is
  // this specific tab won't hear about a sign-out from another tab
  // while it's parked.
  window.addEventListener('pagehide', function () {
    try { sb.auth.broadcastChannel && sb.auth.broadcastChannel.close(); } catch (e) {}
  });

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

  // The admin signs in on /admin, which keeps its own session (separate storage key).
  // An admin session found here is a leftover from before that split (or from an old
  // admin tab), so it is ignored and cleared locally instead of showing the admin's
  // email in the public navbar. scope "local" only removes it from this browser and
  // does not revoke the admin's real session.
  const adminLookups = {}; // one lookup per user id, however many auth events fire
  function isAdminUser(userId) {
    if (!adminLookups[userId]) {
      adminLookups[userId] = sb.from('profiles').select('role').eq('id', userId).maybeSingle()
        .then(({ data }) => !!data && data.role === 'admin');
    }
    return adminLookups[userId];
  }
  let sessionCheckId = 0;
  async function applySupabaseSession(session) {
    const checkId = ++sessionCheckId;
    if (!session) { supabaseUser = null; notify(); return; }
    let isAdmin = false;
    try { isAdmin = await isAdminUser(session.user.id); } catch (e) { /* lookup failed: treat as a normal member */ }
    if (checkId !== sessionCheckId) return; // a newer session event replaced this one
    if (isAdmin) {
      supabaseUser = null;
      sb.auth.signOut({ scope: 'local' });
    } else {
      supabaseUser = session.user;
    }
    notify();
  }

  sb.auth.getSession().then(({ data: { session } }) => applySupabaseSession(session));
  sb.auth.onAuthStateChange((_event, session) => { applySupabaseSession(session); });

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
    const joinAvatar = document.getElementById('join-community-avatar');
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
      ensureGoogleButton();
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
        // Clear any leftover magic-link session first, so a stale Supabase
        // session never shadows the identity the user just signed in with.
        await sb.auth.signOut();
        localStorage.setItem(GOOGLE_SESSION_KEY, profile.sessionToken);
        googleUser = profile;
        supabaseUser = null;
        notify();
      } catch (err) {
        statusMsg.classList.remove('hidden');
        statusMsg.textContent = err.message || 'Google sign-in failed, please try again.';
        statusMsg.className = 'text-xs text-center mt-4 text-red-400';
      }
    }

    // Deliberately NOT initialized on page load: the GSI iframe it creates
    // runs third-party code on every single page view, which is a common
    // cause of the browser skipping its back/forward cache (making every
    // back-navigation a slow full reload instead of an instant restore).
    // Initializing it only when the user actually opens the modal means
    // ordinary browsing (viewing works, signals, going back) never touches
    // Google's script at all.
    let googleButtonInitialized = false;
    function initGoogleButton() {
      if (googleButtonInitialized) return;
      if (!googleBtnContainer || !window.google || !google.accounts || !google.accounts.id) return;
      google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleGoogleCredential });
      googleBtnContainer.innerHTML = '';
      google.accounts.id.renderButton(googleBtnContainer, { theme: 'outline', size: 'large', width: 320, text: 'continue_with' });
      googleButtonInitialized = true;
    }
    function ensureGoogleButton() {
      if (googleButtonInitialized) return;
      initGoogleButton();
      if (googleButtonInitialized) return;
      // The GSI script (loaded async) may still be downloading — retry
      // briefly until it's ready rather than leaving the button blank.
      const retry = setInterval(function () {
        initGoogleButton();
        if (googleButtonInitialized) clearInterval(retry);
      }, 200);
      setTimeout(function () { clearInterval(retry); }, 5000);
    }

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

    const BTN_LOGGED_OUT_CLASSES = 'relative group inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase overflow-hidden border border-[#f75500]/50 text-white bg-cosmic-800/80 hover:bg-[#f75500] hover:text-black transition-all duration-300 glow-orange min-w-[172px] text-center';
    const BTN_LOGGED_IN_CLASSES = 'inline-flex items-center gap-2.5 text-xs font-semibold tracking-wider uppercase text-zinc-200 cursor-default py-1 px-1';

    function renderAuthState() {
      const user = Auth.getUser();
      const slideBg = joinBtn.querySelector('.bg-\\[\\#f75500\\]') || joinBtn.querySelector('div');
      if (user) {
        const fullName = user.name || (user.email ? user.email.split('@')[0] : 'Member');
        joinLabel.textContent = fullName.split(' ')[0];
        joinBtn.dataset.authed = 'true';
        joinBtn.className = BTN_LOGGED_IN_CLASSES;
        if (slideBg) slideBg.style.display = 'none';

        if (joinAvatar) {
          joinAvatar.className = 'relative z-10 w-6 h-6 rounded-full object-cover border border-[#f75500]';
          if (user.picture) {
            joinAvatar.src = user.picture;
          } else {
            joinAvatar.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%239ca3af'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 14c-2.03 0-4.43-.82-6.14-2.88C7.55 15.8 9.68 15 12 15s4.45.8 6.14 2.12C16.43 19.18 14.03 20 12 20z'/%3E%3C/svg%3E";
          }
        }
        if (logoutDesktop) logoutDesktop.style.display = '';
        if (logoutMobile) logoutMobile.style.display = '';
        closeModal();
      } else {
        joinLabel.textContent = t('nav.join', 'Join Community');
        joinBtn.dataset.authed = 'false';
        joinBtn.className = BTN_LOGGED_OUT_CLASSES;
        if (slideBg) slideBg.style.display = '';

        if (joinAvatar) {
          joinAvatar.className = 'hidden relative z-10 w-5 h-5 rounded-full object-cover';
          joinAvatar.removeAttribute('src');
        }
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
