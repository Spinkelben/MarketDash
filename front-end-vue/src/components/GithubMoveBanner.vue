<script setup lang="ts">
import { onMounted, ref } from 'vue';

const isVisible = ref(false);

const hideBanner = () => {
  isVisible.value = false;
  localStorage.setItem('githubRedirectSeen', 'true');
};

onMounted(() => {
  if (typeof window === 'undefined') {
    return;
  }

  const referrer = document.referrer;
  const alreadySeen = localStorage.getItem('githubRedirectSeen') === 'true';

  if ((!alreadySeen && referrer && referrer.includes('https://spinkelben.github.io'))) {
    isVisible.value = true;
  }
});
</script>

<template>
  <div
    id="github-banner"
    class="github-banner"
    v-if="isVisible"
    role="status"
    aria-live="polite"
  >
    <div>
      <span>The food dashboard has moved!</span>
      <p>
        Don't worry, you have already been redirected to the new home of the Food Dashboard:
        <a href="https://food.homelab.soren.ranneries.com" target="_blank" rel="noreferrer noopener">
          https://food.homelab.soren.ranneries.com
        </a>.
        Please update your bookmarks, if you have the page bookmarked. Otherwise you could take the opportunity
        to bookmark the page now 😁 Hit <strong>Ctrl+D</strong>.
        The reason for the move is purely technical, don't worry the site will function the same as before!
      </p>
    </div>
    <button
      class="banner-close"
      type="button"
      @click="hideBanner"
      aria-label="Close notification"
    >&times;</button>
  </div>
</template>

<style scoped>
.github-banner {
    background-color: #f0f8ff;
    border: 2px solid var(--primary-color);
    border-radius: 4px;
    padding: 1em;
    margin-bottom: 1em;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 500;
    color: var(--primary-color);
    animation: slideDown 0.3s ease-in-out;
}

.banner-close {
    background: none;
    border: none;
    font-size: 1.5em;
    cursor: pointer;
    color: var(--primary-color);
    padding: 0;
    margin-left: 1em;
}

.banner-close:hover {
    color: var(--secondary-color);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-0.6rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>