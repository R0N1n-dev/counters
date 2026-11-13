<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import GameShell from '../components/GameShell.vue'
import TypePad from '../components/TypePad.vue'
import Confetti from '../components/Confetti.vue'
import GameOver from '../components/GameOver.vue'
import PromptText from '../components/PromptText.vue'
import { sfx } from '../lib/audio.js'
import { pick } from '../lib/fx.js'
import { recordGame, store } from '../lib/store.js'

const emit = defineEmits(['exit'])

const TOTAL = computed(() => store.rounds)
const TARGETS = [4, 5, 6, 7, 9]
const TODDLER_TARGETS = [2, 3, 4, 5, 3]
const SPOT_COLORS = ['#F5A65B', '#8FE0B0', '#8AD7F2', '#F79AC0']
const PRAISE = ['Peep! A baby dino!', 'CRACK! You counted perfectly!', 'The nest is full of happy dinos!', 'Mama Dino is dancing!']
const RAWR = ['RAWR!', 'Peep-peep! RAWR!', 'RAWRRR!', 'Squawk! RAWR!']

const round = ref(1)
const target = ref(4)
const prompt = ref('')
const mood = ref('happy')
const solved = ref(false)
const cracking = ref(false)
const hatched = ref(false)
const tries = ref(0)
const firstTry = ref(0)
const hint = ref(false)
const rawr = ref('RAWR!')
const burst = ref(0)
const origin = ref({ x: 50, y: 62 })
const finished = ref(false)
const earned = ref(0)
const padRef = ref(null)
let timers = []

const eggs = computed(() => {
  const n = target.value
  const cols = Math.min(5, n)
  const rows = Math.ceil(n / cols)
  const out = []
  for (let i = 0; i < n; i++) {
    const c = i % cols
    const r = Math.floor(i / cols)
    out.push({
      id: i,
      x: 50 + (c - (cols - 1) / 2) * (cols > 3 ? 14 : 18),
      y: 30 - (rows - 1) * 11 + r * 11,
      rot: (i % 2 === 0 ? -1 : 1) * (4 + ((i * 7) % 9)),
      color: SPOT_COLORS[i % SPOT_COLORS.length],
      delay: (i * 0.12).toFixed(2),
    })
  }
  return out
})

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
  cracking.value = false
  hatched.value = false
  tries.value = 0
  hint.value = false
  mood.value = 'happy'
  const targets = store.toddler ? TODDLER_TARGETS : TARGETS
  target.value = targets[(round.value - 1) % targets.length]
  padRef.value?.clear()
  prompt.value = 'How many eggs are in the nest? Type the number!'
}

function check(n) {
  if (solved.value) return
  if (n === target.value) {
    solved.value = true
    mood.value = 'cheer'
    if (tries.value === 0) firstTry.value++
    prompt.value = `Yes! ${target.value} eggs! Something is hatching…`
    sfx.correct()
    later(() => {
      cracking.value = true
      sfx.chew(0.05)
    }, 420)
    later(() => {
      hatched.value = true
      rawr.value = pick(RAWR)
      burst.value++
      origin.value = { x: 50, y: 60 }
      sfx.sparkle()
      prompt.value = `${pick(PRAISE)} That was ${target.value}!`
    }, 1150)
    later(() => {
      if (round.value >= TOTAL.value) finish()
      else {
        round.value++
        buildRound()
      }
    }, 3400)
  } else {
    tries.value++
    padRef.value?.reject()
    sfx.wrong()
    mood.value = 'oops'
    hint.value = tries.value >= 2
    prompt.value =
      tries.value >= 2
        ? 'The eggs glow one by one — count along, then try again!'
        : 'Not quite! Point at each egg and count again.'
    later(() => {
      if (!solved.value) {
        mood.value = 'happy'
        prompt.value = 'How many eggs are in the nest? Type the number!'
      }
    }, 2600)
  }
}

