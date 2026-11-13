<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import GameShell from '../components/GameShell.vue'
import Confetti from '../components/Confetti.vue'
import GameOver from '../components/GameOver.vue'
import NumberPad from '../components/NumberPad.vue'
import PromptText from '../components/PromptText.vue'
import { sfx } from '../lib/audio.js'
import { randInt, scatterGrid } from '../lib/fx.js'
import { recordGame, store } from '../lib/store.js'

const emit = defineEmits(['exit'])

const TOTAL = computed(() => store.rounds)
const JAR = { x: 88, y: 72 }

const round = ref(1)
const target = ref(3)
const flies = ref([])
const caught = ref(0)
const prompt = ref('')
const mood = ref('happy')
const allCaught = computed(() => caught.value === target.value && target.value > 0)
const hit = ref(null)
const miss = ref(null)
const solved = ref(false)
const firstTry = ref(0)
const tries = ref(0)
const burst = ref(0)
const origin = ref({ x: 50, y: 40 })
const lit = ref(false)
const finished = ref(false)
const earned = ref(0)
let timers = []

function later(fn, ms) {
  const t = window.setTimeout(fn, ms)
  timers.push(t)
  return t
}
function clearTimers() {
  timers.forEach(clearTimeout)
  timers = []
}

function buildRound() {
  caught.value = 0
  solved.value = false
  tries.value = 0
  hit.value = null
  miss.value = null
  lit.value = false
  mood.value = 'happy'
  target.value = store.toddler
    ? [2, 3, 4, 5, 3][(round.value - 1) % 5]
    : 3 + ((round.value - 1) % 7)
  const n = target.value
  const spots = scatterGrid(n, { cols: 4, rows: 3, x0: 14, x1: 80, y0: 20, y1: 56 })
  flies.value = spots.map((s, i) => ({
    id: `f${i}-${Math.random().toString(36).slice(2, 7)}`,
    x: s.x,
    y: s.y,
    delay: (Math.random() * 2).toFixed(2),
    glowDelay: (Math.random() * 2.4).toFixed(2),
    caught: false,
    gone: false,
  }))
  prompt.value = 'Catch every firefly in the jar, then tell me how many!'
}

function grab(f) {
  if (f.caught || solved.value) return
  f.caught = true
  caught.value++
  sfx.sparkle()
  if (caught.value === 1) sfx.tap()
  later(() => (f.gone = true), 760)
  if (caught.value === target.value) {
    mood.value = 'happy'
    prompt.value = 'You caught them all! How many fireflies are in the jar?'
    later(() => sfx.chime(), 250)
  }
}

function answer(n) {
  if (solved.value || !allCaught.value) return
  if (n === target.value) {
    solved.value = true
    hit.value = n
    lit.value = true
    mood.value = 'cheer'
    burst.value++
    origin.value = { x: JAR.x, y: JAR.y }
    prompt.value = `Yes! ${target.value} fireflies. The lantern is glowing!`
    if (tries.value === 0) firstTry.value++
    sfx.correct()
    later(() => sfx.win(), 500)
    later(() => {
      if (round.value >= TOTAL.value) finish()
      else {
        round.value++
        buildRound()
      }
    }, 2600)
  } else {
    tries.value++
    miss.value = n
    sfx.wrong()
    mood.value = 'oops'
    prompt.value = 'Not quite! Tap the jar and count the glowing dots one more time.'
    later(() => (miss.value = null), 700)
    later(() => {
      if (!solved.value) {
        mood.value = 'happy'
        prompt.value = 'How many fireflies did you catch? Tap your answer!'
      }
    }, 2000)
  }
}

/** little glowing dots under the jar so a child can recount */
const jarDots = computed(() => Array.from({ length: caught.value }, (_, i) => i))

function finish() {
  earned.value = firstTry.value >= 4 ? 3 : firstTry.value >= 2 ? 2 : 1
  recordGame('firefly', earned.value)
  finished.value = true
}

function restart() {
  clearTimers()
  finished.value = false
  round.value = 1
  firstTry.value = 0
  buildRound()
}

function exitGame() {
  clearTimers()
  emit('exit')
}

onBeforeUnmount(clearTimers)
buildRound()
</script>

