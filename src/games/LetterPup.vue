<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import GameShell from '../components/GameShell.vue'
import Confetti from '../components/Confetti.vue'
import GameOver from '../components/GameOver.vue'
import ClapCritter from '../components/ClapCritter.vue'
import { sfx } from '../lib/audio.js'
import { randInt, pick } from '../lib/fx.js'
import { recordGame, store } from '../lib/store.js'
import { speak } from '../lib/speak.js'

const emit = defineEmits(['exit'])

const TOTAL = computed(() => store.rounds)

// [word, emoji] — animals, foods, transport, jobs, nature, toys and everyday things
const WORDS = [
  // animals
  ['cat', '🐱'], ['dog', '🐶'], ['pig', '🐷'], ['cow', '🐮'], ['hen', '🐔'],
  ['bee', '🐝'], ['fox', '🦊'], ['owl', '🦉'], ['ant', '🐜'], ['bat', '🦇'],
  ['fish', '🐟'], ['frog', '🐸'], ['bear', '🐻'], ['lion', '🦁'], ['duck', '🦆'],
  ['bird', '🐦'], ['crab', '🦀'], ['snail', '🐌'], ['snake', '🐍'], ['rabbit', '🐰'],
  ['monkey', '🐵'], ['turtle', '🐢'], ['sheep', '🐑'], ['goat', '🐐'], ['horse', '🐴'],
  ['zebra', '🦓'], ['tiger', '🐯'], ['panda', '🐼'], ['koala', '🐨'], ['camel', '🐫'],
  ['whale', '🐋'], ['shark', '🦈'], ['mouse', '🐭'], ['chick', '🐤'], ['deer', '🦌'],
  ['seal', '🦭'], ['penguin', '🐧'], ['parrot', '🦜'], ['swan', '🦢'], ['goose', '🪿'],
  // foods
  ['egg', '🥚'], ['apple', '🍎'], ['lemon', '🍋'], ['grape', '🍇'], ['cherry', '🍒'],
  ['orange', '🍊'], ['carrot', '🥕'], ['potato', '🥔'], ['banana', '🍌'], ['cake', '🎂'],
  ['pizza', '🍕'], ['donut', '🍩'], ['candy', '🍭'], ['milk', '🥛'], ['juice', '🧃'],
  ['bread', '🍞'], ['cheese', '🧀'], ['melon', '🍉'], ['mango', '🥭'], ['onion', '🧅'],
  ['bacon', '🥓'], ['cookie', '🍪'], ['waffle', '🧇'], ['peach', '🍑'], ['pear', '🍐'],
  ['kiwi', '🥝'], ['berry', '🫐'], ['toast', '🍞'], ['soup', '🍲'], ['salad', '🥗'],
  // transport
  ['bus', '🚌'], ['car', '🚗'], ['train', '🚂'], ['plane', '✈️'], ['boat', '⛵'],
  ['bike', '🚲'], ['truck', '🚚'], ['ship', '🚢'], ['van', '🚐'], ['jet', '🛩️'],
  ['rocket', '🚀'], ['taxi', '🚕'], ['subway', '🚇'], ['tractor', '🚜'],
  // jobs
  ['doctor', '🧑‍⚕️'], ['nurse', '👩‍⚕️'], ['chef', '👨‍🍳'], ['farmer', '👨‍🌾'],
  ['police', '👮'], ['teacher', '🧑‍🏫'], ['pilot', '🧑‍✈️'], ['fireman', '🧑‍🚒'],
  ['vet', '🦮'], ['dentist', '🦷'], ['artist', '🎨'], ['singer', '🎤'],
  // nature & weather
  ['sun', '☀️'], ['moon', '🌙'], ['star', '⭐'], ['tree', '🌳'], ['flower', '🌸'],
  ['cloud', '☁️'], ['rain', '🌧️'], ['snow', '❄️'], ['wind', '💨'], ['leaf', '🍃'],
  ['rose', '🌹'], ['tulip', '🌷'], ['cactus', '🌵'], ['mushroom', '🍄'], ['rainbow', '🌈'],
  ['hill', '⛰️'], ['island', '🏝️'], ['volcano', '🌋'], ['desert', '🏜️'],
  // toys & objects
  ['kite', '🪁'], ['ball', '⚽'], ['book', '📖'], ['gift', '🎁'], ['drum', '🥁'],
  ['house', '🏠'], ['chair', '🪑'], ['door', '🚪'], ['shoe', '👟'], ['hat', '🎩'],
  ['sock', '🧦'], ['coat', '🧥'], ['glove', '🧤'], ['scarf', '🧣'], ['crown', '👑'],
  ['key', '🔑'], ['bell', '🔔'], ['clock', '🕐'], ['lamp', '💡'], ['pencil', '✏️'],
  ['crayon', '🖍️'], ['scissors', '✂️'], ['brush', '🖌️'], ['mirror', '🪞'], ['teddy', '🧸'],
  ['doll', '🪆'], ['blocks', '🧱'], ['puzzle', '🧩'], ['flag', '🚩'],
  ['map', '🗺️'], ['phone', '📱'], ['camera', '📷'], ['radio', '📻'], ['battery', '🔋'],
  // body & misc
  ['hand', '✋'], ['foot', '🦶'], ['eye', '👁️'], ['ear', '👂'], ['nose', '👃'],
  ['mouth', '👄'], ['hair', '💇'], ['beard', '🧔'], ['baby', '👶'], ['king', '🤴'],
  ['witch', '🧙'], ['robot', '🤖'], ['alien', '👽'], ['ghost', '👻'], ['dinosaur', '🦕'],
]

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const BUBBLE_COLORS = ['#ffb3c6', '#b3e0ff', '#ffe5a3', '#c9b3ff', '#b3ffd9']

