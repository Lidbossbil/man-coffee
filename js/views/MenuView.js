import { fmt } from '../utils.js';

export default {
  props: {
    menuItems: { type: Array, default: () => [] },
  },
  emits: ['add', 'edit', 'toggle', 'delete'],
  setup() {
    return { fmt };
  },
  template: `
  <section class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
      <div>
        <h2 class="font-display text-2xl font-semibold">Danh Sách Món</h2>
        <p class="text-sm text-paper/50">Ảnh, size, giá và trạng thái hiển thị</p>
      </div>
      <button @click="$emit('add')" class="bg-copper hover:bg-copperDk text-ink font-semibold px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-all shadow">
        <i class="fa-solid fa-plus"></i> Thêm Món
      </button>
    </div>

    <div class="bg-ink2 border border-white/5 rounded-xl overflow-hidden">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="text-[11px] uppercase tracking-wider text-paper/40 font-mono border-b border-white/5">
            <th class="p-3">Ảnh</th><th class="p-3">Tên món</th><th class="p-3">Size</th>
            <th class="p-3">Giá</th><th class="p-3">Hiển thị</th><th class="p-3 text-center">Thao tác</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/5">
          <tr v-for="m in menuItems" :key="m.id" class="hover:bg-white/[0.02]">
            <td class="p-3"><img :src="m.image" class="w-10 h-10 rounded-lg object-cover border border-white/10"></td>
            <td class="p-3 font-medium">{{ m.name }}</td>
            <td class="p-3 font-mono text-xs text-paper/60">{{ m.size }}</td>
            <td class="p-3 font-mono">{{ fmt(m.price) }}</td>
            <td class="p-3">
              <button @click="$emit('toggle', m)" class="text-xs px-2 py-1 rounded-full border font-mono"
                :class="m.isVisible ? 'border-sage/40 text-sage bg-sage/10' : 'border-ash/30 text-ash bg-white/5'">
                {{ m.isVisible ? 'Hiện' : 'Ẩn' }}
              </button>
            </td>
            <td class="p-3 text-center space-x-2">
              <button @click="$emit('edit', m)" class="text-copper hover:text-copperDk"><i class="fa-solid fa-pen"></i></button>
              <button @click="$emit('delete', m)" class="text-rust hover:text-rust/70"><i class="fa-solid fa-trash"></i></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
  `,
};
