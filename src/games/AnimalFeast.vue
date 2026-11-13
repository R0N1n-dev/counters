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
const ANIMALS = [
  { id: 'lion', name: 'Leo the Lion', food: 'meat', foodName: 'meat pieces' },
  { id: 'panda', name: 'Pia the Panda', food: 'bamboo', foodName: 'bamboo shoots' },
  { id: 'rabbit', name: 'Romy the Rabbit', food: 'carrot', foodName: 'carrots' },
  { id: 'monkey', name: 'Momo the Monkey', food: 'banana', foodName: 'bananas' },
  { id: 'cat', name: 'Cleo the Cat', food: 'fish', foodName: 'fish' },
]
const TARGETS = [3, 4, 5, 6, 7]
const TODDLER_TARGETS = [2, 3, 4, 3, 5]
const PRAISE = [
  'Yum yum yum! What a good counter!',
  'Munch munch — that was delicious!',
  'The tummy is happy! Perfect counting!',
  'One more friend fed. Well done!',
]

const round = ref(1)
const animal = ref(ANIMALS[0])
const target = ref(3)
const foods = ref([])
const prompt = ref('')
const mood = ref('happy')
const solved = ref(false)
const tries = ref(0)
const firstTry = ref(0)
const hint = ref(false)
const burst = ref(0)
const heartBurst = ref(0)
const origin = ref({ x: 78, y: 55 })
const finished = ref(false)
const earned = ref(0)
const padRef = ref(null)
const stageEl = ref(null)
const mouthEl = ref(null)
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

const foodName = computed(() => animal.value.foodName)

function buildRound() {
  solved.value = false
  tries.value = 0
  hint.value = false
  mood.value = 'happy'
  heartBurst.value = 0
  animal.value = ANIMALS[(round.value - 1) % ANIMALS.length]
  const targets = store.toddler ? TODDLER_TARGETS : TARGETS
  target.value = targets[(round.value - 1) % targets.length]
  padRef.value?.clear()

  const spots = scatterGrid(target.value, { cols: 4, rows: 2, x0: 20, x1: 80, y0: 54, y1: 78 })
  foods.value = spots.map((s, i) => ({
    id: `f${i}-${Math.random().toString(36).slice(2, 7)}`,
    x: s.x,
    y: s.y,
    rot: randInt(-16, 16),
    delay: (Math.random() * 0.5).toFixed(2),
    eaten: false,
    flyX: 78,
    flyY: 55,
  }))
  prompt.value = `${animal.value.name} is hungry! He wants to eat ${animal.value.foodName}. How many ${foodName.value} were brought?`
}

function check(n) {
  if (solved.value) return
  if (n === target.value) {
    solved.value = true
    mood.value = 'cheer'
    if (tries.value === 0) firstTry.value++
    prompt.value = `${pick(PRAISE)} That was ${target.value} ${foodName.value}!`
    burst.value++
    heartBurst.value++
    origin.value = { x: 78, y: 52 }
    sfx.correct()

    const stage = stageEl.value?.getBoundingClientRect()
    const mouth = mouthEl.value?.getBoundingClientRect()
    let mx = 78
    let my = 55
    if (stage && mouth) {
      mx = ((mouth.left + mouth.width / 2 - stage.left) / stage.width) * 100
      my = ((mouth.top + mouth.height / 2 - stage.top) / stage.height) * 100
    }

    foods.value.forEach((f, i) => {
      f.flyX = mx + randInt(-3, 3)
      f.flyY = my + randInt(-3, 3)
      later(() => {
        f.eaten = true
        sfx.chew(0.05 + i * 0.1)
      }, 350 + i * 160)
    })
    later(() => sfx.sparkle(), 900)
    later(() => {
      if (round.value >= TOTAL.value) finish()
      else {
        round.value++
        buildRound()
      }
    }, 3200)
  } else {
    tries.value++
    padRef.value?.reject()
    sfx.wrong()
    mood.value = 'oops'
    hint.value = tries.value >= 2
    prompt.value =
      tries.value >= 2
        ? 'The food is glowing one by one — count along, then try again!'
        : `Not quite! Count the ${foodName.value} slowly, then try again.`
    later(() => {
      if (!solved.value) {
        mood.value = 'happy'
        prompt.value = `${animal.value.name} is hungry! He wants to eat ${animal.value.foodName}. How many ${foodName.value} were brought?`
      }
    }, 2600)
  }
}