<template>
  <div class="game-root">
  <GameShell
    title="Firefly Night"
    accent="#8371E9"
    :round="round"
    :total="TOTAL"
    :mood="mood"
    :dark="true"
    :prompt="prompt"
    @exit="exitGame"
  >
    <template #prompt>
      <PromptText :text="prompt" />
    </template>

    <div class="ff-scene" :class="{ lit }">
      <div class="ff-stars">
        <span
          v-for="s in 26"
          :key="s"
          class="sky-star"
          :style="{
            left: (s * 37) % 97 + '%',
            top: (s * 53) % 58 + '%',
            animationDelay: (s % 9) * 0.4 + 's',
            width: s % 5 === 0 ? '5px' : '3px',
            height: s % 5 === 0 ? '5px' : '3px',
          }"
        />
      </div>

      <div class="ff-moon">
        <div class="moon-glow" />
        <div class="moon-body">
          <span class="crater c1" />
          <span class="crater c2" />
          <span class="crater c3" />
        </div>
      </div>

      <div class="ff-trees">
        <svg viewBox="0 0 900 160" preserveAspectRatio="none">
          <path
            d="M0 160V92l40-28 34 26 26-14 30 22 40-38 36 30 30-12 34 26 40-30 34 22 32-10 30 24 40-34 34 26 32-12 32 24 40-28 34 24 30-10 32 22 40-30 34 26 30-10 22 20v20z"
            fill="#101733"
          />
          <path
            d="M0 160v-26l60-14 50 14 60-20 60 16 60-12 60 18 60-22 60 16 60-12 60 18 60-16 60 12 60-14v38z"
            fill="#0A1026"
          />
        </svg>
      </div>

      <div class="ff-grass" />

      <!-- fireflies -->
      <button
        v-for="f in flies"
        v-show="!f.gone"
        :key="f.id"
        type="button"
        class="fly"
        :class="{ caught: f.caught }"
        :style="{
          left: f.x + '%',
          top: f.y + '%',
          '--fd': f.delay + 's',
          '--gd': f.glowDelay + 's',
        }"
        aria-label="Catch this firefly"
        @click="grab(f)"
      >
        <span class="fly-glow" />
        <svg viewBox="0 0 40 40" class="fly-bug">
          <ellipse cx="20" cy="18" rx="7" ry="9" fill="#FFF3B0" stroke="#2C2620" stroke-width="2.2" />
          <ellipse cx="20" cy="12" rx="4.4" ry="3.6" fill="#FFE066" stroke="#2C2620" stroke-width="2" />
          <path d="M13 16c-5-6-9-4-7 1" fill="#DFF6FF" opacity=".55" stroke="#2C2620" stroke-width="1.4" />
          <path d="M27 16c5-6 9-4 7 1" fill="#DFF6FF" opacity=".55" stroke="#2C2620" stroke-width="1.4" />
          <path d="M17 9l-2-4M23 9l2-4" stroke="#2C2620" stroke-width="1.6" stroke-linecap="round" />
        </svg>
      </button>

      <!-- jar -->
      <div class="jar" :class="{ full: allCaught, shining: lit }">
        <div class="jar-glow" />
        <svg viewBox="0 0 100 120" class="jar-svg">
          <rect x="30" y="6" width="40" height="12" rx="5" fill="#C98D5C" stroke="#2C2620" stroke-width="3.4" />
          <path
            d="M24 26h52c4 0 6 4 6 10v62c0 12-10 16-20 16H38c-10 0-20-4-20-16V36c0-6 2-10 6-10z"
            fill="rgba(220,245,255,.22)"
            stroke="#2C2620"
            stroke-width="3.4"
          />
          <path d="M32 40v56" stroke="#fff" stroke-opacity=".35" stroke-width="6" stroke-linecap="round" />
          <g v-if="jarDots.length">
            <circle
              v-for="(d, i) in jarDots"
              :key="i"
              :cx="38 + (i % 3) * 12"
              :cy="98 - Math.floor(i / 3) * 13"
              r="4.4"
              fill="#FFE066"
              stroke="#2C2620"
              stroke-width="1.6"
              class="jar-dot"
              :style="{ animationDelay: i * 0.08 + 's' }"
            />
          </g>
        </svg>
        <div class="jar-count">{{ caught }}</div>
      </div>

      <div v-if="solved" class="sky-number">{{ target }}</div>

      <Confetti :burst="burst" :origin="origin" :count="36" />
    </div>

    <template #answer>
      <div class="ff-answer">
        <div class="ff-question">
          <span v-if="allCaught">How many fireflies did you catch?</span>
          <span v-else>Catch all the fireflies first…</span>
        </div>
        <NumberPad
          :max="store.toddler ? 5 : 10"
          :disabled="!allCaught || solved"
          :hit="hit"
          :miss="miss"
          @pick="answer"
        />
      </div>
    </template>
  </GameShell>

  <GameOver
    v-if="finished"
    :stars="earned"
    title="The lantern glows!"
    :detail="`You counted ${firstTry} skies all by yourself.`"
    accent="#8371E9"
    @again="restart"
    @exit="exitGame"
  />
  </div>
</template>

