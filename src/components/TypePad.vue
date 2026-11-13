<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { sfx } from '../lib/audio.js'

const props = defineProps({
  disabled: { type: Boolean, default: false },
  hit: { type: Boolean, default: false },
  maxDigits: { type: Number, default: 2 },
  digits: { type: Number, default: 9 },
  // auto-submit once this many digits are typed (0 = wait for the ✓ button)
  answerLength: { type: Number, default: 0 },
})

const keyColumns = computed(() => (props.digits > 5 ? 6 : 4))

const emit = defineEmits(['submit'])

const value = ref('')
const shake = ref(false)
const canCheck = computed(() => value.value !== '' && !props.disabled)

function press(d) {
  if (props.disabled) return
  if (value.value.length >= props.maxDigits) return
  if (value.value === '0') value.value = ''
  value.value += String(d)
  sfx.tap()
}

function back() {
  if (props.disabled) return
  value.value = value.value.slice(0, -1)
}

function submit() {
  if (!canCheck.value) return
  emit('submit', Number(value.value))
}

watch(value, (v) => {
  if (props.answerLength && v.length >= props.answerLength && !props.disabled) submit()
})

function reject() {
  shake.value = true
  window.setTimeout(() => {
    value.value = ''
    shake.value = false
  }, 380)
}

function clear() {
  value.value = ''
  shake.value = false
}

defineExpose({ reject, clear })

function onKey(e) {
  if (props.disabled) return
  if (/^[0-9]$/.test(e.key)) {
    if (e.key === '0' && props.digits <= 5) return
    if (Number(e.key) > props.digits) return
    e.preventDefault()
    press(e.key)
  } else if (e.key === 'Backspace') {
    e.preventDefault()
    back()
  } else if (e.key === 'Enter') {
    e.preventDefault()
    submit()
  }
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="typepad" :class="{ 'tp-disabled': disabled, 'tp-hit': hit }">
    <div class="tp-left">
      <div class="tp-display" :class="{ shake }">
        <span v-if="value" class="tp-value">{{ value }}</span>
        <span v-else class="tp-caret">?</span>
      </div>
      <div class="tp-tip">just type the number</div>
    </div>

    <div class="tp-keys" :style="{ gridTemplateColumns: `repeat(${keyColumns}, var(--k))` }">
      <button
        v-for="d in digits"
        :key="d"
        type="button"
        class="tp-key"
        :disabled="disabled"
        @click="press(d)"
      >
        {{ d }}
      </button>
      <button type="button" class="tp-key tp-fn" :disabled="disabled" aria-label="Delete a digit" @click="back">
        ⌫
      </button>
      <button v-if="digits > 5" type="button" class="tp-key" :disabled="disabled" @click="press(0)">0</button>
    </div>
  </div>
</template>

<style scoped>
.typepad {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(9px, 1.5vw, 18px);
  width: 100%;
  max-width: 620px;
  margin: 0 auto;
}

.tp-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 0 0 auto;
}

.tp-display {
  width: clamp(84px, 12vw, 124px);
  height: clamp(74px, 10.5vw, 100px);
  display: grid;
  place-items: center;
  background: var(--cream);
  border: var(--line);
  border-radius: 18px;
  box-shadow: inset 0 4px 0 rgba(44, 38, 32, 0.08), 0 5px 0 var(--ink);
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(40px, 6vw, 56px);
  line-height: 1;
  color: var(--ink);
  transition: background 0.2s ease;
}

.tp-caret {
  color: rgba(44, 38, 32, 0.28);
  animation: bobSm 1.6s ease-in-out infinite;
}

.tp-display.shake {
  animation: shakeX 0.4s ease;
  background: #ffd9d2;
}

.typepad.tp-hit .tp-display {
  background: var(--mint);
  animation: popIn 0.4s ease;
}

.tp-tip {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ink-soft);
}

.tp-keys {
  --k: clamp(38px, 7vw, 56px);
  display: grid;
  grid-template-columns: repeat(6, var(--k));
  grid-auto-rows: var(--k);
  gap: clamp(5px, 0.9vw, 8px);
}

.tp-key {
  width: var(--k);
  height: var(--k);
  display: grid;
  place-items: center;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: calc(var(--k) * 0.52);
  line-height: 1;
  background: var(--cream);
  border: 3.5px solid var(--ink);
  border-radius: 15px;
  box-shadow: 0 5px 0 var(--ink);
  transition: transform 0.1s ease, box-shadow 0.1s ease, background 0.2s ease;
  touch-action: manipulation;
}

.tp-key:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 var(--ink);
}

.tp-key:active:not(:disabled) {
  transform: translateY(3px);
  box-shadow: 0 1px 0 var(--ink);
}

.tp-key:disabled {
  opacity: 0.45;
  box-shadow: 0 3px 0 rgba(44, 38, 32, 0.4);
}

.tp-fn {
  background: #f4e3c8;
  font-size: calc(var(--k) * 0.42);
}

@media (max-width: 430px) {
  .typepad {
    gap: 6px;
  }
  .tp-keys {
    --k: 34px;
    gap: 5px;
  }
  .tp-tip {
    display: none;
  }
}
</style>
