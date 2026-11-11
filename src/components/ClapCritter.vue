<script setup>
defineProps({
  kind: { type: Number, default: 0 }, // 0 frog, 1 cat, 2 owl, 3 bunny
  x: { type: Number, default: 50 }, // horizontal position, percent
})
</script>

<template>
  <div class="clapper" :style="{ left: x + '%' }" aria-hidden="true">
    <svg viewBox="0 0 64 64" class="critter-svg">
      <!-- frog -->
      <template v-if="kind === 0">
        <ellipse cx="32" cy="40" rx="21" ry="16" fill="#58A86C" stroke="#2C2620" stroke-width="3.4" />
        <circle cx="21" cy="24" r="8" fill="#58A86C" stroke="#2C2620" stroke-width="3" />
        <circle cx="43" cy="24" r="8" fill="#58A86C" stroke="#2C2620" stroke-width="3" />
        <circle cx="21" cy="24" r="3.6" fill="#fff" stroke="#2C2620" stroke-width="1.8" />
        <circle cx="22" cy="24.6" r="1.6" fill="#2C2620" />
        <circle cx="43" cy="24" r="3.6" fill="#fff" stroke="#2C2620" stroke-width="1.8" />
        <circle cx="44" cy="24.6" r="1.6" fill="#2C2620" />
        <path d="M24 40q8 6 16 0" fill="none" stroke="#2C2620" stroke-width="2.6" stroke-linecap="round" />
        <circle cx="14" cy="38" r="3" fill="#F79AC0" opacity=".8" />
        <circle cx="50" cy="38" r="3" fill="#F79AC0" opacity=".8" />
        <circle class="cr-hand cr-l" cx="8" cy="46" r="6" fill="#8FE0B0" stroke="#2C2620" stroke-width="2.8" />
        <circle class="cr-hand cr-r" cx="56" cy="46" r="6" fill="#8FE0B0" stroke="#2C2620" stroke-width="2.8" />
      </template>

      <!-- cat -->
      <template v-else-if="kind === 1">
        <path d="M14 26 16 12l11 9z" fill="#9B72E8" stroke="#2C2620" stroke-width="3" stroke-linejoin="round" />
        <path d="M50 26 48 12l-11 9z" fill="#9B72E8" stroke="#2C2620" stroke-width="3" stroke-linejoin="round" />
        <path d="M17 23l2-8 6 5zM47 23l-2-8-6 5z" fill="#F79AC0" />
        <circle cx="32" cy="36" r="18" fill="#9B72E8" stroke="#2C2620" stroke-width="3.4" />
        <circle cx="25" cy="34" r="2.6" fill="#2C2620" />
        <circle cx="39" cy="34" r="2.6" fill="#2C2620" />
        <path d="M30 39h4l-2 3z" fill="#F79AC0" stroke="#2C2620" stroke-width="1.8" stroke-linejoin="round" />
        <path d="M10 36l-5-1M11 39l-5 1M54 36l5-1M53 39l5 1" fill="none" stroke="#2C2620" stroke-width="1.8" stroke-linecap="round" />
        <circle class="cr-hand cr-l" cx="9" cy="48" r="6" fill="#C9B8F5" stroke="#2C2620" stroke-width="2.8" />
        <circle class="cr-hand cr-r" cx="55" cy="48" r="6" fill="#C9B8F5" stroke="#2C2620" stroke-width="2.8" />
      </template>

      <!-- owl -->
      <template v-else-if="kind === 2">
        <path d="M16 22 12 10l10 6zM48 22l4-12-10 6z" fill="#B07B4F" stroke="#2C2620" stroke-width="3" stroke-linejoin="round" />
        <ellipse cx="32" cy="40" rx="19" ry="20" fill="#C98D5C" stroke="#2C2620" stroke-width="3.4" />
        <ellipse cx="32" cy="46" rx="11" ry="9" fill="#E9C79B" stroke="#2C2620" stroke-width="2.4" />
        <circle cx="25" cy="30" r="7" fill="#fff" stroke="#2C2620" stroke-width="2.4" />
        <circle cx="39" cy="30" r="7" fill="#fff" stroke="#2C2620" stroke-width="2.4" />
        <circle cx="26" cy="31" r="3" fill="#2C2620" />
        <circle cx="40" cy="31" r="3" fill="#2C2620" />
        <path d="M32 36l-4 4h8z" fill="#F59B3F" stroke="#2C2620" stroke-width="2" stroke-linejoin="round" />
        <circle class="cr-hand cr-l" cx="9" cy="46" r="6" fill="#E9C79B" stroke="#2C2620" stroke-width="2.8" />
        <circle class="cr-hand cr-r" cx="55" cy="46" r="6" fill="#E9C79B" stroke="#2C2620" stroke-width="2.8" />
      </template>

      <!-- bunny -->
      <template v-else>
        <ellipse cx="25" cy="12" rx="6" ry="12" fill="#FFF3D6" stroke="#2C2620" stroke-width="3" transform="rotate(-8 25 12)" />
        <ellipse cx="39" cy="12" rx="6" ry="12" fill="#FFF3D6" stroke="#2C2620" stroke-width="3" transform="rotate(8 39 12)" />
        <ellipse cx="25" cy="13" rx="3" ry="8" fill="#F79AC0" transform="rotate(-8 25 13)" />
        <ellipse cx="39" cy="13" rx="3" ry="8" fill="#F79AC0" transform="rotate(8 39 13)" />
        <circle cx="32" cy="40" r="17" fill="#FFF3D6" stroke="#2C2620" stroke-width="3.4" />
        <circle cx="26" cy="38" r="2.6" fill="#2C2620" />
        <circle cx="38" cy="38" r="2.6" fill="#2C2620" />
        <path d="M30 43h4l-2 3.5z" fill="#F79AC0" stroke="#2C2620" stroke-width="1.8" stroke-linejoin="round" />
        <path d="M32 46.5v3M32 49.5q-2 2-4 1.5M32 49.5q2 2 4 1.5" fill="none" stroke="#2C2620" stroke-width="1.8" stroke-linecap="round" />
        <circle class="cr-hand cr-l" cx="11" cy="48" r="6" fill="#F5D9A8" stroke="#2C2620" stroke-width="2.8" />
        <circle class="cr-hand cr-r" cx="53" cy="48" r="6" fill="#F5D9A8" stroke="#2C2620" stroke-width="2.8" />
      </template>
    </svg>
  </div>
</template>

<style scoped>
.clapper {
  position: absolute;
  bottom: 33%;
  width: clamp(72px, 10vw, 108px);
  transform: translateX(-50%);
  z-index: 6;
  pointer-events: none;
  animation: crPop 0.4s backwards cubic-bezier(0.2, 1.5, 0.4, 1);
}

.critter-svg {
  width: 100%;
  height: auto;
  overflow: visible;
  display: block;
  animation: crHop 0.8s ease-in-out infinite;
}

.cr-hand {
  transform-box: fill-box;
  transform-origin: center;
}

.cr-l {
  animation: crClapL 0.42s ease-in-out infinite alternate;
}

.cr-r {
  animation: crClapR 0.42s ease-in-out infinite alternate;
}

@keyframes crClapL {
  from {
    transform: translate(0, 0);
  }
  to {
    transform: translate(12px, -4px);
  }
}

@keyframes crClapR {
  from {
    transform: translate(0, 0);
  }
  to {
    transform: translate(-12px, -4px);
  }
}

@keyframes crHop {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-9px);
  }
}

@keyframes crPop {
  from {
    opacity: 0;
    transform: translateX(-50%) scale(0.3);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) scale(1);
  }
}
</style>
