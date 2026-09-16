<script setup lang="ts">
import { useKanban } from '../stores/kanban';

defineProps<{ title: string }>();
const store = useKanban();
</script>

<template>
  <div class="page-frame">
    <div class="page-frame-inner">
      <header class="top-banner">
        <h1>{{ title }}</h1>
        <span class="phone-callout">1-800-KANBANGO</span>
        <slot name="banner-action" />
      </header>

      <main class="page-main">
        <slot />
      </main>

      <footer class="footer-band">
        <nav class="icon-label-nav">
          <RouterLink to="/">BOARDS</RouterLink>
          <span>EXPORT</span>
          <span>IMPORT</span>
          <span>SUPPORT</span>
        </nav>
        <p v-if="store.saveFailed" class="error-line">
          Storage is full or unavailable — export your board to keep a copy. Data stays in memory for this session.
        </p>
        <p class="footer-copy">© 1996 KANBANGO. This site is best viewed in 800×600 with browser versions 3.0 and higher.</p>
        <p class="footer-copy"><a href="#">Copyright</a> · <a href="#">(Terms of Use)</a></p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.page-main { flex: 1; padding: var(--sp-lg); }
</style>