function bubbleStyle(i) {
  const size = 18 + ((i * 37) % 46)
  return {
    width: size + 'px',
    height: size + 'px',
    left: ((i * 53) % 100) + '%',
    background: BUBBLE_COLORS[i % BUBBLE_COLORS.length],
    animationDuration: 14 + ((i * 7) % 16) + 's',
    animationDelay: -((i * 11) % 20) + 's',
  }
}

const PRAISE = [
  'You spelled it!',
  'Super spelling!',
  'What a word wizard!',
  'Letter by letter — perfect!',
  'You did it! Brilliant!',
]

const round = ref(1)
const word = ref({ text: '', emoji: '🐱' })
const blanks = ref([]) // indices needing letters, ascending
const blankPos = ref(0) // pointer into blanks
const revealed = ref(new Set())
const typed = ref('')
const lastMiss = ref(false)
const missedRound = ref(false)
const streak = ref(0)
const bestStreak = ref(store.spellBest || 0)
const totalSolved = ref(0)
const prevWord = ref('')
const prompt = ref('')
const mood = ref('happy')
const solved = ref(false)
const firstTry = ref(0)
const burst = ref(0)
const clapper = ref(null)
const origin = ref({ x: 50, y: 40 })
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

function currentBlank() {
  return blanks.value[blankPos.value]
}

function isCurrentBlank(i) {
  return i === currentBlank() && !revealed.value.has(i)
}

function isCovered(i) {
  return blanks.value.includes(i) && !revealed.value.has(i) && i !== currentBlank()
}

function tileLetter(i) {
  if (revealed.value.has(i)) return word.value.text[i]
  if (isCurrentBlank(i)) return typed.value
  if (isCovered(i)) return ''
  return word.value.text[i]
}

function buildRound() {
  solved.value = false
  typed.value = ''
  lastMiss.value = false
  missedRound.value = false
  revealed.value = new Set()
  blankPos.value = 0
  mood.value = 'happy'
  clapper.value = null

  let pickWord
  do {
    pickWord = WORDS[randInt(0, WORDS.length - 1)]
  } while (pickWord[0] === prevWord.value && WORDS.length > 1)
  prevWord.value = pickWord[0]
  word.value = { text: pickWord[0], emoji: pickWord[1] }

  // blank count comes from the grown-up "Missing letters" setting
  const len = word.value.text.length
  const mode = store.letterMode
  let count = 1
  if (mode === 'two') count = len >= 4 ? 2 : 1
  const idx = new Set()
  if (mode === 'first') idx.add(0)
  else while (idx.size < count) idx.add(randInt(0, len - 1))
  blanks.value = [...idx].sort((a, b) => a - b)

  prompt.value = 'Look at the picture. What letter is missing?'
  if (store.readAloud) speak(word.value.text)
}

