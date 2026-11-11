<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import GameShell from '../components/GameShell.vue'
import Confetti from '../components/Confetti.vue'
import GameOver from '../components/GameOver.vue'
import PromptText from '../components/PromptText.vue'
import { sfx } from '../lib/audio.js'
import { randInt, shuffle, starPositions, pick } from '../lib/fx.js'
import { recordGame, store } from '../lib/store.js'

const emit = defineEmits(['exit'])

const TOTAL = computed(() => store.rounds)
const COLORS = ['#F9715A', '#FFC93C', '#8FE0B0', '#9ADCF4', '#EC5B84', '#A98BF5', '#F5A65B']
const PRAISE = [
  'Pop! You got it!',
  'Perfect counting!',
  'Yes! Pip is doing a happy dance!',
  'Wonderful! You counted so well!',
  'Pop pop! That was exactly right!',
]

const round = ref(1)
const target = ref(4)
const balloons = ref([])
const prompt = ref('')
const mood = ref('happy')
const wrongId = ref(null)
const poppedId = ref(null)
const solved = ref(false)
const solvedFirstTry = ref(0)
const attempts = ref(0)
const burst = ref(0)
const origin = ref({ x: 50, y: 45 })
const hintId = ref(null)
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
  solved.value = false
  poppedId.value = null
  wrongId.value = null
  hintId.value = null
  attempts.value = 0
  mood.value = 'happy'

  const qty = store.toddler
    ? [3, 4, 2, 5, 4][(round.value - 1) % 5]
    : Math.min(9, 3 + ((round.value - 1) % 5) + randInt(0, 2))
  target.value = qty

  const pool = store.toddler ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6, 7, 8, 9]
  const distractorPool = shuffle(pool.filter((n) => Math.abs(n - qty) >= 1 && n >= 2).slice(0, 7))
  const quantities = shuffle([qty, distractorPool[0], distractorPool[1]])
  const xs = shuffle([20, 50, 80])
  const usedColors = shuffle(COLORS).slice(0, 3)

  balloons.value = quantities.map((n, i) => ({
    id: `b${i}-${Math.random().toString(36).slice(2, 7)}`,
    qty: n,
    color: usedColors[i],
    x: xs[i] + randInt(-3, 3),
    y: 46 + randInt(-7, 7),
    size: 17 + Math.random() * 3,
    delay: (Math.random() * 2.6).toFixed(2),
    state: 'idle',
  }))

  prompt.value = `Pop the balloon with ${qty} stars!`
}

function choose(b) {
  if (solved.value || b.state !== 'idle') return

  if (b.qty === target.value) {
    solved.value = true
    poppedId.value = b.id
    origin.value = { x: b.x, y: b.y }
    if (attempts.value === 0) solvedFirstTry.value++
    sfx.pop()
    sfx.correct(0.1)
    burst.value++
    mood.value = 'cheer'
    prompt.value = pick(PRAISE)
    b.state = 'leaving'
    balloons.value.forEach((o) => {
      if (o.id !== b.id) o.state = 'escaping'
    })
    later(() => {
      if (round.value >= TOTAL.value) finish()
      else {
        round.value++
        buildRound()
      }
    }, 1900)
  } else {
    attempts.value++
    wrongId.value = b.id
    sfx.wrong()
    mood.value = 'oops'
    prompt.value =
      attempts.value >= 2
        ? `Count slowly, one by one. The glowing one is your friend!`
        : `Not that one — count the stars in each balloon!`
    if (attempts.value >= 2) hintId.value = balloons.value.find((x) => x.qty === target.value)?.id
    later(() => (wrongId.value = null), 650)
    later(() => {
      if (!solved.value) {
        mood.value = 'happy'
        prompt.value = `Pop the balloon with ${target.value} stars!`
        hintId.value = null
      }
    }, 2600)
  }
}

function finish() {
  earned.value = solvedFirstTry.value >= 4 ? 3 : solvedFirstTry.value >= 2 ? 2 : 1
  recordGame('balloon', earned.value)
  finished.value = true
}

