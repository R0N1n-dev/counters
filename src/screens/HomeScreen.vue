<script setup>
import { ref } from 'vue'
import PipFox from '../components/PipFox.vue'
import ChompyMonster from '../components/ChompyMonster.vue'
import StarIcon from '../components/StarIcon.vue'
import GrownUpPanel from '../components/GrownUpPanel.vue'
import { store, totalStars, MAX_STARS } from '../lib/store.js'
import { sfx } from '../lib/audio.js'
import { speak } from '../lib/speak.js'

const emit = defineEmits(['play'])

const games = [
  {
    id: 'balloon',
    name: 'Balloon Pop',
    tag: 'Count the stars and pop the right balloon.',
    accent: '#F9715A',
    tint: '#DCEEF8',
  },
  {
    id: 'chompy',
    name: "Chompy's Snacks",
    tag: 'Feed the hungry monster exactly what he asks for.',
    accent: '#8FE0B0',
    tint: '#FFEFD2',
  },
  {
    id: 'firefly',
    name: 'Firefly Night',
    tag: 'Catch the glowing fireflies, then count them.',
    accent: '#8371E9',
    tint: '#232C55',
  },
  {
    id: 'story',
    name: "Pip's Storybook",
    tag: 'Count your way through an eight-page adventure.',
    accent: '#FFC93C',
    tint: '#E8F4DA',
  },
  {
    id: 'rocket',
    name: 'Rocket Countdown',
    tag: 'Type the number, then blast off into space.',
    accent: '#8AD7F2',
    tint: '#1B2450',
    isNew: true,
  },
  {
    id: 'dino',
    name: 'Dino Hatch',
    tag: 'Count the eggs, type the number and hatch a dino.',
    accent: '#A6E06F',
    tint: '#EAF6D8',
    isNew: true,
  },
  {
    id: 'feast',
    name: 'Animal Feast',
    tag: 'Count the food, type the number, feed the animals.',
    accent: '#F5A65B',
    tint: '#FFEFD2',
    isNew: true,
  },
  {
    id: 'parade',
    name: 'Number Parade',
    tag: 'Tap the numbers in order and send a friend on its way.',
    accent: '#F9715A',
    tint: '#DCEEF8',
    isNew: true,
  },
  {
    id: 'objects',
    name: 'Object Count',
    tag: 'A mixed-up meadow — count only the ones asked for.',
    accent: '#5B8DEF',
    tint: '#E3EEFF',
    isNew: true,
  },
]

const fullscreenAvailable =
  typeof document !== 'undefined' && (document.fullscreenEnabled || document.webkitFullscreenEnabled)

const settings = ref(false)

function toggleToddler() {
  store.toddler = !store.toddler
  sfx.tap()
  speak(store.toddler ? 'Toddler mode on. Counting up to five.' : 'Toddler mode off.')
}

async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.()
    else await document.exitFullscreen?.()
  } catch {
    /* browsers can refuse fullscreen; ignore */
  }
}

function play(id) {
  sfx.tap()
  emit('play', id)
}
</script>

