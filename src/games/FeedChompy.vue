<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import GameShell from '../components/GameShell.vue'
import ChompyMonster from '../components/ChompyMonster.vue'
import Confetti from '../components/Confetti.vue'
import GameOver from '../components/GameOver.vue'
import PromptText from '../components/PromptText.vue'
import { sfx } from '../lib/audio.js'
import { randInt, pick } from '../lib/fx.js'
import { recordGame, store } from '../lib/store.js'

const emit = defineEmits(['exit'])

const TOTAL = computed(() => store.rounds)
const FOODS = ['berry', 'cookie', 'grape', 'apple', 'fish']
const PRAISE = ['Yum yum! Exactly right!', 'Chompy is so happy!', 'Delicious counting!', 'Munch munch — perfect!']

const round = ref(1)
const target = ref(3)
const food = ref('berry')
const fed = ref(0)
const inFlight = ref(0)
const berries = ref([])
const mouthMood = ref('idle')
const prompt = ref('')
const mood = ref('happy')
const burst = ref(0)
const origin = ref({ x: 66, y: 46 })
const solved = ref(false)
const firstTry = ref(0)
const tries = ref(0)
const finished = ref(false)
const earned = ref(0)
const floats = ref([])
const heartBurst = ref(0)

const stageEl = ref(null)
const mouthEl = ref(null)
let timers = []
let floatId = 0

function later(fn, ms) {
  const t = window.setTimeout(fn, ms)
  timers.push(t)
  return t
}
function clearTimers() {
  timers.forEach(clearTimeout)
  timers = []
}

const foodName = computed(() => {
  const names = { berry: 'berries', cookie: 'cookies', grape: 'grapes', apple: 'apples', fish: 'fish' }
  return names[food.value]
})

function buildRound() {
  solved.value = false
  fed.value = 0
  inFlight.value = 0
  tries.value = 0
  mouthMood.value = 'idle'
  mood.value = 'happy'
  floats.value = []
  const qty = store.toddler
    ? [2, 3, 4, 5, 3][(round.value - 1) % 5]
    : Math.min(9, 3 + ((round.value - 1) % 7))
  target.value = qty
  food.value = FOODS[(round.value - 1) % FOODS.length]
  const total = Math.min(11, qty + (store.toddler ? 2 : 4))
  const cols = total > 8 ? 4 : 3
  const rows = Math.ceil(total / cols)
  berries.value = Array.from({ length: total }, (_, i) => {
    const c = i % cols
    const r = Math.floor(i / cols)
    return {
      id: `f${i}-${Math.random().toString(36).slice(2, 7)}`,
      x: 20 + c * (60 / Math.max(1, cols - 1)) + randInt(-2, 2),
      y: 30 + r * (rows > 1 ? 16 / (rows - 1) : 0) + randInt(-2, 2),
      rot: randInt(-18, 18),
      gone: false,
      flyX: null,
      flyY: null,
      delay: (Math.random() * 0.6).toFixed(2),
    }
  })
  prompt.value = `Chompy is hungry! Feed him ${qty} ${foodName.value}.`
}

function feed(b) {
  if (solved.value || b.gone) return
  if (fed.value + inFlight.value >= target.value) return

  b.gone = true
  inFlight.value++
  sfx.tap()

  const stage = stageEl.value?.getBoundingClientRect()
  const mouth = mouthEl.value?.getBoundingClientRect()
  if (stage && mouth) {
    b.flyX = ((mouth.left + mouth.width / 2 - stage.left) / stage.width) * 100
    b.flyY = ((mouth.top + mouth.height / 2 - stage.top) / stage.height) * 100
  } else {
    b.flyX = 68
    b.flyY = 48
  }

  later(() => {
    inFlight.value--
    fed.value++
    sfx.chew()
    mouthMood.value = 'chew'
    const fid = ++floatId
    floats.value.push({ id: fid, n: fed.value, x: randInt(58, 76), y: randInt(20, 32) })
    later(() => {
      mouthMood.value = solved.value ? 'open' : 'idle'
    }, 420)
    later(() => {
      floats.value = floats.value.filter((f) => f.id !== fid)
    }, 1100)
    if (fed.value >= target.value) complete()
  }, 470)
}

