import { computed } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
import { fmt, tableTotal, tableRemaining, startOfDay } from '../utils.js';

function dayLabel(dayStart) {
  const today = startOfDay(Date.now());
  const yesterday = today - 86400000;
  if (dayStart === today) return 'Hôm nay';
  if (dayStart === yesterday) return 'Hôm qua';
  return new Date(dayStart).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export default {
  props: {
    sortedTables: { type: Array, default: () => [] },
    salesHistory: { type: Array, default: () => [] },
  },
  emits: ['open-new', 'open-order'],
  setup(props) {
    const closedHistoryGroups = computed(() => {
      const sorted = [...props.salesHistory].sort((a, b) => b.closedAt - a.closedAt);
      const groups = [];
      let currentKey = null;
      let currentGroup = null;

      for (const sale of sorted) {
        const key = startOfDay(sale.closedAt);
        if (key !== currentKey) {
          currentKey = key;
          currentGroup = {
            key,
            label: dayLabel(key),
            items: [],
          };
          groups.push(currentGroup);
        }
        const cups = (sale.items || []).reduce((a, it) => a + it.qty, 0);
        currentGroup.items.push({
          id: sale.id,
          tableName: sale.tableName || 'Bàn',
          total: sale.total || 0,
          cups,
          time: new Date(sale.closedAt).toLocaleTimeString('vi-VN', {
            hour: '2-digit', minute: '2-digit',
          }),
        });
      }
      return groups;
    });

    return { fmt, tableTotal, tableRemaining, closedHistoryGroups };
  },
  template: `
  <section class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
      <div>
        <h2 class="font-display text-2xl font-semibold">Bàn Đang Mở</h2>
        <p class="text-sm text-paper/50">Số bàn không cố định — mở khi có khách, đóng khi thanh toán xong</p>
      </div>
      <button @click="$emit('open-new')" class="bg-copper hover:bg-copperDk text-ink font-semibold px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-all shadow">
        <i class="fa-solid fa-plus"></i> Mở Bàn Mới
      </button>
    </div>

    <div v-if="sortedTables.length === 0" class="border border-dashed border-white/10 rounded-xl py-16 text-center text-paper/30">
      <i class="fa-solid fa-mug-saucer text-3xl mb-3"></i>
      <p class="text-sm">Chưa có bàn nào đang mở. Nhấn "Mở Bàn Mới" khi có khách vào.</p>
    </div>

    <transition-group tag="div" name="fade" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div v-for="tb in sortedTables" :key="tb.id" @click="$emit('open-order', tb)"
        class="ticket text-ink p-4 pt-5 pb-6 cursor-pointer hover:-translate-y-0.5 transition-transform shadow-lg">
        <div class="flex justify-between items-start mb-2">
          <div>
            <p class="font-mono text-[10px] text-ash">#{{ tb.code }}</p>
            <h4 class="font-display font-semibold text-base leading-tight">{{ tb.name }}</h4>
            <p class="text-[11px] text-ash">{{ tb.type === 'mang_di' ? 'Mang đi' : 'Tại chỗ' }}</p>
          </div>
          <span class="stamp text-[9px] font-bold px-1.5 py-0.5 shrink-0"
            :class="tableRemaining(tb) <= 0 ? 'text-sage' : 'text-rust'">
            {{ tableRemaining(tb) <= 0 ? 'ĐÃ TT' : 'CÒN NỢ' }}
          </span>
        </div>
        <div class="dash-divider my-2"></div>
        <ul class="text-xs space-y-0.5 mb-2 max-h-16 overflow-hidden">
          <li v-for="it in (tb.items || [])" :key="it.uid" class="flex justify-between">
            <span class="truncate">{{ it.name }} ({{ it.size }}) x{{ it.qty }}</span>
          </li>
          <li v-if="!tb.items || tb.items.length === 0" class="italic text-ash">Chưa chọn món</li>
        </ul>
        <div class="dash-divider my-2"></div>
        <div class="flex justify-between font-mono text-sm font-semibold">
          <span>Tổng</span><span>{{ fmt(tableTotal(tb)) }}</span>
        </div>
        <div class="flex justify-between font-mono text-[11px] text-ash">
          <span>Còn lại</span><span :class="tableRemaining(tb) > 0 ? 'text-rust font-semibold' : ''">{{ fmt(tableRemaining(tb)) }}</span>
        </div>
      </div>
    </transition-group>

    <div class="pt-2 space-y-4">
      <div>
        <h3 class="font-display text-xl font-semibold">Lịch Sử Đóng Bàn</h3>
        <p class="text-sm text-paper/50">Các bàn đã thanh toán đủ và đóng</p>
      </div>

      <div v-if="closedHistoryGroups.length === 0" class="border border-dashed border-white/10 rounded-xl py-10 text-center text-paper/30">
        <p class="text-sm">Chưa có lịch sử đóng bàn.</p>
      </div>

      <div v-for="(group, gi) in closedHistoryGroups" :key="group.key" class="space-y-3">
        <div v-if="gi > 0" class="dash-divider"></div>
        <h4 class="font-display text-lg font-semibold text-paper/80">{{ group.label }}</h4>
        <div class="space-y-2">
          <div v-for="row in group.items" :key="row.id"
            class="flex flex-wrap items-center justify-between gap-2 bg-ink2 border border-white/5 rounded-lg px-4 py-3 text-sm">
            <div class="min-w-0">
              <p class="font-semibold truncate">{{ row.tableName }}</p>
              <p class="text-[11px] font-mono text-paper/40">{{ row.time }} · {{ row.cups }} ly</p>
            </div>
            <span class="font-mono font-semibold text-copper shrink-0">{{ fmt(row.total) }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
  `,
};
