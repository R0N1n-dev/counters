<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import GameShell from '../components/GameShell.vue'
import Confetti from '../components/Confetti.vue'
import GameOver from '../components/GameOver.vue'
import NumberPad from '../components/NumberPad.vue'
import { sfx } from '../lib/audio.js'
import { recordGame, store } from '../lib/store.js'

const emit = defineEmits(['exit'])

const GRADIENTS = [
  ['#BFE8F5', '#E8F8FF', '#D9F1E0'],
  ['#FFD5AB', '#FFE8CC', '#F3D9BC'],
  ['#C9B4E4', '#E2D6F2', '#CFE2D6'],
  ['#FFC89B', '#FFE0B8', '#E9D6B4'],
  ['#2E3A6E', '#46538F', '#3A4C6E'],
  ['#1E2C55', '#31436F', '#2B3E60'],
  ['#151F3F', '#283866', '#233551'],
  ['#111A36', '#25335C', '#1E2F49'],
]

const NIGHT = [false, false, false, false, true, true, true, true]

const STORY = [
  {
    narration: 'Mama Duck is calling her ducklings. Count them as they waddle out of the reeds!',
    question: 'How many ducklings?',
    answer: 4,
    caption: 'Four ducklings! Peep peep! Mama Duck is so happy.',
    art: 'duck',
    rows: [{ y: 24, xs: [18, 40, 62, 84], w: 18 }],
  },
  {
    narration: 'Mama Duck needs a raft to cross the pond. Count the logs floating on the water!',
    question: 'How many logs?',
    answer: 3,
    caption: 'Three logs bump together and make a sturdy raft.',
    art: 'log',
    rows: [{ y: 22, xs: [22, 50, 78], w: 26 }],
  },
  {
    narration: 'Some friendly frogs want to come along. Count the frogs on the lily pads!',
    question: 'How many frogs?',
    answer: 5,
    caption: 'Five frogs hop aboard. Ribbit!',
    art: 'frog',
    rows: [{ y: 24, xs: [14, 32, 50, 68, 86], w: 17 }],
  },
  {
    narration: 'Dragonflies are dancing over the pond. Count them all!',
    question: 'How many dragonflies?',
    answer: 6,
    caption: 'Six dragonflies spin around the raft.',
    art: 'dragonfly',
    rows: [{ y: 54, xs: [12, 27, 42, 58, 73, 88], w: 14 }],
  },
  {
    narration: 'Night is falling. Count the lanterns glowing on the water!',
    question: 'How many lanterns?',
    answer: 7,
    caption: 'Seven lanterns light up the whole pond.',
    art: 'lantern',
    rows: [{ y: 22, xs: [8, 22, 36, 50, 64, 78, 92], w: 12.5 }],
  },
  {
    narration: 'Fish are leaping in the moonlight. Count them!',
    question: 'How many fish?',
    answer: 8,
    caption: 'Eight silver fish splash and leap.',
    art: 'fish',
    rows: [
      { y: 30, xs: [14, 38, 62, 86], w: 18 },
      { y: 48, xs: [26, 50, 74], w: 18 },
    ],
  },
  {
    narration: 'The sky is full of stars tonight. Count the stars!',
    question: 'How many stars?',
    answer: 9,
    caption: 'Nine stars twinkle over the sleepy water.',
    art: 'star',
    rows: [
      { y: 22, xs: [20, 50, 80], w: 16 },
      { y: 42, xs: [20, 50, 80], w: 16 },
      { y: 62, xs: [20, 50, 80], w: 16 },
    ],
  },
  {
    narration: 'The meadow is throwing a party in the sky. Count the fireworks!',
    question: 'How many fireworks?',
    answer: 10,
    caption: 'Ten fireworks fizz and pop. Goodnight, pond — the end!',
    art: 'firework',
    rows: [
      { y: 50, xs: [12, 31, 50, 69, 88], w: 16 },
      { y: 27, xs: [12, 31, 50, 69, 88], w: 16 },
    ],
  },
]