<template>
  <div class="home">
    <div class="home-bg" aria-hidden="true">
      <div class="sun-wrap">
        <div class="sun-rays" />
        <div class="sun-body" />
      </div>
      <div class="cloud c1" />
      <div class="cloud c2" />
      <div class="cloud c3" />
      <div class="hills">
        <svg viewBox="0 0 1440 220" preserveAspectRatio="none">
          <path d="M0 150c150-60 260-40 380 0 120 40 220-46 360-40 150 6 220 62 340 46 120-16 220-60 360-20v84H0z" fill="#8FD6A0" stroke="#2C2620" stroke-width="5" vector-effect="non-scaling-stroke" />
          <path d="M0 190c170-30 300 10 450 8 170-3 260-34 410-24 150 10 240 40 380 28 90-8 150-14 200-10v28H0z" fill="#69C27B" stroke="#2C2620" stroke-width="5" vector-effect="non-scaling-stroke" />
        </svg>
      </div>
      <div class="flowers">
        <span v-for="i in 9" :key="i" class="flower" :style="{ left: 4 + i * 10 + '%', animationDelay: i * 0.3 + 's' }">
          <span class="petal p1" /><span class="petal p2" /><span class="petal p3" /><span class="petal p4" />
          <span class="flower-core" />
        </span>
      </div>
    </div>

    <header class="home-top">
      <div class="brand">
        <span class="brand-mark"><StarIcon /></span>
        <span class="brand-text">
          <b>Counting Meadow</b>
          <i>little games for little counters</i>
        </span>
      </div>
      <div class="home-top-right">
        <button
          class="icon-btn"
          type="button"
          aria-label="Grown-up settings"
          title="Grown-up settings"
          @click="settings = true"
        >
          <svg viewBox="0 0 24 24" class="ico">
            <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
            <circle cx="9" cy="7" r="2.9" fill="var(--sun)" stroke="currentColor" stroke-width="2.2" />
            <circle cx="15" cy="12" r="2.9" fill="var(--sun)" stroke="currentColor" stroke-width="2.2" />
            <circle cx="8" cy="17" r="2.9" fill="var(--sun)" stroke="currentColor" stroke-width="2.2" />
          </svg>
        </button>
        <button v-if="fullscreenAvailable" class="icon-btn" type="button" aria-label="Full screen" title="Full screen" @click="toggleFullscreen">
          <svg viewBox="0 0 24 24" class="ico"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div class="pill star-pill">
          <span class="star-mini"><StarIcon /></span>
          <b>{{ totalStars }}</b><span class="star-max">/{{ MAX_STARS }}</span>
        </div>
      </div>
    </header>

    <GrownUpPanel v-if="settings" close-label="Back to the meadow" @close="settings = false" />

    <main class="home-main">
      <section class="hero">
        <div class="hero-text">
          <h1 class="home-title">
            <span class="title-line">Counting</span>
            <span class="title-line two">Meadow</span>
          </h1>
          <p class="home-sub">Nine playful counting games, hand-drawn and full of surprises.</p>
          <div class="hero-badges">
            <span class="badge">Ages 2–6</span>
            <span class="badge">{{ store.toddler ? 'Numbers 1–5' : 'Numbers 1–10' }}</span>
            <button
              type="button"
              class="mode-toggle"
              :class="{ on: store.toddler }"
              :aria-pressed="store.toddler"
              @click="toggleToddler"
            >
              <span class="knob" />
              <span>1–5 toddler mode</span>
            </button>
          </div>
        </div>
        <div class="hero-pip">
          <div class="pip-bubble">Pick a game!</div>
          <div class="pip-art"><PipFox mood="happy" /></div>
        </div>
      </section>

      <section class="game-grid">
        <button
          v-for="(g, i) in games"
          :key="g.id"
          type="button"
          class="game-card"
          :class="g.id"
          :style="{ '--accent': g.accent, '--tint': g.tint, animationDelay: 0.06 + i * 0.05 + 's' }"
          @click="play(g.id)"
        >
          <div class="card-art">
            <span v-if="g.isNew" class="card-new">new</span>

            <!-- balloon -->
            <svg v-if="g.id === 'balloon'" viewBox="0 0 220 130" class="art art-balloon">
              <g class="mini-balloon mb1"><ellipse cx="0" cy="0" rx="24" ry="29" fill="#F9715A" stroke="#2C2620" stroke-width="3.4" /><path d="M-6 27l6 8 6-8z" fill="#F9715A" stroke="#2C2620" stroke-width="3" /></g>
              <g class="mini-balloon mb2"><ellipse cx="0" cy="0" rx="21" ry="26" fill="#FFC93C" stroke="#2C2620" stroke-width="3.4" /><path d="M-6 24l6 8 6-8z" fill="#FFC93C" stroke="#2C2620" stroke-width="3" /></g>
              <g class="mini-balloon mb3"><ellipse cx="0" cy="0" rx="25" ry="30" fill="#8AD7F2" stroke="#2C2620" stroke-width="3.4" /><path d="M-6 28l6 8 6-8z" fill="#8AD7F2" stroke="#2C2620" stroke-width="3" /></g>
              <g fill="#FFFAEC" stroke="#2C2620" stroke-width="2">
                <path transform="translate(34 54) scale(.5)" d="M12 1.6l3.2 6.6 7.2 1-5.2 5.1 1.2 7.2-6.4-3.4-6.4 3.4 1.2-7.2L1.6 9.2l7.2-1z" />
                <path transform="translate(54 30) scale(.5)" d="M12 1.6l3.2 6.6 7.2 1-5.2 5.1 1.2 7.2-6.4-3.4-6.4 3.4 1.2-7.2L1.6 9.2l7.2-1z" />
              </g>
            </svg>

            <!-- chompy -->
            <div v-else-if="g.id === 'chompy'" class="art art-chompy">
              <div class="chompy-mini"><ChompyMonster mood="idle" /></div>
              <div class="mini-berry" />
            </div>

            <!-- firefly -->
            <div v-else-if="g.id === 'firefly'" class="art art-firefly">
              <span class="ffmoon" />
              <span v-for="i in 6" :key="i" class="ffdot" :style="{ left: 12 + i * 14 + '%', top: 22 + ((i * 37) % 46) + '%', animationDelay: i * 0.4 + 's' }" />
              <span class="ffjar" />
            </div>

            <!-- rocket -->
            <div v-else-if="g.id === 'rocket'" class="art art-rocket">
              <span v-for="i in 8" :key="i" class="rk-star" :style="{ left: (i * 23) % 94 + '%', top: (i * 37) % 74 + '%', animationDelay: i * 0.3 + 's' }" />
              <span class="rk-planet" />
              <svg viewBox="0 0 100 170" class="rk-ship">
                <g class="rk-flame">
                  <path d="M50 140c-9 6-12 18-7 26 2 4 5 7 7 7s5-3 7-7c5-8 2-20-7-26z" fill="#FFC93C" />
                </g>
                <path d="M28 112c-9 5-12 15-12 26l12-6z" fill="#F9715A" stroke="#2C2620" stroke-width="3" stroke-linejoin="round" />
                <path d="M72 112c9 5 12 15 12 26l-12-6z" fill="#F9715A" stroke="#2C2620" stroke-width="3" stroke-linejoin="round" />
                <path d="M50 8c13 16 20 38 20 66v44c0 6-5 10-10 10H40c-5 0-10-4-10-10V74C30 46 37 24 50 8z" fill="#FFF6E4" stroke="#2C2620" stroke-width="3.4" />
                <path d="M50 6c12 15 19 32 20 48H30c1-16 8-33 20-48z" fill="#F9715A" stroke="#2C2620" stroke-width="3.4" stroke-linejoin="round" />
                <circle cx="50" cy="76" r="15" fill="#9ADCF4" stroke="#2C2620" stroke-width="3.2" />
                <circle cx="46" cy="74" r="2.2" fill="#2C2620" />
                <circle cx="54" cy="74" r="2.2" fill="#2C2620" />
                <path d="M46 81q4 4 8 0" fill="none" stroke="#2C2620" stroke-width="2" stroke-linecap="round" />
              </svg>
            </div>

            <!-- dino -->
            <div v-else-if="g.id === 'dino'" class="art art-dino">
              <span class="dn-leaf l" />
              <span class="dn-leaf r" />
              <svg viewBox="0 0 140 120" class="dn-baby">
                <path d="M40 62c-7-9-3-16 4-14s9 9 5 14" fill="#7CCB88" stroke="#2C2620" stroke-width="2.6" />
                <path d="M56 54c-5-9 0-16 6-13s7 11 3 14" fill="#7CCB88" stroke="#2C2620" stroke-width="2.6" />
                <path d="M72 62c7-9 3-16-4-14s-9 9-5 14" fill="#7CCB88" stroke="#2C2620" stroke-width="2.6" />
                <circle cx="56" cy="76" r="26" fill="#96DCA8" stroke="#2C2620" stroke-width="3.4" />
                <circle cx="46" cy="72" r="7" fill="#FFFBF0" stroke="#2C2620" stroke-width="2.2" />
                <circle cx="66" cy="72" r="7" fill="#FFFBF0" stroke="#2C2620" stroke-width="2.2" />
                <circle cx="47" cy="74" r="3" fill="#2C2620" />
                <circle cx="65" cy="74" r="3" fill="#2C2620" />
                <path d="M50 86q6 6 12 0" fill="none" stroke="#2C2620" stroke-width="2.4" stroke-linecap="round" />
              </svg>
              <svg viewBox="0 0 64 80" class="dn-egg">
                <ellipse cx="32" cy="44" rx="23" ry="30" fill="#FFF3D6" stroke="#2C2620" stroke-width="3.4" />
                <circle cx="40" cy="34" r="4.4" fill="#F5A65B" />
                <circle cx="28" cy="52" r="5" fill="#8FE0B0" />
                <path d="M18 40l8 7-6 7 10 5" fill="none" stroke="#2C2620" stroke-width="2.4" stroke-linejoin="round" />
              </svg>
            </div>

            <!-- animal feast -->
            <div v-else-if="g.id === 'feast'" class="art art-feast">
              <svg viewBox="0 0 220 130">
                <circle cx="168" cy="62" r="40" fill="#D9822B" stroke="#2C2620" stroke-width="3.4" />
                <circle cx="168" cy="66" r="24" fill="#F7C873" stroke="#2C2620" stroke-width="3" />
                <circle cx="160" cy="62" r="3" fill="#2C2620" />
                <circle cx="176" cy="62" r="3" fill="#2C2620" />
                <path d="M163 74q5 4 10 0" fill="none" stroke="#2C2620" stroke-width="2.2" stroke-linecap="round" />
                <g transform="translate(34 74)">
                  <path d="M-16 6c-5-1-7-6-3-9 3-2 8-2 9 1l2 3c3-3 8-3 9 1 1 4-3 6-7 6h-9c-3 0-5-1-6-2z" fill="#F5A65B" stroke="#2C2620" stroke-width="2.6" stroke-linejoin="round" />
                  <rect x="-2" y="8" width="11" height="5" rx="2.5" fill="#FFF3D6" stroke="#2C2620" stroke-width="2.2" transform="rotate(-25 3 10)" />
                </g>
                <g transform="translate(72 92) scale(.9)">
                  <rect x="-4" y="-16" width="8" height="22" rx="4" fill="#69C27B" stroke="#2C2620" stroke-width="2.4" />
                  <path d="M4 -14c6-4 9-3 10 1-4 3-8 3-10-1z" fill="#8FE0B0" stroke="#2C2620" stroke-width="2" />
                </g>
                <g transform="translate(104 96)">
                  <path d="M-8 2c4 3 12 3 16 0-4-4-12-4-16 0z" fill="#8AD7F2" stroke="#2C2620" stroke-width="2.4" />
                  <path d="M8 0l7-5v10z" fill="#8AD7F2" stroke="#2C2620" stroke-width="2.2" />
                </g>
              </svg>
            </div>

            <!-- number parade -->
            <div v-else-if="g.id === 'parade'" class="art art-parade">
              <svg viewBox="0 0 220 130">
                <g class="np-mini-car">
                  <circle cx="66" cy="92" r="9" fill="#3A3630" stroke="#2C2620" stroke-width="2.6" />
                  <circle cx="98" cy="92" r="9" fill="#3A3630" stroke="#2C2620" stroke-width="2.6" />
                  <path d="M52 74c0-6 5-10 12-11l10-9c3-3 8-3 11 0l15 9h19c6 0 11 4 11 9v5z" fill="#F9715A" stroke="#2C2620" stroke-width="3" stroke-linejoin="round" />
                  <path d="M76 56l9-7c2-2 5-2 7 0l12 7z" fill="#9ADCF4" stroke="#2C2620" stroke-width="2.4" stroke-linejoin="round" />
                </g>
                <g fill="#FFFBF0" stroke="#2C2620" stroke-width="2.6">
                  <circle cx="40" cy="34" r="13" />
                  <circle cx="70" cy="22" r="13" />
                  <circle cx="100" cy="34" r="13" />
                </g>
                <g fill="#2C2620" font-family="var(--font-display)" font-weight="800" font-size="14" text-anchor="middle">
                  <text x="40" y="39">2</text>
                  <text x="70" y="27">5</text>
                  <text x="100" y="39">7</text>
                </g>
                <path d="M130 96h70" stroke="#2C2620" stroke-width="4" stroke-linecap="round" stroke-dasharray="10 8" opacity=".5" />
              </svg>
            </div>

            <!-- object count -->
            <div v-else-if="g.id === 'objects'" class="art art-objects">
              <svg viewBox="0 0 220 130">
                <g transform="translate(40 66)">
                  <path d="M0-14c-7-4-14 1-14 9 0 8 6 14 14 14s14-6 14-14c0-8-7-13-14-9z" fill="#F0455F" stroke="#2C2620" stroke-width="3" stroke-linejoin="round" transform="scale(1.1)" />
                  <path d="M0-14c0-4 2-6 4-8" fill="none" stroke="#7A4A31" stroke-width="2.4" stroke-linecap="round" />
                </g>
                <g transform="translate(78 78)">
                  <path d="M-16 4c0-5 4-8 9-9l5-7c2-2 5-2 7 0l8 7h10c4 0 7 3 7 6v3z" fill="#58A86C" stroke="#2C2620" stroke-width="2.6" stroke-linejoin="round" />
                  <path d="M-8-8l3-5h4l3 5z" fill="#9ADCF4" stroke="#2C2620" stroke-width="2" stroke-linejoin="round" />
                  <circle cx="-9" cy="8" r="4" fill="#3A3630" stroke="#2C2620" stroke-width="2.2" />
                  <circle cx="7" cy="8" r="4" fill="#3A3630" stroke="#2C2620" stroke-width="2.2" />
                </g>
                <g transform="translate(120 60)">
                  <path d="M0 10l3.4 7 7.6 1-5.5 5.4 1.3 7.6-6.8-3.6-6.8 3.6 1.3-7.6-5.5-5.4 7.6-1z" fill="#FFC93C" stroke="#2C2620" stroke-width="2.6" stroke-linejoin="round" transform="translate(0 -14) scale(.95)" />
                </g>
                <g transform="translate(160 80)">
                  <ellipse cx="-6" cy="2" rx="11" ry="8" fill="#3BB5AC" stroke="#2C2620" stroke-width="2.6" />
                  <circle cx="7" cy="-8" r="6" fill="#3BB5AC" stroke="#2C2620" stroke-width="2.6" />
                  <path d="M12-9l6 2-6 3z" fill="#F59B3F" stroke="#2C2620" stroke-width="2" stroke-linejoin="round" />
                </g>
              </svg>
            </div>

            <!-- storybook -->
            <div v-else class="art art-story">
              <svg viewBox="0 0 220 130">
                <path d="M110 34c-18-14-46-16-74-10v78c28-6 56-4 74 10 18-14 46-16 74-10V24c-28-6-56-4-74 10z" fill="#FFF6DF" stroke="#2C2620" stroke-width="3.6" stroke-linejoin="round" />
                <path d="M110 34v78" stroke="#2C2620" stroke-width="3" />
                <path d="M52 46c14-4 28-4 44 2M52 60c14-4 28-4 44 2M52 74c14-4 28-4 44 2" stroke="#C9B79C" stroke-width="3.4" stroke-linecap="round" />
                <g transform="translate(156 74) scale(0.72)">
                  <ellipse cx="0" cy="14" rx="25" ry="16" fill="#FFF6DF" stroke="#2C2620" stroke-width="3.4" />
                  <circle cx="14" cy="-8" r="15" fill="#FFF6DF" stroke="#2C2620" stroke-width="3.4" />
                  <path d="M28 -8h10c2 0 2 4 0 5l-10 3z" fill="#F5A623" stroke="#2C2620" stroke-width="3" />
                  <circle cx="17" cy="-12" r="3.2" fill="#2C2620" />
                </g>
                <g class="mini-star"><path transform="translate(60 16) scale(.8)" d="M12 1.6l3.2 6.6 7.2 1-5.2 5.1 1.2 7.2-6.4-3.4-6.4 3.4 1.2-7.2L1.6 9.2l7.2-1z" fill="#FFC93C" stroke="#2C2620" stroke-width="2" /></g>
              </svg>
            </div>

            <span class="card-index">{{ String(i + 1).padStart(2, '0') }}</span>
          </div>

          <div class="card-body">
            <h3>{{ g.name }}</h3>
            <p>{{ g.tag }}</p>
            <div class="card-foot">
              <span class="play-cta">
                Play
                <svg viewBox="0 0 24 24" class="cta-arrow"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>
              <span class="card-stars" :aria-label="`${store.best[g.id]} of 3 stars`">
                <span v-for="n in 3" :key="n" class="cs"><StarIcon :filled="n <= store.best[g.id]" color="#FFC93C" /></span>
              </span>
            </div>
          </div>
        </button>
      </section>

      <footer class="home-foot">
        <span>Made for little hands · play with sound on</span>
        <span class="foot-dot" />
        <span>Tap the speaker on any game to hear it read aloud</span>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.home {
  position: relative;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  overflow-x: hidden;
  background: linear-gradient(180deg, #d9f2fb 0%, #f2fbf3 42%, #fdf4e3 100%);
}

/* ---------- backdrop ---------- */
.home-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.sun-wrap {
  position: absolute;
  top: 4%;
  right: 6%;
  width: clamp(90px, 12vw, 150px);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
}

.sun-rays {
  position: absolute;
  inset: -32%;
  background: repeating-conic-gradient(
    from 0deg,
    rgba(255, 201, 60, 0.5) 0deg 5deg,
    transparent 5deg 22deg
  );
  border-radius: 50%;
  animation: sunRays 70s linear infinite;
  mask-image: radial-gradient(circle, #000 34%, transparent 72%);
  -webkit-mask-image: radial-gradient(circle, #000 34%, transparent 72%);
}

.sun-body {
  position: absolute;
  inset: 14%;
  border-radius: 50%;
  background: var(--sun);
  border: 4px solid var(--ink);
  box-shadow: 0 8px 0 rgba(44, 38, 32, 0.16);
  animation: bob 7s ease-in-out infinite;
}

.cloud {
  position: absolute;
  height: clamp(22px, 3vw, 34px);
  background: #fffdf6;
  border: 3.5px solid var(--ink);
  border-radius: 999px;
  opacity: 0.9;
}
.cloud::before,
.cloud::after {
  content: '';
  position: absolute;
  background: inherit;
  border: inherit;
  border-radius: 50%;
  bottom: 50%;
}
.cloud::before {
  width: 58%;
  aspect-ratio: 1;
  left: 12%;
  margin-bottom: -5px;
}
.cloud::after {
  width: 40%;
  aspect-ratio: 1;
  right: 12%;
  margin-bottom: -3px;
}
.cloud.c1 {
  width: 130px;
  left: 6%;
  top: 16%;
  animation: drift 54s linear infinite;
}
.cloud.c2 {
  width: 100px;
  left: 0;
  top: 34%;
  opacity: 0.72;
  animation: drift 74s linear infinite;
  animation-delay: -30s;
}
.cloud.c3 {
  width: 150px;
  left: 0;
  top: 6%;
  opacity: 0.6;
  animation: drift 90s linear infinite;
  animation-delay: -60s;
}

.hills {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: clamp(120px, 20vh, 200px);
}
.hills svg {
  width: 100%;
  height: 100%;
}

.flowers {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 2%;
  height: 0;
}
.flower {
  position: absolute;
  bottom: 0;
  width: 14px;
  height: 14px;
  animation: sway 3.6s ease-in-out infinite;
  transform-origin: bottom center;
}
.petal {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #fff8ea;
  border: 1.5px solid var(--ink);
}
.petal.p1 {
  left: 3px;
  top: -3px;
}
.petal.p2 {
  left: -2px;
  top: 2px;
  background: #ffe08a;
}
.petal.p3 {
  left: 8px;
  top: 2px;
  background: #ffe08a;
}
.petal.p4 {
  left: 3px;
  top: 7px;
  background: #ffd0c6;
}
.flower-core {
  position: absolute;
  left: 4.5px;
  top: 3.5px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--sun);
}

/* ---------- top bar ---------- */
.home-top {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px clamp(12px, 3vw, 34px) 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}

.brand-mark {
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
  animation: wiggle 3.4s ease-in-out infinite;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.05;
  min-width: 0;
}
.brand-text b {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 800;
  white-space: nowrap;
}
.brand-text i {
  font-style: normal;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-soft);
  font-weight: 800;
  white-space: nowrap;
}

.home-top-right {
  display: flex;
  align-items: center;
  gap: 7px;
}

.ico {
  width: 19px;
  height: 19px;
}

.icon-btn {
  width: 42px;
  height: 42px;
}

.star-mini {
  width: 17px;
  height: 17px;
  display: inline-block;
}

.star-max {
  color: var(--ink-soft);
  font-weight: 700;
  font-size: 0.85em;
}

/* ---------- hero ---------- */
.home-main {
  position: relative;
  z-index: 2;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: clamp(8px, 1.6vh, 16px);
  width: 100%;
  max-width: 1140px;
  margin: 0 auto;
  padding: clamp(8px, 1.8vh, 22px) clamp(12px, 3vw, 34px) 12px;
}

.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding-top: clamp(2px, 1vh, 12px);
}

