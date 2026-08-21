import { ref } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
import { login } from '../auth.js';

export default {
  emits: ['success'],
  setup(_, { emit }) {
    const email = ref('');
    const password = ref('');
    const error = ref('');
    const loading = ref(false);

    async function submit() {
      error.value = '';
      loading.value = true;
      try {
        const result = await login(email.value, password.value);
        if (!result.ok) {
          error.value = result.error;
          return;
        }
        emit('success', result.session);
      } finally {
        loading.value = false;
      }
    }

    return { email, password, error, loading, submit };
  },
  template: `
  <div class="min-h-screen flex items-center justify-center p-4 bg-ink text-paper">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <div class="inline-flex bg-copper/15 border border-copper/40 p-3 rounded-xl text-copper text-2xl mb-4">
          <i class="fa-solid fa-mug-hot"></i>
        </div>
        <h1 class="font-display font-semibold text-2xl tracking-tight">Quầy Sổ</h1>
        <p class="text-sm text-paper/50 mt-1 font-mono">Đăng nhập để vào Coffee POS</p>
      </div>

      <form @submit.prevent="submit" class="bg-ink2 border border-white/10 rounded-2xl p-5 space-y-4">
        <div>
          <label class="text-xs text-paper/50 font-mono">Email</label>
          <input v-model="email" type="email" autocomplete="email"
            class="w-full mt-1 bg-ink border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-copper"
            placeholder="nhanvien@man.coffee">
        </div>
        <div>
          <label class="text-xs text-paper/50 font-mono">Mật khẩu</label>
          <input v-model="password" type="password" autocomplete="current-password"
            class="w-full mt-1 bg-ink border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-copper"
            placeholder="••••••••">
        </div>
        <p v-if="error" class="text-sm text-rust font-mono">{{ error }}</p>
        <button type="submit" :disabled="loading"
          class="w-full py-2.5 rounded-lg bg-copper hover:bg-copperDk text-ink font-semibold text-sm disabled:opacity-50">
          {{ loading ? 'Đang vào…' : 'Đăng nhập' }}
        </button>
      </form>
    </div>
  </div>
  `,
};
