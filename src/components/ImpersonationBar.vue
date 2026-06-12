<script setup>
// Persistent banner shown while an admin is impersonating a client user (the FY26
// "user impersonation" ask — view a client's portal to troubleshoot their issues).
const props = defineProps({ user: { type: Object, required: true } })
const emit = defineEmits(['exit'])
</script>

<template>
  <div class="imp-bar" role="status">
    <span class="imp-ico">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /><path d="M2 2l20 20" opacity=".45" />
      </svg>
    </span>
    <span class="imp-text">
      Viewing as <b>{{ user.name }}</b> · {{ user.firm }}
      <span class="imp-role">client</span>
    </span>
    <button class="imp-exit" @click="emit('exit')">
      Exit impersonation
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
    </button>
  </div>
</template>

<style scoped>
.imp-bar {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 28px; background: var(--brand-900); color: #fff;
}
.imp-ico { display: grid; place-items: center; }
.imp-ico svg { width: 16px; height: 16px; }
.imp-text { font-size: 13px; }
.imp-text b { font-weight: 700; }
.imp-role {
  margin-left: 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em;
  background: rgba(255,255,255,.2); border-radius: 99px; padding: 2px 8px;
}
.imp-exit {
  margin-left: auto; display: inline-flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,.15); color: #fff; border: 1px solid rgba(255,255,255,.3);
  border-radius: var(--radius-sm); padding: 5px 12px; font-size: 12.5px; font-weight: 600;
}
.imp-exit:hover { background: rgba(255,255,255,.26); }
.imp-exit svg { width: 13px; height: 13px; }
</style>
