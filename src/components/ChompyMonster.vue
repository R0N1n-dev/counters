<script setup>
import { computed } from 'vue'

const props = defineProps({
  mood: { type: String, default: 'idle' }, // idle | open | chew
  bobbing: { type: Boolean, default: true },
})

const uid = `chompy-${Math.random().toString(36).slice(2, 8)}`
const mouthClip = computed(() => `${uid}-mouth`)
</script>

<template>
  <svg viewBox="0 0 200 200" class="chompy" :class="{ 'chompy-bobbing': bobbing }" aria-hidden="true">
    <defs>
      <clipPath :id="mouthClip">
        <ellipse cx="100" cy="118" rx="42" ry="24" />
      </clipPath>
    </defs>

    <!-- arms -->
    <ellipse
      cx="34"
      cy="126"
      rx="14"
      ry="19"
      fill="#8ad6a0"
      stroke="#2c2620"
      stroke-width="5"
      transform="rotate(-16 34 126)"
    />
    <ellipse
      cx="166"
      cy="126"
      rx="14"
      ry="19"
      fill="#8ad6a0"
      stroke="#2c2620"
      stroke-width="5"
      transform="rotate(16 166 126)"
    />

    <!-- feet -->
    <ellipse cx="74" cy="174" rx="20" ry="12" fill="#6dc48c" stroke="#2c2620" stroke-width="5" />
    <ellipse cx="126" cy="174" rx="20" ry="12" fill="#6dc48c" stroke="#2c2620" stroke-width="5" />

    <!-- little horns -->
    <path
      d="M62 30c-2-10 3-16 9-16 5 0 8 6 5 15z"
      fill="#ffe08a"
      stroke="#2c2620"
      stroke-width="4.5"
      stroke-linejoin="round"
    />
    <path
      d="M138 30c2-10-3-16-9-16-5 0-8 6-5 15z"
      fill="#ffe08a"
      stroke="#2c2620"
      stroke-width="4.5"
      stroke-linejoin="round"
    />

    <!-- body -->
    <path
      d="M100 22c33 0 56 15 56 46v42c0 31-23 52-56 52s-56-21-56-52V68c0-31 23-46 56-46z"
      fill="#96dca8"
      stroke="#2c2620"
      stroke-width="5"
      stroke-linejoin="round"
    />

    <!-- spots -->
    <circle cx="54" cy="52" r="6" fill="#7bcb96" />
    <circle cx="150" cy="64" r="8" fill="#7bcb96" />
    <circle cx="140" cy="42" r="4.5" fill="#7bcb96" />

    <!-- belly -->
    <ellipse cx="100" cy="158" rx="34" ry="17" fill="#d9f6e2" opacity="0.85" />

    <!-- eyes -->
    <g class="chompy-eyes">
      <ellipse cx="76" cy="74" rx="16" ry="17" fill="#fffaf0" stroke="#2c2620" stroke-width="4" />
      <ellipse cx="124" cy="74" rx="16" ry="17" fill="#fffaf0" stroke="#2c2620" stroke-width="4" />
      <circle cx="80" cy="76" r="7" fill="#2c2620" />
      <circle cx="120" cy="76" r="7" fill="#2c2620" />
      <circle cx="82.5" cy="73" r="2.4" fill="#fff" />
      <circle cx="122.5" cy="73" r="2.4" fill="#fff" />
    </g>

    <!-- brows -->
    <path
      d="M62 54q14-7 27-2"
      fill="none"
      stroke="#2c2620"
      stroke-width="4"
      stroke-linecap="round"
      opacity="0.75"
    />
    <path
      d="M138 54q-14-7-27-2"
      fill="none"
      stroke="#2c2620"
      stroke-width="4"
      stroke-linecap="round"
      opacity="0.75"
    />

    <!-- mouth -->
    <g class="chompy-mouth" :class="'mouth-' + mood">
      <ellipse
        cx="100"
        cy="118"
        rx="42"
        ry="24"
        fill="#5d2b39"
        stroke="#2c2620"
        stroke-width="4.5"
      />
      <g :clip-path="`url(#${mouthClip})`">
        <path d="M58 100h84v10l-10-8-10 8-10-8-11 8-10-8-11 8-10-8-12 8z" fill="#fffaf0" />
        <path d="M58 138h84v-10l-10 8-10-8-10 8-11-8-10 8-11-8-10 8-12-8z" fill="#fffaf0" />
        <ellipse cx="100" cy="136" rx="24" ry="10" fill="#e46a86" />
      </g>
      <ellipse
        cx="100"
        cy="118"
        rx="42"
        ry="24"
        fill="none"
        stroke="#2c2620"
        stroke-width="4.5"
      />
    </g>

    <ellipse cx="55" cy="104" rx="7" ry="5" fill="#f2a0a0" opacity="0.5" />
    <ellipse cx="145" cy="104" rx="7" ry="5" fill="#f2a0a0" opacity="0.5" />
  </svg>
</template>

<style scoped>
.chompy {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.chompy-bobbing {
  animation: bob 2.4s ease-in-out infinite;
}

.chompy-eyes {
  animation: blink 3.9s infinite;
  transform-box: fill-box;
  transform-origin: center;
}

.chompy-mouth {
  transform-box: fill-box;
  transform-origin: center;
  transition: transform 0.2s ease;
}

.mouth-open {
  transform: scaleY(1.22);
}

.mouth-chew {
  animation: chomp 0.36s ease-in-out 2;
}
</style>
