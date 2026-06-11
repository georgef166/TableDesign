<script setup>
import { computed } from 'vue'
import StatusIcon from './StatusIcon.vue'

// AG Grid passes a `params` prop to cell renderer components.
const props = defineProps({ params: { type: Object, required: true } })
const status = computed(() => props.params.value)
</script>

<template>
  <!-- Colour + weight come from the global .status-* class AG Grid puts on the
       cell; the icon inherits that colour via stroke:currentColor. The inline
       margin is used (not flex gap) because a cell renderer's own scoped styles
       don't reach its root element in ag-grid-vue3. -->
  <span class="status-badge">
    <StatusIcon :status="status" :size="13" style="margin-right: 10px" />{{ status }}
  </span>
</template>
