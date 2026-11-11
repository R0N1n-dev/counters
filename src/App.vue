<script setup>
import { ref, computed } from 'vue'
import HomeScreen from './screens/HomeScreen.vue'
import BalloonPop from './games/BalloonPop.vue'
import FeedChompy from './games/FeedChompy.vue'
import FireflyNight from './games/FireflyNight.vue'
import StoryBook from './games/StoryBook.vue'
import RocketCountdown from './games/RocketCountdown.vue'
import DinoHatch from './games/DinoHatch.vue'
import AnimalFeast from './games/AnimalFeast.vue'
import NumberParade from './games/NumberParade.vue'
import ObjectCount from './games/ObjectCount.vue'
import { store } from './lib/store.js'

const GAMES = {
  balloon: BalloonPop,
  chompy: FeedChompy,
  firefly: FireflyNight,
  story: StoryBook,
  rocket: RocketCountdown,
  dino: DinoHatch,
  feast: AnimalFeast,
  parade: NumberParade,
  objects: ObjectCount,
}

const active = ref(null)
const current = computed(() => (active.value ? GAMES[active.value] : null))

function play(id) {
  active.value = id
}

function exit() {
  active.value = null
}
</script>

<template>
  <div class="app-shell">
    <HomeScreen v-if="!active" key="home" @play="play" />
    <component
      :is="current"
      v-else
      :key="active + (store.toddler ? '-t' : '-n')"
      @exit="exit"
    />
  </div>
</template>
