<script setup>
defineProps({
  filled: { type: Boolean, default: true },
  color: { type: String, default: '#FFC93C' },
})
</script>

<template>
  <svg viewBox="0 0 24 24" class="star-icon" aria-hidden="true">
    <path
      d="M12 2l3.1 6.4 7 1-5.1 4.9 1.2 7-6.2-3.3-6.2 3.3 1.2-7L2 9.4l7-1z"
      :fill="filled ? color : '#EFE1C6'"
      stroke="#2C2620"
      stroke-width="1.9"
      stroke-linejoin="round"
    />
  </svg>
</template>

<style scoped>
.star-icon {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