.hero-text {
  min-width: 0;
}

.home-title {
  display: flex;
  flex-direction: column;
  gap: 0;
  font-size: clamp(42px, 7.6vw, 88px);
  line-height: 0.86;
  letter-spacing: -0.03em;
  color: var(--ink);
}

.title-line {
  display: inline-block;
  animation: dropIn 0.7s cubic-bezier(0.2, 1.3, 0.4, 1) backwards;
}

.title-line.two {
  color: var(--meadow-d);
  transform: rotate(-1.4deg);
  padding-left: 0.08em;
  animation-delay: 0.1s;
}

.home-sub {
  margin-top: 10px;
  font-size: clamp(12.5px, 1.5vw, 16px);
  font-weight: 800;
  color: var(--ink-soft);
  max-width: 36ch;
}

.hero-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.mode-toggle {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 10.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: rgba(255, 250, 240, 0.85);
  border: 2.5px solid var(--ink);
  border-radius: 999px;
  padding: 3px 11px 3px 4px;
  box-shadow: 0 2.5px 0 rgba(44, 38, 32, 0.22);
  transition: background 0.2s ease;
}

.mode-toggle .knob {
  position: relative;
  width: 26px;
  height: 14px;
  border-radius: 999px;
  background: #e4d5bb;
  border: 2px solid var(--ink);
  transition: background 0.2s ease;
}

