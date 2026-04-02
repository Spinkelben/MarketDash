<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Product } from '../models';

interface Props {
  item: Product
}

const open = defineModel<boolean>();

const props = defineProps<Props>()
const dialog = ref<HTMLDialogElement | null>(null);

watch(open, (newVal) => {
    if (newVal) {
        dialog.value?.showModal();
    }
});
</script>

<template>
    <dialog ref="dialog" class="menu-item-details" closedby="any" @close="open = false">
        <h1 class="item-name">{{ item.Name }}</h1>
        <img class="menu-img-big" :src="item.ImageUrl" alt="Menu Item Image" /> 
        <br>
        <p class="menu-item-description" >{{ item.DescriptionLong }}</p>
        <button @click.prevent="dialog?.close()" autofocus>Close</button> 
    </dialog>
</template>

<style scoped>
.menu-item-details {
    background-color: var(--accent-color);
    border-radius: 10px;
}

.menu-img-big {
    max-width: 75vw;
    min-width: 50vw;
    max-height: 30vh;
    object-fit: contain;
    margin: 0 auto;
    display: block;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    border-radius: 10px;
}

.menu-item-description {
    white-space: pre-wrap;
    display: block;
    max-width: 50vw;
    margin-top: 0.5em;
}
</style>