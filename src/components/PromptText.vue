<script setup>
import { computed } from 'vue'

const props = defineProps({ text: { type: String, default: '' } })

const parts = computed(() => props.text.split(/(\d+)/).filter((p) => p !== ''))
const isNum = (p) => /^\d+$/.test(p)
</script>

<template>
  <span class="prompt-text">
    <template v-for="(part, i) in parts" :key="i">
      <b v-if="isNum(part)" class="num">{{ part }}</b>
      <span v-else>{{ part }}</span>
    </template>
  </span>
</template>

<style scoped>
.prompt-text {
  line-height: 1.35;
}

.num {
  display: inline-block;
  font-family: var(--font-display);
  font-size: 1.35em;
  line-height: 1;
  color: var(--ink);
  background: var(--sun);
  border: 2.5px solid var(--ink);
  border-radius: 9px;
  padding: 0 0.28em;
  margin: 0 0.1em;
  transform: translateY(-1px) rotate(-2deg);
  box-shadow: 0 2px 0 rgba(44, 38, 32, 0.35);
}
</style>