.mode-toggle .knob::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 1px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cream);
  border: 1.5px solid var(--ink);
  transform: translateY(-50%);
  transition: left 0.2s ease;
}

.mode-toggle.on {
  background: var(--mint);
}

.mode-toggle.on .knob {
  background: var(--mint-d);
}

.mode-toggle.on .knob::after {
  left: 13px;
}

.badge {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: rgba(255, 250, 240, 0.8);
  border: 2.5px solid var(--ink);
  border-radius: 999px;
  padding: 3px 10px;
  box-shadow: 0 2.5px 0 rgba(44, 38, 32, 0.2);
}

.hero-pip {
  position: relative;
  flex: 0 0 auto;
  width: clamp(100px, 13vw, 170px);
  align-self: flex-end;
  padding-bottom: 4px;
}

.pip-art {
  width: 100%;
  aspect-ratio: 1;
  filter: drop-shadow(0 8px 0 rgba(44, 38, 32, 0.12));
}

.pip-bubble {
  position: absolute;
  right: 78%;
  top: 4%;
  white-space: nowrap;
  background: var(--cream);
  border: 3px solid var(--ink);
  border-radius: 16px;
  padding: 6px 12px 8px;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(12px, 1.3vw, 15px);
  box-shadow: 0 4px 0 rgba(44, 38, 32, 0.2);
  animation: bobSm 3s ease-in-out infinite;
}

