import { fmt } from '../utils.js';

export default {
  props: {
    show: Boolean,
    activeTable: Object,
    visibleMenu: { type: Array, default: () => [] },
    orderTotal: { type: Number, default: 0 },
    orderRemaining: { type: Number, default: 0 },
    partialPayInput: { default: null },
  },
  emits: ['close', 'add-item', 'change-qty', 'update:partialPayInput', 'partial-pay', 'save-temp', 'full-pay'],
  setup() {
    return { fmt };
  },
  template: `
  <div v-if="show" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="$emit('close')">
    <div class="bg-paper text-ink rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
      <div class="bg-ink text-paper p-4 px-6 flex justify-between items-center">
        <div>
          <h3 class="font-display font-semibold text-lg">{{ activeTable?.name }}</h3>
          <p class="text-[11px] text-paper/40 font-mono">#{{ activeTable?.code }} · {{ activeTable?.type === 'mang_di' ? 'Mang đi' : 'Tại chỗ' }}</p>
        </div>
        <button @click="$emit('close')" class="text-paper/50 hover:text-paper text-xl"><i class="fa-solid fa-xmark"></i></button>
      </div>

      <div class="flex-grow grid grid-cols-1 md:grid-cols-12 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-ink/10">
        <div class="md:col-span-7 p-4 overflow-y-auto bg-paperDim">
          <h4 class="text-xs font-mono uppercase tracking-wider text-ash mb-3">Chọn món cho bàn</h4>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button v-for="m in visibleMenu" :key="m.id" @click="$emit('add-item', m)"
              class="bg-paper rounded-xl p-2.5 text-left border border-ink/5 hover:border-copper transition-all">
              <img :src="m.image" class="w-full h-16 object-cover rounded-lg mb-1.5">
              <p class="text-xs font-semibold leading-tight">{{ m.name }}</p>
              <p class="text-[10px] text-ash font-mono">{{ m.size }} · {{ fmt(m.price) }}</p>
            </button>
          </div>
        </div>

        <div class="md:col-span-5 p-4 flex flex-col justify-between overflow-y-auto">
          <div>
            <h4 class="text-xs font-mono uppercase tracking-wider text-ash mb-2">Món đã chọn</h4>
            <div class="space-y-1.5 mb-3 max-h-48 overflow-y-auto pr-1">
              <div v-if="!activeTable?.items?.length" class="text-xs italic text-ash py-3">Chưa có món nào</div>
              <div v-for="it in activeTable?.items" :key="it.uid" class="flex items-center justify-between text-sm bg-paperDim rounded-lg px-2.5 py-1.5">
                <span class="truncate flex-grow">{{ it.name }} ({{ it.size }})</span>
                <div class="flex items-center gap-1.5 font-mono">
                  <button @click="$emit('change-qty', it, -1)" class="w-5 h-5 rounded bg-ink/10 hover:bg-ink/20 text-xs">−</button>
                  <span class="w-4 text-center">{{ it.qty }}</span>
                  <button @click="$emit('change-qty', it, 1)" class="w-5 h-5 rounded bg-ink/10 hover:bg-ink/20 text-xs">+</button>
                  <span class="w-16 text-right">{{ fmt(it.qty * it.price) }}</span>
                </div>
              </div>
            </div>

            <div class="bg-copper/10 border border-copper/25 rounded-xl p-3 space-y-1.5 text-sm">
              <div class="flex justify-between text-ash"><span>Tổng tiền order</span><span class="font-mono font-semibold text-ink">{{ fmt(orderTotal) }}</span></div>
              <div class="flex justify-between text-sage"><span>Đã thanh toán</span><span class="font-mono font-semibold">{{ fmt(activeTable?.paidAmount || 0) }}</span></div>
              <div class="dash-divider my-1"></div>
              <div class="flex justify-between font-bold text-base"><span>Còn lại</span><span class="font-mono" :class="orderRemaining>0?'text-rust':'text-sage'">{{ fmt(orderRemaining) }}</span></div>
            </div>
          </div>

          <div class="pt-4 space-y-2 border-t border-ink/10 mt-3">
            <div v-if="orderRemaining > 0" class="flex gap-2">
              <input :value="partialPayInput" @input="$emit('update:partialPayInput', $event.target.value === '' ? null : Number($event.target.value))"
                type="number" placeholder="Số tiền khách trả" class="flex-grow bg-white border border-ink/15 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-copper">
              <button @click="$emit('partial-pay')" class="bg-ink2 text-paper px-3 rounded-lg text-sm shrink-0">Ghi nhận trả</button>
            </div>
            <button @click="$emit('save-temp')" class="w-full bg-white border border-ink/15 hover:border-ink/30 font-medium py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
              <i class="fa-regular fa-floppy-disk"></i> Tạm Lưu Trạng Thái
            </button>
            <button @click="$emit('full-pay')" class="w-full bg-sage hover:bg-sage/90 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-40" :disabled="!activeTable?.items?.length">
              <i class="fa-solid fa-circle-check"></i> Trả Hết & Đóng Bàn
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
};
