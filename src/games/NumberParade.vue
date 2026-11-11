<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import GameShell from '../components/GameShell.vue'
import NumberPad from '../components/NumberPad.vue'
import Confetti from '../components/Confetti.vue'
import GameOver from '../components/GameOver.vue'
import PromptText from '../components/PromptText.vue'
import { sfx } from '../lib/audio.js'
import { shuffle, pick } from '../lib/fx.js'
import { recordGame, store } from '../lib/store.js'

const emit = defineEmits(['exit'])

const TOTAL = computed(() => store.rounds)

// every round a different friend joins the parade, each with its own move.
// ground vehicles drive left or right; the rocket flies up; the plane flies across.
const VEHICLES = [
  { id: 'car', name: 'the car', bottom: '12%', dur: '1.9s', ease: 'cubic-bezier(.5,0,.85,.4)' },
  { id: 'rocket', name: 'the rocket', dur: '2.4s', ease: 'cubic-bezier(.6,0,.9,.35)' },
  { id: 'bunny', name: 'the bunny', bottom: '12%', dur: '1.7s', ease: 'cubic-bezier(.45,0,.7,.5)' },
  { id: 'snail', name: 'the snail', bottom: '9%', dur: '3.3s', ease: 'cubic-bezier(.4,0,.6,1)' },
  { id: 'train', name: 'the train', bottom: '9%', dur: '2.8s', ease: 'cubic-bezier(.5,0,.8,.45)' },
  { id: 'plane', name: 'the aeroplane', bottom: '42%', dur: '2.6s', ease: 'cubic-bezier(.4,0,.7,.5)' },
  { id: 'duck', name: 'the duck', bottom: '11%', dur: '2.0s', ease: 'cubic-bezier(.5,0,.8,.45)' },
  { id: 'frog', name: 'the frog', bottom: '10%', dur: '2.4s', ease: 'cubic-bezier(.55,0,.6,1)' },
]

const PRAISE = [
  'What a clever counter!',
  'Off you go — perfectly in order!',
  'The finish line loves you!',
  'Zoom zoom! That was just right!',
]

const COMPLIMENTS = [
  'What a clever counter you are!',
  'You are amazing with numbers!',
  'Hooray! Super counting!',
  'You did it — well done!',
  'Numbers love you!',
  'What a star! Keep going!',
]

const round = ref(1)
const queue = ref([])
const dir = ref(1)
const seq = ref([])
const idx = ref(0)
const go = ref(false)
// 0 waiting, 1 first leg, 2 paused mid-way (compliment), 3 second leg
const stage = ref(0)
const cheer = ref('')
const prompt = ref('')
const mood = ref('happy')
const hit = ref(null)
const miss = ref(null)
const solved = ref(false)
const tries = ref(0)
const firstTry = ref(0)
const burst = ref(0)
const origin = ref({ x: 50, y: 60 })
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

const veh = computed(() => queue.value[round.value - 1] || VEHICLES[0])
const vehicleName = computed(() => veh.value.name)

// each leg of the journey takes half the vehicle's cruise duration
const legDur = computed(() => `${(parseFloat(veh.value.dur) / 2).toFixed(2)}s`)

const vehicleStyle = computed(() => {
  const v = veh.value
  const s = stage.value
  const moving = s === 1 || s === 3
  const duration = moving ? legDur.value : '0s'
  const ease = v.ease
  if (v.id === 'rocket') {
    const bottoms = ['13%', '52%', '52%', '120%']
    return {
      left: '50%',
      bottom: bottoms[s],
      transform: 'translateX(-50%)',
      transitionDuration: duration,
      transitionTimingFunction: ease,
    }
  }
  const mids = ['5%', '57%', '57%', '114%']
  const pos =
    dir.value > 0
      ? { left: mids[s] }
      : { right: mids[s] }
  return {
    ...pos,
    bottom: v.bottom,
    transitionDuration: duration,
    transitionTimingFunction: ease,
  }
})

