<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Product } from '../models';

interface Props {
  item?: Product;
  name?: string;
  imageUrl?: string;
  description?: string;
  dialogClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  item: undefined,
  name: '',
  imageUrl: '',
  description: '',
  dialogClass: 'menu-item-details',
});

const open = defineModel<boolean>({ default: false });
const dialog = ref<HTMLDialogElement | null>(null);

const resolvedName = computed(() => props.name || props.item?.Name || '');
const resolvedImageUrl = computed(() => props.imageUrl || props.item?.ImageUrl || '');
const resolvedDescription = computed(() => props.description || props.item?.DescriptionLong || '');
const isResultDialog = computed(() => props.dialogClass === 'result-dish-details');
const titleClass = computed(() => (isResultDialog.value ? 'result-details-name' : 'item-name'));
const descriptionClass = computed(() => (isResultDialog.value ? 'result-details-description' : 'menu-item-description'));
const imageClass = computed(() => (isResultDialog.value ? 'result-details-img' : 'menu-img-big'));

watch(open, (newVal) => {
  if (newVal) {
    dialog.value?.showModal();
  } else {
    dialog.value?.close();
  }
});

watch([resolvedName, resolvedImageUrl, resolvedDescription], () => {
  if (open.value && dialog.value && !dialog.value.open) {
    dialog.value.showModal();
  }
});

const closeDialog = () => {
  dialog.value?.close();
  open.value = false;
};
</script>

<template>
  <dialog
    ref="dialog"
    :class="dialogClass"
    closedby="any"
    @close="open = false"
  >
    <h1 :class="titleClass">{{ resolvedName }}</h1>
    <img
      v-if="resolvedImageUrl"
      :class="imageClass"
      :src="resolvedImageUrl"
      alt="Menu Item Image"
    />
    <br>
    <p :class="descriptionClass">{{ resolvedDescription }}</p>
    <button @click.prevent="closeDialog()" autofocus>Close</button>
  </dialog>
</template>

<style scoped>
.menu-item-details,
.result-dish-details {
  background-color: var(--accent-color, #dee5f2);
  border-radius: 10px;
  box-sizing: border-box;
}

.result-dish-details {
  max-width: 80vw;
  max-height: 80vh;
}

.menu-item-details::backdrop,
.result-dish-details::backdrop {
  background-color: rgba(0, 0, 0, 0.5);
}

.menu-img-big,
.result-details-img {
  max-width: 100%;
  min-width: 0;
  max-height: 30vh;
  object-fit: contain;
  margin: 0 auto;
  display: block;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}

.result-details-img {
  max-width: 75vw;
  min-width: 50vw;
}

.menu-item-description,
.result-details-description {
  white-space: pre-wrap;
  display: block;
  max-width: 50vw;
  margin-top: 0.5em;
  font-family: Verdana, Geneva, Tahoma, sans-serif;
  color: var(--font-color, #1a1b1d);
  padding: 1em;
  text-align: left;
}

.item-name,
.result-details-name {
  margin: 0 0 0.75em;
  color: var(--primary-color, #1670d6);
  font-family: Arial, Helvetica, sans-serif;
  text-align: center;
}

button {
  display: block;
  background-color: var(--primary-color, #1670d6);
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 20px;
  cursor: pointer;
  transition: background-color 0.3s;
  border-radius: 10px;
}

button:hover {
  background-color: var(--secondary-color, #1a1b1d);
}
</style>