<style scoped>
.ff-scene {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  overflow: hidden;
  background: linear-gradient(180deg, #151d3f 0%, #253163 55%, #3c4a86 100%);
  transition: background 1.2s ease;
}

.ff-scene.lit {
  background: linear-gradient(180deg, #1d2a58 0%, #35457f 55%, #6b5aa0 100%);
}

.sky-star {
  position: absolute;
  border-radius: 50%;
  background: #fff8d8;
  animation: twinkle 3.6s ease-in-out infinite;
}

.ff-moon {
  position: absolute;
  right: 9%;
  top: 8%;
  width: clamp(60px, 9vw, 100px);
  aspect-ratio: 1;
}

.moon-glow {
  position: absolute;
  inset: -40%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 248, 216, 0.4) 0%, rgba(255, 248, 216, 0) 68%);
  animation: glowPulse 6s ease-in-out infinite;
}

.moon-body {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: #fff6d8;
  border: 4px solid #2c2620;
  box-shadow: inset -8px -6px 0 rgba(44, 38, 32, 0.09);
}

.crater {
  position: absolute;
  border-radius: 50%;
  background: rgba(44, 38, 32, 0.1);
}
.crater.c1 {
  width: 22%;
  height: 22%;
  left: 22%;
  top: 26%;
}
.crater.c2 {
  width: 15%;
  height: 15%;
  left: 56%;
  top: 50%;
}
.crater.c3 {
  width: 18%;
  height: 18%;
  left: 32%;
  top: 62%;
}

.ff-trees {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 12%;
  height: 34%;
}
.ff-trees svg {
  width: 100%;
  height: 100%;
}

.ff-grass {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 14%;
  background: linear-gradient(180deg, #1b2a4d 0%, #101a33 100%);
  border-top: 3px solid #0a1026;
}

/* firefly */
.fly {
  position: absolute;
  width: clamp(46px, 6.2vw, 66px);
  height: clamp(46px, 6.2vw, 66px);
  transform: translate(-50%, -50%);
  z-index: 8;
  padding: 0;
  transition: left 0.7s cubic-bezier(0.4, -0.2, 0.5, 1.2), top 0.7s cubic-bezier(0.4, -0.2, 0.5, 1.2),
    transform 0.7s ease, opacity 0.3s ease 0.45s;
  animation: flyFloat 5.5s ease-in-out infinite;
  animation-delay: var(--fd);
}

.fly-glow {
  position: absolute;
  inset: -35%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 231, 110, 0.75) 0%, rgba(255, 231, 110, 0) 70%);
  animation: glowPulse 2.4s ease-in-out infinite;
  animation-delay: var(--gd);
  pointer-events: none;
}

.fly-bug {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 8px rgba(255, 231, 110, 0.9));
  animation: bobSm 2s ease-in-out infinite;
}

.fly:hover .fly-bug {
  transform: scale(1.15);
}

.fly.caught {
  left: 88% !important;
  top: 72% !important;
  transform: translate(-50%, -50%) scale(0.45);
  opacity: 0;
  pointer-events: none;
}

/* jar */
.jar {
  position: absolute;
  right: 6%;
  bottom: 4%;
  width: clamp(64px, 9vw, 96px);
  z-index: 6;
}

.jar-svg {
  width: 100%;
  height: auto;
  overflow: visible;
  filter: drop-shadow(0 8px 0 rgba(0, 0, 0, 0.25));
}

.jar-glow {
  position: absolute;
  inset: -30%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 231, 110, 0.55) 0%, rgba(255, 231, 110, 0) 65%);
  opacity: 0.35;
  transition: opacity 0.6s ease;
}

.jar.full .jar-glow {
  opacity: 0.9;
  animation: glowPulse 2s ease-in-out infinite;
}

.jar.shining .jar-glow {
  opacity: 1;
  animation: glowPulse 0.9s ease-in-out infinite;
}

.jar-count {
  position: absolute;
  left: 50%;
  bottom: -6px;
  transform: translate(-50%, 50%);
  background: var(--sun);
  border: 3px solid var(--ink);
  border-radius: 999px;
  min-width: 1.9em;
  padding: 0 0.35em;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(15px, 1.8vw, 20px);
  text-align: center;
  line-height: 1.3;
  color: var(--ink);
}

.jar-dot {
  animation: bobSm 1.6s ease-in-out infinite;
}

.sky-number {
  position: absolute;
  left: 50%;
  top: 28%;
  transform: translate(-50%, -50%);
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(70px, 12vw, 130px);
  color: #fff6c9;
  text-shadow: 0 0 24px rgba(255, 231, 110, 0.95), 0 0 60px rgba(255, 231, 110, 0.6);
  animation: popIn 0.6s cubic-bezier(0.2, 1.5, 0.4, 1);
  pointer-events: none;
  z-index: 10;
}

/* answer area */
.ff-answer {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ff-question {
  text-align: center;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(17px, 2vw, 22px);
  color: var(--ink);
}

@media (max-width: 640px) {
  .jar {
    right: 4%;
  }
  .fly {
    width: 54px;
    height: 54px;
  }
}
</style>