function buildRound() {
  solved.value = false
  go.value = false
  stage.value = 0
  idx.value = 0
  tries.value = 0
  hit.value = null
  miss.value = null
  mood.value = 'happy'

  if (round.value === 1 || !queue.value.length) {
    const deck = []
    while (deck.length < TOTAL.value) deck.push(...shuffle(VEHICLES))
    queue.value = deck.slice(0, TOTAL.value)
  }

  const max = store.toddler ? 5 : 10
  const seen = new Set()
  const out = []
  while (out.length < 3) {
    const n = 1 + Math.floor(Math.random() * max)
    if (!seen.has(n)) {
      seen.add(n)
      out.push(n)
    }
  }
  seq.value = out
  dir.value = Math.random() < 0.5 ? 1 : -1
  prompt.value = `${capitalize(vehicleName.value)} is waiting! Tap the numbers in order.`
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function pickNumber(n) {
  if (solved.value || go.value) return
  if (n === seq.value[idx.value]) {
    hit.value = n
    sfx.tap()
    idx.value++
    if (idx.value >= seq.value.length) finishRound()
  } else {
    tries.value++
    miss.value = n
    sfx.wrong()
    mood.value = 'oops'
    prompt.value = `Oops! The next number is ${seq.value[idx.value]}. Try again!`
    later(() => (miss.value = null), 650)
    later(() => {
      if (!solved.value) {
        mood.value = 'happy'
        prompt.value = `${capitalize(vehicleName.value)} is waiting! Tap the numbers in order.`
      }
    }, 2400)
  }
}

function finishRound() {
  solved.value = true
  go.value = true
  stage.value = 1
  cheer.value = pick(COMPLIMENTS)
  mood.value = 'cheer'
  if (tries.value === 0) firstTry.value++
  prompt.value = `${pick(PRAISE)} ${capitalize(vehicleName.value)} is off!`
  burst.value++
  origin.value = { x: 50, y: 62 }
  sfx.correct()
  later(() => sfx.whoosh(), 350)
  later(() => sfx.sparkle(), 800)

  // halfway through, the vehicle pauses so it can say something nice
  const legMs = parseFloat(veh.value.dur) * 500
  const PAUSE = 1500
  later(() => {
    stage.value = 2
    sfx.chime()
  }, legMs)
  later(() => {
    stage.value = 3
  }, legMs + PAUSE)
  later(() => {
    if (round.value >= TOTAL.value) finish()
    else {
      round.value++
      buildRound()
    }
  }, legMs * 2 + PAUSE + 600)
}

function finish() {
  earned.value = firstTry.value >= 4 ? 3 : firstTry.value >= 2 ? 2 : 1
  recordGame('parade', earned.value)
  finished.value = true
}

function restart() {
  clearTimers()
  finished.value = false
  round.value = 1
  firstTry.value = 0
  queue.value = []
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
      title="Number Parade"
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

      <div class="np-scene">
        <div class="np-sun" />
        <div class="np-cloud c1" />
        <div class="np-cloud c2" />
        <div class="np-cloud c3" />

        <div class="np-hills">
          <svg viewBox="0 0 900 200" preserveAspectRatio="none">
            <path d="M0 150c120-50 240-40 360-8 120 32 220-24 340-20 120 4 220 40 340 24v54H0z" fill="#9ED48F" stroke="#2C2620" stroke-width="4" vector-effect="non-scaling-stroke" />
            <path d="M0 178c140-24 260 8 400 4 140-4 260-28 400-16 80 7 160 12 200 8v26H0z" fill="#69C27B" stroke="#2C2620" stroke-width="4" vector-effect="non-scaling-stroke" />
          </svg>
        </div>

        <div class="np-road" />
        <div class="np-fence">
          <span v-for="i in 12" :key="i" class="np-post" :style="{ left: i * 8.4 + '%' }" />
        </div>

        <!-- the sequence to tap -->
        <div class="np-seq">
          <div
            v-for="(n, i) in seq"
            :key="i"
            class="np-bubble"
            :class="{ done: i < idx, now: i === idx && !solved }"
          >
            <span v-if="i < idx" class="np-check">✓</span>
            <span v-else>{{ n }}</span>
          </div>
        </div>

        <!-- vehicle -->
        <div
          class="np-vehicle"
          :key="round + veh.id"
          :class="[veh.id, { go, 'face-left': dir < 0 && veh.id !== 'rocket' }]"
          :style="vehicleStyle"
        >
          <!-- car -->
          <svg v-if="veh.id === 'car'" viewBox="0 0 130 80" class="veh-svg">
            <g class="np-wheel">
              <circle cx="34" cy="60" r="14" fill="#3A3630" stroke="#2C2620" stroke-width="4" />
              <path d="M34 48v24M22 60h24" stroke="#C9B79C" stroke-width="4" stroke-linecap="round" />
              <circle cx="34" cy="60" r="5" fill="#C9B79C" />
            </g>
            <g class="np-wheel">
              <circle cx="98" cy="60" r="14" fill="#3A3630" stroke="#2C2620" stroke-width="4" />
              <path d="M98 48v24M86 60h24" stroke="#C9B79C" stroke-width="4" stroke-linecap="round" />
              <circle cx="98" cy="60" r="5" fill="#C9B79C" />
            </g>
            <path d="M14 52c0-8 6-14 16-16l14-14c4-4 10-4 14 0l22 14h26c8 0 14 5 14 12v8z" fill="#F9715A" stroke="#2C2620" stroke-width="4" stroke-linejoin="round" />
            <path d="M48 26l12-10c3-2 7-2 10 0l16 10z" fill="#9ADCF4" stroke="#2C2620" stroke-width="3.4" stroke-linejoin="round" />
            <circle cx="112" cy="48" r="4" fill="#FFE066" stroke="#2C2620" stroke-width="2.4" />
            <circle class="np-puff p1" cx="16" cy="62" r="5" fill="#fff" opacity="0" />
            <circle class="np-puff p2" cx="10" cy="56" r="4" fill="#fff" opacity="0" />
          </svg>

          <!-- rocket -->
          <svg v-else-if="veh.id === 'rocket'" viewBox="0 0 100 180" class="veh-svg">
            <circle class="np-rsmoke s1" cx="42" cy="158" r="8" fill="#fff" opacity="0" />
            <circle class="np-rsmoke s2" cx="58" cy="158" r="6" fill="#fff" opacity="0" />
            <g class="np-flame">
              <path d="M50 132c-10 7-13 20-8 29 2 5 5 8 8 8s6-3 8-8c5-9 2-22-8-29z" fill="#F9715A" stroke="#2C2620" stroke-width="3.4" />
              <path d="M50 140c-6 4-7 12-4 17 1 3 2 4 4 4s3-1 4-4c3-5 2-13-4-17z" fill="#FFC93C" />
            </g>
            <path d="M28 96c-9 5-12 15-12 26l12-6z" fill="#F9715A" stroke="#2C2620" stroke-width="3" stroke-linejoin="round" />
            <path d="M72 96c9 5 12 15 12 26l-12-6z" fill="#F9715A" stroke="#2C2620" stroke-width="3" stroke-linejoin="round" />
            <path d="M50 8c13 16 20 38 20 66v44c0 6-5 10-10 10H40c-5 0-10-4-10-10V74C30 46 37 24 50 8z" fill="#FFF6E4" stroke="#2C2620" stroke-width="3.4" />
            <path d="M50 6c12 15 19 32 20 48H30c1-16 8-33 20-48z" fill="#F9715A" stroke="#2C2620" stroke-width="3.4" stroke-linejoin="round" />
            <circle cx="50" cy="76" r="15" fill="#9ADCF4" stroke="#2C2620" stroke-width="3.2" />
            <circle cx="46" cy="74" r="2.2" fill="#2C2620" />
            <circle cx="54" cy="74" r="2.2" fill="#2C2620" />
            <path d="M46 81q4 4 8 0" fill="none" stroke="#2C2620" stroke-width="2" stroke-linecap="round" />
          </svg>

          <!-- bunny -->
          <svg v-else-if="veh.id === 'bunny'" viewBox="0 0 110 90" class="veh-svg">
            <ellipse cx="30" cy="18" rx="8" ry="20" fill="#FFFBF0" stroke="#2C2620" stroke-width="3.6" transform="rotate(-10 30 18)" />
            <ellipse cx="52" cy="16" rx="8" ry="22" fill="#FFFBF0" stroke="#2C2620" stroke-width="3.6" transform="rotate(8 52 16)" />
            <ellipse cx="31" cy="20" rx="3.6" ry="12" fill="#F79AC0" transform="rotate(-10 31 20)" />
            <ellipse cx="51" cy="18" rx="3.6" ry="13" fill="#F79AC0" transform="rotate(8 51 18)" />
            <ellipse cx="66" cy="56" rx="34" ry="26" fill="#FFFBF0" stroke="#2C2620" stroke-width="4" />
            <circle cx="88" cy="44" r="20" fill="#FFFBF0" stroke="#2C2620" stroke-width="4" />
            <circle cx="94" cy="40" r="3.4" fill="#2C2620" />
            <path d="M96 48h10l-5 6z" fill="#F79AC0" stroke="#2C2620" stroke-width="2.4" stroke-linejoin="round" />
            <path d="M100 54q4 3 8 1" fill="none" stroke="#2C2620" stroke-width="2.2" stroke-linecap="round" />
            <path d="M52 76q-4 10-2 14" fill="none" stroke="#2C2620" stroke-width="4" stroke-linecap="round" />
            <path d="M78 76q4 10 2 14" fill="none" stroke="#2C2620" stroke-width="4" stroke-linecap="round" />
            <circle class="np-puff p1" cx="14" cy="60" r="4" fill="#fff" opacity="0" />
          </svg>

          <!-- snail -->
          <svg v-else-if="veh.id === 'snail'" viewBox="0 0 120 80" class="veh-svg">
            <path d="M8 62c0-8 8-14 18-14h66c8 0 14 5 14 12v4z" fill="#F5A65B" stroke="#2C2620" stroke-width="3.6" stroke-linejoin="round" />
            <circle cx="46" cy="46" r="22" fill="#F79AC0" stroke="#2C2620" stroke-width="4" />
            <path d="M46 46m-13 0a13 13 0 1 1 26 0 9 9 0 1 1-18 0 5 5 0 1 1 10 0" fill="none" stroke="#2C2620" stroke-width="3" stroke-linecap="round" />
            <path d="M92 50q2-14 8-18M100 52q4-10 10-12" fill="none" stroke="#2C2620" stroke-width="3" stroke-linecap="round" />
            <circle cx="101" cy="31" r="4" fill="#FFFBF0" stroke="#2C2620" stroke-width="2.8" />
            <circle cx="111" cy="39" r="4" fill="#FFFBF0" stroke="#2C2620" stroke-width="2.8" />
            <circle cx="102" cy="32" r="1.6" fill="#2C2620" />
            <circle cx="112" cy="40" r="1.6" fill="#2C2620" />
          </svg>

          <!-- train -->
          <svg v-else-if="veh.id === 'train'" viewBox="0 0 160 90" class="veh-svg">
            <circle class="np-puff t1" cx="104" cy="10" r="6" fill="#fff" opacity="0" />
            <circle class="np-puff t2" cx="98" cy="8" r="4.5" fill="#fff" opacity="0" />
            <rect x="86" y="14" width="11" height="18" rx="3" fill="#3A3630" stroke="#2C2620" stroke-width="3" />
            <rect x="16" y="34" width="80" height="30" rx="10" fill="#5B8DEF" stroke="#2C2620" stroke-width="3.4" />
            <rect x="92" y="26" width="36" height="38" rx="8" fill="#5B8DEF" stroke="#2C2620" stroke-width="3.4" />
            <rect x="99" y="33" width="15" height="13" rx="3" fill="#9ADCF4" stroke="#2C2620" stroke-width="2.4" />
            <ellipse cx="48" cy="31" rx="11" ry="8" fill="#FFC93C" stroke="#2C2620" stroke-width="3" />
            <path d="M126 62l16 12-8-18z" fill="#F59B3F" stroke="#2C2620" stroke-width="3" stroke-linejoin="round" />
            <circle cx="38" cy="68" r="12" fill="#3A3630" stroke="#2C2620" stroke-width="3.4" />
            <circle cx="72" cy="68" r="12" fill="#3A3630" stroke="#2C2620" stroke-width="3.4" />
            <circle cx="106" cy="68" r="12" fill="#3A3630" stroke="#2C2620" stroke-width="3.4" />
            <circle cx="38" cy="68" r="4.5" fill="#C9B79C" />
            <circle cx="72" cy="68" r="4.5" fill="#C9B79C" />
            <circle cx="106" cy="68" r="4.5" fill="#C9B79C" />
            <circle cx="140" cy="52" r="4" fill="#FFE066" stroke="#2C2620" stroke-width="2.4" />
          </svg>

          <!-- aeroplane -->
          <svg v-else-if="veh.id === 'plane'" viewBox="0 0 150 80" class="veh-svg">
            <path d="M62 30l22-22 10 5-17 19z" fill="#F59B3F" stroke="#2C2620" stroke-width="3" stroke-linejoin="round" />
            <path d="M14 40l-8-9 3-3 12 7z" fill="#F59B3F" stroke="#2C2620" stroke-width="2.6" stroke-linejoin="round" />
            <path d="M16 46l-10 6 4 4 12-4z" fill="#F59B3F" stroke="#2C2620" stroke-width="2.6" stroke-linejoin="round" />
            <path d="M12 40c0-9 16-16 40-16h50c20 0 34 7 36 15-2 8-16 15-36 15H52c-24 0-40-6-40-14z" fill="#F59B3F" stroke="#2C2620" stroke-width="3.6" stroke-linejoin="round" />
            <ellipse cx="110" cy="33" rx="11" ry="7" fill="#9ADCF4" stroke="#2C2620" stroke-width="2.8" />
            <circle cx="66" cy="38" r="2.6" fill="#2C2620" />
            <circle cx="82" cy="38" r="2.6" fill="#2C2620" />
            <circle cx="98" cy="38" r="2.6" fill="#2C2620" />
            <g class="np-prop">
              <ellipse cx="142" cy="40" rx="13" ry="4" fill="#3A3630" opacity=".35" />
              <ellipse cx="142" cy="40" rx="4" ry="13" fill="#3A3630" />
            </g>
          </svg>

          <!-- duck -->
          <svg v-else-if="veh.id === 'duck'" viewBox="0 0 120 80" class="veh-svg">
            <path d="M26 48l-15-9 5 14z" fill="#FFE066" stroke="#2C2620" stroke-width="3" stroke-linejoin="round" />
            <ellipse cx="52" cy="54" rx="30" ry="20" fill="#FFE066" stroke="#2C2620" stroke-width="3.6" />
            <ellipse class="np-flap" cx="48" cy="54" rx="14" ry="9" fill="#F5C93F" stroke="#2C2620" stroke-width="2.8" />
            <circle cx="84" cy="34" r="17" fill="#FFE066" stroke="#2C2620" stroke-width="3.6" />
            <path d="M94 31l15 5-15 6z" fill="#F59B3F" stroke="#2C2620" stroke-width="2.8" stroke-linejoin="round" />
            <circle cx="88" cy="30" r="3" fill="#2C2620" />
            <circle cx="89" cy="29" r="1" fill="#fff" />
            <ellipse cx="46" cy="72" rx="7" ry="4" fill="#F59B3F" stroke="#2C2620" stroke-width="2.4" />
            <ellipse cx="66" cy="72" rx="7" ry="4" fill="#F59B3F" stroke="#2C2620" stroke-width="2.4" />
          </svg>

          <!-- frog -->
          <svg v-else viewBox="0 0 120 80" class="veh-svg">
            <circle cx="44" cy="32" r="11" fill="#58A86C" stroke="#2C2620" stroke-width="3.4" />
            <circle cx="72" cy="30" r="12" fill="#58A86C" stroke="#2C2620" stroke-width="3.4" />
            <circle cx="45" cy="32" r="4.6" fill="#fff" stroke="#2C2620" stroke-width="2.4" />
            <circle cx="73" cy="30" r="5" fill="#fff" stroke="#2C2620" stroke-width="2.4" />
            <circle cx="46" cy="33" r="2.2" fill="#2C2620" />
            <circle cx="74" cy="31" r="2.2" fill="#2C2620" />
            <ellipse cx="58" cy="56" rx="32" ry="22" fill="#58A86C" stroke="#2C2620" stroke-width="3.6" />
            <ellipse cx="60" cy="64" rx="17" ry="10" fill="#EAF9EC" />
            <path d="M44 54q14 9 30 3" fill="none" stroke="#2C2620" stroke-width="2.8" stroke-linecap="round" />
            <path d="M28 62q-10 4-14 12M92 62q10 4 14 12" fill="none" stroke="#2C2620" stroke-width="4" stroke-linecap="round" />
            <ellipse cx="14" cy="74" rx="8" ry="4" fill="#F59B3F" stroke="#2C2620" stroke-width="2.6" />
            <ellipse cx="106" cy="74" rx="8" ry="4" fill="#F59B3F" stroke="#2C2620" stroke-width="2.6" />
          </svg>

          <!-- mid-journey compliment -->
          <div
            v-if="stage === 2"
            class="np-cheer"
            :class="{ flip: dir < 0 && veh.id !== 'rocket' }"
          >
            {{ cheer }}
          </div>
        </div>

        <Confetti :burst="burst" :origin="origin" :count="36" />
      </div>

      <template #answer>
        <NumberPad
          :max="store.toddler ? 5 : 10"
          :disabled="solved"
          :hit="hit"
          :miss="miss"
          @pick="pickNumber"
        />
      </template>
    </GameShell>

    <GameOver
      v-if="finished"
      :stars="earned"
      title="Parade complete!"
      :detail="`You finished ${firstTry} parades in perfect order.`"
      accent="#F9715A"
      @again="restart"
      @exit="exitGame"
    />
  </div>
</template>

<style scoped>
.np-scene {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  overflow: hidden;
  background: linear-gradient(180deg, #bfeaf8 0%, #e3f6ff 55%, #f3fbe8 100%);
}

.np-sun {
  position: absolute;
  right: 8%;
  top: 6%;
  width: clamp(46px, 7vw, 74px);
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--sun);
  border: 4px solid var(--ink);
  box-shadow: 0 0 0 10px rgba(255, 201, 60, 0.25), 0 0 0 22px rgba(255, 201, 60, 0.12);
  animation: bob 6s ease-in-out infinite;
}

.np-cloud {
  position: absolute;
  height: clamp(22px, 3.4vw, 36px);
  background: #fffdf6;
  border: 3.5px solid var(--ink);
  border-radius: 999px;
  opacity: 0.92;
}
.np-cloud::before,
.np-cloud::after {
  content: '';
  position: absolute;
  background: inherit;
  border: inherit;
  border-radius: 50%;
  bottom: 50%;
}
.np-cloud::before {
  width: 55%;
  aspect-ratio: 1;
  left: 12%;
  margin-bottom: -5px;
}
.np-cloud::after {
  width: 38%;
  aspect-ratio: 1;
  right: 12%;
  margin-bottom: -3px;
}
.np-cloud.c1 {
  width: clamp(90px, 14vw, 150px);
  left: 22%;
  top: 8%;
  animation: drift 62s linear infinite;
}
.np-cloud.c2 {
  width: clamp(64px, 10vw, 110px);
  left: 0;
  top: 22%;
  opacity: 0.7;
  animation: drift 82s linear infinite;
  animation-delay: -40s;
}
.np-cloud.c3 {
  width: clamp(50px, 8vw, 90px);
  left: 0;
  top: 36%;
  opacity: 0.55;
  animation: drift 95s linear infinite;
  animation-delay: -70s;
}

.np-hills {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 36%;
}
.np-hills svg {
  width: 100%;
  height: 100%;
}

.np-road {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 13%;
  background: #b8a98f;
  border-top: 4px solid var(--ink);
}
.np-road::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 46%;
  border-top: 4px dashed rgba(255, 250, 240, 0.75);
}

.np-fence {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 12.5%;
  height: 0;
  pointer-events: none;
}
.np-post {
  position: absolute;
  bottom: 0;
  width: 5px;
  height: 26px;
  background: #a9744f;
  border: 2.5px solid var(--ink);
  border-radius: 3px;
}

/* sequence bubbles */
.np-seq {
  position: absolute;
  left: 50%;
  top: 9%;
  transform: translateX(-50%);
  display: flex;
  gap: clamp(8px, 1.4vw, 14px);
  z-index: 6;
}

.np-bubble {
  width: clamp(52px, 8vw, 84px);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(26px, 4.4vw, 44px);
  line-height: 1;
  color: var(--ink);
  background: var(--cream);
  border: 4px solid var(--ink);
  border-radius: 50%;
  box-shadow: 0 5px 0 var(--ink);
  transition: background 0.2s ease, transform 0.2s ease;
}

.np-bubble.now {
  background: var(--coral);
  color: var(--cream);
  animation: npPulse 1.1s ease-in-out infinite;
}

@keyframes npPulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.np-bubble.done {
  background: var(--mint);
}

.np-check {
  font-size: 0.72em;
}

/* vehicle */
.np-vehicle {
  position: absolute;
  width: clamp(110px, 17%, 190px);
  z-index: 5;
  transition-property: left, right, bottom;
  transition-duration: 2s;
  transition-timing-function: cubic-bezier(0.55, 0, 0.85, 0.4);
  filter: drop-shadow(0 8px 0 rgba(44, 38, 32, 0.2));
}

.np-vehicle.rocket {
  width: clamp(80px, 12%, 140px);
}
.np-vehicle.train {
  width: clamp(140px, 22%, 240px);
}
.np-vehicle.plane {
  width: clamp(120px, 19%, 210px);
}
.np-vehicle.frog {
  width: clamp(100px, 15%, 170px);
}

.np-vehicle.face-left {
  transform: scaleX(-1);
}

/* mid-journey compliment bubble */
.np-cheer {
  position: absolute;
  bottom: 110%;
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
  max-width: 250px;
  background: var(--cream);
  border: 3px solid var(--ink);
  border-radius: 16px;
  padding: 6px 14px 8px;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(12px, 1.7vw, 16px);
  line-height: 1.25;
  color: var(--ink);
  text-align: center;
  box-shadow: 0 4px 0 rgba(44, 38, 32, 0.25);
  z-index: 8;
  pointer-events: none;
  opacity: 0;
  scale: 0.4;
  animation: cheerPop 0.35s cubic-bezier(0.2, 1.5, 0.4, 1) forwards;
}

.np-vehicle.face-left .np-cheer {
  transform: translateX(-50%) scaleX(-1);
}

.np-cheer::after {
  content: '';
  position: absolute;
  bottom: -9px;
  left: 50%;
  width: 12px;
  height: 12px;
  background: var(--cream);
  border-right: 3px solid var(--ink);
  border-bottom: 3px solid var(--ink);
  transform: translateX(-50%) rotate(45deg);
}

@keyframes cheerPop {
  to {
    opacity: 1;
    scale: 1;
  }
}

.veh-svg {
  width: 100%;
  height: auto;
  overflow: visible;
}

/* animated parts */
.np-wheel,
.np-prop,
.np-flame,
.np-puff,
.np-rsmoke,
.np-flap {
  transform-box: fill-box;
  transform-origin: center;
}

.np-vehicle.go .np-wheel {
  animation: wheelSpin 0.45s linear infinite;
}

@keyframes wheelSpin {
  to {
    transform: rotate(360deg);
  }
}

.np-vehicle.go .np-flame {
  opacity: 1;
  animation: flameFlicker 0.14s steps(2, end) infinite;
}

.np-vehicle:not(.go) .np-flame {
  opacity: 0.35;
}

@keyframes flameFlicker {
  0% {
    transform: scaleY(0.85) scaleX(1.04);
  }
  100% {
    transform: scaleY(1.14) scaleX(0.94);
  }
}

.np-vehicle.go .np-rsmoke {
  animation: rSmoke 0.9s ease-out infinite;
}
.np-vehicle.go .np-rsmoke.s2 {
  animation-delay: 0.3s;
}

@keyframes rSmoke {
  0% {
    transform: translate(0, 0) scale(0.5);
    opacity: 0.85;
  }
  100% {
    transform: translate(-14px, -34px) scale(1.7);
    opacity: 0;
  }
}

.np-vehicle.go .np-puff {
  animation: puffUp 0.8s ease-out infinite;
}
.np-vehicle.go .np-puff.p2,
.np-vehicle.go .np-puff.t2 {
  animation-delay: 0.25s;
}
.np-vehicle.go .np-puff.t1 {
  animation-delay: 0.15s;
}
.np-vehicle.go .np-puff.t2 {
  animation-delay: 0.45s;
}

@keyframes puffUp {
  0% {
    transform: translate(0, 0) scale(0.5);
    opacity: 0.85;
  }
  100% {
    transform: translate(-30px, -26px) scale(1.6);
    opacity: 0;
  }
}

.np-vehicle.go .np-prop {
  animation: propSpin 0.16s linear infinite;
}

@keyframes propSpin {
  to {
    transform: rotate(360deg);
  }
}

.np-vehicle.go .np-flap {
  animation: flapWing 0.35s ease-in-out infinite;
}

@keyframes flapWing {
  0%,
  100% {
    transform: rotate(-8deg);
  }
  50% {
    transform: rotate(8deg);
  }
}

/* whole-body motions while travelling */
.np-vehicle.go.bunny .veh-svg {
  animation: bunnyRun 0.5s ease-in-out infinite;
}

@keyframes bunnyRun {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  40% {
    transform: translateY(-14px) rotate(-4deg);
  }
  60% {
    transform: translateY(0) rotate(3deg);
  }
}

.np-vehicle.go.snail .veh-svg {
  animation: snailBob 0.9s ease-in-out infinite;
}

@keyframes snailBob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

.np-vehicle.go.train .veh-svg {
  animation: trainChug 0.4s ease-in-out infinite;
}

@keyframes trainChug {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-3px) rotate(-1.2deg);
  }
}