function finish() {
  earned.value = firstTry.value >= 4 ? 3 : firstTry.value >= 2 ? 2 : 1
  recordGame('feast', earned.value)
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
      title="Animal Feast"
      accent="#F5A65B"
      :round="round"
      :total="TOTAL"
      :mood="mood"
      :prompt="prompt"
      @exit="exitGame"
    >
      <template #prompt>
        <PromptText :text="prompt" />
      </template>

      <div ref="stageEl" class="af-scene" :class="{ hint, yum: solved }">
        <div class="af-sun" />
        <div class="af-cloud c1" />
        <div class="af-cloud c2" />

        <div class="af-hills">
          <svg viewBox="0 0 900 200" preserveAspectRatio="none">
            <path d="M0 150c120-50 240-40 360-8 120 32 220-24 340-20 120 4 220 40 340 24v54H0z" fill="#9ED48F" stroke="#2C2620" stroke-width="4" vector-effect="non-scaling-stroke" />
            <path d="M0 178c140-24 260 8 400 4 140-4 260-28 400-16 80 7 160 12 200 8v26H0z" fill="#69C27B" stroke="#2C2620" stroke-width="4" vector-effect="non-scaling-stroke" />
          </svg>
        </div>

        <div class="af-tree left">
          <svg viewBox="0 0 120 160">
            <rect x="52" y="86" width="16" height="60" rx="6" fill="#A9744F" stroke="#2C2620" stroke-width="4" />
            <circle cx="60" cy="62" r="42" fill="#58A86C" stroke="#2C2620" stroke-width="4" />
            <circle cx="34" cy="78" r="24" fill="#69C27B" stroke="#2C2620" stroke-width="4" />
            <circle cx="86" cy="78" r="24" fill="#69C27B" stroke="#2C2620" stroke-width="4" />
          </svg>
        </div>
        <div class="af-tree right">
          <svg viewBox="0 0 120 160">
            <rect x="52" y="86" width="16" height="60" rx="6" fill="#A9744F" stroke="#2C2620" stroke-width="4" />
            <circle cx="60" cy="62" r="42" fill="#4E9B62" stroke="#2C2620" stroke-width="4" />
            <circle cx="34" cy="78" r="24" fill="#58A86C" stroke="#2C2620" stroke-width="4" />
            <circle cx="86" cy="78" r="24" fill="#58A86C" stroke="#2C2620" stroke-width="4" />
          </svg>
        </div>

        <!-- food pile -->
        <div class="af-pile">
          <svg viewBox="0 0 220 100" class="pile-svg">
            <rect x="4" y="78" width="212" height="20" rx="8" fill="#C98D5C" stroke="#2C2620" stroke-width="4" />
            <ellipse cx="110" cy="70" rx="94" ry="22" fill="#fffdf7" stroke="#2C2620" stroke-width="4" />
            <ellipse cx="110" cy="66" rx="74" ry="14" fill="#FBEBCB" />
            <ellipse cx="110" cy="62" rx="60" ry="9" fill="#fff" opacity=".5" />
          </svg>

          <button
            v-for="(f, i) in foods"
            :key="f.id"
            type="button"
            class="af-food"
            :class="[animal.food, { eaten: f.eaten }]"
            :style="{
              left: f.x + '%',
              top: f.y + '%',
              '--rot': f.rot + 'deg',
              '--i': i,
              '--flyx': f.flyX + '%',
              '--flyy': f.flyY + '%',
              animationDelay: f.delay + 's',
            }"
            :disabled="solved || f.eaten"
            :aria-label="`${foodName} piece`"
          >
            <svg viewBox="0 0 48 48">
              <template v-if="animal.food === 'meat'">
                <path d="M13 30c-7-2-9-10-4-15 4-4 11-3 13 2l3 4c4-5 12-4 14 1 2 6-4 10-11 10H21c-5 0-7-1-8-2z" fill="#F5A65B" stroke="#2C2620" stroke-width="3.2" stroke-linejoin="round" />
                <g transform="rotate(-32 38 36)">
                  <rect x="30" y="31" width="17" height="9" rx="4.5" fill="#FFF3D6" stroke="#2C2620" stroke-width="3" />
                  <circle cx="31" cy="35.5" r="4.2" fill="#FFF3D6" stroke="#2C2620" stroke-width="3" />
                  <circle cx="46" cy="35.5" r="4.2" fill="#FFF3D6" stroke="#2C2620" stroke-width="3" />
                </g>
              </template>
              <template v-else-if="animal.food === 'bamboo'">
                <rect x="19" y="8" width="11" height="34" rx="5.5" fill="#69C27B" stroke="#2C2620" stroke-width="3" />
                <path d="M19 20h11M19 30h11" stroke="#2C2620" stroke-width="2.4" opacity=".45" />
                <path d="M30 12c9-7 15-5 17 1-7 5-13 5-17-1z" fill="#8FE0B0" stroke="#2C2620" stroke-width="2.6" stroke-linejoin="round" />
                <path d="M29 26c7-4 12-2 13 3-6 4-11 3-13-3z" fill="#8FE0B0" stroke="#2C2620" stroke-width="2.4" stroke-linejoin="round" />
              </template>
              <template v-else-if="animal.food === 'carrot'">
                <path d="M24 11c8 6 13 16 11 29-1 6-6 8-11 8s-10-2-11-8c-2-13 3-23 11-29z" fill="#F59B3F" stroke="#2C2620" stroke-width="3.2" stroke-linejoin="round" />
                <path d="M21 30c2 3 5 5 8 5M19 22c3 2 6 4 9 4" fill="none" stroke="#D97B1E" stroke-width="2.2" stroke-linecap="round" />
                <path d="M20 13c-3-8 0-15 5-19M24 11c0-8 3-14 8-17M28 13c3-7 8-11 13-12" fill="none" stroke="#4E9B62" stroke-width="4" stroke-linecap="round" />
              </template>
              <template v-else-if="animal.food === 'banana'">
                <path d="M13 12c-5 18 4 33 25 36 4 0 6-3 4-6-13-4-21-14-22-30 0-4-4-4-7 0z" fill="#FFE066" stroke="#2C2620" stroke-width="3.2" stroke-linejoin="round" />
                <path d="M15 15c-3 14 4 26 20 30" fill="none" stroke="#E8B93C" stroke-width="2.6" stroke-linecap="round" />
                <circle cx="39" cy="45" r="3" fill="#8A5A2B" stroke="#2C2620" stroke-width="2" />
                <circle cx="13" cy="14" r="2.6" fill="#8A5A2B" stroke="#2C2620" stroke-width="2" />
              </template>
              <template v-else>
                <path d="M8 24c8-10 20-10 27 0-7 10-19 10-27 0z" fill="#8AD7F2" stroke="#2C2620" stroke-width="3.2" stroke-linejoin="round" />
                <path d="M35 24l10-8v16z" fill="#8AD7F2" stroke="#2C2620" stroke-width="3.2" stroke-linejoin="round" />
                <circle cx="17" cy="22" r="2" fill="#2C2620" />
                <path d="M14 30q3 3 7 2M30 30q-2 3-6 3" fill="none" stroke="#2C2620" stroke-width="2" stroke-linecap="round" />
              </template>
            </svg>
          </button>
        </div>

        <!-- animal -->
        <div class="af-animal" :class="[animal.id, { yum: solved }]">
          <svg v-if="animal.id === 'lion'" viewBox="0 0 140 140" class="animal-svg">
            <circle cx="70" cy="76" r="55" fill="#D9822B" stroke="#2C2620" stroke-width="5" />
            <circle cx="70" cy="80" r="36" fill="#F7C873" stroke="#2C2620" stroke-width="4" />
            <circle cx="40" cy="56" r="10" fill="#F7C873" stroke="#2C2620" stroke-width="3.6" />
            <circle cx="100" cy="56" r="10" fill="#F7C873" stroke="#2C2620" stroke-width="3.6" />
            <circle cx="57" cy="74" r="4.6" fill="#2C2620" />
            <circle cx="83" cy="74" r="4.6" fill="#2C2620" />
            <path d="M62 86q8 7 16 0" fill="none" stroke="#2C2620" stroke-width="3" stroke-linecap="round" />
            <path d="M70 90v6M70 96q-7 6-14 3M70 96q7 6 14 3" fill="none" stroke="#2C2620" stroke-width="2.6" stroke-linecap="round" />
            <circle cx="46" cy="86" r="3" fill="#F79AC0" opacity=".6" />
            <circle cx="94" cy="86" r="3" fill="#F79AC0" opacity=".6" />
          </svg>

          <svg v-else-if="animal.id === 'panda'" viewBox="0 0 140 140" class="animal-svg">
            <circle cx="44" cy="46" r="14" fill="#3A3630" stroke="#2C2620" stroke-width="4" />
            <circle cx="96" cy="46" r="14" fill="#3A3630" stroke="#2C2620" stroke-width="4" />
            <circle cx="70" cy="80" r="42" fill="#FFFBF0" stroke="#2C2620" stroke-width="4.5" />
            <ellipse cx="54" cy="72" rx="10" ry="13" fill="#3A3630" transform="rotate(-14 54 72)" />
            <ellipse cx="86" cy="72" rx="10" ry="13" fill="#3A3630" transform="rotate(14 86 72)" />
            <circle cx="55" cy="73" r="3.4" fill="#FFFBF0" />
            <circle cx="85" cy="73" r="3.4" fill="#FFFBF0" />
            <ellipse cx="70" cy="92" rx="8" ry="6" fill="#3A3630" />
            <path d="M70 98q0 6-8 7M70 98q0 6 8 7" fill="none" stroke="#2C2620" stroke-width="2.6" stroke-linecap="round" />
            <circle cx="44" cy="92" r="3.4" fill="#F79AC0" opacity=".6" />
            <circle cx="96" cy="92" r="3.4" fill="#F79AC0" opacity=".6" />
          </svg>

          <svg v-else-if="animal.id === 'rabbit'" viewBox="0 0 140 140" class="animal-svg">
            <ellipse cx="52" cy="34" rx="11" ry="28" fill="#FFFBF0" stroke="#2C2620" stroke-width="4" transform="rotate(-8 52 34)" />
            <ellipse cx="88" cy="34" rx="11" ry="28" fill="#FFFBF0" stroke="#2C2620" stroke-width="4" transform="rotate(8 88 34)" />
            <ellipse cx="52" cy="36" rx="5" ry="18" fill="#F79AC0" transform="rotate(-8 52 36)" />
            <ellipse cx="88" cy="36" rx="5" ry="18" fill="#F79AC0" transform="rotate(8 88 36)" />
            <ellipse cx="70" cy="88" rx="40" ry="36" fill="#FFFBF0" stroke="#2C2620" stroke-width="4.5" />
            <circle cx="55" cy="82" r="4.6" fill="#2C2620" />
            <circle cx="85" cy="82" r="4.6" fill="#2C2620" />
            <path d="M63 94h14l-7 8z" fill="#F79AC0" stroke="#2C2620" stroke-width="2.6" stroke-linejoin="round" />
            <path d="M70 102v4M70 106q-6 5-13 3M70 106q6 5 13 3" fill="none" stroke="#2C2620" stroke-width="2.6" stroke-linecap="round" />
            <rect x="63" y="106" width="14" height="10" rx="3" fill="#fff" stroke="#2C2620" stroke-width="2.6" />
            <path d="M70 106v10" stroke="#2C2620" stroke-width="2.2" />
            <circle cx="40" cy="94" r="3.4" fill="#F79AC0" opacity=".6" />
            <circle cx="100" cy="94" r="3.4" fill="#F79AC0" opacity=".6" />
          </svg>

          <svg v-else-if="animal.id === 'monkey'" viewBox="0 0 140 140" class="animal-svg">
            <circle cx="28" cy="86" r="13" fill="#8A5A3B" stroke="#2C2620" stroke-width="4" />
            <circle cx="112" cy="86" r="13" fill="#8A5A3B" stroke="#2C2620" stroke-width="4" />
            <circle cx="28" cy="86" r="6" fill="#E8C39E" />
            <circle cx="112" cy="86" r="6" fill="#E8C39E" />
            <circle cx="70" cy="74" r="40" fill="#9C6B4F" stroke="#2C2620" stroke-width="4.5" />
            <ellipse cx="70" cy="94" rx="24" ry="20" fill="#E8C39E" stroke="#2C2620" stroke-width="3.4" />
            <circle cx="57" cy="64" r="4.6" fill="#2C2620" />
            <circle cx="83" cy="64" r="4.6" fill="#2C2620" />
            <ellipse cx="70" cy="86" rx="6" ry="4.6" fill="#7A4A31" />
            <path d="M70 91q0 6-8 8M70 91q0 6 8 8" fill="none" stroke="#2C2620" stroke-width="2.6" stroke-linecap="round" />
            <circle cx="46" cy="80" r="3" fill="#F79AC0" opacity=".55" />
            <circle cx="94" cy="80" r="3" fill="#F79AC0" opacity=".55" />
          </svg>

          <svg v-else viewBox="0 0 140 140" class="animal-svg">
            <path d="M34 66L42 30l24 22z" fill="#F5A65B" stroke="#2C2620" stroke-width="4" stroke-linejoin="round" />
            <path d="M106 66L98 30 74 52z" fill="#F5A65B" stroke="#2C2620" stroke-width="4" stroke-linejoin="round" />
            <path d="M40 58l4-12 10 8zM100 58l-4-12-10 8z" fill="#F79AC0" />
            <circle cx="70" cy="78" r="38" fill="#F5A65B" stroke="#2C2620" stroke-width="4.5" />
            <path d="M58 46l4 8M70 42v9M82 46l-4 8" stroke="#D97B1E" stroke-width="3" stroke-linecap="round" />
            <circle cx="56" cy="74" r="5" fill="#69C27B" stroke="#2C2620" stroke-width="2.6" />
            <circle cx="84" cy="74" r="5" fill="#69C27B" stroke="#2C2620" stroke-width="2.6" />
            <circle cx="56" cy="74" r="2" fill="#2C2620" />
            <circle cx="84" cy="74" r="2" fill="#2C2620" />
            <path d="M62 88h16l-8 7z" fill="#F79AC0" stroke="#2C2620" stroke-width="2.6" stroke-linejoin="round" />
            <path d="M62 95q-8 4-14 1M78 95q8 4 14 1" fill="none" stroke="#2C2620" stroke-width="2.4" stroke-linecap="round" />
            <path d="M30 80l-14-3M30 88l-14 1M110 80l14-3M110 88l14 1" stroke="#2C2620" stroke-width="2.2" stroke-linecap="round" />
            <circle cx="44" cy="94" r="3.4" fill="#F79AC0" opacity=".6" />
            <circle cx="96" cy="94" r="3.4" fill="#F79AC0" opacity=".6" />
          </svg>

          <div ref="mouthEl" class="af-mouth" />
        </div>

        <div v-if="heartBurst" class="af-hearts" :key="heartBurst">
          <svg v-for="i in 6" :key="i" viewBox="0 0 24 24" class="af-heart" :style="{ left: 56 + i * 5 + '%', animationDelay: i * 0.09 + 's' }">
            <path d="M12 21s-8-5-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 6-8 11-8 11z" fill="#EC5B84" stroke="#2C2620" stroke-width="2" />
          </svg>
        </div>

        <Confetti :burst="burst" :origin="origin" :count="36" />
      </div>

      <template #answer>
        <div class="af-answer">
          <div class="af-question">How many {{ foodName }}? <span class="af-type-hint">type it with the numbers</span></div>
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
      title="Tummies are full!"
      :detail="`You fed ${firstTry} hungry friends first try.`"
      accent="#F5A65B"
      @again="restart"
      @exit="exitGame"
    />
  </div>
