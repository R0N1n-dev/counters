<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import GameShell from '../components/GameShell.vue'
import TypePad from '../components/TypePad.vue'
import Confetti from '../components/Confetti.vue'
import GameOver from '../components/GameOver.vue'
import PromptText from '../components/PromptText.vue'
import { sfx } from '../lib/audio.js'
import { randInt, scatterGrid, pick } from '../lib/fx.js'
import { recordGame, store } from '../lib/store.js'

const emit = defineEmits(['exit'])

const TOTAL = computed(() => store.rounds)
const TARGETS = [3, 4, 6, 8, 10]
const TODDLER_TARGETS = [3, 4, 2, 5, 4]
const ALIEN_COLORS = ['#8FE0B0', '#8AD7F2', '#A98BF5', '#FFC93C', '#F79AC0']
const PRAISE = ['Blast off! Perfect count!', 'Three... two... one... you did it!', 'Mission control is cheering!', 'The rocket loves your counting!']

const round = ref(1)
const target = ref(3)
const aliens = ref([])
const prompt = ref('')
const mood = ref('happy')
const solved = ref(false)
const launching = ref(false)
const tries = ref(0)
const firstTry = ref(0)
const hint = ref(false)
const burst = ref(0)
const origin = ref({ x: 50, y: 55 })
const finished = ref(false)
const earned = ref(0)
const padRef = ref(null)
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
  launching.value = false
  tries.value = 0
  hint.value = false
  mood.value = 'happy'
  const targets = store.toddler ? TODDLER_TARGETS : TARGETS
  target.value = targets[(round.value - 1) % targets.length]
  padRef.value?.clear()

  const spots = scatterGrid(target.value, { cols: 5, rows: 2, x0: 40, x1: 93, y0: 14, y1: 54 })
  aliens.value = spots.map((s, i) => ({
    id: `a${i}-${Math.random().toString(36).slice(2, 7)}`,
    x: s.x,
    y: s.y,
    color: ALIEN_COLORS[i % ALIEN_COLORS.length],
    delay: (Math.random() * 2.4).toFixed(2),
    scale: 0.86 + Math.random() * 0.3,
  }))
  prompt.value = `How many aliens are floating outside the rocket? Type the number!`
}

function check(n) {
  if (solved.value) return
  if (n === target.value) {
    solved.value = true
    launching.value = true
    mood.value = 'cheer'
    if (tries.value === 0) firstTry.value++
    prompt.value = `${pick(PRAISE)} ${target.value} aliens!`
    burst.value++
    origin.value = { x: 30, y: 70 }
    sfx.correct()
    later(() => sfx.whoosh(), 220)
    later(() => sfx.sparkle(), 700)
    later(() => {
      if (round.value >= TOTAL.value) finish()
      else {
        round.value++
        buildRound()
      }
    }, 3000)
  } else {
    tries.value++
    padRef.value?.reject()
    sfx.wrong()
    mood.value = 'oops'
    hint.value = tries.value >= 2
    prompt.value =
      tries.value >= 2
        ? 'The aliens are glowing one by one — count along, then try again!'
        : 'Not quite! Count the aliens from left to right, then try again.'
    later(() => {
      if (!solved.value) {
        mood.value = 'happy'
        prompt.value = 'How many aliens are outside the rocket? Type the number!'
      }
    }, 2600)
  }
}