.pip-bubble::after {
  content: '';
  position: absolute;
  right: -8px;
  top: 52%;
  width: 13px;
  height: 13px;
  background: var(--cream);
  border-right: 3px solid var(--ink);
  border-bottom: 3px solid var(--ink);
  transform: translateY(-50%) rotate(-45deg);
  border-bottom-right-radius: 3px;
}

/* ---------- cards ---------- */
.game-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(10px, 1.4vw, 16px);
}

.game-card {
  position: relative;
  display: flex;
  flex-direction: column;
  text-align: left;
  background: var(--cream);
  border: var(--line);
  border-radius: 24px;
  box-shadow: 0 7px 0 rgba(44, 38, 32, 0.22);
  overflow: hidden;
  padding: 0;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  animation: riseFade 0.55s cubic-bezier(0.2, 1.2, 0.4, 1) backwards;
}

.game-card:hover {
  transform: translateY(-6px) rotate(-0.8deg);
  box-shadow: 0 13px 0 rgba(44, 38, 32, 0.2);
}

.game-card:active {
  transform: translateY(2px);
  box-shadow: 0 4px 0 rgba(44, 38, 32, 0.24);
}

.card-art {
  position: relative;
  height: clamp(88px, 14vh, 132px);
  background: var(--tint);
  border-bottom: var(--line);
  overflow: hidden;
}

