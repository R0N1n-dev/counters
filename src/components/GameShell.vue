<script setup>
import { ref, watch, onMounted } from 'vue'
import PipFox from './PipFox.vue'
import SpeechBubble from './SpeechBubble.vue'
import StarIcon from './StarIcon.vue'
import GrownUpPanel from './GrownUpPanel.vue'
import { store, totalStars, MAX_STARS } from '../lib/store.js'
import { sfx } from '../lib/audio.js'
import { speak } from '../lib/speak.js'

const props = defineProps({
  title: { type: String, default: '' },
  accent: { type: String, default: '#FFC93C' },
  round: { type: Number, default: 1 },
  total: { type: Number, default: 5 },
  prompt: { type: String, default: '' },
  mood: { type: String, default: 'happy' },
  dark: { type: Boolean, default: false },
  showPip: { type: Boolean, default: true },
})

defineEmits(['exit'])

// read the instruction out loud when a new prompt appears and read-aloud is on
onMounted(() => {
  if (store.readAloud && props.prompt) speak(props.prompt)
})

watch(
  () => props.prompt,
  (text) => {
    if (store.readAloud && text) speak(text)
  },
)

// grown-ups: settings panel
const panel = ref(false)

function openPanel() {
  panel.value = true
  sfx.tap()
}
</script>

<template>
  <div class="shell" :class="{ 'shell-dark': dark }">
    <header class="shell-top">
      <button class="icon-btn" type="button" aria-label="Back to the meadow" @click="$emit('exit')">
        <svg viewBox="0 0 24 24" class="ico"><path d="M14 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>

      <div class="shell-title" :style="{ '--accent': accent }">
        <span class="shell-title-text">{{ title }}</span>
      </div>

      <div class="shell-count" :aria-label="`Round ${round} of ${total}`">{{ round }}/{{ total }}</div>

      <div class="shell-right">
        <button
          class="icon-btn pause-btn"
          type="button"
          aria-label="Grown-up settings"
          title="Grown-up settings"
          @click="openPanel"
        >
          <svg viewBox="0 0 24 24" class="ico">
            <rect x="8" y="6" width="3" height="12" rx="1.2" fill="currentColor" />
            <rect x="13.5" y="6" width="3" height="12" rx="1.2" fill="currentColor" />
          </svg>
        </button>
        <div v-if="store.toddler" class="pill toddler-chip" title="Toddler mode: counting up to 5">1–5</div>
        <div class="pill star-pill" :title="`${totalStars} of ${MAX_STARS} stars`">
          <span class="star-mini"><StarIcon /></span>
          {{ totalStars }}<span class="star-max">/{{ MAX_STARS }}</span>
        </div>
      </div>
    </header>

    <div v-if="prompt || $slots.prompt" class="shell-prompt">
      <div v-if="showPip" class="prompt-pip">
        <PipFox :mood="mood" />
      </div>
      <SpeechBubble :tone="dark ? 'night' : 'cream'">
        <slot name="prompt">{{ prompt }}</slot>
      </SpeechBubble>
      <button
        class="speak-btn"
        type="button"
        title="Read it to me"
        aria-label="Read the instruction out loud"
        @click="speak(prompt)"
      >
        <svg viewBox="0 0 24 24" class="ico">
          <path d="M4 9h3l4-3v12l-4-3H4z" fill="currentColor" />
          <path d="M15 8.5a5 5 0 010 7M18 6a8.5 8.5 0 010 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
        </svg>
      </button>
    </div>

    <div class="shell-stage">
      <slot />
    </div>

    <div class="shell-answer">
      <slot name="answer" />
    </div>

    <GrownUpPanel v-if="panel" @close="panel = false" />
  </div>
</template>

<style scoped>
.shell {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 9px;
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: 12px clamp(10px, 2vw, 22px) 14px;
  min-height: 0;
}

.shell-top {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
}

.shell-title {
  background: var(--accent);
  border: var(--line);
  border-radius: 999px;
  padding: 5px 22px 7px;
  box-shadow: 0 4px 0 var(--ink);
  transform: rotate(-1.2deg);
  flex: 0 1 auto;
  min-width: 0;
}

.shell-title-text {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(17px, 2.2vw, 24px);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.shell-count {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 15px;
  background: var(--cream);
  border: 3px solid var(--ink);
  border-radius: 999px;
  padding: 3px 12px 5px;
  box-shadow: 0 3px 0 rgba(44, 38, 32, 0.25);
  flex: 0 0 auto;
  margin-left: auto;
}

.shell-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ico {
  width: 22px;
  height: 22px;
}

.star-pill {
  font-size: clamp(13px, 1.5vw, 16px);
  padding-right: 10px;
}

.star-mini {
  width: 19px;
  height: 19px;
  display: inline-block;
}

.toddler-chip {
  background: var(--mint);
  font-size: 13px;
}

.star-max {
  color: var(--ink-soft);
  font-weight: 700;
  font-size: 0.85em;
}

.shell-prompt {
  display: flex;
  align-items: center;
  gap: 9px;
  flex: 0 0 auto;
  min-height: 62px;
}

.prompt-pip {
  width: clamp(54px, 6.2vw, 74px);
  height: clamp(54px, 6.2vw, 74px);
  flex: 0 0 auto;
}

.speak-btn {
  width: 46px;
  height: 46px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border: 3px solid var(--ink);
  border-radius: 50%;
  background: var(--sun);
  color: var(--ink);
  box-shadow: 0 3px 0 var(--ink);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.speak-btn:hover {
  transform: translateY(-2px) rotate(-5deg);
  box-shadow: 0 5px 0 var(--ink);
}

.speak-btn:active {
  transform: translateY(2px);
  box-shadow: 0 1px 0 var(--ink);
}

.speak-btn .ico {
  width: 19px;
  height: 19px;
}

.shell-stage {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
}

.shell-stage > :deep(*) {
  flex: 1 1 auto;
  min-height: 0;
}

.shell-answer {
  flex: 0 0 auto;
}

.shell-dark {
  color: #f2f0ff;
}



@media (max-width: 640px) {
  .shell {
    gap: 7px;
    padding: 8px 8px 10px;
  }
  .icon-btn {
    width: 44px;
    height: 44px;
  }
  .star-max,
  .toddler-chip {
    display: none;
  }
}
</style>