function complete() {
  solved.value = true
  mouthMood.value = 'chew'
  mood.value = 'cheer'
  if (tries.value === 0) firstTry.value++
  prompt.value = pick(PRAISE) + ` That was ${target.value}!`
  burst.value++
  heartBurst.value++
  origin.value = { x: 66, y: 42 }
  sfx.correct(0.25)

  later(() => {
    mouthMood.value = 'open'
  }, 500)
  later(() => {
    if (round.value >= TOTAL.value) finish()
    else {
      round.value++
      buildRound()
    }
  }, 2100)
}

function finish() {
  earned.value = firstTry.value >= 4 ? 3 : firstTry.value >= 2 ? 2 : 1
  recordGame('chompy', earned.value)
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
    title="Chompy's Snacks"
    accent="#8FE0B0"
    :round="round"
    :total="TOTAL"
    :mood="mood"
    :prompt="prompt"
    @exit="exitGame"
  >
    <template #prompt>
      <PromptText :text="prompt" />
    </template>

    <div ref="stageEl" class="fc-scene">
      <div class="fc-wall">
        <div class="fc-window">
          <div class="fc-window-sky" />
          <div class="fc-window-sun" />
          <div class="fc-window-hill" />
        </div>
        <div class="fc-bunting">
          <span v-for="i in 9" :key="i" :class="['flag', 'f' + (i % 4)]" />
        </div>
      </div>

      <div class="fc-table">
        <div class="fc-cloth" />
      </div>

      <div class="fc-counter">
        <span class="counter-num">{{ fed }}</span>
        <span class="counter-label">eaten</span>
      </div>

      <div class="chompy-wrap" :class="{ excited: solved }">
        <ChompyMonster :mood="mouthMood" />
        <div ref="mouthEl" class="mouth-anchor" />
      </div>

      <!-- hearts -->
      <div v-if="heartBurst" class="hearts" :key="heartBurst">
        <svg v-for="i in 5" :key="i" viewBox="0 0 24 24" class="heart" :style="{ left: 54 + i * 5 + '%', animationDelay: i * 0.08 + 's' }">
          <path d="M12 21s-8-5-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 6-8 11-8 11z" fill="#EC5B84" stroke="#2C2620" stroke-width="2" />
        </svg>
      </div>

      <!-- rising count numbers -->
      <div
        v-for="f in floats"
        :key="f.id"
        class="feed-float"
        :style="{ left: f.x + '%', top: f.y + '%' }"
      >
        {{ f.n }}
      </div>

      <!-- food bowl -->
      <div class="bowl-zone">
        <svg viewBox="0 0 200 120" class="bowl-svg">
          <ellipse cx="100" cy="34" rx="82" ry="26" fill="#F7D9A8" stroke="#2C2620" stroke-width="4" />
          <path d="M20 36c2 44 34 70 80 70s78-26 80-70z" fill="#E9B778" stroke="#2C2620" stroke-width="4" stroke-linejoin="round" />
          <path d="M34 52c6 28 30 44 66 44" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".25" />
          <ellipse cx="100" cy="34" rx="70" ry="18" fill="#FBEBCB" />
        </svg>

        <button
          v-for="b in berries"
          :key="b.id"
          type="button"
          class="food"
          :class="[food, { flying: b.gone }]"
          :style="{
            left: b.x + '%',
            top: b.y + '%',
            '--rot': b.rot + 'deg',
            '--flyx': (b.flyX ?? 68) + '%',
            '--flyy': (b.flyY ?? 48) + '%',
            animationDelay: b.delay + 's',
          }"
          @click="feed(b)"
        >
          <svg viewBox="0 0 48 48">
            <template v-if="food === 'berry'">
              <circle cx="24" cy="28" r="14" fill="#F0455F" stroke="#2C2620" stroke-width="3.2" />
              <path d="M24 15c1-4 5-6 8-6-1 4-4 6-8 6z" fill="#69C27B" stroke="#2C2620" stroke-width="2.6" stroke-linejoin="round" />
              <circle cx="19" cy="26" r="1.6" fill="#FFE3E6" />
              <circle cx="27" cy="32" r="1.6" fill="#FFE3E6" />
              <circle cx="23" cy="22" r="1.3" fill="#FFE3E6" />
            </template>
            <template v-else-if="food === 'cookie'">
              <circle cx="24" cy="25" r="14" fill="#E3B378" stroke="#2C2620" stroke-width="3.2" />
              <circle cx="18" cy="21" r="3" fill="#7A4A31" />
              <circle cx="29" cy="27" r="2.6" fill="#7A4A31" />
              <circle cx="21" cy="32" r="2.2" fill="#7A4A31" />
            </template>
            <template v-else-if="food === 'grape'">
              <circle cx="18" cy="22" r="7" fill="#9B72E8" stroke="#2C2620" stroke-width="2.8" />
              <circle cx="30" cy="22" r="7" fill="#9B72E8" stroke="#2C2620" stroke-width="2.8" />
              <circle cx="24" cy="31" r="7" fill="#8A5BDF" stroke="#2C2620" stroke-width="2.8" />
              <path d="M24 12c0-3 2-5 5-5" fill="none" stroke="#69C27B" stroke-width="3" stroke-linecap="round" />
            </template>
            <template v-else-if="food === 'apple'">
              <path d="M24 14c8-6 17 0 16 10-1 11-9 18-16 18S9 35 8 24c-1-10 8-16 16-10z" fill="#F0455F" stroke="#2C2620" stroke-width="3.2" stroke-linejoin="round" />
              <path d="M24 14v-6" stroke="#7A4A31" stroke-width="3" stroke-linecap="round" />
              <path d="M24 10c3-4 7-4 9-2-2 3-6 4-9 2z" fill="#69C27B" stroke="#2C2620" stroke-width="2.4" />
            </template>
            <template v-else>
              <path d="M8 24c8-10 20-10 27 0-7 10-19 10-27 0z" fill="#8AD7F2" stroke="#2C2620" stroke-width="3.2" stroke-linejoin="round" />
              <path d="M35 24l9-7v14z" fill="#8AD7F2" stroke="#2C2620" stroke-width="3.2" stroke-linejoin="round" />
              <circle cx="17" cy="22" r="2" fill="#2C2620" />
            </template>
          </svg>
        </button>
      </div>

      <Confetti :burst="burst" :origin="origin" :count="34" />
    </div>

    <template #answer>
      <div class="fc-meter">
        <div class="meter-dots">
          <span v-for="i in target" :key="i" class="mdot" :class="{ on: i <= fed }" />
        </div>
        <span class="meter-text">{{ fed }} / {{ target }}</span>
      </div>
    </template>
  </GameShell>

  <GameOver
    v-if="finished"
    :stars="earned"
    title="Chompy is stuffed!"
    :detail="`You fed Chompy ${TOTAL} perfect snacks.`"
    accent="#8FE0B0"
    @again="restart"
    @exit="exitGame"
  />
  </div>