const FIREWORK_COLORS = ['#FFC93C', '#F9715A', '#8FE0B0', '#EC5B84', '#8AD7F2', '#A98BF5']

// toddler mode keeps every page at five or fewer, in one easy row
const TODDLER_COUNTS = [2, 3, 4, 5, 3, 5, 4, 5]
const TODDLER_XS = {
  1: [50],
  2: [34, 66],
  3: [22, 50, 78],
  4: [18, 40, 62, 84],
  5: [14, 32, 50, 68, 86],
}
const TODDLER_W = { 1: 24, 2: 24, 3: 24, 4: 20, 5: 16 }

const TOTAL = STORY.length
const page = ref(0)
const solved = ref(false)
const hit = ref(null)
const miss = ref(null)
const firstTry = ref(0)
const tries = ref(0)
const mood = ref('happy')
const burst = ref(0)
const origin = ref({ x: 50, y: 50 })
const flipping = ref(false)
const finished = ref(false)
const earned = ref(0)
const prompt = ref(STORY[0].narration)
const collected = ref([])
let timers = []

const data = computed(() => STORY[page.value])
const count = computed(() =>
  store.toddler ? TODDLER_COUNTS[page.value] : data.value.answer,
)
const isLast = computed(() => page.value === TOTAL - 1)
const bg = computed(() => {
  const g = GRADIENTS[page.value]
  return `linear-gradient(180deg, ${g[0]} 0%, ${g[1]} 58%, ${g[2]} 100%)`
})

const items = computed(() => {
  const out = []
  if (store.toddler) {
    const n = TODDLER_COUNTS[page.value]
    TODDLER_XS[n].forEach((x) => {
      out.push({
        key: out.length,
        x,
        y: data.value.rows[0].y,
        w: TODDLER_W[n],
        color: FIREWORK_COLORS[out.length % FIREWORK_COLORS.length],
        delay: (out.length * 0.07).toFixed(2),
      })
    })
    return out
  }
  data.value.rows.forEach((row) => {
    row.xs.forEach((x, i) => {
      out.push({
        key: out.length,
        x,
        y: row.y,
        w: row.w,
        color: FIREWORK_COLORS[(out.length + i) % FIREWORK_COLORS.length],
        delay: (out.length * 0.07).toFixed(2),
      })
    })
  })
  return out
})

const art = computed(() => data.value.art)

function later(fn, ms) {
  const t = window.setTimeout(fn, ms)
  timers.push(t)
  return t
}
function clearTimers() {
  timers.forEach(clearTimeout)
  timers = []
}

function reward() {
  const kinds = ['star', 'leaf', 'gem']
  return kinds[collected.value.length % kinds.length]
}

function answer(n) {
  if (solved.value) return
  if (n === count.value) {
    solved.value = true
    hit.value = n
    mood.value = 'cheer'
    if (tries.value === 0) firstTry.value++
    sfx.correct()
    burst.value++
    origin.value = { x: 50, y: 55 }
    collected.value = [...collected.value, reward()]
    later(() => sfx.sparkle(), 500)
    prompt.value = store.toddler ? `${count.value}! Perfect counting!` : data.value.caption
    // automatic page turn: celebrate, then move on by itself
    later(() => {
      if (isLast.value) {
        finish()
        return
      }
      flipping.value = true
      sfx.whoosh()
      later(() => {
        page.value++
        solved.value = false
        hit.value = null
        miss.value = null
        tries.value = 0
        mood.value = 'happy'
        prompt.value = STORY[page.value].narration
        flipping.value = false
      }, 320)
    }, 2400)
  } else {
    tries.value++
    miss.value = n
    sfx.wrong()
    mood.value = 'oops'
    prompt.value = 'Hmm, not that many. Point at each one and count again!'
    later(() => (miss.value = null), 700)
    later(() => {
      if (!solved.value) {
        mood.value = 'happy'
        prompt.value = data.value.narration
      }
    }, 2600)
  }
}

