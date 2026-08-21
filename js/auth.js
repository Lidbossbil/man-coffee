import { FIREBASE_ENABLED } from './config.js';
import { getFirebaseAuth } from './firebase.js';

const SDK_AUTH = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

function sessionFromUser(user) {
  if (!user) return null;
  const email = user.email || '';
  const username = email.includes('@') ? email.split('@')[0] : (email || 'user');
  return { username, email, uid: user.uid, at: Date.now() };
}

function mapFirebaseError(err) {
  const code = err?.code || '';
  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found' ||
    code === 'auth/invalid-login-credentials'
  ) {
    return 'Sai email hoặc mật khẩu';
  }
  if (code === 'auth/invalid-email') return 'Email không hợp lệ';
  if (code === 'auth/too-many-requests') return 'Thử lại sau (quá nhiều lần sai)';
  if (code === 'auth/network-request-failed') return 'Lỗi mạng — kiểm tra kết nối';
  return 'Không đăng nhập được';
}

/** Local demo (no databaseURL): single auto-session, no Firebase Auth. */
export function getLocalSession() {
  return { username: 'local', email: null, uid: null, at: Date.now() };
}

export function getCurrentUser() {
  // Populated only after watchAuth / login; sync helper for callers that need a peek.
  return _currentSession;
}

let _currentSession = null;

/**
 * Subscribe to auth state. Local mode immediately emits { username: 'local' }.
 * Returns an unsubscribe function.
 */
export function watchAuth(cb) {
  if (!FIREBASE_ENABLED) {
    _currentSession = getLocalSession();
    cb(_currentSession);
    return () => {};
  }

  let unsub = null;
  let cancelled = false;

  (async () => {
    try {
      const auth = await getFirebaseAuth();
      const { onAuthStateChanged } = await import(SDK_AUTH);
      if (cancelled) return;
      unsub = onAuthStateChanged(auth, (user) => {
        _currentSession = sessionFromUser(user);
        cb(_currentSession);
      });
    } catch (e) {
      console.error('Auth init lỗi:', e);
      _currentSession = null;
      cb(null);
    }
  })();

  return () => {
    cancelled = true;
    unsub?.();
  };
}

export async function login(email, password) {
  if (!FIREBASE_ENABLED) {
    _currentSession = getLocalSession();
    return { ok: true, session: _currentSession };
  }
  const e = String(email || '').trim();
  const p = String(password || '');
  if (!e || !p) return { ok: false, error: 'Nhập email và mật khẩu' };
  try {
    const auth = await getFirebaseAuth();
    const { signInWithEmailAndPassword } = await import(SDK_AUTH);
    const cred = await signInWithEmailAndPassword(auth, e, p);
    _currentSession = sessionFromUser(cred.user);
    return { ok: true, session: _currentSession };
  } catch (err) {
    return { ok: false, error: mapFirebaseError(err) };
  }
}

export async function logout() {
  _currentSession = null;
  if (!FIREBASE_ENABLED) return;
  const auth = await getFirebaseAuth();
  if (!auth) return;
  const { signOut } = await import(SDK_AUTH);
  await signOut(auth);
}
