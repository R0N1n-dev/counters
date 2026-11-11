<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import GameShell from '../components/GameShell.vue'
import TypePad from '../components/TypePad.vue'
import Confetti from '../components/Confetti.vue'
import GameOver from '../components/GameOver.vue'
import PromptText from '../components/PromptText.vue'
import { sfx } from '../lib/audio.js'
import { randInt, scatterGrid, shuffle, pick } from '../lib/fx.js'
import { recordGame, store } from '../lib/store.js'

const emit = defineEmits(['exit'])

const TOTAL = computed(() => store.rounds)

// each round mixes TWO kinds of things; kids count only the asked one.
// colour pairs differ by paint; object pairs share a colour so kids must
// spot the SHAPE (red cars among red trains, blue planes among blue boats).
const RED = '#F0455F'
const GREEN = '#58A86C'
const YELLOW = '#FFC93C'
const BLUE = '#5B8DEF'
const ORANGE = '#F59B3F'
const PURPLE = '#9B72E8'
const PINK = '#EC5B84'
const TEAL = '#3BB5AC'
const BROWN = '#B07B4F'

const PAIRS = [
  {
    a: { shape: 'apple', color: RED, singular: 'red apple', plural: 'red apples' },
    b: { shape: 'apple', color: GREEN, singular: 'green apple', plural: 'green apples' },
  },
  {
    a: { shape: 'ball', color: BLUE, singular: 'blue ball', plural: 'blue balls' },
    b: { shape: 'ball', color: RED, singular: 'red ball', plural: 'red balls' },
  },
  {
    a: { shape: 'star', color: YELLOW, singular: 'yellow star', plural: 'yellow stars' },
    b: { shape: 'moon', color: YELLOW, singular: 'yellow moon', plural: 'yellow moons' },
  },
  {
    a: { shape: 'fish', color: ORANGE, singular: 'orange fish', plural: 'orange fish' },
    b: { shape: 'fish', color: BLUE, singular: 'blue fish', plural: 'blue fish' },
  },
  {
    a: { shape: 'balloon', color: PINK, singular: 'pink balloon', plural: 'pink balloons' },
    b: { shape: 'balloon', color: YELLOW, singular: 'yellow balloon', plural: 'yellow balloons' },
  },
  {
    a: { shape: 'lollipop', color: RED, singular: 'red lollipop', plural: 'red lollipops' },
    b: { shape: 'lollipop', color: PURPLE, singular: 'purple lollipop', plural: 'purple lollipops' },
  },
  {
    a: { shape: 'heart', color: RED, singular: 'red heart', plural: 'red hearts' },
    b: { shape: 'flower', color: RED, singular: 'red flower', plural: 'red flowers' },
  },
  {
    a: { shape: 'carrot', color: ORANGE, singular: 'orange carrot', plural: 'orange carrots' },
    b: { shape: 'pea', color: GREEN, singular: 'green pea', plural: 'green peas' },
  },
  // object pairs — same paint, different thing
  {
    a: { shape: 'car', color: RED, singular: 'car', plural: 'cars' },
    b: { shape: 'train', color: RED, singular: 'train', plural: 'trains' },
  },
  {
    a: { shape: 'plane', color: BLUE, singular: 'plane', plural: 'planes' },
    b: { shape: 'boat', color: BLUE, singular: 'boat', plural: 'boats' },
  },
  {
    a: { shape: 'bike', color: GREEN, singular: 'bike', plural: 'bikes' },
    b: { shape: 'car', color: GREEN, singular: 'car', plural: 'cars' },
  },
  {
    a: { shape: 'dog', color: BROWN, singular: 'dog', plural: 'dogs' },
    b: { shape: 'cat', color: PURPLE, singular: 'cat', plural: 'cats' },
  },
  {
    a: { shape: 'bird', color: TEAL, singular: 'bird', plural: 'birds' },
    b: { shape: 'butterfly', color: PINK, singular: 'butterfly', plural: 'butterflies' },
  },
  {
    a: { shape: 'duck', color: YELLOW, singular: 'duck', plural: 'ducks' },
    b: { shape: 'frog', color: GREEN, singular: 'frog', plural: 'frogs' },
  },
  {
    a: { shape: 'snail', color: PINK, singular: 'snail', plural: 'snails' },
    b: { shape: 'turtle', color: GREEN, singular: 'turtle', plural: 'turtles' },
  },
  {
    a: { shape: 'fish', color: ORANGE, singular: 'fish', plural: 'fish' },
    b: { shape: 'bird', color: TEAL, singular: 'bird', plural: 'birds' },
  },
]