function finish() {
  earned.value = firstTry.value >= 4 ? 3 : firstTry.value >= 2 ? 2 : 1
  recordGame('rocket', earned.value)
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
      title="Rocket Countdown"
      accent="#8AD7F2"
      :round="round"
      :total="TOTAL"
      :mood="mood"
      :prompt="prompt"
      :dark="true"
      @exit="exitGame"
    >
      <template #prompt>
        <PromptText :text="prompt" />
      </template>

      <div class="rc-scene" :class="{ launching, hint }">
        <div class="rc-stars">
          <span
            v-for="s in 40"
            :key="s"
            class="rc-star"
            :style="{
              left: (s * 31) % 98 + '%',
              top: (s * 47) % 66 + '%',
              width: s % 6 === 0 ? '5px' : '3px',
              height: s % 6 === 0 ? '5px' : '3px',
              animationDelay: (s % 11) * 0.35 + 's',
            }"
          />
        </div>

        <div class="rc-planet">
          <div class="planet-ring" />
          <div class="planet-body" />
        </div>
        <div class="rc-moon" />

        <div class="rc-aliens">
          <div
            v-for="(a, i) in aliens"
            :key="a.id"
            class="alien"
            :style="{ left: a.x + '%', top: a.y + '%', '--i': i, '--d': a.delay + 's', '--s': a.scale }"
          >
            <svg viewBox="0 0 60 76" class="alien-svg">
              <path d="M22 20l-6-13M38 20l6-13" stroke="#2C2620" stroke-width="2.6" stroke-linecap="round" />
              <circle cx="16" cy="6" r="5" :fill="a.color" stroke="#2C2620" stroke-width="2.6" />
              <circle cx="44" cy="6" r="5" :fill="a.color" stroke="#2C2620" stroke-width="2.6" />
              <path
                d="M30 18c13 0 22 12 22 26 0 13-9 22-22 22s-22-9-22-22c0-14 9-26 22-26z"
                :fill="a.color"
                stroke="#2C2620"
                stroke-width="3.2"
              />
              <ellipse cx="22" cy="38" rx="7" ry="8" fill="#FFFBF0" stroke="#2C2620" stroke-width="2.2" />
              <ellipse cx="38" cy="38" rx="7" ry="8" fill="#FFFBF0" stroke="#2C2620" stroke-width="2.2" />
              <circle cx="23" cy="39" r="3.2" fill="#2C2620" />
              <circle cx="37" cy="39" r="3.2" fill="#2C2620" />
              <path d="M25 52q5 4 10 0" fill="none" stroke="#2C2620" stroke-width="2.4" stroke-linecap="round" />
              <circle cx="15" cy="48" r="3.4" fill="#fff" opacity=".35" />
              <circle cx="45" cy="48" r="3.4" fill="#fff" opacity=".35" />
            </svg>
          </div>
        </div>

        <div class="rc-pad">
          <div class="launch-pad" />
        </div>

        <div class="rc-rocket" :class="{ launching }">
          <div class="smoke">
            <span /><span /><span />
          </div>
          <svg viewBox="0 0 140 260" class="rocket-svg">
            <g class="flame">
              <path
                d="M70 206c-17 10-22 30-13 46 5 9 9 14 13 14s8-5 13-14c9-16 4-36-13-46z"
                fill="#F9715A"
                stroke="#2C2620"
                stroke-width="4"
              />
              <path d="M70 216c-10 7-13 20-8 30 3 6 5 9 8 9s5-3 8-9c5-10 2-23-8-30z" fill="#FFC93C" />
              <path d="M70 228c-5 4-6 12-3 18 1 3 2 4 3 4s2-1 3-4c3-6 2-14-3-18z" fill="#FFF6DF" />
            </g>

            <path
              d="M40 158c-17 9-23 28-23 47l23-11z"
              fill="#F9715A"
              stroke="#2C2620"
              stroke-width="5"
              stroke-linejoin="round"
            />
            <path
              d="M100 158c17 9 23 28 23 47l-23-11z"
              fill="#F9715A"
              stroke="#2C2620"
              stroke-width="5"
              stroke-linejoin="round"
            />
            <path
              d="M70 8c19 24 29 52 29 94v62c0 9-7 14-14 14H55c-7 0-14-5-14-14v-62c0-42 10-70 29-94z"
              fill="#FFF6E4"
              stroke="#2C2620"
              stroke-width="5"
            />
            <path
              d="M70 6c18 22 27 46 29 70H41c2-24 11-48 29-70z"
              fill="#F9715A"
              stroke="#2C2620"
              stroke-width="5"
              stroke-linejoin="round"
            />
            <path d="M41 146h58v16H41z" fill="#8AD7F2" stroke="#2C2620" stroke-width="4" />
            <circle cx="70" cy="108" r="23" fill="#9ADCF4" stroke="#2C2620" stroke-width="5" />
            <circle cx="70" cy="108" r="16" fill="#CDEFFA" />
            <circle cx="64" cy="105" r="3" fill="#2C2620" />
            <circle cx="76" cy="105" r="3" fill="#2C2620" />
            <path d="M65 114q5 5 10 0" fill="none" stroke="#2C2620" stroke-width="2.6" stroke-linecap="round" />
            <circle cx="52" cy="46" r="3" fill="#C9B79C" />
            <circle cx="92" cy="62" r="3" fill="#C9B79C" />
            <circle cx="58" cy="180" r="3" fill="#C9B79C" />
            <circle cx="84" cy="180" r="3" fill="#C9B79C" />
          </svg>
        </div>

        <Transition name="pop">
          <div v-if="launching" class="rc-blast">BLAST OFF!</div>
        </Transition>

        <Confetti :burst="burst" :origin="origin" :count="40" />
      </div>

      <template #answer>
        <div class="rc-answer">
          <div class="rc-question">How many aliens? <span class="rc-type-hint">type it with the numbers</span></div>
          <TypePad
            ref="padRef"
            :disabled="solved"
            :hit="solved"
            :digits="store.toddler ? 5 : 9"
            :answer-length="String(target).length"
            @submit="check"
          />
        </div>
      </template>
    </GameShell>

    <GameOver
      v-if="finished"
      :stars="earned"
      title="Mission complete!"
      :detail="`You counted ${firstTry} launches first try.`"
      accent="#8AD7F2"
      @again="restart"
      @exit="exitGame"
    />
  </div>