</template>

<style scoped>
.fc-scene {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  overflow: hidden;
  background: #fff2d8;
}

.fc-wall {
  position: absolute;
  inset: 0 0 26% 0;
  background:
    repeating-linear-gradient(
      90deg,
      rgba(44, 38, 32, 0.06) 0 2px,
      transparent 2px 46px
    ),
    linear-gradient(180deg, #fff7e4 0%, #ffe9c4 100%);
}

.fc-window {
  position: absolute;
  left: 24%;
  top: 12%;
  width: clamp(70px, 15%, 150px);
  aspect-ratio: 1.15;
  border: 4px solid var(--ink);
  border-radius: 14px;
  overflow: hidden;
  background: #bfeaf8;
  box-shadow: inset 0 0 0 8px #fff3d8;
}
.fc-window-sky {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #bfeaf8, #e8f9ff);
}
.fc-window-sun {
  position: absolute;
  top: 12%;
  right: 12%;
  width: 26%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--sun);
  border: 3px solid var(--ink);
}
.fc-window-hill {
  position: absolute;
  left: -10%;
  right: -10%;
  bottom: -12%;
  height: 46%;
  background: #8fd6a0;
  border-top: 4px solid var(--ink);
  border-radius: 50% 50% 0 0;
}

.fc-bunting {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 0;
  display: flex;
  justify-content: space-around;
  border-top: 3px solid var(--ink);
  transform: translateY(6px);
  opacity: 0.9;
}

.flag {
  width: 0;
  height: 0;
  border-left: 11px solid transparent;
  border-right: 11px solid transparent;
  border-top: 22px solid var(--coral);
  margin-top: 0;
  filter: drop-shadow(0 2px 0 rgba(44, 38, 32, 0.25));
  transform-origin: top center;
  animation: sway 3.4s ease-in-out infinite;
}
.flag.f1 {
  border-top-color: var(--sun);
}
.flag.f2 {
  border-top-color: var(--mint);
}
.flag.f3 {
  border-top-color: var(--sky);
}