</template>

<style scoped>
.af-scene {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  overflow: hidden;
  background: linear-gradient(180deg, #bfeaf8 0%, #e3f6ff 46%, #f3fbe8 100%);
}

.af-sun {
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

.af-cloud {
  position: absolute;
  height: clamp(22px, 3.4vw, 36px);
  background: #fffdf6;
  border: 3.5px solid var(--ink);
  border-radius: 999px;
  opacity: 0.92;
}
.af-cloud::before,
.af-cloud::after {
  content: '';
  position: absolute;
  background: inherit;
  border: inherit;
  border-radius: 50%;
  bottom: 50%;
}
.af-cloud::before {
  width: 55%;
  aspect-ratio: 1;
  left: 12%;
  margin-bottom: -5px;
}
.af-cloud::after {
  width: 38%;
  aspect-ratio: 1;
  right: 12%;
  margin-bottom: -3px;
}
.af-cloud.c1 {
  width: clamp(90px, 14vw, 150px);
  left: 30%;
  top: 8%;
  animation: drift 60s linear infinite;
}
.af-cloud.c2 {
  width: clamp(64px, 10vw, 110px);
  left: 0;
  top: 24%;
  opacity: 0.7;
  animation: drift 80s linear infinite;
  animation-delay: -40s;
}

.af-hills {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 34%;
}
.af-hills svg {
  width: 100%;
  height: 100%;
}

.af-tree {
  position: absolute;
  bottom: 12%;
  width: clamp(70px, 11%, 130px);
  pointer-events: none;
}
.af-tree.left {
  left: -1%;
}
.af-tree.right {
  right: 30%;
}
.af-tree svg {
  width: 100%;
  height: auto;
  animation: sway 4.5s ease-in-out infinite;
  transform-origin: bottom center;
}

/* food pile */
.af-pile {
  position: absolute;
  left: 0;
  bottom: 4%;
  width: 47%;
  aspect-ratio: 220 / 100;
  z-index: 3;
}

.pile-svg {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: auto;
  filter: drop-shadow(0 8px 0 rgba(44, 38, 32, 0.15));
}

.af-food {
  position: absolute;
  width: clamp(58px, 9.5vw, 96px);
  aspect-ratio: 1;
  padding: 0;
  transform: translate(-50%, -50%) rotate(var(--rot));
  transition: left 0.5s cubic-bezier(0.35, -0.35, 0.5, 1.25), top 0.5s cubic-bezier(0.35, -0.35, 0.5, 1.25),
    transform 0.5s ease, opacity 0.3s ease 0.3s;
  animation: popIn 0.4s backwards cubic-bezier(0.2, 1.5, 0.4, 1);
  animation-delay: var(--d, 0s);
  z-index: 4;
  filter: drop-shadow(0 3px 0 rgba(44, 38, 32, 0.18));
}

.af-food svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.af-food:hover:not(:disabled) {
  transform: translate(-50%, -50%) rotate(0deg) scale(1.12);
}

.af-food.eaten {
  left: var(--flyx) !important;
  top: var(--flyy) !important;
  transform: translate(-50%, -50%) rotate(200deg) scale(0.25);
  opacity: 0;
  pointer-events: none;
}

.af-scene.hint .af-food {
  animation: afGlow 2.6s ease-in-out infinite;
  animation-delay: calc(var(--i, 0) * 0.25s);
}

@keyframes afGlow {
  0%,
  100% {
    filter: none;
    transform: translate(-50%, -50%) rotate(var(--rot));
  }
  40% {
    filter: drop-shadow(0 0 16px rgba(255, 201, 60, 0.95));
    transform: translate(-50%, -54%) rotate(var(--rot)) scale(1.15);
  }
}

/* animal */
.af-animal {
  position: absolute;
  right: 3%;
  bottom: 6%;
  width: clamp(180px, 33%, 340px);
  transform-origin: bottom center;
  z-index: 5;
  transition: transform 0.25s ease;
}

.af-animal.yum {
  animation: happyBounce 0.7s ease-in-out 2;
}

@keyframes happyBounce {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  40% {
    transform: translateY(-14px) scale(1.04);
  }
  70% {
    transform: translateY(0) scale(0.98);
  }
}

.animal-svg {
  width: 100%;
  height: auto;
  overflow: visible;
  filter: drop-shadow(0 10px 0 rgba(44, 38, 32, 0.18));
  animation: bob 3.8s ease-in-out infinite;
}

.af-animal.yum .animal-svg {
  animation: animalChew 0.5s ease-in-out 4;
}

@keyframes animalChew {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.06, 0.94);
  }
}

.af-mouth {
  position: absolute;
  left: 50%;
  top: 62%;
  width: 2px;
  height: 2px;
}

.af-hearts {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 12;
}
.af-heart {
  position: absolute;
  top: 30%;
  width: clamp(18px, 2.4vw, 26px);
  animation: heartUp 1.15s ease-out forwards;
}

/* answer */
.af-answer {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.af-question {
  text-align: center;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(18px, 2.3vw, 25px);
  line-height: 1.3;
  color: var(--ink);
  background: var(--cream);
  border: 3px solid var(--ink);
  border-radius: 16px;
  padding: 7px 14px;
  box-shadow: 0 4px 0 var(--ink);
}

.af-type-hint {
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-soft);
  margin-left: 6px;
}

@media (max-width: 640px) {
  .af-pile {
    width: 56%;
  }
  .af-tree.right {
    display: none;
  }
  .af-animal {
    width: 46%;
    right: 1%;
  }
  .af-food {
    width: clamp(46px, 12vw, 64px);
  }
  .af-type-hint {
    display: none;
  }
}
</style>