function restart() {
  clearTimers()
  finished.value = false
  round.value = 1
  solvedFirstTry.value = 0
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
    title="Balloon Pop"
    accent="#F9715A"
    :round="round"
    :total="TOTAL"
    :mood="mood"
    :prompt="prompt"
    @exit="exitGame"
  >
    <template #prompt>
      <PromptText :text="prompt" />
    </template>

    <div class="bp-scene">
      <div class="bp-sun" />
      <div class="bp-cloud c1" />
      <div class="bp-cloud c2" />
      <div class="bp-cloud c3" />

      <div class="bp-hills">
        <svg viewBox="0 0 600 120" preserveAspectRatio="none" class="hills-svg">
          <path
            d="M0 78C70 44 128 44 196 68c56 20 96 8 148-4 62-14 108 10 156 24 40 12 74 10 100 2v30H0z"
            fill="#8FD6A0"
            stroke="#2C2620"
            stroke-width="4"
            stroke-linejoin="round"
            vector-effect="non-scaling-stroke"
          />
          <path
            d="M0 100c86-16 160-10 232 2 78 13 130-4 200-6 62-2 116 8 168 12v12H0z"
            fill="#69C27B"
            stroke="#2C2620"
            stroke-width="4"
            stroke-linejoin="round"
            vector-effect="non-scaling-stroke"
          />
        </svg>
      </div>

      <div class="bp-birds">
        <svg viewBox="0 0 60 20"><path d="M2 12q8-8 14 0M20 8q8-8 14 0" fill="none" stroke="#2C2620" stroke-width="2.4" stroke-linecap="round" opacity=".55" /></svg>
      </div>

      <button
        v-for="b in balloons"
        :key="b.id"
        type="button"
        class="bp-balloon"
        :class="[b.state, { wrong: wrongId === b.id, pop: poppedId === b.id, hint: hintId === b.id }]"
        :style="{ left: b.x + '%', top: b.y + '%', width: b.size + '%' }"
        :aria-label="`Balloon with ${b.qty} stars`"
        @click="choose(b)"
      >
        <div class="bob" :style="{ animationDelay: b.delay + 's' }">
          <svg viewBox="0 0 120 178" class="balloon-svg">
            <path
              class="string"
              d="M60 138c-9 10 9 16-1 34"
              fill="none"
              stroke="#2C2620"
              stroke-width="3.4"
              stroke-linecap="round"
            />
            <path
              d="M60 128l-10 13h20z"
              :fill="b.color"
              stroke="#2C2620"
              stroke-width="4"
              stroke-linejoin="round"
            />
            <ellipse
              cx="60"
              cy="72"
              rx="47"
              ry="57"
              :fill="b.color"
              stroke="#2C2620"
              stroke-width="4"
            />
            <ellipse
              cx="41"
              cy="44"
              rx="9"
              ry="17"
              fill="#fff"
              opacity="0.35"
              transform="rotate(-22 41 44)"
            />
            <g class="stars">
              <path
                v-for="(p, i) in starPositions(b.qty)"
                :key="i"
                :transform="`translate(${p.x} ${p.y}) scale(.78) translate(-12 -12)`"
                d="M12 1.6l3.2 6.6 7.2 1-5.2 5.1 1.2 7.2-6.4-3.4-6.4 3.4 1.2-7.2L1.6 9.2l7.2-1z"
                fill="#FFFAEC"
                stroke="#2C2620"
                stroke-width="2.4"
                stroke-linejoin="round"
              />
            </g>
          </svg>
        </div>
      </button>

      <Confetti :burst="burst" :origin="origin" :count="30" />

      <Transition name="pop">
        <div v-if="solved" class="bp-cheer">
          <div class="cheer-tag">+1 star</div>
        </div>
      </Transition>
    </div>

    <template #answer>
      <div class="bp-hint-bar">
        <span class="tap-dot" />
        Count the little stars, then tap that balloon
      </div>
    </template>
  </GameShell>

  <GameOver
    v-if="finished"
    :stars="earned"
    title="Balloon party!"
    :detail="`You popped ${solvedFirstTry} of ${TOTAL} balloons first try.`"
    accent="#F9715A"
    @again="restart"
    @exit="exitGame"
  />
  </div>
</template>

<style scoped>
.bp-scene {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  overflow: hidden;
  background: linear-gradient(180deg, #bfeaf8 0%, #ddf6fd 52%, #f3fbe8 100%);
}

/* sun */
.bp-sun {
  position: absolute;
  top: 6%;
  right: 7%;
  width: clamp(52px, 8vw, 84px);
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--sun);
  border: 4px solid var(--ink);
  box-shadow: 0 0 0 10px rgba(255, 201, 60, 0.28), 0 0 0 22px rgba(255, 201, 60, 0.14);
  animation: bob 6s ease-in-out infinite;
}

/* clouds */
.bp-cloud {
  position: absolute;
  height: clamp(26px, 4vw, 44px);
  background: #fffdf6;
  border: 4px solid var(--ink);
  border-radius: 999px;
  opacity: 0.95;
}
.bp-cloud::before,
.bp-cloud::after {
  content: '';
  position: absolute;
  background: inherit;
  border: inherit;
  border-radius: 50%;
  bottom: 50%;
}
.bp-cloud::before {
  width: 55%;
  aspect-ratio: 1;
  left: 12%;
  margin-bottom: -6px;
}
.bp-cloud::after {
  width: 38%;
  aspect-ratio: 1;
  right: 14%;
  margin-bottom: -4px;
}

.bp-cloud.c1 {
  width: clamp(90px, 14vw, 150px);
  left: 8%;
  top: 12%;
  animation: drift 46s linear infinite;
}
.bp-cloud.c2 {
  width: clamp(70px, 11vw, 120px);
  left: 0;
  top: 30%;
  animation: drift 62s linear infinite;
  animation-delay: -20s;
  opacity: 0.8;
}
.bp-cloud.c3 {
  width: clamp(60px, 9vw, 100px);
  left: 0;
  top: 4%;
  animation: drift 80s linear infinite;
  animation-delay: -50s;
  opacity: 0.7;
}

.bp-birds {
  position: absolute;
  left: 26%;
  top: 18%;
  width: 70px;
  opacity: 0.8;
  animation: floaty 5s ease-in-out infinite;
}

.bp-hills {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 30%;
  pointer-events: none;
}
.hills-svg {
  width: 100%;
  height: 100%;
}

/* balloons */
.bp-balloon {
  position: absolute;
  transform: translate(-50%, -50%);
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  z-index: 4;
  transition: filter 0.2s ease;
}

.balloon-svg {
  width: 100%;
  height: auto;
  overflow: visible;
  filter: drop-shadow(0 10px 0 rgba(44, 38, 32, 0.12));
}

.bob {
  animation: balloonFloat 4.6s ease-in-out infinite;
  transform-origin: 50% 80%;
}

.bp-balloon:hover .bob {
  animation-play-state: paused;
}
.bp-balloon:hover .balloon-svg {
  transform: scale(1.04);
}

.bp-balloon.leaving .bob {
  animation: balloonPop 0.42s ease-out forwards;
}

.bp-balloon.escaping {
  pointer-events: none;
}

.bp-balloon.escaping .bob {
  animation: balloonAway 1.5s cubic-bezier(0.4, 0, 0.7, 0.4) forwards;
}

.bp-balloon.wrong .bob {
  animation: shakeX 0.55s ease;
}

.bp-balloon.wrong .balloon-svg {
  filter: grayscale(0.5) drop-shadow(0 10px 0 rgba(44, 38, 32, 0.12));
}

.bp-balloon.hint .balloon-svg {
  animation: hintGlow 1.3s ease-in-out infinite;
}

@keyframes hintGlow {
  0%,
  100% {
    filter: drop-shadow(0 0 0 rgba(255, 201, 60, 0));
    transform: scale(1);
  }
  50% {
    filter: drop-shadow(0 0 16px rgba(255, 201, 60, 0.95));
    transform: scale(1.05);
  }
}

.bp-cheer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: grid;
  place-items: center;
  z-index: 20;
}

.cheer-tag {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(20px, 2.6vw, 30px);
  background: var(--sun);
  border: var(--line);
  border-radius: 999px;
  padding: 6px 22px 10px;
  box-shadow: 0 6px 0 var(--ink);
  transform: translateY(90px) rotate(-4deg);
  animation: popIn 0.4s cubic-bezier(0.2, 1.6, 0.4, 1);
}

.bp-hint-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: clamp(12px, 1.4vw, 15px);
  color: var(--ink-soft);
  padding: 6px 0 2px;
}

.tap-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--coral);
  border: 2px solid var(--ink);
  animation: bobSm 1.4s ease-in-out infinite;
}

@media (max-width: 640px) {
  .bp-balloon {
    width: 26% !important;
  }
}
</style>
