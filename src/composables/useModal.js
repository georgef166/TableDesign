import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

// Shared modal/drawer behaviour for accessible dialogs: Escape-to-close, a focus
// trap (Tab cycles within the dialog), focus moved into the dialog on open and
// returned to the trigger on close, and a body scroll-lock. Bind the returned
// `dialogRef` to the dialog's root element and pass the close callback:
//
//   const { dialogRef } = useModal(() => emit('close'))
//   <div class="modal" ref="dialogRef" role="dialog" aria-modal="true"> … </div>
//
// A module-level stack keeps nested dialogs sane: only the topmost handles
// Escape/Tab, and the scroll-lock lifts only when the last one closes.
const stack = []
let savedOverflow = null

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])',
  'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])'
].join(',')

function focusable(root) {
  if (!root) return []
  // Visible focusables only (a hidden file input or display:none control isn't a tab stop).
  return [...root.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null || el === document.activeElement)
}

export function useModal(onClose, opts = {}) {
  const dialogRef = ref(null)
  let trigger = null
  const self = {}

  const isTop = () => stack[stack.length - 1] === self

  function onKeydown(e) {
    if (!isTop()) return
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'Tab') {
      const els = focusable(dialogRef.value)
      if (!els.length) { e.preventDefault(); return }
      const first = els[0], last = els[els.length - 1]
      const active = document.activeElement
      // Wrap around the ends, and pull focus back in if it has escaped the dialog.
      if (e.shiftKey && (active === first || !dialogRef.value.contains(active))) {
        e.preventDefault(); last.focus()
      } else if (!e.shiftKey && (active === last || !dialogRef.value.contains(active))) {
        e.preventDefault(); first.focus()
      }
    }
  }

  onMounted(() => {
    trigger = document.activeElement
    stack.push(self)
    document.addEventListener('keydown', onKeydown)
    if (stack.length === 1) {
      savedOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    // Move focus into the dialog — unless it already manages its own (e.g. an
    // autofocused typeahead), in which case leave that focus alone.
    nextTick(() => {
      const root = dialogRef.value
      if (!root || root.contains(document.activeElement)) return
      const target = opts.initialFocus?.value || focusable(root)[0] || root
      target.focus?.()
    })
  })

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', onKeydown)
    const i = stack.indexOf(self)
    if (i !== -1) stack.splice(i, 1)
    if (stack.length === 0) document.body.style.overflow = savedOverflow || ''
    // Return focus to whatever opened the dialog.
    trigger?.focus?.()
  })

  return { dialogRef }
}
