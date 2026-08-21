import { ref, computed, watch, nextTick, onMounted } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
import { fmt, startOfDay, startOfWeek, startOfMonth } from '../utils.js';

const PERIOD_OPTIONS = [
  { id: 'day', label: 'Ngày này' },
  { id: 'week', label: 'Tuần này' },
  { id: 'month', label: 'Tháng này' },
];

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export default {
  props: {
    salesHistory: { type: Array, default: () => [] },
    active: { type: Boolean, default: false },
  },
  setup(props) {
    const period = ref('day');
    const chartCanvas = ref(null);
    let chartInst = null;

    const periodStart = computed(() => {
      const now = Date.now();
      if (period.value === 'day') return startOfDay(now);
      if (period.value === 'week') return startOfWeek(now);
      return startOfMonth(now);
    });

    const periodSales = computed(() =>
      props.salesHistory.filter(s => s.closedAt >= periodStart.value));

    const periodRevenue = computed(() =>
      periodSales.value.reduce((a, s) => a + s.total, 0));

    const periodCups = computed(() =>
      periodSales.value.reduce((a, s) => a + (s.items || []).reduce((b, it) => b + it.qty, 0), 0));

    const periodOrders = computed(() => periodSales.value.length);

    const periodAvg = computed(() =>
      periodOrders.value ? Math.round(periodRevenue.value / periodOrders.value) : 0);

    const periodSubtitle = computed(() => {
      if (period.value === 'day') return 'Theo giờ trong hôm nay';
      if (period.value === 'week') return 'Từ thứ Hai đến Chủ nhật tuần này';
      return 'Từ ngày 01 đầu tháng đến hiện tại';
    });

    const chartTitle = computed(() => {
      if (period.value === 'day') return 'Doanh Thu Theo Giờ';
      if (period.value === 'week') return 'Doanh Thu Theo Ngày Trong Tuần';
      return 'Doanh Thu Theo Ngày Trong Tháng';
    });

    const topSubtitle = computed(() => {
      if (period.value === 'day') return 'Hôm nay · nhiều → ít';
      if (period.value === 'week') return 'Tuần này · nhiều → ít';
      return 'Tháng này · nhiều → ít';
    });

    const kpis = computed(() => [
      { label: 'Doanh thu', value: fmt(periodRevenue.value), color: 'text-copper' },
      { label: 'Số đơn đóng', value: String(periodOrders.value), color: 'text-paper' },
      { label: 'Số ly đã bán', value: periodCups.value + ' ly', color: 'text-sage' },
      { label: 'TB / đơn', value: fmt(periodAvg.value), color: 'text-paper' },
    ]);

    const topDrinks = computed(() => {
      const map = {};
      periodSales.value.forEach(s => (s.items || []).forEach(it => {
        const key = `${it.name} (${it.size})`;
        map[key] = (map[key] || 0) + it.qty;
      }));
      return Object.entries(map).map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty);
    });

    function buildChartSeries() {
      const now = new Date();
      const sales = props.salesHistory;

      if (period.value === 'day') {
        const dayStart = startOfDay(now);
        const labels = [...Array(24)].map((_, h) => String(h).padStart(2, '0') + 'h');
        const data = labels.map((_, h) => {
          const from = dayStart + h * 3600000;
          const to = from + 3600000;
          return sales
            .filter(s => s.closedAt >= from && s.closedAt < to)
            .reduce((a, s) => a + s.total, 0);
        });
        return { labels, data };
      }

      if (period.value === 'week') {
        const weekStart = startOfWeek(now);
        const labels = WEEKDAY_LABELS;
        const data = labels.map((_, i) => {
          const from = weekStart + i * 86400000;
          const to = from + 86400000;
          return sales
            .filter(s => s.closedAt >= from && s.closedAt < to)
            .reduce((a, s) => a + s.total, 0);
        });
        return { labels, data };
      }

      const monthStart = startOfMonth(now);
      const today = startOfDay(now);
      const days = Math.floor((today - monthStart) / 86400000) + 1;
      const labels = [...Array(days)].map((_, i) => {
        const d = new Date(monthStart + i * 86400000);
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      });
      const data = labels.map((_, i) => {
        const from = monthStart + i * 86400000;
        const to = from + 86400000;
        return sales
          .filter(s => s.closedAt >= from && s.closedAt < to)
          .reduce((a, s) => a + s.total, 0);
      });
      return { labels, data };
    }

    function drawChart() {
      if (!chartCanvas.value || typeof Chart === 'undefined') return;
      const { labels, data } = buildChartSeries();
      if (chartInst) chartInst.destroy();
      chartInst = new Chart(chartCanvas.value, {
        type: 'bar',
        data: { labels, datasets: [{ data, backgroundColor: '#BE7B45', borderRadius: 4 }] },
        options: {
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: '#8A7F70', font: { family: 'JetBrains Mono', size: 10 } }, grid: { display: false } },
            y: { ticks: { color: '#8A7F70', font: { family: 'JetBrains Mono', size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
          },
        },
      });
    }

    watch(() => props.salesHistory, () => nextTick(drawChart), { deep: true });
    watch(period, () => nextTick(drawChart));
    watch(() => props.active, (v) => { if (v) nextTick(drawChart); });
    onMounted(() => nextTick(drawChart));

    return {
      period,
      PERIOD_OPTIONS,
      periodSubtitle,
      chartTitle,
      topSubtitle,
      kpis,
      topDrinks,
      chartCanvas,
    };
  },
  template: `
  <section class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
      <div>
        <h2 class="font-display text-2xl font-semibold">Thống Kê Doanh Thu</h2>
        <p class="text-sm text-paper/50">{{ periodSubtitle }}</p>
      </div>
      <select v-model="period"
        class="bg-ink2 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-paper focus:outline-none focus:border-copper">
        <option v-for="opt in PERIOD_OPTIONS" :key="opt.id" :value="opt.id">{{ opt.label }}</option>
      </select>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="k in kpis" :key="k.label" class="bg-ink2 border border-white/5 rounded-xl p-5">
        <p class="text-[11px] uppercase tracking-wider text-paper/40 font-mono">{{ k.label }}</p>
        <h3 class="font-mono text-2xl font-semibold mt-1.5" :class="k.color">{{ k.value }}</h3>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div class="lg:col-span-2 bg-ink2 border border-white/5 rounded-xl p-5">
        <div class="flex justify-between items-center mb-3">
          <h3 class="font-display font-semibold text-lg">{{ chartTitle }}</h3>
          <span class="text-[11px] font-mono text-paper/40">VNĐ</span>
        </div>
        <div class="h-72"><canvas ref="chartCanvas"></canvas></div>
      </div>

      <div class="bg-ink2 border border-white/5 rounded-xl p-5">
        <h3 class="font-display font-semibold text-lg mb-1">Xếp Hạng Ly Đã Bán</h3>
        <p class="text-[11px] text-paper/40 mb-3 font-mono">{{ topSubtitle }}</p>
        <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
          <div v-if="topDrinks.length === 0" class="text-sm text-paper/30 italic py-6 text-center">Chưa có dữ liệu bán hàng</div>
          <div v-for="(d, i) in topDrinks" :key="d.name" class="flex items-center gap-3 text-sm">
            <span class="font-mono text-copper w-5 text-right">{{ i+1 }}</span>
            <span class="flex-grow truncate">{{ d.name }}</span>
            <span class="font-mono font-semibold">{{ d.qty }} ly</span>
          </div>
        </div>
      </div>
    </div>
  </section>
  `,
};
