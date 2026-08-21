import { ref, computed, nextTick } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

const KEY_LS = 'cpos_gemini_key';
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SYSTEM_PROMPT =
  'Bạn là trợ lý quán cà phê / POS tiếng Việt: ngắn gọn, thực tế, giúp nhân viên về menu, order, thanh toán, vận hành quầy. Không bịa số liệu doanh thu nếu không được cung cấp.';

export default {
  setup() {
    const open = ref(false);
    const showSettings = ref(false);
    const apiKey = ref(localStorage.getItem(KEY_LS) || '');
    const keyDraft = ref(apiKey.value);
    const input = ref('');
    const loading = ref(false);
    const error = ref('');
    const messages = ref([]);
    const listEl = ref(null);

    const hasKey = computed(() => !!apiKey.value.trim());

    function toggle() {
      open.value = !open.value;
      if (open.value && !hasKey.value) showSettings.value = true;
    }

    function saveKey() {
      const k = keyDraft.value.trim();
      apiKey.value = k;
      if (k) localStorage.setItem(KEY_LS, k);
      else localStorage.removeItem(KEY_LS);
      showSettings.value = false;
      error.value = '';
    }

    function clearKey() {
      keyDraft.value = '';
      apiKey.value = '';
      localStorage.removeItem(KEY_LS);
      error.value = '';
    }

    async function scrollBottom() {
      await nextTick();
      if (listEl.value) listEl.value.scrollTop = listEl.value.scrollHeight;
    }

    async function send() {
      const text = input.value.trim();
      if (!text || loading.value) return;
      if (!hasKey.value) {
        showSettings.value = true;
        error.value = 'Dán Gemini API key để dùng chat.';
        return;
      }

      messages.value.push({ role: 'user', text });
      input.value = '';
      error.value = '';
      loading.value = true;
      await scrollBottom();

      try {
        const contents = messages.value.map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }],
        }));

        const res = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey.value.trim())}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = data?.error?.message || `Lỗi API (${res.status})`;
          throw new Error(msg);
        }

        const reply =
          data?.candidates?.[0]?.content?.parts?.map((p) => p.text).filter(Boolean).join('') ||
          'Không có phản hồi.';
        messages.value.push({ role: 'model', text: reply });
      } catch (e) {
        error.value = e?.message || 'Gọi Gemini thất bại';
        messages.value.push({
          role: 'model',
          text: 'Xin lỗi, không gọi được AI. Kiểm tra API key hoặc thử lại.',
        });
      } finally {
        loading.value = false;
        await scrollBottom();
      }
    }

    return {
      open, showSettings, apiKey, keyDraft, input, loading, error, messages, listEl,
      hasKey, toggle, saveKey, clearKey, send,
    };
  },
  template: `
  <div class="ai-chatbox">
    <button
      type="button"
      class="ai-chatbox-fab"
      :class="{ 'ai-chatbox-fab--open': open }"
      :title="open ? 'Đóng trợ lý' : 'Trợ lý AI'"
      @click="toggle"
    >
      <i :class="open ? 'fa-solid fa-xmark' : 'fa-solid fa-comments'"></i>
    </button>

    <div v-if="open" class="ai-chatbox-panel">
      <div class="ai-chatbox-head">
        <div>
          <p class="font-display font-semibold text-sm text-paper">Trợ lý quầy</p>
          <p class="text-[10px] font-mono text-paper/45">Gemini · key trên máy bạn</p>
        </div>
        <button type="button" class="ai-chatbox-icon-btn" title="Cài API key" @click="showSettings = !showSettings">
          <i class="fa-solid fa-gear"></i>
        </button>
      </div>

      <div v-if="showSettings" class="ai-chatbox-settings">
        <label class="text-[10px] font-mono text-paper/50">Gemini API key</label>
        <input
          v-model="keyDraft"
          type="password"
          autocomplete="off"
          placeholder="AIza…"
          class="ai-chatbox-input mt-1"
        >
        <p class="text-[10px] text-paper/40 mt-1.5 leading-relaxed">
          Lấy key tại
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" class="text-copper underline">Google AI Studio</a>.
          Lưu localStorage — không commit vào repo.
        </p>
        <div class="flex gap-2 mt-2">
          <button type="button" class="ai-chatbox-btn-primary flex-1" @click="saveKey">Lưu key</button>
          <button type="button" class="ai-chatbox-btn-ghost" @click="clearKey">Xóa</button>
        </div>
      </div>

      <div v-else ref="listEl" class="ai-chatbox-messages">
        <p v-if="!messages.length" class="text-[11px] text-paper/40 font-mono leading-relaxed px-1">
          Hỏi nhanh về menu, order, thanh toán…
          <span v-if="!hasKey"> Dán API key (bánh răng) trước khi gửi.</span>
        </p>
        <div
          v-for="(m, i) in messages"
          :key="i"
          class="ai-chatbox-bubble"
          :class="m.role === 'user' ? 'ai-chatbox-bubble--user' : 'ai-chatbox-bubble--bot'"
        >{{ m.text }}</div>
        <p v-if="loading" class="text-[10px] font-mono text-copper/80 px-1">Đang nghĩ…</p>
      </div>

      <p v-if="error" class="text-[10px] text-rust font-mono px-3 pb-1">{{ error }}</p>

      <form v-if="!showSettings" class="ai-chatbox-compose" @submit.prevent="send">
        <input
          v-model="input"
          type="text"
          class="ai-chatbox-input flex-1"
          placeholder="Nhập câu hỏi…"
          :disabled="loading"
        >
        <button type="submit" class="ai-chatbox-btn-primary shrink-0" :disabled="loading || !input.trim()">
          <i class="fa-solid fa-paper-plane"></i>
        </button>
      </form>
    </div>
  </div>
  `,
};
