<script setup>
defineProps({
  tone: { type: String, default: 'cream' },
})
</script>

<template>
  <div class="bubble" :class="'tone-' + tone">
    <slot />
  </div>
</template>

<style scoped>
.bubble {
  position: relative;
  width: 100%;
  background: var(--cream);
  border: 3.5px solid var(--ink);
  border-radius: 22px;
  padding: 12px 20px 14px;
  box-shadow: 0 5px 0 rgba(44, 38, 32, 0.22);
  font-size: clamp(17px, 1.9vw, 22px);
  font-weight: 800;
  line-height: 1.28;
  color: var(--ink);
  animation: bubbleIn 0.35s cubic-bezier(0.2, 1.4, 0.4, 1);
  min-height: 58px;
  display: flex;
  align-items: center;
}

/* tail pointing left toward Pip */
.bubble::before {
  content: '';
  position: absolute;
  left: -13px;
  top: 50%;
  width: 16px;
  height: 16px;
  background: var(--cream);
  border-left: 3.5px solid var(--ink);
  border-bottom: 3.5px solid var(--ink);
  transform: translateY(-50%) rotate(45deg);
  border-bottom-left-radius: 4px;
}

.tone-night {
  background: #2b3766;
  color: #f2f0ff;
  border-color: #f2f0ff;
}

.tone-night::before {
  background: #2b3766;
  border-color: #f2f0ff;
}
</style>
