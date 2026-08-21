export default {
  props: {
    firebaseReady: Boolean,
    currentView: String,
    tabs: { type: Array, default: () => [] },
    currentDateStr: String,
    username: String,
  },
  emits: ['update:currentView', 'show-sync-info', 'logout'],
  template: `
  <header class="bg-gradient-to-b from-ink to-ink2 text-paper sticky top-0 z-30 border-b border-copper/30">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
      <div class="flex items-center gap-3">
        <div class="bg-copper/15 border border-copper/40 p-2 rounded-lg text-copper text-lg">
          <i class="fa-solid fa-mug-hot"></i>
        </div>
        <div>
          <h1 class="font-display font-semibold text-lg leading-tight tracking-tight">Quầy Sổ — Coffee POS</h1>
          <p class="text-[11px] text-paper/50 font-mono">{{ currentDateStr }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span v-if="firebaseReady" class="text-[11px] font-mono px-2.5 py-1 rounded-full bg-sage/15 text-sage border border-sage/30 flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-sage animate-pulse"></span> Đồng bộ real-time
        </span>
        <span v-else class="text-[11px] font-mono px-2.5 py-1 rounded-full bg-rust/15 text-rust border border-rust/30 flex items-center gap-1.5 cursor-pointer" @click="$emit('show-sync-info')">
          <i class="fa-solid fa-triangle-exclamation"></i> Chế độ 1 thiết bị
        </span>
        <span v-if="username" class="hidden sm:inline text-[11px] font-mono text-paper/50 px-2">{{ username }}</span>
        <button v-if="username" @click="$emit('logout')" title="Đăng xuất"
          class="text-[11px] font-mono px-2.5 py-1 rounded-full border border-white/15 text-paper/60 hover:text-paper hover:border-white/30 flex items-center gap-1.5">
          <i class="fa-solid fa-right-from-bracket"></i> Thoát
        </button>
      </div>
    </div>
    <nav class="bg-ink2/60 border-t border-white/5">
      <div class="max-w-7xl mx-auto px-4 flex gap-6 text-sm">
        <button v-for="t in tabs" :key="t.id" @click="$emit('update:currentView', t.id)"
          class="py-3 flex items-center gap-2 border-b-2 transition-all"
          :class="currentView === t.id ? 'border-copper text-copper font-medium' : 'border-transparent text-paper/50 hover:text-paper/80'">
          <i :class="t.icon"></i> {{ t.label }}
        </button>
      </div>
    </nav>
  </header>
  `,
};
