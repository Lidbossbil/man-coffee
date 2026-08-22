export default {
  props: {
    show: Boolean,
    newTableName: String,
    newTableType: String,
  },
  emits: ['update:show', 'update:newTableName', 'update:newTableType', 'confirm'],
  template: `
  <div v-if="show" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="$emit('update:show', false)">
    <div class="bg-ink2 border border-black/10 rounded-2xl w-full max-w-sm p-5 text-paper">
      <h3 class="font-display font-semibold text-lg mb-4">Mở Bàn Mới</h3>
      <label class="text-xs text-paper/50 font-mono">Tên bàn / mã đơn</label>
      <input :value="newTableName" @input="$emit('update:newTableName', $event.target.value)"
        placeholder="VD: Bàn 5, Khách quen, Ship 1..." class="w-full mt-1 mb-3 bg-ink border border-black/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-copper">
      <label class="text-xs text-paper/50 font-mono">Loại</label>
      <div class="flex gap-2 mt-1 mb-5">
        <button @click="$emit('update:newTableType', 'tai_cho')" class="flex-1 py-2 rounded-lg text-sm border" :class="newTableType==='tai_cho' ? 'bg-copper text-ink border-copper font-semibold' : 'border-black/10 text-paper/60'">Tại chỗ</button>
        <button @click="$emit('update:newTableType', 'mang_di')" class="flex-1 py-2 rounded-lg text-sm border" :class="newTableType==='mang_di' ? 'bg-copper text-ink border-copper font-semibold' : 'border-black/10 text-paper/60'">Mang đi</button>
      </div>
      <div class="flex gap-2">
        <button @click="$emit('update:show', false)" class="flex-1 py-2.5 rounded-lg border border-black/10 text-sm">Hủy</button>
        <button @click="$emit('confirm')" class="flex-1 py-2.5 rounded-lg bg-copper text-ink font-semibold text-sm">Mở Bàn</button>
      </div>
    </div>
  </div>
  `,
};