<script setup>
/* One shape per status so meaning never rides on colour alone (WCAG 1.4.1).
 * Reused by the status badge and the filter stat cards. */
defineProps({
  status: { type: String, required: true },   // APPROVED | PENDING | REJECTED | ALL
  size: { type: [Number, String], default: 14 }
})
</script>

<template>
  <svg class="status-ic" :width="size" :height="size" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"
       aria-hidden="true">
    <!-- Approved: check in circle -->
    <template v-if="status === 'APPROVED'">
      <circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </template>
    <!-- Pending: clock -->
    <template v-else-if="status === 'PENDING'">
      <circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3 2" />
    </template>
    <!-- Rejected: x in circle -->
    <template v-else-if="status === 'REJECTED'">
      <circle cx="12" cy="12" r="9" /><path d="M9 9l6 6M15 9l-6 6" />
    </template>
    <!-- All requests: stacked rows -->
    <template v-else>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </template>
  </svg>
</template>

<style scoped>
/* inline-block + vertical-align:middle centers the glyph beside text in plain
   inline flow (the grid badge) and is harmless inside the flex stat cards. */
.status-ic { display: inline-block; vertical-align: middle; flex: none; }
</style>
