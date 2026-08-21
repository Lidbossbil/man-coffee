import { FIREBASE_CONFIG } from './config.js';

export async function makeFirebaseBackend() {
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
  const { getDatabase, ref: dref, onValue, set, remove, push } =
    await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js');
  const app = initializeApp(FIREBASE_CONFIG);
  const rtdb = getDatabase(app);
  return {
    watch(path, cb) {
      onValue(dref(rtdb, path), (snap) => cb(snap.val() || {}));
    },
    async setItem(path, id, data) { await set(dref(rtdb, `${path}/${id}`), data); },
    async removeItem(path, id) { await remove(dref(rtdb, `${path}/${id}`)); },
    newId(path) { return push(dref(rtdb, path)).key; },
  };
}

export function makeLocalBackend() {
  const channel = 'BroadcastChannel' in window ? new BroadcastChannel('coffee_pos_sync') : null;
  const listeners = {};
  function readAll(path) { return JSON.parse(localStorage.getItem('cpos_' + path) || '{}'); }
  function writeAll(path, obj) {
    localStorage.setItem('cpos_' + path, JSON.stringify(obj));
    listeners[path]?.forEach(cb => cb(obj));
    channel?.postMessage({ path });
  }
  channel?.addEventListener('message', (e) => {
    listeners[e.data.path]?.forEach(cb => cb(readAll(e.data.path)));
  });
  return {
    watch(path, cb) {
      listeners[path] = listeners[path] || [];
      listeners[path].push(cb);
      cb(readAll(path));
    },
    async setItem(path, id, data) { const all = readAll(path); all[id] = data; writeAll(path, all); },
    async removeItem(path, id) { const all = readAll(path); delete all[id]; writeAll(path, all); },
    newId() { return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7); },
  };
}