const PRAISE = [
  'Spot on! Only the right ones!',
  'Super sorting eyes! Perfect count!',
  'You counted just the right things!',
  'Brilliant! That is exactly right!',
]

const round = ref(1)
const queue = ref([])
const pair = ref(PAIRS[0])
const targetKind = ref(null)
const target = ref(3)
const ask = ref('')
const items = ref([])
const prompt = ref('')
const mood = ref('happy')
const solved = ref(false)
const tries = ref(0)
const firstTry = ref(0)
const hint = ref(false)
const burst = ref(0)
const origin = ref({ x: 50, y: 40 })
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
  tries.value = 0
  hint.value = false
  mood.value = 'happy'
  padRef.value?.clear()

  if (round.value === 1 || !queue.value.length) {
    const deck = []
    while (deck.length < TOTAL.value) deck.push(...shuffle(PAIRS))
    queue.value = deck.slice(0, TOTAL.value)
  }
  pair.value = queue.value[round.value - 1]

  // randomly decide which of the two kinds is the one to count
  targetKind.value = Math.random() < 0.5 ? 'a' : 'b'
  const targetItem = pair.value[targetKind.value]
  const otherItem = pair.value[targetKind.value === 'a' ? 'b' : 'a']
  ask.value = targetItem.plural
  target.value = randInt(store.toddler ? 2 : 4, store.toddler ? 5 : 9)
  let other = randInt(store.toddler ? 1 : 3, store.toddler ? 5 : 9)
  while (other === target.value) other = randInt(store.toddler ? 1 : 3, store.toddler ? 5 : 9)

  const total = target.value + other
  const spots = scatterGrid(total, { cols: 6, rows: 3, x0: 6, x1: 94, y0: 9, y1: 60 })
  const deck = [
    ...Array.from({ length: target.value }, () => ({ ...targetItem, isTarget: true })),
    ...Array.from({ length: other }, () => ({ ...otherItem, isTarget: false })),
  ]
  items.value = deck.map((d, i) => ({
    ...d,
    id: `i${i}-${Math.random().toString(36).slice(2, 7)}`,
    x: spots[i].x,
    y: spots[i].y,
    rot: randInt(-14, 14),
    delay: (Math.random() * 0.9).toFixed(2),
  }))
  prompt.value = `How many ${ask.value}? Count only those!`
}

function check(n) {
  if (solved.value) return
  if (n === target.value) {
    solved.value = true
    mood.value = 'cheer'
    if (tries.value === 0) firstTry.value++
    prompt.value = `${pick(PRAISE)} There were ${target.value} ${ask.value}!`
    burst.value++
    origin.value = { x: 50, y: 40 }
    sfx.correct()
    later(() => sfx.sparkle(), 600)
    later(() => {
      if (round.value >= TOTAL.value) finish()
      else {
        round.value++
        buildRound()
      }
    }, 2800)
  } else {
    tries.value++
    padRef.value?.reject()
    sfx.wrong()
    mood.value = 'oops'
    hint.value = tries.value >= 2
    prompt.value =
      tries.value >= 2
        ? `Only count the ${ask.value}! The glowing ones are your friends.`
        : `Not quite! Count only the ${ask.value} — the other ones don't count.`
    later(() => {
      if (!solved.value) {
        mood.value = 'happy'
        prompt.value = `How many ${ask.value}? Count only those!`
      }
    }, 2600)
  }
}

