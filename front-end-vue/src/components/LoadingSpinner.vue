<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    size?: 'big' | 'small';
}

const props = withDefaults(defineProps<Props>(), {
    size: 'big'
});

const getRandomFoodIcon = () => {
    const foodEmoji = ['🌭', '🍔', '🍕', '🍖', '🍗', '🍚', '🍜', '🍞', '🍟', '🍠', '🍣', '🍤', '🍩', '🍪', '🍰', '🥐', '🥓', '🥖', '🦐', '🦑',
'🍿', '🥚', '🍳', '🧇', '🥞', '🧈', '🥨', '🧀', '🥗', '🥙', '🥪', '🌮', '🌯', '🥩', '🥟', '🥠', '🥡', '🍱', '🍘', '🍙', '🍛', '🦪', '🍥',
'🥮', '🍢', '🧆', '🥘', '🍲', '🍝', '🥣', '🥧', '🍦', '🍧', '🍨', '🎂', '🧁', '🍫', '🍮', '🍯', '🍷', '🍾', '🍼', '🍶', '🧉', '🍵', '☕',
'🧃', '🥛', '🍸', '🍹', '🍺', '🥂', '🥃', '🥤', '🥝', '🥥', '🍇', '🍎', '🥭', '🍍', '🍌', '🍋', '🍊', '🍉', '🍈', '🍏', '🍐', '🍑', '🍒',
'🍓', '🍅', '🍆', '🌽', '🧄', '🥔', '🥦', '🥬', '🥒','🥑', '💩', '🍄', '🌶', '🧅', '🥕', '🌰', '🥜'];
    return foodEmoji[Math.floor(Math.random() * foodEmoji.length)];
}

const foodIcon = computed(() => getRandomFoodIcon());
</script>

<template>
  <div id="load-icon" class="spinner" :class="props.size">{{ foodIcon }}</div>
</template>

<style scoped>
.spinner.big {
    font-size: 16em;
}

.spinner.small {
    font-size: 2em;
}

@media (max-width: 600px) {
    .spinner.big {
        font-size: 8em;
    }
    .spinner.small {
        font-size: 1.5em;
    }
}

.spinner {
    transform-origin: center;
    animation: spin 1s linear infinite;
    display: flex;
    justify-content: center;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(-360deg); }
}
</style>