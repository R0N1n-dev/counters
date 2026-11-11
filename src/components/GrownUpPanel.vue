<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { store, toggleSound } from '../lib/store.js'
import { sfx } from '../lib/audio.js'
import { speak } from '../lib/speak.js'

defineProps({
  closeLabel: { type: String, default: 'Keep playing' },
})

const emit = defineEmits(['close'])

const first = ref(null)
nextTick(() => first.value?.focus())

function flipToddler() {
  store.toddler = !store.toddler
  sfx.tap()
  speak(store.toddler ? 'Counting up to five.' : 'Counting up to ten.')
}

function flipRead() {
  store.readAloud = !store.readAloud
  if (store.readAloud) speak('Reading out loud is on.')
  else {
    try {
      window.speechSynthesis?.cancel()
    } catch {
      /* nothing to cancel */
    }
  }
}

function flipSound() {
  toggleSound()
  if (store.sound) sfx.chime()
}

function setRounds(n) {
  if (store.rounds === n) return
  store.rounds = n
  sfx.tap()
  speak(`Games now have ${n} rounds.`)
}

// keep stray digits from reaching the answer pads behind the panel
function onKey(e) {
  if (e.key === 'Escape') emit('close')
  else if (/^[0-9]$/.test(e.key) || e.key === 'Backspace') e.stopPropagation()
}

onMounted(() => window.addEventListener('keydown', onKey, true))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey, true))
</script>

<template>
  <div class="pause-scrim" @click.self="emit('close')">
    <div class="pause-card" role="dialog" aria-modal="true" aria-labelledby="grown-title">
      <div id="grown-title" class="pause-title">Grown-ups</div>
      <p class="pause-sub">Settings for the little one's play.</p>

      <div class="pause-list">
        <button
          ref="first"
          type="button"
          class="pause-switch"
          :class="{ on: store.toddler }"
          :aria-pressed="store.toddler"
          @click="flipToddler"
        >
          <span class="pause-label">
            1–5 toddler mode
            <small>Counts up to five, with 1–5 answer buttons.</small>
          </span>
          <span class="knob" aria-hidden="true" />
        </button>

        <button
          type="button"
          class="pause-switch"
          :class="{ on: store.readAloud }"
          :aria-pressed="store.readAloud"
          @click="flipRead"
        >
          <span class="pause-label">
            Read aloud
            <small>Speaks each instruction out loud.</small>
          </span>
          <span class="knob" aria-hidden="true" />
        </button>

        <div class="pause-rounds">
          <span class="pause-label">
            Rounds per game
            <small>How many stages before the star rating.</small>
          </span>
          <div class="round-btns">
            <button
              v-for="n in [5, 10, 15, 25, 50]"
              :key="n"
              type="button"
              class="round-btn"
              :class="{ on: store.rounds === n }"
              :aria-pressed="store.rounds === n"
              @click="setRounds(n)"
            >
              {{ n }}
            </button>
          </div>
        </div>

        <button
          type="button"
          class="pause-switch"
          :class="{ on: store.sound }"
          :aria-pressed="store.sound"
          @click="flipSound"
        >
          <span class="pause-label">
            Sound effects
            <small>Pops, chimes and cheers.</small>
          </span>
          <span class="knob" aria-hidden="true" />
        </button>
      </div>

      <button type="button" class="pause-resume" @click="emit('close')">{{ closeLabel }}</button>
    </div>
  </div>
</template>

<style scoped>
.pause-scrim {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(32, 27, 22, 0.55);
  backdrop-filter: blur(3px);
}

.pause-card {
  width: 100%;
  max-width: 390px;
  max-height: calc(100dvh - 36px);
  overflow-y: auto;
  background: var(--cream);
  border: var(--line);
  border-radius: 26px;
  padding: 22px 20px 18px;
  box-shadow: 0 10px 0 rgba(32, 27, 22, 0.35);
  animation: popIn 0.24s cubic-bezier(0.2, 1.4, 0.4, 1) both;
}

.pause-title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 25px;
  line-height: 1.1;
}

.pause-sub {
  margin: 3px 0 14px;
  font-size: 14px;
  font-weight: 700;
  color: var(--ink-soft);
}

.pause-list {
  display: grid;
  gap: 10px;
}

.pause-switch {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  background: #fffdf7;
  border: 3px solid var(--ink);
  border-radius: 18px;
  padding: 11px 13px;
  box-shadow: 0 3px 0 var(--ink);
  transition: background 0.18s ease;
}

.pause-switch.on {
  background: var(--mint);
}

.pause-label {
  flex: 1 1 auto;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 16px;
  line-height: 1.25;
  color: var(--ink);
}

.pause-label small {
  display: block;
  margin-top: 2px;
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 12px;
  line-height: 1.35;
  color: var(--ink-soft);
}

.pause-switch .knob {
  position: relative;
  flex: 0 0 auto;
  width: 46px;
  height: 26px;
  border-radius: 999px;
  background: #e4d5bb;
  border: 3px solid var(--ink);
  transition: background 0.18s ease;
}

.pause-switch .knob::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--cream);
  border: 2px solid var(--ink);
  transform: translateY(-50%);
  transition: left 0.18s ease;
}

.pause-switch.on .knob {
  background: var(--mint-d);
}

.pause-switch.on .knob::after {
  left: 23px;
}

.pause-rounds {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fffdf7;
  border: 3px solid var(--ink);
  border-radius: 18px;
  padding: 11px 13px;
  box-shadow: 0 3px 0 var(--ink);
}

.round-btns {
  display: flex;
  gap: 6px;
  flex: 0 0 auto;
}

.round-btn {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 15px;
  min-width: 44px;
  padding: 7px 0;
  border: 2.5px solid var(--ink);
  border-radius: 12px;
  background: var(--cream);
  box-shadow: 0 3px 0 var(--ink);
  transition: background 0.15s ease, transform 0.1s ease;
}

.round-btn.on {
  background: var(--mint);
}

.round-btn:active {
  transform: translateY(2px);
  box-shadow: 0 1px 0 var(--ink);
}

.pause-resume {
  width: 100%;
  margin-top: 14px;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 17px;
  color: var(--ink);
  background: var(--sun);
  border: 3px solid var(--ink);
  border-radius: 16px;
  padding: 12px;
  box-shadow: 0 4px 0 var(--ink);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.pause-resume:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 var(--ink);
}
</style>
