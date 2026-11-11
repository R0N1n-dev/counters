import { reactive, watch, computed } from 'vue'

const KEY = 'counting-meadow-v1'
const GAME_IDS = ['balloon', 'chompy', 'firefly', 'story', 'rocket', 'dino', 'feast', 'parade', 'objects']

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') || {}
  } catch {
    return {}
  }
}

const saved = load()

function bestMap() {
  const out = {}
  for (const id of GAME_IDS) out[id] = saved.best?.[id] || 0
  return out
}

export const store = reactive({
  sound: saved.sound !== false,
  readAloud: saved.readAloud !== false,
  // toddler mode keeps every count at five or below and offers only 1-5 answers
  toddler: saved.toddler === true,
  // stages per game: 5 up to 50
  rounds: [5, 10, 15, 25, 50].includes(saved.rounds) ? saved.rounds : 5,
  best: bestMap(),
})

watch(
  store,
  (v) => {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          sound: v.sound,
          readAloud: v.readAloud,
          toddler: v.toddler,
          rounds: v.rounds,
          best: { ...v.best },
        }),
      )
    } catch {
      /* private mode — stars just won't persist */
    }
  },
  { deep: true },
)

export const totalStars = computed(() => GAME_IDS.reduce((sum, id) => sum + (store.best[id] || 0), 0))

export const MAX_STARS = GAME_IDS.length * 3

export function recordGame(id, stars) {
  store.best[id] = Math.max(store.best[id] || 0, stars)
}

export function toggleSound() {
  store.sound = !store.sound
}