.card-new {
  position: absolute;
  left: 8px;
  top: 8px;
  z-index: 4;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 9.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #fffaf0;
  background: var(--berry);
  border: 2.5px solid var(--ink);
  border-radius: 999px;
  padding: 1px 7px 2px;
  transform: rotate(-6deg);
  box-shadow: 0 2px 0 var(--ink);
}

.card-index {
  position: absolute;
  right: 9px;
  top: 7px;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 12px;
  color: rgba(44, 38, 32, 0.55);
  background: rgba(255, 250, 240, 0.75);
  border-radius: 999px;
  padding: 0 7px;
  line-height: 1.5;
}

.art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.mini-balloon {
  animation: floaty 4.4s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: center;
}
.mb1 {
  transform: translate(48px, 64px);
  animation-delay: 0.2s;
}
.mb2 {
  transform: translate(158px, 48px);
  animation-delay: -1.2s;
}
.mb3 {
  transform: translate(108px, 94px);
  animation-delay: -2.4s;
}

.art-chompy {
  display: grid;
  place-items: center;
}

.chompy-mini {
  position: absolute;
  width: 112px;
  height: 112px;
  bottom: -14px;
  right: 6%;
  animation: bob 3s ease-in-out infinite;
}

.mini-berry {
  position: absolute;
  left: 16%;
  top: 30%;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #f0455f;
  border: 2.6px solid var(--ink);
  animation: hop 2.4s ease-in-out infinite;
  box-shadow: 0 2px 0 rgba(44, 38, 32, 0.2);
}
.mini-berry::after {
  content: '';
  position: absolute;
  left: 50%;
  top: -6px;
  width: 10px;
  height: 7px;
  background: #69c27b;
  border: 2px solid var(--ink);
  border-radius: 50% 50% 0 0;
  transform: translateX(-50%) rotate(-12deg);
}

