const AUTH_KEY = 'cpos_auth';

/** Tài khoản hardcode (client-side). Ai xem source cũng thấy — phù hợp POS nội bộ. */
const ACCOUNTS = [
  { username: 'thuthuy', password: 'admin', role: 'admin' },
  { username: 'thanhnam', password: 'nhanvien', role: 'staff' },
];

export function getSession() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session?.username) return null;
    return session;
  } catch {
    return null;
  }
}

export function login(username, password) {
  const u = String(username || '').trim().toLowerCase();
  const p = String(password || '');
  const match = ACCOUNTS.find(a => a.username === u && a.password === p);
  if (!match) return { ok: false, error: 'Sai tên đăng nhập hoặc mật khẩu' };
  const session = { username: match.username, role: match.role, at: Date.now() };
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  return { ok: true, session };
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
}