function pressLetter(ch) {
  if (solved.value || finished.value) return
  const i = currentBlank()
  if (i === undefined) return
  const expected = word.value.text[i]
  if (ch === expected) {
    revealed.value = new Set([...revealed.value, i])
    typed.value = ''
    lastMiss.value = false
    streak.value++
    totalSolved.value++
    bestStreak.value = Math.max(bestStreak.value, streak.value)
    store.spellBest = bestStreak.value
    sfx.tap()
    if (blankPos.value + 1 >= blanks.value.length) {
      solveRound()
    } else {
      blankPos.value++
      sfx.chime()
    }
  } else {
    missedRound.value = true
    streak.value = 0
    lastMiss.value = true
    typed.value = ch
    sfx.wrong()
    mood.value = 'oops'
    prompt.value = 'Try again!'
    later(() => {
      if (!solved.value) {
        lastMiss.value = false
        typed.value = ''
        mood.value = 'happy'
        prompt.value = 'Look at the picture. What letter is missing?'
      }
    }, 550)
  }
}

function solveRound() {
  solved.value = true
  mood.value = 'cheer'
  clapper.value = { kind: randInt(0, 3), x: randInt(14, 86) }
  burst.value++
  origin.value = { x: 50, y: 45 }
  prompt.value = `${pick(PRAISE)} The word is ${word.value.text.toUpperCase()}!`
  if (!missedRound.value) firstTry.value++
  sfx.correct()
  later(() => sfx.sparkle(), 500)
  later(() => {
    clapper.value = null
  }, 2300)
  later(() => {
    if (round.value >= TOTAL.value) finish()
    else {
      round.value++
      buildRound()
    }
  }, 2400)
}

function finish() {
  earned.value =
    firstTry.value >= TOTAL.value * 0.8 ? 3 : firstTry.value >= TOTAL.value * 0.5 ? 2 : 1
  recordGame('spell', earned.value)
  finished.value = true
}

function restart() {
  clearTimers()
  finished.value = false
  round.value = 1
  firstTry.value = 0
  streak.value = 0
  totalSolved.value = 0
  prevWord.value = ''
  buildRound()
}

function exitGame() {
  clearTimers()
  emit('exit')
}

function onKey(e) {
  if (finished.value) return
  if (document.querySelector('.pause-scrim')) return
  if (/^[a-zA-Z]$/.test(e.key)) pressLetter(e.key.toLowerCase())
}

onBeforeUnmount(() => {
  clearTimers()
  window.removeEventListener('keydown', onKey)
})
window.addEventListener('keydown', onKey)
buildRound()
</script>

<template>
  <div class="game-root">
    <GameShell
      title="Letter Pup"
      accent="#9B72E8"
      :round="round"
      :total="TOTAL"
      :mood="mood"
      :prompt="prompt"
      @exit="exitGame"
    >
      <template #prompt>
        {{ prompt }}
      </template>

      <div class="lp-scene">
        <div class="lp-sun" />
        <div class="lp-bubbles">
          <span v-for="i in 10" :key="i" class="lp-bubble" :style="bubbleStyle(i)" />
        </div>

        <div class="lp-hills">
          <svg viewBox="0 0 900 200" preserveAspectRatio="none">
            <path d="M0 150c120-50 240-40 360-8 120 32 220-24 340-20 120 4 220 40 340 24v54H0z" fill="#9ED48F" stroke="#2C2620" stroke-width="4" vector-effect="non-scaling-stroke" />
            <path d="M0 178c140-24 260 8 400 4 140-4 260-28 400-16 80 7 160 12 200 8v26H0z" fill="#69C27B" stroke="#2C2620" stroke-width="4" vector-effect="non-scaling-stroke" />
          </svg>
        </div>

        <div class="lp-stats">
          <span class="lp-stat">Streak <b>{{ streak }}</b></span>
          <span class="lp-stat">Best <b>{{ bestStreak }}</b></span>
          <span class="lp-stat">Letters <b>{{ totalSolved }}</b></span>
        </div>

        <!-- picture + word -->
        <div class="lp-round">
          <div class="lp-picture">
            <span class="lp-emoji">{{ word.emoji }}</span>
          </div>
          <div class="lp-tiles">
            <div
              v-for="(ch, i) in word.text"
              :key="i"
              class="lp-tile"
              :class="{
                blank: isCurrentBlank(i),
                covered: isCovered(i),
                hit: revealed.has(i),
                miss: lastMiss && isCurrentBlank(i),
              }"
            >
              {{ tileLetter(i) }}
            </div>
          </div>
        </div>

        <ClapCritter v-if="clapper" :kind="clapper.kind" :x="clapper.x" />
        <Confetti :burst="burst" :origin="origin" :count="36" />
      </div>

      <template #answer>
        <div class="lp-pad">
          <div class="lp-keys">
            <button
              v-for="ch in ALPHABET"
              :key="ch"
              type="button"
              class="lp-key"
              :disabled="solved"
              @click="pressLetter(ch.toLowerCase())"
            >
              {{ ch }}
            </button>
          </div>
        </div>
      </template>
    </GameShell>

    <GameOver
      v-if="finished"
      :stars="earned"
      title="Spelling star!"
      :detail="`You spelled ${totalSolved} letters with a best streak of ${bestStreak}!`"
      accent="#9B72E8"
      @again="restart"
      @exit="exitGame"
    />
  </div>
