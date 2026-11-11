<script setup>
defineProps({
  mood: { type: String, default: 'happy' }, // happy | cheer | oops | sleepy
  bobbing: { type: Boolean, default: true },
})
</script>

<template>
  <svg
    viewBox="0 0 120 120"
    class="pip"
    :class="['pip-' + mood, { 'pip-bobbing': bobbing }]"
    aria-hidden="true"
  >
    <!-- tail -->
    <g class="pip-tail">
      <path
        d="M36 92c-16 6-30-4-28-18 2-12 16-16 24-7 6 7 9 16 4 25z"
        fill="#f9883d"
        stroke="#2c2620"
        stroke-width="4"
        stroke-linejoin="round"
      />
      <path
        d="M14 62c6 1 10 6 11 11 1 5-2 8-6 7-5-1-8-7-7-12"
        fill="#fff1dd"
        stroke="#2c2620"
        stroke-width="3.4"
        stroke-linejoin="round"
      />
    </g>

    <!-- feet -->
    <g>
      <ellipse cx="48" cy="105" rx="11" ry="7" fill="#e4702c" stroke="#2c2620" stroke-width="4" />
      <ellipse cx="73" cy="105" rx="11" ry="7" fill="#e4702c" stroke="#2c2620" stroke-width="4" />
    </g>

    <!-- body -->
    <path
      d="M60 64c20 0 31 12 31 26 0 11-9 17-31 17S29 101 29 90c0-14 11-26 31-26z"
      fill="#f9883d"
      stroke="#2c2620"
      stroke-width="4"
      stroke-linejoin="round"
    />
    <ellipse cx="60" cy="90" rx="16" ry="13" fill="#fff1dd" />

    <!-- head -->
    <g class="pip-head">
      <path
        d="M37 34 34 12l21 12z"
        fill="#f9883d"
        stroke="#2c2620"
        stroke-width="4"
        stroke-linejoin="round"
      />
      <path
        d="M83 34 86 12 65 24z"
        fill="#f9883d"
        stroke="#2c2620"
        stroke-width="4"
        stroke-linejoin="round"
      />
      <path d="M40 30 39 19l9 6z" fill="#f7b6a6" />
      <path d="M80 30 81 19l-9 6z" fill="#f7b6a6" />

      <circle cx="60" cy="48" r="27" fill="#f9883d" stroke="#2c2620" stroke-width="4" />
      <path
        d="M60 46c7 0 12 4 12 9 0 6-5 10-12 10s-12-4-12-10c0-5 5-9 12-9z"
        fill="#fff1dd"
      />

      <g class="pip-eyes">
        <ellipse cx="49" cy="42" rx="4" ry="4.6" fill="#2c2620" />
        <ellipse cx="71" cy="42" rx="4" ry="4.6" fill="#2c2620" />
        <circle cx="50.4" cy="40.4" r="1.4" fill="#fff" />
        <circle cx="72.4" cy="40.4" r="1.4" fill="#fff" />
      </g>

      <ellipse cx="60" cy="54" rx="4.4" ry="3.4" fill="#2c2620" />
      <circle cx="41" cy="54" r="4.2" fill="#f7a29a" opacity="0.55" />
      <circle cx="79" cy="54" r="4.2" fill="#f7a29a" opacity="0.55" />

      <g v-if="mood === 'cheer'" class="pip-mouth">
        <path d="M52 60q8 12 16 0z" fill="#7d3b3b" stroke="#2c2620" stroke-width="2.6" />
        <path d="M56 60q4 4 8 0" fill="#f79aa0" />
      </g>
      <path
        v-else-if="mood === 'oops'"
        d="M56 61q4 3 8 0"
        fill="none"
        stroke="#2c2620"
        stroke-width="2.6"
        stroke-linecap="round"
      />
      <path
        v-else
        d="M54 59q6 6 12 0"
        fill="none"
        stroke="#2c2620"
        stroke-width="2.6"
        stroke-linecap="round"
      />
    </g>
  </svg>
</template>

<style scoped>
.pip {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.pip-bobbing {
  animation: bob 2.6s ease-in-out infinite;
}

.pip-tail {
  animation: wag 1.9s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: 85% 25%;
}

.pip-eyes {
  animation: blink 4.6s infinite;
  transform-box: fill-box;
  transform-origin: center;
}

.pip-mouth {
  transform-box: fill-box;
  transform-origin: center top;
  animation: bobSm 0.7s ease-in-out infinite;
}
</style>
