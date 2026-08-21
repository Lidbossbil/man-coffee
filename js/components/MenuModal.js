import { ref, watch } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
import { IMGBB_API_KEY } from '../config.js';

export default {
  props: {
    show: Boolean,
    editingMenuItem: Object,
    menuForm: { type: Object, required: true },
  },
  emits: ['update:show', 'save'],
  setup(props) {
    const uploading = ref(false);
    const uploadError = ref('');
    const previewUrl = ref('');
    const fileInput = ref(null);

    watch(() => props.show, (open) => {
      if (open) {
        uploadError.value = '';
        previewUrl.value = props.menuForm.image || '';
        if (fileInput.value) fileInput.value.value = '';
      } else {
        previewUrl.value = '';
        uploading.value = false;
      }
    });

    watch(() => props.menuForm.image, (url) => {
      if (!uploading.value) previewUrl.value = url || '';
    });

    async function onFileChange(e) {
      const file = e.target?.files?.[0];
      if (!file) return;

      uploadError.value = '';
      previewUrl.value = URL.createObjectURL(file);

      if (!IMGBB_API_KEY) {
        uploadError.value = 'Chưa cấu hình IMGBB_API_KEY trong js/config.js — dán URL ảnh thủ công bên dưới.';
        return;
      }

      uploading.value = true;
      try {
        const body = new FormData();
        body.append('image', file);
        const res = await fetch(
          `https://api.imgbb.com/1/upload?key=${encodeURIComponent(IMGBB_API_KEY)}`,
          { method: 'POST', body },
        );
        const json = await res.json();
        const url = json?.data?.display_url || json?.data?.url;
        if (!json?.success || !url) {
          throw new Error(json?.error?.message || 'Upload thất bại');
        }
        props.menuForm.image = url;
        previewUrl.value = url;
      } catch (err) {
        uploadError.value = err?.message || 'Không upload được ảnh. Thử lại hoặc dán URL.';
        previewUrl.value = props.menuForm.image || '';
      } finally {
        uploading.value = false;
        if (fileInput.value) fileInput.value.value = '';
      }
    }

    return { uploading, uploadError, previewUrl, fileInput, onFileChange };
  },
  template: `
  <div v-if="show" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="$emit('update:show', false)">
    <div class="bg-ink2 border border-white/10 rounded-2xl w-full max-w-md p-5 text-paper">
      <h3 class="font-display font-semibold text-lg mb-4">{{ editingMenuItem?.id ? 'Sửa Món' : 'Thêm Món Mới' }}</h3>
      <div class="space-y-3">
        <div>
          <label class="text-xs text-paper/50 font-mono">Tên món</label>
          <input v-model="menuForm.name" class="w-full mt-1 bg-ink border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-copper">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-paper/50 font-mono">Size</label>
            <input v-model="menuForm.size" placeholder="M / L" class="w-full mt-1 bg-ink border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-copper">
          </div>
          <div>
            <label class="text-xs text-paper/50 font-mono">Giá (VNĐ)</label>
            <input v-model.number="menuForm.price" type="number" class="w-full mt-1 bg-ink border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-copper">
          </div>
        </div>
        <div>
          <label class="text-xs text-paper/50 font-mono">Ảnh món</label>
          <div class="mt-1 flex items-start gap-3">
            <div class="w-16 h-16 rounded-lg border border-white/10 bg-ink overflow-hidden shrink-0 flex items-center justify-center">
              <img v-if="previewUrl" :src="previewUrl" alt="" class="w-full h-full object-cover">
              <i v-else class="fa-regular fa-image text-paper/30"></i>
            </div>
            <div class="flex-1 min-w-0 space-y-1.5">
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                class="block w-full text-xs text-paper/60 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-ink file:text-paper file:text-xs file:border file:border-white/10 file:cursor-pointer hover:file:border-copper"
                :disabled="uploading"
                @change="onFileChange"
              >
              <p v-if="uploading" class="text-xs text-copper font-mono">Đang upload ImgBB…</p>
              <p v-else-if="uploadError" class="text-xs text-rust">{{ uploadError }}</p>
              <p v-else class="text-[11px] text-paper/40">Chọn file để upload (ImgBB). Có thể dán URL bên dưới.</p>
            </div>
          </div>
        </div>
        <div>
          <label class="text-xs text-paper/50 font-mono">URL hình ảnh (thủ công)</label>
          <input v-model="menuForm.image" placeholder="https://..." class="w-full mt-1 bg-ink border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-copper">
        </div>
        <label class="flex items-center gap-2 text-sm pt-1">
          <input type="checkbox" v-model="menuForm.isVisible" class="accent-copper"> Hiển thị món này cho khách gọi
        </label>
      </div>
      <div class="flex gap-2 mt-5">
        <button @click="$emit('update:show', false)" class="flex-1 py-2.5 rounded-lg border border-white/10 text-sm" :disabled="uploading">Hủy</button>
        <button @click="$emit('save')" class="flex-1 py-2.5 rounded-lg bg-copper text-ink font-semibold text-sm disabled:opacity-50" :disabled="uploading">Lưu</button>
      </div>
    </div>
  </div>
  `,
};