.fc-table {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 30%;
  background: linear-gradient(180deg, #c98d5c 0%, #b3754a 100%);
  border-top: 4px solid var(--ink);
}

.fc-cloth {
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(90deg, rgba(255, 250, 240, 0.5) 0 26px, transparent 26px 52px),
    repeating-linear-gradient(0deg, rgba(255, 250, 240, 0.5) 0 26px, transparent 26px 52px);
  background-color: #f4a8a0;
  opacity: 0.55;
}

/* chompy */
.chompy-wrap {
  position: absolute;
  left: 48%;
  bottom: 8%;
  width: clamp(190px, 44%, 400px);
  transform-origin: bottom center;
  transition: transform 0.25s ease;
  z-index: 3;
}

.chompy-wrap.excited {
  animation: happyBounce 0.7s ease-in-out 2;
}

@keyframes happyBounce {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  40% {
    transform: translateY(-12px) scale(1.03);
  }
  70% {
    transform: translateY(0) scale(0.98);
  }
}

.mouth-anchor {
  position: absolute;
  left: 50%;
  top: 59%;
  width: 2px;
  height: 2px;
}

/* counter */
.fc-counter {
  position: absolute;
  left: 4%;
  top: 8%;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--cream);
  border: var(--line);
  border-radius: 18px;
  padding: 2px 14px 6px;
  box-shadow: 0 5px 0 rgba(44, 38, 32, 0.2);
  transform: rotate(-3deg);
  z-index: 6;
}

.counter-num {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(26px, 4vw, 40px);
  line-height: 1;
}

.counter-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--ink-soft);
}

/* bowl */
.bowl-zone {
  position: absolute;
  left: 2%;
  bottom: 4%;
  width: 42%;
  aspect-ratio: 200 / 120;
  z-index: 4;
}

.bowl-svg {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: auto;
  filter: drop-shadow(0 8px 0 rgba(44, 38, 32, 0.15));
}

.food {
  position: absolute;
  width: clamp(40px, 6vw, 60px);
  aspect-ratio: 1;
  padding: 0;
  transform: translate(-50%, -50%) rotate(var(--rot));
  transition: left 0.48s cubic-bezier(0.35, -0.35, 0.5, 1.25), top 0.48s cubic-bezier(0.35, -0.35, 0.5, 1.25),
    transform 0.48s ease, opacity 0.3s ease 0.3s;
  animation: popIn 0.4s backwards cubic-bezier(0.2, 1.5, 0.4, 1);
  z-index: 5;
  filter: drop-shadow(0 3px 0 rgba(44, 38, 32, 0.18));
}

.food svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.food:hover {
  transform: translate(-50%, -50%) rotate(0deg) scale(1.12);
}

.food.flying {
  left: var(--flyx) !important;
  top: var(--flyy) !important;
  transform: translate(-50%, -50%) rotate(220deg) scale(0.4);
  opacity: 0;
  pointer-events: none;
}

/* hearts */
.hearts {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 12;
}
.heart {
  position: absolute;
  top: 34%;
  width: clamp(18px, 2.4vw, 26px);
  animation: heartUp 1.15s ease-out forwards;
}

/* rising numbers */
.feed-float {
  position: absolute;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(26px, 3.6vw, 40px);
  color: var(--ink);
  background: var(--sun);
  border: 3px solid var(--ink);
  border-radius: 50%;
  width: 1.6em;
  height: 1.6em;
  display: grid;
  place-items: center;
  z-index: 14;
  animation: heartUp 1s ease-out forwards;
  pointer-events: none;
}

/* meter */
.fc-meter {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 4px 0 2px;
}

.meter-dots {
  display: flex;
  gap: 6px;
}

.mdot {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  border: 2.5px solid var(--ink);
  background: #fff;
  transition: background 0.2s ease, transform 0.2s ease;
}

.mdot.on {
  background: var(--mint);
  transform: scale(1.12);
}

.meter-text {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 17px;
  color: var(--ink-soft);
}

@media (max-width: 640px) {
  .chompy-wrap {
    left: 42%;
    width: 58%;
  }
  .bowl-zone {
    width: 52%;
  }
  .fc-counter {
    padding: 0 10px 4px;
  }
}
</style>