function finish() {
  earned.value = firstTry.value >= 7 ? 3 : firstTry.value >= 4 ? 2 : 1
  recordGame('story', earned.value)
  finished.value = true
}

function restart() {
  clearTimers()
  finished.value = false
  page.value = 0
  solved.value = false
  hit.value = null
  miss.value = null
  tries.value = 0
  firstTry.value = 0
  mood.value = 'happy'
  collected.value = []
  prompt.value = STORY[0].narration
  flipping.value = false
}

function exitGame() {
  clearTimers()
  emit('exit')
}

onBeforeUnmount(clearTimers)
</script>

<template>
  <div class="game-root">
    <GameShell
      title="Pip's Storybook"
      accent="#FFC93C"
      :round="page + 1"
      :total="TOTAL"
      :mood="mood"
      :prompt="prompt"
      @exit="exitGame"
    >
      <div class="pond" :class="{ night: NIGHT[page], flipping }" :style="{ background: bg }">
        <!-- big, simple animal art shared by every page -->
        <svg class="lib" aria-hidden="true">
          <symbol id="art-duck" viewBox="0 0 100 100">
            <ellipse cx="46" cy="68" rx="31" ry="20" fill="#FFF6DF" stroke="#2C2620" stroke-width="3.6" />
            <path d="M32 86h-9c-3 0-3-5 0-5h11zM62 86h9c3 0 3-5 0-5H60z" fill="#F5A623" stroke="#2C2620" stroke-width="2.6" />
            <circle cx="66" cy="36" r="19" fill="#FFF6DF" stroke="#2C2620" stroke-width="3.6" />
            <path d="M60 16c0-6 5-9 9-6 4 2 3 8-2 10" fill="none" stroke="#2C2620" stroke-width="3.2" stroke-linecap="round" />
            <path d="M81 34h12c2 0 2 5 0 6l-12 4z" fill="#F5A623" stroke="#2C2620" stroke-width="3" stroke-linejoin="round" />
            <circle cx="70" cy="32" r="3.6" fill="#2C2620" />
            <circle cx="71" cy="31" r="1.3" fill="#fff" />
            <circle cx="56" cy="43" r="3.8" fill="#F7A29A" opacity=".6" />
            <path d="M26 64c10-3 17 1 17 8" fill="none" stroke="#2C2620" stroke-width="2.6" opacity=".4" />
          </symbol>

          <symbol id="art-log" viewBox="0 0 100 100">
            <rect x="4" y="32" width="92" height="36" rx="18" fill="#B98156" stroke="#2C2620" stroke-width="3.8" />
            <ellipse cx="13" cy="50" rx="7" ry="14" fill="#E8C39B" stroke="#2C2620" stroke-width="2.8" />
            <ellipse cx="13" cy="50" rx="3" ry="6" fill="none" stroke="#B98156" stroke-width="2" />
            <path d="M42 42h44M36 54h50" stroke="#9A6440" stroke-width="2.6" stroke-linecap="round" opacity=".6" />
          </symbol>

          <symbol id="art-frog" viewBox="0 0 100 100">
            <ellipse cx="50" cy="68" rx="30" ry="21" fill="#7FD08B" stroke="#2C2620" stroke-width="3.4" />
            <circle cx="34" cy="42" r="14" fill="#7FD08B" stroke="#2C2620" stroke-width="3.4" />
            <circle cx="66" cy="42" r="14" fill="#7FD08B" stroke="#2C2620" stroke-width="3.4" />
            <circle cx="34" cy="42" r="5.6" fill="#FFFBF0" stroke="#2C2620" stroke-width="2" />
            <circle cx="66" cy="42" r="5.6" fill="#FFFBF0" stroke="#2C2620" stroke-width="2" />
            <circle cx="35" cy="43" r="2.9" fill="#2C2620" />
            <circle cx="65" cy="43" r="2.9" fill="#2C2620" />
            <path d="M38 70q12 10 24 0" fill="none" stroke="#2C2620" stroke-width="2.8" stroke-linecap="round" />
          </symbol>

          <symbol id="art-dragonfly" viewBox="0 0 100 100">
            <g fill="#DFF6FF" opacity=".8" stroke="#2C2620" stroke-width="1.8">
              <ellipse cx="33" cy="42" rx="18" ry="6" transform="rotate(-18 33 42)" />
              <ellipse cx="67" cy="42" rx="18" ry="6" transform="rotate(18 67 42)" />
              <ellipse cx="35" cy="56" rx="16" ry="5" transform="rotate(14 35 56)" />
              <ellipse cx="65" cy="56" rx="16" ry="5" transform="rotate(-14 65 56)" />
            </g>
            <ellipse cx="50" cy="58" rx="4.4" ry="22" fill="#5AC8E8" stroke="#2C2620" stroke-width="2.6" />
            <circle cx="50" cy="27" r="8.5" fill="#9ADCF4" stroke="#2C2620" stroke-width="2.6" />
            <circle cx="47" cy="26" r="2.4" fill="#2C2620" />
            <circle cx="53" cy="26" r="2.4" fill="#2C2620" />
          </symbol>

          <symbol id="art-lantern" viewBox="0 0 100 100">
            <rect x="30" y="26" width="40" height="46" rx="13" fill="#FFD27A" stroke="#2C2620" stroke-width="3.4" />
            <rect x="36" y="15" width="28" height="12" rx="4" fill="#C98D5C" stroke="#2C2620" stroke-width="3" />
            <path d="M50 72v9" stroke="#2C2620" stroke-width="2.8" stroke-linecap="round" />
            <ellipse cx="50" cy="86" rx="17" ry="5" fill="#FFD27A" opacity=".5" />
          </symbol>

          <symbol id="art-fish" viewBox="0 0 100 100">
            <path d="M28 50c12-18 36-18 50 0-14 18-38 18-50 0z" fill="#F5A65B" stroke="#2C2620" stroke-width="3.4" stroke-linejoin="round" />
            <path d="M28 50l-16-13v26z" fill="#F5A65B" stroke="#2C2620" stroke-width="3.4" stroke-linejoin="round" />
            <circle cx="64" cy="45" r="3.4" fill="#2C2620" />
            <path d="M54 58q7 6 14 2" fill="none" stroke="#2C2620" stroke-width="2.4" stroke-linecap="round" />
          </symbol>

          <symbol id="art-star" viewBox="0 0 100 100">
            <path d="M50 10l10 21 23 3.4-16.6 16.2 4 22.9L50 62.4 29.6 73.5l4-22.9L17 34.4 40 31z" fill="#FFC93C" stroke="#2C2620" stroke-width="3.4" stroke-linejoin="round" />
          </symbol>

          <symbol id="art-firework" viewBox="0 0 100 100">
            <g stroke="currentColor" stroke-width="4.5" stroke-linecap="round" fill="none">
              <path d="M50 10v24M50 66v24M10 50h24M66 50h24M22 22l16 16M78 78L62 62M78 22L62 38M22 78l16-16" />
            </g>
            <circle cx="50" cy="50" r="5.5" fill="currentColor" />
          </symbol>
        </svg>

        <!-- landscape -->
        <svg class="landscape" viewBox="0 0 900 440" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M0 300c90-46 150-30 220-14 80 18 130-26 210-22s130 36 210 22 160-30 260-8v60H0z"
            :fill="NIGHT[page] ? '#24405a' : '#8FD6A0'"
          />
          <path
            d="M0 330c70-18 130 2 190 4 80 3 128-16 198-14s140 18 208 12 128-16 200-4 104 6 104 6v106H0z"
            :fill="NIGHT[page] ? '#2b4d68' : '#69C27B'"
          />
          <ellipse cx="450" cy="470" rx="560" ry="150" :fill="NIGHT[page] ? '#22335c' : '#79C6E0'" />
          <ellipse cx="450" cy="500" rx="430" ry="120" :fill="NIGHT[page] ? '#31476f' : '#A6DEF0'" opacity=".55" />
          <g stroke="#FFF6DF" stroke-opacity=".35" stroke-width="4" stroke-linecap="round" fill="none">
            <path d="M120 360q30-8 58 0t58 0" />
            <path d="M600 400q26-7 52 0t52 0" />
          </g>
        </svg>

        <!-- sky decorations -->
        <div v-if="!NIGHT[page]" class="sun" />
        <div v-else class="moon"><span class="crater a" /><span class="crater b" /></div>
        <div v-if="NIGHT[page]" class="stars">
          <span v-for="i in 22" :key="i" :style="{ left: (i * 37) % 96 + '%', top: (i * 47) % 46 + '%', animationDelay: (i % 7) * 0.4 + 's' }" />
        </div>

        <!-- countable animals, always in clear rows -->
        <div class="items" :class="{ celebrating: solved }">
          <div
            v-for="it in items"
            :key="page + '-' + it.key"
            class="item"
            :class="'item-' + art"
            :style="{ left: it.x + '%', bottom: it.y + '%', '--w': it.w + '%', '--i': it.delay, color: it.color }"
          >
            <svg viewBox="0 0 100 100" class="item-art">
              <use :href="'#art-' + art" />
            </svg>
          </div>
        </div>

        <!-- collected loot -->
        <div class="bag">
          <div v-for="(c, i) in collected" :key="i" class="loot" :class="c">
            <svg viewBox="0 0 40 40">
              <path v-if="c === 'star'" d="M20 5l4.6 9.6L35 16l-7.5 7.3L29.5 34 20 28.9 10.5 34l2-10.7L5 16l10.4-1.4z" fill="#FFC93C" stroke="#2C2620" stroke-width="2.4" stroke-linejoin="round" />
              <path v-else-if="c === 'gem'" d="M20 6l12 10-12 18L8 16z" fill="#8AD7F2" stroke="#2C2620" stroke-width="2.4" stroke-linejoin="round" />
              <path v-else d="M8 26c0-10 8-18 18-18 0 10-8 18-18 18z" fill="#8FE0B0" stroke="#2C2620" stroke-width="2.4" stroke-linejoin="round" />
            </svg>
          </div>
        </div>

        <div class="page-chip">Page {{ page + 1 }} of {{ TOTAL }}</div>

        <Transition name="pop">
          <div v-if="isLast && solved" class="the-end">
            <span class="the-end-small">and they all lived</span>
            <span class="the-end-big">happily ever after</span>
          </div>
        </Transition>

        <div v-if="flipping" class="page-flip" />
        <Confetti :burst="burst" :origin="origin" :count="34" />
      </div>

      <template #answer>
        <div class="sb-answer">
          <div class="sb-question">{{ data.question }}</div>
          <NumberPad
            :max="store.toddler ? 5 : 10"
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
      title="The end!"
      :detail="`You counted all ${TOTAL} pages and collected ${collected.length} treasures!`"
      accent="#FFC93C"
      @again="restart"
      @exit="exitGame"
    />
  </div>