.art-firefly {
  background: linear-gradient(180deg, #1b2447, #38447d);
}

.ffmoon {
  position: absolute;
  right: 12%;
  top: 12%;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #fff6d8;
  border: 2.6px solid var(--ink);
  box-shadow: 0 0 16px rgba(255, 246, 216, 0.7);
}

.ffdot {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ffe066;
  box-shadow: 0 0 10px rgba(255, 224, 102, 0.95);
  animation: twinkle 2.4s ease-in-out infinite;
}

.ffjar {
  position: absolute;
  left: 12%;
  bottom: 8%;
  width: 26px;
  height: 34px;
  border: 2.6px solid #fff6d8;
  border-radius: 6px 6px 9px 9px;
  background: rgba(255, 246, 216, 0.16);
}
.ffjar::before {
  content: '';
  position: absolute;
  left: 4px;
  top: -7px;
  right: 4px;
  height: 6px;
  background: #c98d5c;
  border: 2px solid var(--ink);
  border-radius: 3px;
}

.art-rocket {
  background: radial-gradient(120% 90% at 70% 10%, #2a3670 0%, #141d42 50%, #0b1130 100%);
}

.rk-star {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #fff8d8;
  animation: twinkle 3.4s ease-in-out infinite;
}

.rk-planet {
  position: absolute;
  left: 9%;
  top: 16%;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: radial-gradient(circle at 34% 30%, #d7a4ff, #8a5bd8);
  border: 2.6px solid #0b1130;
  box-shadow: 0 0 0 4px rgba(232, 199, 255, 0.18);
}

.rk-ship {
  position: absolute;
  right: 20%;
  top: 8%;
  width: 44%;
  height: 110%;
  animation: bob 3.4s ease-in-out infinite;
}

.rk-flame {
  animation: flameFlicker 0.16s steps(2, end) infinite;
  transform-box: fill-box;
}

.art-dino {
  background: linear-gradient(180deg, #eaf6d8, #cfe9b8);
}

.dn-leaf {
  position: absolute;
  width: 54px;
  height: 26px;
  background: #69c27b;
  border: 3px solid var(--ink);
  border-radius: 60% 0 60% 0;
}
.dn-leaf.l {
  left: -12px;
  top: -6px;
  transform: rotate(18deg);
}
.dn-leaf.r {
  right: -12px;
  bottom: -6px;
  transform: rotate(-160deg);
}

.dn-baby {
  position: absolute;
  left: 12%;
  bottom: 6%;
  width: 44%;
  height: auto;
  animation: bobSm 2.6s ease-in-out infinite;
}

.dn-egg {
  position: absolute;
  right: 14%;
  bottom: 4%;
  width: 26%;
  height: auto;
  transform: rotate(6deg);
  animation: wiggle 2.4s ease-in-out infinite;
}

.art-story {
  background: #e8f4da;
}

.mini-star {
  animation: twinkle 2.8s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: center;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px 12px;
  flex: 1 1 auto;
}

.card-body h3 {
  font-size: clamp(15px, 1.6vw, 19px);
  font-weight: 800;
}

.card-body p {
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
  color: var(--ink-soft);
  flex: 1 1 auto;
}

.card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 3px;
}

.play-cta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 12.5px;
  background: var(--accent);
  color: var(--ink);
  border: 2.5px solid var(--ink);
  border-radius: 999px;
  padding: 2px 9px 3px;
  box-shadow: 0 2.5px 0 var(--ink);
  transition: transform 0.15s ease;
}

.game-card:hover .play-cta {
  transform: translateX(2px) rotate(-2deg);
}

.cta-arrow {
  width: 13px;
  height: 13px;
}

.card-stars {
  display: flex;
  gap: 1px;
}

.cs {
  width: 15px;
  height: 15px;
  display: block;
}

/* ---------- footer ---------- */
.home-foot {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 11px;
  font-weight: 800;
  color: var(--ink-soft);
  padding: 0 0 2px;
}

.foot-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--ink-soft);
  opacity: 0.5;
}

