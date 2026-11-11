<script setup>
import { onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  min: { type: Number, default: 1 },
  max: { type: Number, default: 10 },
  disabled: { type: Boolean, default: false },
  hit: { type: Number, default: null },
  miss: { type: Number, default: null },
})

const emit = defineEmits(['pick'])

function numbers() {
  const out = []
  for (let n = props.min; n <= props.max; n++) out.push(n)
  return out
}

function tap(n) {
  if (props.disabled) return
  emit('pick', n)
}

function onKey(e) {
  if (props.disabled) return
  const n = e.key === '0' ? 10 : Number(e.key)
  if (!Number.isInteger(n) || n < props.min || n > props.max) return
  e.preventDefault()
  emit('pick', n)
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="pad" :class="{ 'pad-disabled': disabled }">
    <button
      v-for="n in numbers()"
      :key="n"
      class="pad-btn"
      :class="{ 'is-hit': hit === n, 'is-miss': miss === n }"
      :disabled="disabled"
      type="button"
      @click="tap(n)"
    >
      {{ n }}
    </button>
  </div>
</template>

<style scoped>
.pad {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: clamp(7px, 1vw, 12px);
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
}

.pad-btn {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(26px, 3.6vw, 40px);
  padding: 0.1em 0 0.16em;
  min-height: clamp(58px, 8.6vh, 82px);
  border: 4px solid var(--ink);
  border-radius: 20px;
  background: var(--cream);
  box-shadow: 0 6px 0 var(--ink);
  transition: transform 0.12s ease, box-shadow 0.12s ease, background 0.2s ease;
  touch-action: manipulation;
}

.pad-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 0 var(--ink);
}

.pad-btn:active:not(:disabled) {
  transform: translateY(5px);
  box-shadow: 0 1px 0 var(--ink);
}

.pad-btn.is-hit {
  background: var(--mint);
  animation: popIn 0.45s ease;
}

.pad-btn.is-miss {
  background: #ffd9d2;
  animation: shakeX 0.45s ease;
}

.pad-btn:disabled {
  opacity: 0.45;
  box-shadow: 0 4px 0 rgba(44, 38, 32, 0.35);
  cursor: default;
}

@media (max-width: 520px) {
  .pad {
    gap: 6px;
  }
  .pad-btn {
    border-width: 3px;
    border-radius: 14px;
    box-shadow: 0 4px 0 var(--ink);
    min-height: 54px;
  }
}
</style>
