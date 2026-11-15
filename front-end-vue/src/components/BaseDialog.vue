<script setup lang="ts">
import { useTemplateRef, watchPostEffect } from 'vue';

/**
 * A modal dialog whose visibility is bound with `v-model:open`.
 *
 * Wraps the native <dialog> so callers never touch showModal()/close():
 * they flip a boolean, and get it flipped back when the user dismisses the
 * dialog with Esc or by clicking the backdrop. The slot is only rendered
 * while the dialog is open.
 *
 * A `class` on <BaseDialog> lands on the <dialog> element, so callers style
 * the box (size, background, radius, ::backdrop) from their own scoped CSS.
 * Padding belongs on the slotted content: the dialog itself has none, which
 * is what lets a click on the dialog element be read as a backdrop click.
 */
const open = defineModel<boolean>('open', { required: true });
const dialog = useTemplateRef('dialog');

// Keep the element in step with the model. Runs after the DOM is updated, so
// the slot content exists (and `autofocus` works) by the time it is shown.
watchPostEffect(() => {
  const el = dialog.value;
  if (!el) return;
  if (open.value && !el.open) el.showModal();
  else if (!open.value && el.open) el.close();
});

// The browser fires `close` however the dialog was closed, including by Esc,
// but does so asynchronously. If the dialog has been reopened in the meantime
// the event is stale and must not close it again.
function onClose() {
  if (!dialog.value?.open) open.value = false;
}
</script>

<template>
  <dialog ref="dialog" class="base-dialog" @close="onClose" @click.self="open = false">
    <div v-if="open">
      <slot />
    </div>
  </dialog>
</template>

<style scoped>
.base-dialog {
  padding: 0;
}

.base-dialog::backdrop {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