.np-vehicle.go.plane .veh-svg {
  animation: planeBob 0.8s ease-in-out infinite;
}

@keyframes planeBob {
  0%,
  100% {
    transform: translateY(0) rotate(-2deg);
  }
  50% {
    transform: translateY(-9px) rotate(2deg);
  }
}

.np-vehicle.go.duck .veh-svg {
  animation: waddle 0.5s ease-in-out infinite;
}

@keyframes waddle {
  0%,
  100% {
    transform: rotate(-6deg) translateY(0);
  }
  50% {
    transform: rotate(6deg) translateY(-4px);
  }
}

.np-vehicle.go.frog .veh-svg {
  animation: frogHop 0.55s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes frogHop {
  0%,
  100% {
    transform: translateY(0) scaleY(1);
  }
  40% {
    transform: translateY(-18px) scaleY(1.05);
  }
  70% {
    transform: translateY(0) scaleY(0.94);
  }
}

.np-vehicle.go.car .veh-svg {
  animation: carBounce 0.5s ease-in-out infinite;
}

@keyframes carBounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

@media (max-width: 640px) {
  .np-bubble {
    width: 46px;
    font-size: 24px;
    border-width: 3px;
    box-shadow: 0 3px 0 var(--ink);
  }
  .np-vehicle {
    width: 30%;
  }
  .np-vehicle.rocket {
    width: 24%;
  }
  .np-vehicle.train {
    width: 40%;
  }
  .np-vehicle.plane {
    width: 36%;
  }
}
</style>