@media (max-width: 900px) {
  .game-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .hero-pip {
    width: 112px;
  }
}

/* tablet landscape: six cards still fit in two rows */
@media (min-width: 601px) and (max-width: 900px) {
  .game-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* short screens: shrink the landing page so it still fits */
@media (max-height: 800px) {
  .home-main {
    gap: 9px;
    padding-top: 4px;
  }
  .home-title {
    font-size: clamp(34px, 6.4vw, 54px);
  }
  .home-sub {
    margin-top: 7px;
    font-size: 12px;
  }
  .hero-badges {
    margin-top: 7px;
  }
  .hero {
    padding-top: 0;
  }
  .card-art {
    height: 78px;
  }
  .card-body {
    padding: 8px 11px 9px;
    gap: 2px;
  }
  .card-body h3 {
    font-size: 15px;
  }
  .card-body p {
    font-size: 11px;
  }
  .home-foot {
    display: none;
  }
  .hero-badges .badge:nth-child(3) {
    display: none;
  }
}

@media (max-width: 640px) {
  .brand-text i {
    display: none;
  }
  .icon-btn {
    width: 38px;
    height: 38px;
  }
  .star-pill {
    padding-right: 8px;
  }
  .card-art {
    height: 66px;
  }
  .card-body {
    padding: 7px 9px 8px;
    gap: 2px;
  }
  .card-body h3 {
    font-size: 13.5px;
  }
  .card-body p {
    display: none;
  }
  .play-cta {
    font-size: 11px;
    padding: 1px 7px 2px;
  }
  .cs {
    width: 13px;
    height: 13px;
  }
  .card-index {
    font-size: 10px;
    padding: 0 5px;
  }
  .pip-bubble {
    display: none;
  }
  .hero-pip {
    width: 84px;
  }
  .home-sub {
    font-size: 12px;
  }
  .badge {
    font-size: 9.5px;
    padding: 2px 8px;
  }
  .dn-baby {
    width: 50%;
  }
}

@media (max-width: 380px) {
  .brand-text {
    display: none;
  }
}
</style>