function finish() {
  earned.value = firstTry.value >= 4 ? 3 : firstTry.value >= 2 ? 2 : 1
  recordGame('objects', earned.value)
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
      title="Object Count"
      accent="#5B8DEF"
      :round="round"
      :total="TOTAL"
      :mood="mood"
      :prompt="prompt"
      @exit="exitGame"
    >
      <template #prompt>
        <PromptText :text="prompt" />
      </template>

      <div class="cc-scene" :class="{ hint }">
        <div class="cc-sun" />
        <div class="cc-cloud c1" />
        <div class="cc-cloud c2" />

        <div class="cc-hills">
          <svg viewBox="0 0 900 200" preserveAspectRatio="none">
            <path d="M0 150c120-50 240-40 360-8 120 32 220-24 340-20 120 4 220 40 340 24v54H0z" fill="#9ED48F" stroke="#2C2620" stroke-width="4" vector-effect="non-scaling-stroke" />
            <path d="M0 178c140-24 260 8 400 4 140-4 260-28 400-16 80 7 160 12 200 8v26H0z" fill="#69C27B" stroke="#2C2620" stroke-width="4" vector-effect="non-scaling-stroke" />
          </svg>
        </div>

        <div
          v-for="it in items"
          :key="it.id"
          class="cc-item"
          :class="{ target: it.isTarget }"
          :style="{
            left: it.x + '%',
            top: it.y + '%',
            '--rot': it.rot + 'deg',
            '--i': it.id,
            animationDelay: it.delay + 's',
          }"
        >
          <svg viewBox="0 0 48 48" class="item-svg">
            <!-- apple / pear-ish round fruit -->
            <template v-if="it.shape === 'apple'">
              <path d="M24 15c0-5 2-8 6-10" fill="none" stroke="#7A4A31" stroke-width="3" stroke-linecap="round" />
              <path d="M30 7c5-2 9 0 10 3-4 3-8 3-10-3z" fill="#69C27B" stroke="#2C2620" stroke-width="2.4" stroke-linejoin="round" />
              <path d="M24 15c8-4 17 1 17 12 0 9-7 17-17 17S7 36 7 27c0-11 9-16 17-12z" :fill="it.color" stroke="#2C2620" stroke-width="3.2" stroke-linejoin="round" />
              <ellipse cx="17" cy="27" rx="4" ry="6" fill="#fff" opacity=".35" transform="rotate(-18 17 27)" />
            </template>

            <!-- ball -->
            <template v-else-if="it.shape === 'ball'">
              <circle cx="24" cy="26" r="17" :fill="it.color" stroke="#2C2620" stroke-width="3.2" />
              <path d="M9 23q15 9 30 0" fill="none" stroke="#fff" stroke-width="5" opacity=".5" stroke-linecap="round" />
              <ellipse cx="18" cy="19" rx="4.5" ry="6" fill="#fff" opacity=".4" transform="rotate(-20 18 19)" />
            </template>

            <!-- star -->
            <template v-else-if="it.shape === 'star'">
              <path d="M24 5l5.6 11.6 12.7 1.8-9.2 8.9 2.2 12.6L24 33.4l-11.3 6 2.2-12.6-9.2-8.9 12.7-1.8z" :fill="it.color" stroke="#2C2620" stroke-width="3" stroke-linejoin="round" />
            </template>

            <!-- moon -->
            <template v-else-if="it.shape === 'moon'">
              <path d="M33 6a18 18 0 1 0 0 36 15 15 0 0 1 0-36z" :fill="it.color" stroke="#2C2620" stroke-width="3" stroke-linejoin="round" />
              <circle cx="15" cy="18" r="2.4" :fill="it.color" opacity=".55" />
              <circle cx="13" cy="30" r="1.8" :fill="it.color" opacity=".55" />
            </template>

            <!-- fish -->
            <template v-else-if="it.shape === 'fish'">
              <path d="M33 24l11-8v16z" :fill="it.color" stroke="#2C2620" stroke-width="3" stroke-linejoin="round" />
              <ellipse cx="21" cy="24" rx="15" ry="11" :fill="it.color" stroke="#2C2620" stroke-width="3.2" />
              <path d="M27 15q4 9 0 18" fill="none" stroke="#2C2620" stroke-width="2.4" opacity=".45" />
              <circle cx="13" cy="21" r="2.6" fill="#2C2620" />
            </template>

            <!-- balloon -->
            <template v-else-if="it.shape === 'balloon'">
              <path d="M24 40q-5 5 0 8" fill="none" stroke="#2C2620" stroke-width="2.6" stroke-linecap="round" />
              <path d="M20 38l4 5 4-5z" :fill="it.color" stroke="#2C2620" stroke-width="2.6" stroke-linejoin="round" />
              <ellipse cx="24" cy="21" rx="15" ry="18" :fill="it.color" stroke="#2C2620" stroke-width="3.2" />
              <ellipse cx="18" cy="14" rx="4" ry="7" fill="#fff" opacity=".4" transform="rotate(-18 18 14)" />
            </template>

            <!-- lollipop -->
            <template v-else-if="it.shape === 'lollipop'">
              <rect x="22" y="30" width="5" height="14" rx="2.5" fill="#A9744F" stroke="#2C2620" stroke-width="2.6" />
              <circle cx="24" cy="19" r="14" :fill="it.color" stroke="#2C2620" stroke-width="3.2" />
              <path d="M24 7a12 12 0 0 1 10 19M14 12a14 14 0 0 0 2 14M34 12a14 14 0 0 1-2 14" fill="none" stroke="#fff" stroke-width="3" opacity=".55" stroke-linecap="round" />
            </template>

            <!-- heart -->
            <template v-else-if="it.shape === 'heart'">
              <path d="M24 41C12 31 7 23 9 16c2-6 10-8 15-3 5-5 13-3 15 3 2 7-3 15-15 25z" :fill="it.color" stroke="#2C2620" stroke-width="3" stroke-linejoin="round" />
              <ellipse cx="16" cy="20" rx="3.4" ry="5" fill="#fff" opacity=".4" transform="rotate(-20 16 20)" />
            </template>

            <!-- flower -->
            <template v-else-if="it.shape === 'flower'">
              <circle cx="24" cy="12" r="8" :fill="it.color" stroke="#2C2620" stroke-width="2.6" />
              <circle cx="35" cy="19" r="8" :fill="it.color" stroke="#2C2620" stroke-width="2.6" />
              <circle cx="32" cy="32" r="8" :fill="it.color" stroke="#2C2620" stroke-width="2.6" />
              <circle cx="16" cy="32" r="8" :fill="it.color" stroke="#2C2620" stroke-width="2.6" />
              <circle cx="13" cy="19" r="8" :fill="it.color" stroke="#2C2620" stroke-width="2.6" />
              <circle cx="24" cy="24" r="6.5" fill="#FFC93C" stroke="#2C2620" stroke-width="2.8" />
            </template>

            <!-- carrot -->
            <template v-else-if="it.shape === 'carrot'">
              <path d="M20 13c-3-8 0-14 4-17M24 12c0-8 2-13 6-16M28 14c3-7 7-10 11-11" fill="none" stroke="#4E9B62" stroke-width="3.6" stroke-linecap="round" />
              <path d="M24 15c7 5 11 12 10 22-1 5-5 7-10 7s-9-2-10-7c-1-10 3-17 10-22z" :fill="it.color" stroke="#2C2620" stroke-width="3.2" stroke-linejoin="round" />
              <path d="M20 28c2 3 5 5 8 5M18 21c3 2 6 4 9 4" fill="none" stroke="#D97B1E" stroke-width="2.2" stroke-linecap="round" />
            </template>

            <!-- car -->
            <template v-else-if="it.shape === 'car'">
              <path d="M9 29c0-3 2-5 5-6l5-8c1.5-2.5 4.5-3 6.5-.5L33 23h8c2.5 0 4 1.5 4 3.5V30H9z" :fill="it.color" stroke="#2C2620" stroke-width="3" stroke-linejoin="round" />
              <path d="M20 20l3.5-6h5l4 6z" fill="#9ADCF4" stroke="#2C2620" stroke-width="2.2" stroke-linejoin="round" />
              <circle cx="16" cy="34" r="5" fill="#3A3630" stroke="#2C2620" stroke-width="2.4" />
              <circle cx="33" cy="34" r="5" fill="#3A3630" stroke="#2C2620" stroke-width="2.4" />
              <circle cx="16" cy="34" r="1.8" fill="#fff" />
              <circle cx="33" cy="34" r="1.8" fill="#fff" />
            </template>

            <!-- train -->
            <template v-else-if="it.shape === 'train'">
              <rect x="5" y="25" width="24" height="13" rx="5" :fill="it.color" stroke="#2C2620" stroke-width="3" />
              <rect x="28" y="19" width="13" height="19" rx="4" :fill="it.color" stroke="#2C2620" stroke-width="3" />
              <rect x="31" y="12" width="5" height="8" rx="2" fill="#3A3630" stroke="#2C2620" stroke-width="2.2" />
              <rect x="9" y="20" width="7" height="6" rx="2" fill="#9ADCF4" stroke="#2C2620" stroke-width="2" />
              <circle cx="12" cy="34" r="4.5" fill="#3A3630" stroke="#2C2620" stroke-width="2.2" />
              <circle cx="24" cy="34" r="4.5" fill="#3A3630" stroke="#2C2620" stroke-width="2.2" />
              <circle cx="35" cy="34" r="4.5" fill="#3A3630" stroke="#2C2620" stroke-width="2.2" />
            </template>

            <!-- plane -->
            <template v-else-if="it.shape === 'plane'">
              <ellipse cx="20" cy="27" rx="15" ry="8" :fill="it.color" stroke="#2C2620" stroke-width="3" />
              <path d="M18 20l9-11 4 3-7 9z" :fill="it.color" stroke="#2C2620" stroke-width="2.6" stroke-linejoin="round" />
              <path d="M9 25l-7-7 2-2 8 4z" :fill="it.color" stroke="#2C2620" stroke-width="2.4" stroke-linejoin="round" />
              <circle cx="31" cy="25" r="2.8" fill="#9ADCF4" stroke="#2C2620" stroke-width="2" />
            </template>

            <!-- boat -->
            <template v-else-if="it.shape === 'boat'">
              <path d="M6 31h36l-6 10H12z" :fill="it.color" stroke="#2C2620" stroke-width="3" stroke-linejoin="round" />
              <path d="M24 5v26" stroke="#2C2620" stroke-width="2.6" stroke-linecap="round" />
              <path d="M26 7l-13 15h13z" fill="#fffdf7" stroke="#2C2620" stroke-width="2.4" stroke-linejoin="round" />
              <path d="M26 7l11 15H26z" :fill="it.color" opacity=".55" stroke="#2C2620" stroke-width="2.4" stroke-linejoin="round" />
              <path d="M3 43q4-3 8 0t8 0 8 0 8 0 8 0" fill="none" stroke="#5B8DEF" stroke-width="2.6" stroke-linecap="round" />
            </template>

            <!-- bike -->
            <template v-else-if="it.shape === 'bike'">
              <circle cx="13" cy="34" r="8" fill="none" stroke="#2C2620" stroke-width="3" />
              <circle cx="35" cy="34" r="8" fill="none" stroke="#2C2620" stroke-width="3" />
              <path d="M13 34 22 19h5l10 15M22 19l-4 15M27 19l9 4-4 8" :stroke="it.color" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round" />
              <circle cx="13" cy="34" r="2" fill="#2C2620" />
              <circle cx="35" cy="34" r="2" fill="#2C2620" />
            </template>

            <!-- dog -->
            <template v-else-if="it.shape === 'dog'">
              <ellipse cx="14" cy="20" rx="6" ry="11" :fill="it.color" stroke="#2C2620" stroke-width="3" transform="rotate(-14 14 20)" />
              <ellipse cx="34" cy="20" rx="6" ry="11" :fill="it.color" stroke="#2C2620" stroke-width="3" transform="rotate(14 34 20)" />
              <circle cx="24" cy="27" r="14" :fill="it.color" stroke="#2C2620" stroke-width="3.2" />
              <ellipse cx="24" cy="33" rx="8" ry="6" fill="#FFE3C2" stroke="#2C2620" stroke-width="2.2" />
              <ellipse cx="24" cy="30" rx="3.4" ry="2.8" fill="#3A3630" />
              <circle cx="18" cy="25" r="2.4" fill="#2C2620" />
              <circle cx="30" cy="25" r="2.4" fill="#2C2620" />
            </template>

            <!-- cat -->
            <template v-else-if="it.shape === 'cat'">
              <path d="M13 21 15 8l10 9z" :fill="it.color" stroke="#2C2620" stroke-width="3" stroke-linejoin="round" />
              <path d="M35 21 33 8l-10 9z" :fill="it.color" stroke="#2C2620" stroke-width="3" stroke-linejoin="round" />
              <circle cx="24" cy="28" r="14" :fill="it.color" stroke="#2C2620" stroke-width="3.2" />
              <path d="M22 33h4l-2 3z" fill="#F79AC0" stroke="#2C2620" stroke-width="1.8" stroke-linejoin="round" />
              <circle cx="18" cy="26" r="2.4" fill="#2C2620" />
              <circle cx="30" cy="26" r="2.4" fill="#2C2620" />
              <path d="M8 29l-5-1M9 32l-5 1M40 29l5-1M39 32l5 1" fill="none" stroke="#2C2620" stroke-width="1.8" stroke-linecap="round" />
            </template>

            <!-- bird -->
            <template v-else-if="it.shape === 'bird'">
              <ellipse cx="21" cy="29" rx="13" ry="10" :fill="it.color" stroke="#2C2620" stroke-width="3" />
              <circle cx="34" cy="18" r="8" :fill="it.color" stroke="#2C2620" stroke-width="3" />
              <path d="M40 17l8 2.5-8 4z" fill="#F59B3F" stroke="#2C2620" stroke-width="2.2" stroke-linejoin="round" />
              <path d="M10 28l-8-6 2 9z" :fill="it.color" stroke="#2C2620" stroke-width="2.4" stroke-linejoin="round" />
              <ellipse cx="20" cy="29" rx="6" ry="4.5" fill="#fff" opacity=".3" />
              <circle cx="36" cy="16" r="2" fill="#2C2620" />
            </template>

            <!-- butterfly -->
            <template v-else-if="it.shape === 'butterfly'">
              <ellipse cx="15" cy="18" rx="8" ry="11" :fill="it.color" stroke="#2C2620" stroke-width="2.8" transform="rotate(-18 15 18)" />
              <ellipse cx="33" cy="18" rx="8" ry="11" :fill="it.color" stroke="#2C2620" stroke-width="2.8" transform="rotate(18 33 18)" />
              <ellipse cx="15" cy="32" rx="6" ry="8" :fill="it.color" stroke="#2C2620" stroke-width="2.8" transform="rotate(-8 15 32)" />
              <ellipse cx="33" cy="32" rx="6" ry="8" :fill="it.color" stroke="#2C2620" stroke-width="2.8" transform="rotate(8 33 32)" />
              <circle cx="15" cy="18" r="3" fill="#fff" opacity=".5" />
              <circle cx="33" cy="18" r="3" fill="#fff" opacity=".5" />
              <rect x="22" y="10" width="4.5" height="28" rx="2.2" fill="#3A3630" />
              <path d="M23 10q-4-5-8-6M25 10q4-5 8-6" fill="none" stroke="#2C2620" stroke-width="2" stroke-linecap="round" />
            </template>

            <!-- duck -->
            <template v-else-if="it.shape === 'duck'">
              <ellipse cx="22" cy="31" rx="15" ry="10" :fill="it.color" stroke="#2C2620" stroke-width="3" />
              <circle cx="34" cy="19" r="9" :fill="it.color" stroke="#2C2620" stroke-width="3" />
              <path d="M41 18l9 3-9 4.5z" fill="#F59B3F" stroke="#2C2620" stroke-width="2.2" stroke-linejoin="round" />
              <path d="M8 30l-7-4 1 7z" :fill="it.color" stroke="#2C2620" stroke-width="2.4" stroke-linejoin="round" />
              <ellipse cx="20" cy="31" rx="7" ry="4.5" fill="#fff" opacity=".3" />
              <circle cx="36" cy="17" r="2" fill="#2C2620" />
            </template>

            <!-- frog -->
            <template v-else-if="it.shape === 'frog'">
              <ellipse cx="24" cy="31" rx="15" ry="11" :fill="it.color" stroke="#2C2620" stroke-width="3" />
              <circle cx="17" cy="17" r="6" :fill="it.color" stroke="#2C2620" stroke-width="2.8" />
              <circle cx="31" cy="17" r="6" :fill="it.color" stroke="#2C2620" stroke-width="2.8" />
              <circle cx="17" cy="17" r="2.8" fill="#fff" stroke="#2C2620" stroke-width="1.8" />
              <circle cx="17.8" cy="17.8" r="1.4" fill="#2C2620" />
              <circle cx="31" cy="17" r="2.8" fill="#fff" stroke="#2C2620" stroke-width="1.8" />
              <circle cx="31.8" cy="17.8" r="1.4" fill="#2C2620" />
              <path d="M18 36q6 4 12 0" fill="none" stroke="#2C2620" stroke-width="2.4" stroke-linecap="round" />
            </template>

            <!-- snail -->
            <template v-else-if="it.shape === 'snail'">
              <path d="M7 36q10-9 22-4t15 2v6H7z" fill="#F5A65B" stroke="#2C2620" stroke-width="3" stroke-linejoin="round" />
              <circle cx="22" cy="25" r="12" :fill="it.color" stroke="#2C2620" stroke-width="3" />
              <path d="M22 25m-6 0a6 6 0 1 1 12 0 4 4 0 1 1-8 0 2.4 2.4 0 1 1 4.8 0" fill="none" stroke="#2C2620" stroke-width="2.2" />
              <path d="M36 30q4-9 8-10M39 32q5-7 9-7" fill="none" stroke="#2C2620" stroke-width="2.4" stroke-linecap="round" />
              <circle cx="44" cy="19" r="2.4" fill="#2C2620" />
              <circle cx="48" cy="24" r="2.4" fill="#2C2620" />
            </template>

            <!-- turtle -->
            <template v-else-if="it.shape === 'turtle'">
              <ellipse cx="22" cy="31" rx="15" ry="10" :fill="it.color" stroke="#2C2620" stroke-width="3" />
              <path d="M12 31q10-8 20 0" fill="none" stroke="#2C2620" stroke-width="2" opacity=".4" />
              <circle cx="38" cy="27" r="6" :fill="it.color" stroke="#2C2620" stroke-width="2.8" />
              <circle cx="40" cy="26" r="1.8" fill="#2C2620" />
              <ellipse cx="14" cy="39" rx="4" ry="2.6" fill="#3A3630" />
              <ellipse cx="30" cy="39" rx="4" ry="2.6" fill="#3A3630" />
            </template>

            <!-- pea -->
            <template v-else>
              <circle cx="24" cy="25" r="15" :fill="it.color" stroke="#2C2620" stroke-width="3.2" />
              <ellipse cx="18" cy="19" rx="4" ry="6" fill="#fff" opacity=".4" transform="rotate(-18 18 19)" />
            </template>
          </svg>
        </div>

        <Confetti :burst="burst" :origin="origin" :count="36" />
      </div>

      <template #answer>
        <div class="cc-answer">
          <div class="cc-question">How many {{ ask }}? <span class="cc-type-hint">type it with the numbers</span></div>
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
      title="Sorting superstar!"
      :detail="`You counted ${firstTry} mixes first try.`"
      accent="#5B8DEF"
      @again="restart"
      @exit="exitGame"
    />
  </div>