</template>

<style scoped>
/* hidden art library */
.lib {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
}

.pond {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  overflow: hidden;
  transition: background 0.9s ease;
}

.landscape {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* sun & moon */
.sun {
  position: absolute;
  right: 8%;
  top: 8%;
  width: clamp(54px, 9vw, 84px);
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--sun);
  border: 4px solid var(--ink);
  box-shadow: 0 0 0 12px rgba(255, 201, 60, 0.25), 0 0 0 26px rgba(255, 201, 60, 0.12);
  animation: bob 6s ease-in-out infinite;
}

.moon {
  position: absolute;
  right: 8%;
  top: 7%;
  width: clamp(48px, 8vw, 76px);
  aspect-ratio: 1;
  border-radius: 50%;
  background: #fff6d8;
  border: 4px solid var(--ink);
  box-shadow: 0 0 26px rgba(255, 246, 216, 0.55);
  animation: bob 7s ease-in-out infinite;
}
.crater {
  position: absolute;
  border-radius: 50%;
  background: rgba(44, 38, 32, 0.12);
}
.crater.a {
  width: 22%;
  height: 22%;
  left: 22%;
  top: 28%;
}
.crater.b {
  width: 16%;
  height: 16%;
  left: 56%;
  top: 54%;
}

.stars span {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #fff8d8;
  animation: twinkle 3.4s ease-in-out infinite;
}

