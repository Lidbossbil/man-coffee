export default {
  props: {
    toasts: { type: Array, default: () => [] },
  },
  template: `
  <div class="fixed top-20 right-4 z-[60] space-y-2">
    <transition-group name="fade">
      <div v-for="t in toasts" :key="t.id" class="px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg text-white flex items-center gap-2"
        :class="t.type==='error' ? 'bg-rust' : 'bg-sage'">
        <i class="fa-solid" :class="t.type==='error' ? 'fa-circle-exclamation' : 'fa-circle-check'"></i> {{ t.msg }}
      </div>
    </transition-group>
  </div>
  `,
};