</template>

<style scoped>
.lp-scene {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  overflow: hidden;
  background: linear-gradient(180deg, #ffd6ec 0%, #fff1e0 62%, #f3fbe8 100%);
}

.lp-sun {
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

.lp-bubbles {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.lp-bubble {
  position: absolute;
  bottom: -8%;
  border-radius: 50%;
  border: 3px solid rgba(44, 38, 32, 0.25);
  animation: lpRise linear infinite;
}

@keyframes lpRise {
  to {
    transform: translateY(-115vh);
  }
}

.lp-hills {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 26%;
}
.lp-hills svg {
  width: 100%;
  height: 100%;
}

.lp-stats {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  z-index: 5;
}

.lp-stat {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(12px, 1.6vw, 15px);
  color: var(--ink);
  background: var(--cream);
  border: 3px solid var(--ink);
  border-radius: 999px;
  padding: 4px 12px 6px;
  box-shadow: 0 3px 0 rgba(44, 38, 32, 0.25);
}
.lp-stat b {
  color: #9B72E8;
}

.lp-round {
  position: absolute;
  left: 50%;
  top: 46%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(10px, 2vw, 20px);
  z-index: 4;
}

.lp-picture {
  width: clamp(110px, 18vw, 170px);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  background: rgba(255, 253, 248, 0.85);
  border: 3px dashed var(--ink-soft);
  border-radius: 24px;
  box-shadow: 0 6px 0 rgba(44, 38, 32, 0.15);
}

.lp-emoji {
  font-size: clamp(56px, 9vw, 92px);
  line-height: 1;
  animation: bob 3s ease-in-out infinite;
}

.lp-tiles {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: clamp(6px, 1vw, 10px);
}

.lp-tile {
  min-width: clamp(38px, 6vw, 58px);
  height: clamp(46px, 7vw, 66px);
  padding: 0 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(22px, 3.4vw, 34px);
  text-transform: uppercase;
  color: var(--ink);
  background: rgba(255, 253, 248, 0.8);
  border: 3px solid var(--ink-soft);
  border-radius: 14px;
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}

.lp-tile.covered {
  background: rgba(255, 253, 248, 0.5);
  border-style: dashed;
  color: transparent;
}

.lp-tile.blank {
  background: #fff;
  border-color: #9B72E8;
  color: #9B72E8;
  animation: lpPulse 1s ease-in-out infinite;
}

.lp-tile.hit {
  border-color: var(--hit, #1f7a4d);
  color: #1f7a4d;
  background: rgba(95, 211, 154, 0.18);
}

.lp-tile.miss {
  border-color: var(--miss, #c8543f);
  color: #c8543f;
  animation: lpShake 0.3s ease;
}

@keyframes lpPulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(155, 114, 232, 0.5);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(155, 114, 232, 0);
  }
}

@keyframes lpShake {
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

/* letter pad */
.lp-pad {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.lp-keys {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
}

.lp-key {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(15px, 2vw, 20px);
  min-width: clamp(34px, 4.6vw, 46px);
  height: clamp(40px, 5.6vw, 54px);
  padding: 0 6px;
  color: var(--ink);
  background: var(--cream);
  border: 3px solid var(--ink);
  border-radius: 12px;
  box-shadow: 0 3px 0 var(--ink);
  transition: transform 0.1s ease, box-shadow 0.1s ease, background 0.12s ease;
}

.lp-key:active:not(:disabled) {
  transform: translateY(3px);
  box-shadow: 0 0 0 var(--ink);
  background: #e9dcff;
}

.lp-key:disabled {
  opacity: 0.55;
}
</style>