function finish() {
  earned.value = firstTry.value >= 4 ? 3 : firstTry.value >= 2 ? 2 : 1
  recordGame('dino', earned.value)
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
      title="Dino Hatch"
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

      <div class="dh-scene" :class="{ cracking, hatched, hint }">
        <div class="dh-sun" />
        <div class="dh-hills">
          <svg viewBox="0 0 900 240" preserveAspectRatio="none">
            <path d="M0 190c110-60 220-54 330-18 110 36 200-30 300-34 100-4 180 30 270 44v58H0z" fill="#9ED48F" stroke="#2C2620" stroke-width="4" vector-effect="non-scaling-stroke" />
            <path d="M0 220c130-30 230 6 340 2 120-4 200-26 320-14 80 8 150 18 240 10v22H0z" fill="#6FBF7C" stroke="#2C2620" stroke-width="4" vector-effect="non-scaling-stroke" />
          </svg>
        </div>

        <div class="dh-leaves left">
          <svg viewBox="0 0 200 160">
            <path d="M0 10c60 0 120 26 150 72-46-8-74-2-102-24C24 40 6 24 0 10z" fill="#4E9B62" stroke="#2C2620" stroke-width="4" stroke-linejoin="round" />
            <path d="M8 20c50 16 92 40 118 66" fill="none" stroke="#2C2620" stroke-width="3" opacity=".5" />
            <path d="M0 70c40 6 78 24 96 52-34 0-60-8-74-24C12 88 4 78 0 70z" fill="#5FAE6D" stroke="#2C2620" stroke-width="4" stroke-linejoin="round" />
          </svg>
        </div>
        <div class="dh-leaves right">
          <svg viewBox="0 0 200 160">
            <path d="M200 10c-60 0-120 26-150 72 46-8 74-2 102-24 24-18 42-34 48-48z" fill="#4E9B62" stroke="#2C2620" stroke-width="4" stroke-linejoin="round" />
            <path d="M192 20c-50 16-92 40-118 66" fill="none" stroke="#2C2620" stroke-width="3" opacity=".5" />
          </svg>
        </div>

        <div class="dh-mama" :class="{ happy: hatched }">
          <svg viewBox="0 0 180 220">
            <path d="M34 220c-4-70 6-108 40-126 24-13 44-10 46 6 2 13-14 20-30 28-22 11-28 42-26 92z" fill="#7CCB88" stroke="#2C2620" stroke-width="4.5" stroke-linejoin="round" />
            <path d="M76 100c4-14 16-20 26-16" fill="none" stroke="#4E9B62" stroke-width="4" stroke-linecap="round" />
            <circle cx="112" cy="86" r="30" fill="#8FD6A0" stroke="#2C2620" stroke-width="4.5" />
            <path d="M86 70c-6-12-2-20 6-20 7 0 10 8 8 18" fill="none" stroke="#2C2620" stroke-width="3.6" stroke-linecap="round" />
            <ellipse cx="124" cy="82" rx="12" ry="9" fill="#8FD6A0" stroke="#2C2620" stroke-width="3.6" />
            <circle cx="100" cy="80" r="6.5" fill="#fff" stroke="#2C2620" stroke-width="2.6" />
            <circle cx="101" cy="81" r="3" fill="#2C2620" />
            <circle cx="101" cy="91" r="3.4" fill="#2C2620" />
            <path d="M108 98q10 8 20 0" fill="none" stroke="#2C2620" stroke-width="3" stroke-linecap="round" />
            <circle cx="90" cy="96" r="4.4" fill="#F79AC0" opacity=".55" />
            <path d="M40 150c14-10 30-8 40 2" fill="none" stroke="#4E9B62" stroke-width="4" stroke-linecap="round" />
          </svg>
        </div>

        <div class="dh-bush left" />
        <div class="dh-bush right" />

        <div class="dh-nest" :class="{ cracking, hatched }">
          <svg viewBox="0 0 400 150" class="nest-back">
            <ellipse cx="200" cy="86" rx="168" ry="52" fill="#C98D5C" stroke="#2C2620" stroke-width="5" />
            <ellipse cx="200" cy="80" rx="146" ry="40" fill="#8E6440" />
          </svg>

          <div class="dh-eggs">
            <div
              v-for="e in eggs"
              :key="e.id"
              class="egg"
              :style="{ left: e.x + '%', top: e.y + '%', '--rot': e.rot + 'deg', '--i': e.id, '--d': e.delay + 's' }"
            >
              <svg viewBox="0 0 64 80">
                <ellipse cx="32" cy="44" rx="23" ry="30" fill="#FFF3D6" stroke="#2C2620" stroke-width="4" />
                <ellipse cx="23" cy="33" rx="6" ry="10" fill="#fff" opacity=".65" />
                <circle cx="40" cy="34" r="4.4" :fill="e.color" />
                <circle cx="28" cy="52" r="5" :fill="e.color" />
                <circle cx="43" cy="58" r="3.4" :fill="e.color" opacity=".85" />
                <path class="crack" d="M18 40l8 7-6 7 10 5" fill="none" stroke="#2C2620" stroke-width="2.6" stroke-linejoin="round" />
              </svg>
            </div>
          </div>

          <svg viewBox="0 0 400 150" class="nest-front">
            <path d="M32 74c30 44 92 58 168 58s138-14 168-58c-4 34-26 66-168 66S36 108 32 74z" fill="#D9A566" stroke="#2C2620" stroke-width="5" stroke-linejoin="round" />
            <g stroke="#A9744F" stroke-width="4" stroke-linecap="round" opacity=".8">
              <path d="M76 96q22 20 52 26M140 106q26 18 60 20M212 118q34 2 60-8M280 106q30-8 46-20" fill="none" />
            </g>
          </svg>

          <Transition name="pop">
            <div v-if="hatched" class="dh-baby">
              <svg viewBox="0 0 140 140">
                <ellipse cx="70" cy="120" rx="40" ry="12" fill="#4E9B62" opacity=".35" />
                <path d="M92 96c18-4 24-16 20-28-8 6-16 8-22 8z" fill="#7CCB88" stroke="#2C2620" stroke-width="4" stroke-linejoin="round" />
                <ellipse cx="70" cy="96" rx="34" ry="30" fill="#8FD6A0" stroke="#2C2620" stroke-width="4.5" />
                <ellipse cx="70" cy="104" rx="19" ry="17" fill="#EAF9EC" />
                <path d="M50 62c-8-10-4-18 4-16s10 10 6 16" fill="#7CCB88" stroke="#2C2620" stroke-width="3.6" />
                <path d="M70 52c-6-10 0-18 8-14s8 12 2 16" fill="#7CCB88" stroke="#2C2620" stroke-width="3.6" />
                <path d="M90 62c8-10 4-18-4-16s-10 10-6 16" fill="#7CCB88" stroke="#2C2620" stroke-width="3.6" />
                <circle cx="70" cy="72" r="34" fill="#96DCA8" stroke="#2C2620" stroke-width="4.5" />
                <circle cx="57" cy="68" r="9" fill="#FFFBF0" stroke="#2C2620" stroke-width="2.6" />
                <circle cx="83" cy="68" r="9" fill="#FFFBF0" stroke="#2C2620" stroke-width="2.6" />
                <circle cx="58" cy="70" r="4" fill="#2C2620" />
                <circle cx="82" cy="70" r="4" fill="#2C2620" />
                <path d="M62 84q8 8 16 0" fill="none" stroke="#2C2620" stroke-width="3" stroke-linecap="round" />
                <circle cx="48" cy="82" r="4" fill="#F79AC0" opacity=".6" />
                <circle cx="92" cy="82" r="4" fill="#F79AC0" opacity=".6" />
                <path d="M38 108c10 4 22 4 32 0" fill="none" stroke="#2C2620" stroke-width="3" stroke-linecap="round" opacity=".5" />
              </svg>
            </div>
          </Transition>
        </div>

        <Transition name="pop">
          <div v-if="hatched" class="dh-rawr">{{ rawr }}</div>
        </Transition>

        <div v-if="hatched" class="dh-hearts">
          <svg v-for="i in 6" :key="i" viewBox="0 0 24 24" class="dh-heart" :style="{ left: 34 + i * 6 + '%', animationDelay: i * 0.1 + 's' }">
            <path d="M12 21s-8-5-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 6-8 11-8 11z" fill="#EC5B84" stroke="#2C2620" stroke-width="2" />
          </svg>
        </div>

        <Confetti :burst="burst" :origin="origin" :count="36" />
      </div>

      <template #answer>
        <div class="dh-answer">
          <div class="dh-question">How many eggs? <span class="dh-type-hint">type it with the numbers</span></div>
          <TypePad
            ref="padRef"
            :disabled="solved"
            :hit="solved && !cracking"
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
      title="Hatch party!"
      :detail="`You counted ${firstTry} nests first try.`"
      accent="#8FE0B0"
      @again="restart"
      @exit="exitGame"
    />
  </div>
</template>

<style scoped>
.dh-scene {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  overflow: hidden;
  background: linear-gradient(180deg, #ffe4b8 0%, #f4f0c8 42%, #d8eecb 100%);
}

.dh-sun {
  position: absolute;
  right: 9%;
  top: 7%;
  width: clamp(46px, 7vw, 74px);
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--sun);
  border: 4px solid var(--ink);
  box-shadow: 0 0 0 10px rgba(255, 201, 60, 0.25), 0 0 0 22px rgba(255, 201, 60, 0.12);
  animation: bob 6s ease-in-out infinite;
}

.dh-hills {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 38%;
}
.dh-hills svg {
  width: 100%;
  height: 100%;
}

.dh-leaves {
  position: absolute;
  top: 0;
  width: clamp(120px, 22%, 240px);
  height: auto;
  pointer-events: none;
}
.dh-leaves.left {
  left: -2%;
}
.dh-leaves.right {
  right: -2%;
}
.dh-leaves svg {
  width: 100%;
  height: auto;
}

/* mama */
.dh-mama {
  position: absolute;
  left: 2%;
  bottom: 12%;
  width: clamp(96px, 20%, 210px);
  transform-origin: bottom center;
}
.dh-mama svg {
  width: 100%;
  height: auto;
  overflow: visible;
}
.dh-mama.happy {
  animation: happyBounce 0.8s ease-in-out 2;
}

@keyframes happyBounce {
  0%,
  100% {
    transform: translateY(0) rotate(0);
  }
  40% {
    transform: translateY(-10px) rotate(-3deg);
  }
}

.dh-bush {
  position: absolute;
  bottom: 0;
  height: 26%;
  width: 34%;
  background: #4e9b62;
  border-top: 4px solid var(--ink);
  border-radius: 60% 60% 0 0 / 100% 100% 0 0;
}
.dh-bush.left {
  left: -8%;
  background: #58a86c;
}
.dh-bush.right {
  right: -8%;
  width: 30%;
  background: #4e9b62;
}

/* nest */
.dh-nest {
  position: absolute;
  left: 50%;
  bottom: 5%;
  width: clamp(190px, 52%, 560px);
  transform: translateX(-50%);
  z-index: 3;
}

.nest-back,
.nest-front {
  width: 100%;
  height: auto;
  display: block;
  filter: drop-shadow(0 8px 0 rgba(44, 38, 32, 0.15));
}
.nest-front {
  position: relative;
  z-index: 2;
  margin-top: -18%;
}

.dh-eggs {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 26%;
  z-index: 1;
}

.egg {
  position: absolute;
  width: clamp(24px, 8.2%, 58px);
  transform: translate(-50%, -50%) rotate(var(--rot));
  animation: eggBob 2.8s ease-in-out infinite;
  animation-delay: var(--d);
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.egg svg {
  width: 100%;
  height: auto;
  overflow: visible;
  filter: drop-shadow(0 3px 0 rgba(44, 38, 32, 0.18));
}

.egg .crack {
  opacity: 0;
  transition: opacity 0.3s ease;
}

@keyframes eggBob {
  0%,
  100% {
    transform: translate(-50%, -50%) rotate(var(--rot));
  }
  50% {
    transform: translate(-50%, -56%) rotate(calc(var(--rot) * -1));
  }
}

.dh-nest.cracking .egg {
  animation: eggWobble 0.34s ease-in-out infinite;
}
.dh-nest.cracking .egg .crack {
  opacity: 1;
}
.dh-nest.hatched .egg {
  opacity: 0;
  transform: translate(-50%, -90%) scale(0.6);
}

@keyframes eggWobble {
  0%,
  100% {
    transform: translate(-50%, -50%) rotate(-9deg) scale(1);
  }
  50% {
    transform: translate(-50%, -54%) rotate(9deg) scale(1.05);
  }
}

.dh-scene.hint .egg {
  animation: eggHint 2.6s ease-in-out infinite;
  animation-delay: calc(var(--i) * 0.3s);
}

@keyframes eggHint {
  0%,
  100% {
    filter: none;
    transform: translate(-50%, -50%) rotate(var(--rot));
  }
  40% {
    filter: drop-shadow(0 0 14px rgba(255, 201, 60, 0.95));
    transform: translate(-50%, -58%) rotate(var(--rot)) scale(1.12);
  }
}

.dh-baby {
  position: absolute;
  left: 50%;
  bottom: 46%;
  width: 34%;
  transform: translateX(-50%);
  z-index: 4;
  animation: popIn 0.6s cubic-bezier(0.2, 1.5, 0.4, 1);
}
.dh-baby svg {
  width: 100%;
  height: auto;
  overflow: visible;
  animation: hop 1.6s ease-in-out infinite;
}

.dh-rawr {
  position: absolute;
  left: 62%;
  top: 26%;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(22px, 3.4vw, 38px);
  color: var(--cream);
  background: var(--coral);
  border: 4px solid var(--ink);
  border-radius: 16px;
  padding: 2px 14px 6px;
  box-shadow: 0 5px 0 var(--ink);
  transform: rotate(-6deg);
  z-index: 8;
  animation: popIn 0.4s cubic-bezier(0.2, 1.5, 0.4, 1);
}

.dh-hearts {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 7;
}
.dh-heart {
  position: absolute;
  top: 40%;
  width: clamp(16px, 2.2vw, 24px);
  animation: heartUp 1.2s ease-out forwards;
}

/* answer */
.dh-answer {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.dh-question {
  text-align: center;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(19px, 2.4vw, 27px);
  line-height: 1.25;
  color: var(--ink);
  background: var(--cream);
  border: 3px solid var(--ink);
  border-radius: 16px;
  padding: 8px 14px;
  box-shadow: 0 4px 0 var(--ink);
}

.dh-type-hint {
  font-family: var(--font-body);
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-soft);
  margin-left: 6px;
}

@media (max-width: 640px) {
  .dh-nest {
    width: 62%;
  }
  .dh-mama {
    width: 26%;
  }
  .dh-type-hint {
    display: none;
  }
}
</style>