</template>

<style scoped>
.rc-scene {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  overflow: hidden;
  background: radial-gradient(120% 90% at 70% 10%, #2a3670 0%, #141d42 46%, #0b1130 100%);
}

.rc-star {
  position: absolute;
  border-radius: 50%;
  background: #fff8d8;
  animation: twinkle 3.8s ease-in-out infinite;
}

.rc-planet {
  position: absolute;
  left: 4%;
  top: 8%;
  width: clamp(56px, 9vw, 96px);
  aspect-ratio: 1;
  animation: floaty 9s ease-in-out infinite;
}
.planet-body {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle at 34% 30%, #d7a4ff 0%, #a06ce0 60%, #7b4bc0 100%);
  border: 4px solid #0b1130;
}
.planet-ring {
  position: absolute;
  left: -22%;
  right: -22%;
  top: 38%;
  height: 24%;
  border: 4px solid #e8c7ff;
  border-radius: 50%;
  transform: rotate(-16deg);
  opacity: 0.85;
}
.rc-moon {
  position: absolute;
  right: 7%;
  top: 7%;
  width: clamp(34px, 5vw, 54px);
  aspect-ratio: 1;
  border-radius: 50%;
  background: #fff6d8;
  border: 3.5px solid #0b1130;
  box-shadow: 0 0 22px rgba(255, 246, 216, 0.55);
  animation: bob 7s ease-in-out infinite;
}

/* aliens */
.rc-aliens {
  position: absolute;
  inset: 0;
}
.alien {
  position: absolute;
  width: clamp(56px, 8.5vw, 92px);
  transform: translate(-50%, -50%) scale(var(--s));
  animation: flyFloat 5s ease-in-out infinite;
  animation-delay: var(--d);
  transition: opacity 0.7s ease, transform 0.9s ease;
}
.alien-svg {
  width: 100%;
  height: auto;
  filter: drop-shadow(0 4px 0 rgba(0, 0, 0, 0.25));
}

.rc-scene.hint .alien {
  animation: alienGlow 2.6s ease-in-out infinite;
  animation-delay: calc(var(--i) * 0.3s);
}

@keyframes alienGlow {
  0%,
  100% {
    filter: none;
    transform: translate(-50%, -50%) scale(var(--s));
  }
  40% {
    filter: drop-shadow(0 0 14px rgba(255, 224, 102, 0.95));
    transform: translate(-50%, -50%) scale(calc(var(--s) * 1.16));
  }
}

.rc-scene.launching .alien {
  opacity: 0.25;
  transform: translate(-50%, -180%) scale(calc(var(--s) * 0.8));
}

/* rocket */
.rc-pad {
  position: absolute;
  left: 6%;
  bottom: 0;
  width: 30%;
  height: 22%;
}
.launch-pad {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 46%;
  background: linear-gradient(180deg, #3c4a86 0%, #232c55 100%);
  border-top: 4px solid #0b1130;
  border-radius: 50% 50% 0 0 / 30% 30% 0 0;
}

.rc-rocket {
  position: absolute;
  left: 11%;
  bottom: 2%;
  width: clamp(80px, 17%, 165px);
  transform-origin: bottom center;
  animation: bob 3.6s ease-in-out infinite;
  filter: drop-shadow(0 10px 0 rgba(0, 0, 0, 0.25));
}

.rocket-svg {
  width: 100%;
  height: auto;
  overflow: visible;
}

.flame {
  opacity: 0;
  transform-origin: 70px 206px;
}
.rc-rocket.launching .flame {
  opacity: 1;
  animation: flameFlicker 0.14s steps(2, end) infinite;
}

@keyframes flameFlicker {
  0% {
    transform: scaleY(0.85) scaleX(1.04);
  }
  100% {
    transform: scaleY(1.14) scaleX(0.94);
  }
}

.rc-rocket.launching {
  animation: blastOff 1.5s cubic-bezier(0.5, 0, 0.7, 1) 0.35s forwards;
}

@keyframes blastOff {
  0% {
    transform: translateY(0) rotate(0);
  }
  18% {
    transform: translateY(-8%) rotate(-3deg);
  }
  100% {
    transform: translateY(-460%) rotate(4deg);
  }
}

.smoke {
  position: absolute;
  left: 50%;
  bottom: -6%;
  transform: translateX(-50%);
  width: 100%;
  height: 40%;
  pointer-events: none;
}
.smoke span {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 46%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: rgba(255, 246, 228, 0.75);
  opacity: 0;
}
.rc-rocket.launching .smoke span {
  animation: smokePuff 1.1s ease-out forwards;
}
.rc-rocket.launching .smoke span:nth-child(2) {
  animation-delay: 0.14s;
  left: 26%;
  width: 38%;
}
.rc-rocket.launching .smoke span:nth-child(3) {
  animation-delay: 0.26s;
  left: 66%;
  width: 40%;
}

@keyframes smokePuff {
  0% {
    opacity: 0.9;
    transform: translate(-50%, 0) scale(0.4);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, 60%) scale(1.9);
  }
}

.rc-blast {
  position: absolute;
  left: 28%;
  top: 32%;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(26px, 5vw, 54px);
  color: #fff6d8;
  text-shadow: 0 0 24px rgba(255, 224, 102, 0.9), 0 5px 0 rgba(11, 17, 48, 0.6);
  transform: rotate(-5deg);
  animation: popIn 0.5s cubic-bezier(0.2, 1.5, 0.4, 1);
  pointer-events: none;
}

/* answer */
.rc-answer {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.rc-question {
  text-align: center;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(17px, 2.1vw, 24px);
  line-height: 1.25;
  color: var(--ink);
  background: var(--cream);
  border: 3px solid var(--ink);
  border-radius: 16px;
  padding: 8px 14px;
  box-shadow: 0 4px 0 var(--ink);
}

.rc-type-hint {
  font-family: var(--font-body);
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-soft);
  margin-left: 6px;
}

@media (max-width: 640px) {
  .rc-rocket {
    left: 6%;
    width: 24%;
  }
  .rc-pad {
    width: 38%;
  }
  .rc-type-hint {
    display: none;
  }
}
</style>
