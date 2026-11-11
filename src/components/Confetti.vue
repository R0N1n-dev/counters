<script setup>
import { ref, watch } from 'vue'
import { randInt, pick } from '../lib/fx.js'

const props = defineProps({
  burst: { type: Number, default: 0 },
  count: { type: Number, default: 26 },
  origin: { type: Object, default: () => ({ x: 50, y: 50 }) },
  mode: { type: String, default: 'burst' }, // burst | rain
})

const COLORS = ['#F9715A', '#FFC93C', '#8FE0B0', '#9ADCF4', '#EC5B84', '#8371E9', '#F5A623']
const parts = ref([])

function spawn() {
  const list = []
  const n = props.count
  for (let i = 0; i < n; i++) {
    const rain = props.mode === 'rain'
    const x = rain ? randInt(2, 98) : props.origin.x + (Math.random() * 8 - 4)
    const y = rain ? randInt(-14, 2) : props.origin.y
    list.push({
      id: i + '-' + Math.random(),
      x,
      y,
      dx: randInt(-130, 130),
      dy: rain ? randInt(20, 90) : randInt(-180, -40),
      rot: randInt(-540, 540),
      size: randInt(8, 16),
      color: pick(COLORS),
      shape: pick(['circle', 'square', 'tri', 'star']),
      delay: (rain ? Math.random() * 1.1 : Math.random() * 0.18).toFixed(2),
      dur: (rain ? 1.5 + Math.random() * 1.2 : 1.0 + Math.random() * 0.5).toFixed(2),
    })
  }
  parts.value = list
  window.setTimeout(() => (parts.value = []), 3200)
}

watch(
  () => props.burst,
  (v) => {
    if (v > 0) spawn()
  },
)
</script>

<template>
  <div class="confetti" aria-hidden="true">
    <div
      v-for="p in parts"
      :key="p.id"
      class="bit"
      :class="'shape-' + p.shape"
      :style="{
        left: p.x + '%',
        top: p.y + '%',
        width: p.size + 'px',
        height: p.size + 'px',
        background: p.shape === 'triangle' ? 'transparent' : p.color,
        '--dx': p.dx + 'px',
        '--dy': p.dy + 'px',
        '--rot': p.rot + 'deg',
        '--dur': p.dur + 's',
        '--delay': p.delay + 's',
        '--c': p.color,
      }"
    />
  </div>
</template>

<style scoped>
.confetti {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 35;
}

.bit {
  position: absolute;
  border-radius: 3px;
  animation: fly var(--dur) cubic-bezier(0.2, 0.7, 0.4, 1) var(--delay) forwards;
  opacity: 0;
}

.shape-circle {
  border-radius: 50%;
}

.shape-square {
  border-radius: 2px;
}

.shape-triangle {
  width: 0 !important;
  height: 0 !important;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-bottom: 12px solid var(--c);
  border-radius: 0;
  background: transparent !important;
}

.shape-star {
  background: var(--c) !important;
  clip-path: polygon(50% 0%, 62% 36%, 100% 38%, 70% 60%, 82% 100%, 50% 76%, 18% 100%, 30% 60%, 0% 38%, 38% 36%);
  border-radius: 1px;
}

@keyframes fly {
  0% {
    opacity: 1;
    transform: translate(0, 0) rotate(0) scale(1);
  }
  55% {
    opacity: 1;
    transform: translate(calc(var(--dx) * 0.8), var(--dy)) rotate(calc(var(--rot) * 0.6))
      scale(1.05);
  }
  100% {
    opacity: 0;
    transform: translate(var(--dx), calc(var(--dy) + 340px)) rotate(var(--rot)) scale(0.8);
  }
}
</style>