</template>

<style scoped>
.cc-scene {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  overflow: hidden;
  background: linear-gradient(180deg, #bfeaf8 0%, #e3f6ff 50%, #f3fbe8 100%);
}

.cc-sun {
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

.cc-cloud {
  position: absolute;
  height: clamp(22px, 3.4vw, 36px);
  background: #fffdf6;
  border: 3.5px solid var(--ink);
  border-radius: 999px;
  opacity: 0.92;
}
.cc-cloud::before,
.cc-cloud::after {
  content: '';
  position: absolute;
  background: inherit;
  border: inherit;
  border-radius: 50%;
  bottom: 50%;
}
.cc-cloud::before {
  width: 55%;
  aspect-ratio: 1;
  left: 12%;
  margin-bottom: -5px;
}
.cc-cloud::after {
  width: 38%;
  aspect-ratio: 1;
  right: 12%;
  margin-bottom: -3px;
}
.cc-cloud.c1 {
  width: clamp(90px, 14vw, 150px);
  left: 24%;
  top: 7%;
  animation: drift 60s linear infinite;
}
.cc-cloud.c2 {
  width: clamp(64px, 10vw, 110px);
  left: 0;
  top: 20%;
  opacity: 0.7;
  animation: drift 80s linear infinite;
  animation-delay: -40s;
}

.cc-hills {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 30%;
}
.cc-hills svg {
  width: 100%;
  height: 100%;
}

.cc-item {
  position: absolute;
  width: clamp(50px, 7.6vw, 86px);
  transform: translate(-50%, -50%) rotate(var(--rot));
  animation: ccBob 3.6s ease-in-out infinite;
  animation-delay: var(--d, 0s);
  z-index: 4;
  filter: drop-shadow(0 4px 0 rgba(44, 38, 32, 0.16));
  transition: filter 0.2s ease;
}

.item-svg {
  width: 100%;
  height: auto;
  overflow: visible;
  animation: popIn 0.45s backwards cubic-bezier(0.2, 1.5, 0.4, 1);
  animation-delay: inherit;
}

@keyframes ccBob {
  0%,
  100% {
    transform: translate(-50%, -50%) rotate(var(--rot));
  }
  50% {
    transform: translate(-50%, -56%) rotate(calc(var(--rot) * -1));
  }
}

.cc-scene.hint .cc-item.target .item-svg {
  animation: ccGlow 2.4s ease-in-out infinite;
}

@keyframes ccGlow {
  0%,
  100% {
    filter: drop-shadow(0 0 0 rgba(255, 201, 60, 0));
  }
  50% {
    filter: drop-shadow(0 0 16px rgba(255, 201, 60, 0.95)) drop-shadow(0 4px 0 rgba(44, 38, 32, 0.16));
  }
}

/* answer */
.cc-answer {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.cc-question {
  text-align: center;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(16px, 2vw, 22px);
  line-height: 1.3;
  color: var(--ink);
  background: var(--cream);
  border: 3px solid var(--ink);
  border-radius: 16px;
  padding: 7px 14px;
  box-shadow: 0 4px 0 var(--ink);
}

.cc-type-hint {
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-soft);
  margin-left: 6px;
}

@media (max-width: 640px) {
  .cc-item {
    width: clamp(38px, 10.5vw, 58px);
  }
  .cc-type-hint {
    display: none;
  }
}
</style>