/* animals */
.items {
  position: absolute;
  inset: 0;
}

.item {
  position: absolute;
  width: clamp(52px, var(--w), 150px);
  transform: translateX(-50%);
  animation: itemBob 3s ease-in-out infinite;
  animation-delay: var(--i);
  transition: transform 0.4s ease;
}

.item-art {
  width: 100%;
  height: auto;
  overflow: visible;
  filter: drop-shadow(0 6px 0 rgba(44, 38, 32, 0.18));
}

.item-log {
  width: clamp(88px, var(--w), 230px);
}
.item-firework .item-art {
  filter: drop-shadow(0 0 10px currentColor);
}

@keyframes itemBob {
  0%,
  100% {
    transform: translateX(-50%) translateY(0);
  }
  50% {
    transform: translateX(-50%) translateY(-6px);
  }
}

.celebrating .item {
  animation: itemCheer 0.8s ease-in-out infinite;
  animation-delay: var(--i);
}

@keyframes itemCheer {
  0%,
  100% {
    transform: translateX(-50%) translateY(0) rotate(0);
  }
  35% {
    transform: translateX(-50%) translateY(-22px) rotate(-6deg) scale(1.06);
  }
  70% {
    transform: translateX(-50%) translateY(0) rotate(4deg);
  }
}

