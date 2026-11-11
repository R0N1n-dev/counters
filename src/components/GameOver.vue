<script setup>
import { ref, onMounted, nextTick } from 'vue'
import PipFox from './PipFox.vue'
import Confetti from './Confetti.vue'
import StarIcon from './StarIcon.vue'
import { sfx } from '../lib/audio.js'

const props = defineProps({
  stars: { type: Number, default: 1 },
  title: { type: String, default: 'You did it!' },
  detail: { type: String, default: '' },
  accent: { type: String, default: '#FFC93C' },
})

defineEmits(['again', 'exit'])

const burst = ref(0)

onMounted(() => {
  sfx.win()
  nextTick(() => {
    burst.value++
    window.setTimeout(() => (burst.value++), 700)
  })
})
</script>

<template>
  <div class="overlay">
    <Confetti :burst="burst" :count="46" mode="rain" />
    <div class="over-card">
      <div class="over-pip"><PipFox mood="cheer" /></div>
      <h2 class="over-title">{{ title }}</h2>
      <p v-if="detail" class="over-detail">{{ detail }}</p>

      <div class="over-stars">
        <div
          v-for="i in 3"
          :key="i"
          class="over-star"
          :class="{ on: i <= stars }"
          :style="{ animationDelay: 0.25 + i * 0.17 + 's' }"
        >
          <StarIcon :filled="i <= stars" />
        </div>
      </div>

      <p class="over-star-note">
        {{ stars === 3 ? 'Three shiny stars!' : stars === 2 ? 'Two shiny stars!' : 'One shiny star!' }}
      </p>

      <div class="over-actions">
        <button class="btn btn-mint" type="button" @click="$emit('again')">Play again</button>
        <button class="btn" type="button" @click="$emit('exit')">Back to meadow</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(44, 38, 32, 0.35);
  backdrop-filter: blur(3px);
  animation: riseFade 0.25s ease;
}

.over-card {
  position: relative;
  width: min(420px, 92vw);
  background: var(--cream);
  border: var(--line);
  border-radius: 32px;
  box-shadow: 0 12px 0 rgba(44, 38, 32, 0.28);
  padding: 18px 24px 24px;
  text-align: center;
  animation: popIn 0.45s cubic-bezier(0.2, 1.5, 0.4, 1);
}

.over-pip {
  width: 96px;
  height: 96px;
  margin: -62px auto 2px;
  filter: drop-shadow(0 6px 0 rgba(44, 38, 32, 0.16));
}

.over-title {
  font-size: clamp(28px, 5vw, 38px);
  color: var(--ink);
}

.over-detail {
  margin-top: 6px;
  font-size: 15px;
  color: var(--ink-soft);
  font-weight: 800;
}

.over-stars {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin: 14px 0 4px;
}

.over-star {
  width: clamp(50px, 12vw, 66px);
  height: clamp(50px, 12vw, 66px);
  opacity: 0;
  transform: scale(0.3) rotate(-25deg);
  animation: starPop 0.5s cubic-bezier(0.2, 1.6, 0.4, 1) forwards;
}

.over-star.on {
  filter: drop-shadow(0 4px 0 rgba(44, 38, 32, 0.2));
}

.over-star .star-icon {
  animation: wiggle 2.2s ease-in-out infinite;
  animation-delay: 0.9s;
}

.over-star-note {
  font-family: var(--font-display);
  font-size: 16px;
  color: var(--ink-soft);
  margin-bottom: 16px;
}

.over-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.over-actions .btn {
  width: 100%;
}

@keyframes starPop {
  0% {
    opacity: 0;
    transform: scale(0.3) rotate(-25deg);
  }
  70% {
    opacity: 1;
    transform: scale(1.15) rotate(6deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0);
  }
}
</style>
