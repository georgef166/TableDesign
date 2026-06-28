<script setup>
import { useModal } from '../composables/useModal.js'

// Reusable yes/no confirmation modal. Gates destructive or consequential actions
// (e.g. deleting a schedule list, firing a run) behind an explicit confirm step.
// Markup mirrors the app's other modals (.modal role="dialog") and reuses the
// global .btn styles. Emits `confirm` / `cancel`.
defineProps({
  title: { type: String, default: 'Are you sure?' },
  message: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Confirm' },
  cancelLabel: { type: String, default: 'Cancel' },
  tone: { type: String, default: 'normal' }   // 'normal' | 'danger'
})
const emit = defineEmits(['confirm', 'cancel'])

// Escape cancels; focus is trapped and returned to the trigger on close.
const { dialogRef } = useModal(() => emit('cancel'))
</script>

<template>
  <div class="overlay" @click.self="emit('cancel')">
    <div class="modal" ref="dialogRef" role="dialog" aria-modal="true" :aria-label="title">
      <div class="cd-body">
        <span class="cd-ico" :class="tone">
          <svg v-if="tone === 'danger'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.5" /></svg>
        </span>
        <div class="cd-text">
          <h2>{{ title }}</h2>
          <p v-if="message">{{ message }}</p>
        </div>
      </div>
      <footer class="modal-foot">
        <button class="btn ghost" @click="emit('cancel')">{{ cancelLabel }}</button>
        <button class="btn" :class="tone === 'danger' ? 'danger' : 'primary'" @click="emit('confirm')">{{ confirmLabel }}</button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed; inset: 0; background: rgba(15, 23, 42, .45);
  display: grid; place-items: center; padding: 24px; z-index: 60;
}
.modal {
  width: 100%; max-width: 420px; background: var(--surface);
  border-radius: var(--radius); box-shadow: var(--shadow-lg);
  display: flex; flex-direction: column;
}
.cd-body { display: flex; gap: 14px; padding: 24px 24px 18px; }
.cd-ico {
  flex: none; width: 38px; height: 38px; border-radius: 50%;
  display: grid; place-items: center;
}
.cd-ico svg { width: 19px; height: 19px; }
.cd-ico.danger { background: var(--bad-bg); color: var(--bad); }
.cd-ico.normal { background: var(--brand-50); color: var(--brand-700); }
.cd-text h2 { margin: 0; font-size: 16px; }
.cd-text p { margin: 6px 0 0; font-size: 13px; color: var(--text-soft); line-height: 1.45; }

.modal-foot {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 14px 24px; border-top: 1px solid var(--border); background: var(--surface-2);
}
.btn {
  border: 1px solid transparent; border-radius: var(--radius-sm);
  padding: 9px 18px; font-size: 13px; font-weight: 600; transition: background .12s, border-color .12s;
}
.btn.ghost { background: var(--surface); border-color: var(--border); color: var(--text-soft); }
.btn.ghost:hover { background: var(--surface-2); border-color: var(--text-mute); }
.btn.primary { background: var(--brand-500); color: #fff; }
.btn.primary:hover { background: var(--brand-700); }
.btn.danger { background: var(--bad); color: #fff; }
.btn.danger:hover { filter: brightness(.92); }
</style>