/* collected loot */
.bag {
  position: absolute;
  left: 12px;
  top: 12px;
  display: flex;
  gap: 4px;
  z-index: 10;
}

.loot {
  width: clamp(22px, 3vw, 32px);
  height: clamp(22px, 3vw, 32px);
  animation: popIn 0.4s cubic-bezier(0.2, 1.5, 0.4, 1);
}
.loot svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 2px 0 rgba(44, 38, 32, 0.25));
}

.page-chip {
  position: absolute;
  right: 12px;
  bottom: 10px;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(12px, 1.5vw, 15px);
  color: var(--ink);
  background: rgba(255, 250, 240, 0.92);
  border: 3px solid var(--ink);
  border-radius: 999px;
  padding: 2px 12px 3px;
  box-shadow: 0 3px 0 rgba(44, 38, 32, 0.3);
}

.the-end {
  position: absolute;
  left: 50%;
  top: 22%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  pointer-events: none;
  animation: popIn 0.7s cubic-bezier(0.2, 1.5, 0.4, 1);
  z-index: 12;
}
.the-end-small {
  font-family: var(--font-display);
  font-size: clamp(12px, 1.6vw, 16px);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #cdd7ff;
  text-shadow: 0 2px 0 rgba(10, 16, 38, 0.6);
}
.the-end-big {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(26px, 4.6vw, 46px);
  color: #fff6d8;
  text-shadow: 0 0 22px rgba(255, 246, 216, 0.8), 0 4px 0 rgba(10, 16, 38, 0.35);
}

.page-flip {
  position: absolute;
  inset: 0;
  z-index: 20;
  background: linear-gradient(100deg, #fffaf0 0%, #f3e4c8 46%, rgba(243, 228, 200, 0) 100%);
  border-top-right-radius: 60px;
  transform-origin: left center;
  animation: pageFlip 0.62s ease-in-out forwards;
  pointer-events: none;
}

@keyframes pageFlip {
  0% {
    transform: perspective(1200px) rotateY(0deg);
    opacity: 0.95;
  }
  100% {
    transform: perspective(1200px) rotateY(-92deg);
    opacity: 0;
  }
}

/* answer area */
.sb-answer {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.sb-question {
  text-align: center;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(19px, 2.5vw, 26px);
}
</style>
