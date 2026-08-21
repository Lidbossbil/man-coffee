import { createApp, reactive, ref, computed, onMounted } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
import { FIREBASE_ENABLED } from './config.js';
import { makeFirebaseBackend, makeLocalBackend } from './db.js';
import { getSession, logout as clearSession } from './auth.js';
import { fmt, tableTotal, tableRemaining } from './utils.js';

import LoginView from './views/LoginView.js';
import DashboardView from './views/DashboardView.js';
import TablesView from './views/TablesView.js';
import MenuView from './views/MenuView.js';
import AppHeader from './components/AppHeader.js';
import OpenTableModal from './components/OpenTableModal.js';
import OrderModal from './components/OrderModal.js';
import MenuModal from './components/MenuModal.js';
import ToastHost from './components/ToastHost.js';

let dbApi;

const DEFAULT_MENU = [
  { id: 'm1', name: 'Cà Phê Đen', size: 'M', price: 15000, image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300', isVisible: true },
  { id: 'm2', name: 'Cà Phê Sữa', size: 'M', price: 18000, image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300', isVisible: true },
  { id: 'm3', name: 'Bạc Sỉu', size: 'M', price: 20000, image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=300', isVisible: true },
  { id: 'm4', name: 'Cà Phê Muối', size: 'L', price: 25000, image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300', isVisible: true },
  { id: 'm5', name: 'Trà Trái Cây', size: 'L', price: 25000, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300', isVisible: true },
];

createApp({
  components: {
    LoginView,
    DashboardView,
    TablesView,
    MenuView,
    AppHeader,
    OpenTableModal,
    OrderModal,
    MenuModal,
    ToastHost,
  },
  setup() {
    const session = ref(getSession());
    const firebaseReady = ref(false);
    const currentView = ref('dashboard');
    const showSyncInfo = ref(false);

    const tabs = [
      { id: 'dashboard', label: 'Thống Kê', icon: 'fa-solid fa-chart-line' },
      { id: 'tables', label: 'Bàn & Đơn', icon: 'fa-solid fa-store' },
      { id: 'menu', label: 'Quản Lý Món', icon: 'fa-solid fa-mug-saucer' },
    ];

    const menuItems = ref([]);
    const tables = ref([]);
    const salesHistory = ref([]);

    onMounted(async () => {
      if (FIREBASE_ENABLED) {
        try {
          dbApi = await makeFirebaseBackend();
          firebaseReady.value = true;
        } catch (e) {
          console.error('Firebase init lỗi, chuyển sang chế độ local:', e);
          dbApi = makeLocalBackend();
        }
      } else {
        dbApi = makeLocalBackend();
      }

      dbApi.watch('menu', (data) => {
        const list = Object.entries(data).map(([id, v]) => ({ id, ...v }));
        menuItems.value = list.length ? list : DEFAULT_MENU;
        if (!list.length) DEFAULT_MENU.forEach(({ id, ...rest }) => dbApi.setItem('menu', id, rest));
      });
      dbApi.watch('tables', (data) => {
        tables.value = Object.entries(data).map(([id, v]) => ({ id, items: [], paidAmount: 0, ...v }));
      });
      dbApi.watch('sales', (data) => {
        salesHistory.value = Object.entries(data).map(([id, v]) => ({ id, ...v }));
      });
    });

    const toasts = ref([]);
    function toast(msg, type = 'success') {
      const id = Date.now();
      toasts.value.push({ id, msg, type });
      setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id); }, 2500);
    }

    const currentDateStr = new Date().toLocaleDateString('vi-VN', {
      weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
    });
    const sortedTables = computed(() => [...tables.value].sort((a, b) => b.createdAt - a.createdAt));

    function onLoginSuccess(s) {
      session.value = s;
    }
    function doLogout() {
      clearSession();
      session.value = null;
      currentView.value = 'dashboard';
    }

    const showOpenTableModal = ref(false);
    const newTableName = ref('');
    const newTableType = ref('tai_cho');
    let tableCounter = 1;

    function openNewTableDialog() {
      newTableName.value = '';
      newTableType.value = 'tai_cho';
      showOpenTableModal.value = true;
    }
    async function confirmOpenTable() {
      const name = newTableName.value.trim() || `Khách #${tableCounter}`;
      const id = dbApi.newId('tables');
      const code = String(tableCounter++).padStart(3, '0');
      await dbApi.setItem('tables', id, {
        name, type: newTableType.value, code, items: [], paidAmount: 0, createdAt: Date.now(),
      });
      showOpenTableModal.value = false;
      toast(`Đã mở ${name}`);
    }

    const showOrderModal = ref(false);
    const activeTable = ref(null);
    const partialPayInput = ref(null);
    const visibleMenu = computed(() => menuItems.value.filter(m => m.isVisible));
    const orderTotal = computed(() => activeTable.value ? tableTotal(activeTable.value) : 0);
    const orderRemaining = computed(() => activeTable.value ? tableRemaining(activeTable.value) : 0);

    function openOrderModal(tb) {
      activeTable.value = JSON.parse(JSON.stringify(tb));
      partialPayInput.value = null;
      showOrderModal.value = true;
    }
    function closeOrderModal() {
      showOrderModal.value = false;
      activeTable.value = null;
    }
    function addItemToOrder(m) {
      const existing = activeTable.value.items.find(it => it.menuId === m.id);
      if (existing) existing.qty++;
      else activeTable.value.items.push({
        uid: m.id + '_' + Date.now(), menuId: m.id, name: m.name, size: m.size, price: m.price, qty: 1,
      });
    }
    function changeQty(it, delta) {
      it.qty += delta;
      if (it.qty <= 0) activeTable.value.items = activeTable.value.items.filter(x => x.uid !== it.uid);
    }
    async function persistActiveTable() {
      const { id, ...data } = activeTable.value;
      await dbApi.setItem('tables', id, data);
    }
    async function saveTempState() {
      await persistActiveTable();
      toast('Đã tạm lưu trạng thái bàn');
    }
    async function processPartialPay() {
      const amt = Number(partialPayInput.value);
      if (!amt || amt <= 0) { toast('Nhập số tiền hợp lệ', 'error'); return; }
      activeTable.value.paidAmount = (activeTable.value.paidAmount || 0) + amt;
      partialPayInput.value = null;
      await persistActiveTable();
      toast(`Ghi nhận đã trả ${fmt(amt)}`);
    }
    async function processFullPayAndClose() {
      if (!activeTable.value?.items?.length) return;
      const total = tableTotal(activeTable.value);
      const remaining = total - (activeTable.value.paidAmount || 0);
      if (remaining > 0) activeTable.value.paidAmount = total;
      const saleId = dbApi.newId('sales');
      await dbApi.setItem('sales', saleId, {
        items: activeTable.value.items,
        total,
        closedAt: Date.now(),
        tableName: activeTable.value.name,
      });
      await dbApi.removeItem('tables', activeTable.value.id);
      showOrderModal.value = false;
      toast(`Đã thanh toán & đóng ${activeTable.value.name}`);
      activeTable.value = null;
    }

    const showMenuModal = ref(false);
    const editingMenuItem = ref(null);
    const menuForm = reactive({ name: '', size: 'M', price: 0, image: '', isVisible: true });

    function openMenuDialog(m) {
      editingMenuItem.value = m;
      if (m) Object.assign(menuForm, m);
      else Object.assign(menuForm, { name: '', size: 'M', price: 0, image: '', isVisible: true });
      showMenuModal.value = true;
    }
    async function saveMenuItem() {
      if (!menuForm.name.trim() || !menuForm.price) { toast('Nhập đủ tên và giá món', 'error'); return; }
      const id = editingMenuItem.value?.id || dbApi.newId('menu');
      const image = menuForm.image.trim() || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300';
      await dbApi.setItem('menu', id, {
        name: menuForm.name.trim(), size: menuForm.size, price: menuForm.price, image, isVisible: menuForm.isVisible,
      });
      showMenuModal.value = false;
      toast('Đã lưu món');
    }
    async function toggleVisibility(m) {
      const { id, ...rest } = m;
      await dbApi.setItem('menu', id, { ...rest, isVisible: !m.isVisible });
      toast(m.isVisible ? 'Đã ẩn món' : 'Đã hiện món');
    }
    async function deleteMenuItem(m) {
      if (!confirm(`Xóa món "${m.name}"?`)) return;
      await dbApi.removeItem('menu', m.id);
      toast('Đã xóa món');
    }

    return {
      session, onLoginSuccess, doLogout,
      firebaseReady, currentView, showSyncInfo, tabs, currentDateStr,
      menuItems, tables, sortedTables, salesHistory,
      showOpenTableModal, newTableName, newTableType, openNewTableDialog, confirmOpenTable,
      showOrderModal, activeTable, visibleMenu, orderTotal, orderRemaining, partialPayInput,
      openOrderModal, closeOrderModal, addItemToOrder, changeQty, saveTempState, processPartialPay, processFullPayAndClose,
      showMenuModal, editingMenuItem, menuForm, openMenuDialog, saveMenuItem, toggleVisibility, deleteMenuItem,
      toasts,
    };
  },
  template: `
  <LoginView v-if="!session" @success="onLoginSuccess" />

  <div v-else class="min-h-screen flex flex-col">
    <AppHeader
      :firebase-ready="firebaseReady"
      :current-view="currentView"
      :tabs="tabs"
      :current-date-str="currentDateStr"
      :username="session.username"
      @update:current-view="currentView = $event"
      @show-sync-info="showSyncInfo = true"
      @logout="doLogout"
    />

    <main class="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 bg-ink text-paper">
      <DashboardView
        v-if="currentView === 'dashboard'"
        :sales-history="salesHistory"
        :active="currentView === 'dashboard'"
      />
      <TablesView
        v-else-if="currentView === 'tables'"
        :sorted-tables="sortedTables"
        :sales-history="salesHistory"
        @open-new="openNewTableDialog"
        @open-order="openOrderModal"
      />
      <MenuView
        v-else-if="currentView === 'menu'"
        :menu-items="menuItems"
        @add="openMenuDialog(null)"
        @edit="openMenuDialog"
        @toggle="toggleVisibility"
        @delete="deleteMenuItem"
      />
    </main>

    <OpenTableModal
      v-model:show="showOpenTableModal"
      v-model:new-table-name="newTableName"
      v-model:new-table-type="newTableType"
      @confirm="confirmOpenTable"
    />

    <OrderModal
      :show="showOrderModal"
      :active-table="activeTable"
      :visible-menu="visibleMenu"
      :order-total="orderTotal"
      :order-remaining="orderRemaining"
      v-model:partial-pay-input="partialPayInput"
      @close="closeOrderModal"
      @add-item="addItemToOrder"
      @change-qty="changeQty"
      @partial-pay="processPartialPay"
      @save-temp="saveTempState"
      @full-pay="processFullPayAndClose"
    />

    <MenuModal
      v-model:show="showMenuModal"
      :editing-menu-item="editingMenuItem"
      :menu-form="menuForm"
      @save="saveMenuItem"
    />

    <div v-if="showSyncInfo" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="showSyncInfo = false">
      <div class="bg-ink2 border border-white/10 rounded-2xl w-full max-w-lg p-5 text-paper text-sm leading-relaxed">
        <h3 class="font-display font-semibold text-lg mb-2">Chưa cấu hình đồng bộ nhiều thiết bị</h3>
        <p class="text-paper/60 mb-3">Ứng dụng đang lưu dữ liệu bằng <span class="font-mono text-copper">localStorage</span> — chỉ thiết bị này thấy được thay đổi. Để nhiều nhân viên trên nhiều điện thoại/máy tính cùng thấy trạng thái bàn theo thời gian thực, điền cấu hình Firebase vào <span class="font-mono text-copper">js/config.js</span> (xem hướng dẫn kèm theo).</p>
        <button @click="showSyncInfo = false" class="w-full py-2.5 rounded-lg bg-copper text-ink font-semibold text-sm mt-2">Đã hiểu</button>
      </div>
    </div>

    <ToastHost :toasts="toasts" />
  </div>
  `,
}).mount('#app');
