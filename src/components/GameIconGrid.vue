<template>
  <aside :class="['game-icon-grid', `game-icon-grid--${layout}`]" aria-label="More carnival games">
    <div class="game-icon-grid__inner">
      <a
        v-for="entry in gameEntries"
        :key="entry.id"
        :href="entry.url"
        target="_blank"
        rel="noopener noreferrer"
        class="game-icon-grid__cell"
        :class="`game-icon-grid__cell--${entry.theme}`"
        :aria-label="`Open ${entry.alt}`"
        @click="onGameEntryActivate($event, entry)"
      >
        <span class="game-icon-grid__thumb">
          <span class="game-icon-grid__hot" aria-hidden="true">HOT</span>

          <img
            v-if="!imageFailed[entry.src]"
            :src="entry.src"
            :alt="entry.alt"
            class="game-icon-grid__img"
            loading="lazy"
            @error="markImageFailed(entry.src)"
          />
          <span v-else class="game-icon-grid__emoji-fallback" aria-hidden="true">{{ entry.fallback }}</span>
        </span>
        <!-- <span class="game-icon-grid__caption">{{ entry.alt }}</span> -->
      </a>
    </div>
  </aside>
</template>

<script setup>
import { computed, reactive } from 'vue'
import {
  isFBInstantInitialized,
  switchGameAsync,
  tryNavigatePlayUrlViaTopWindow,
} from '../services/fbInstant.js'
import nfIcon from '../assets/icons/nf_icon.png'
import phIcon from '../assets/icons/ph_icon.png'
import tekhenIcon from '../assets/icons/tekhen_icon.png'

const props = defineProps({
  layout: {
    type: String,
    default: 'stack',
  },
})

const imageFailed = reactive({})
const layout = computed(() => (props.layout === 'compact' ? 'compact' : 'stack'))

const gameEntries = [
  {
    id: 'nf',
    src: nfIcon,
    alt: 'nf_icon',
    appId: '1431508008453701',
    url: 'https://fb.gg/play/1431508008453701',
    fallback: 'NF',
    theme: 'green',
  },
  {
    id: 'ph',
    src: phIcon,
    alt: 'ph_icon',
    appId: '4166337263499439',
    url: 'https://fb.gg/play/4166337263499439',
    fallback: 'PH',
    theme: 'yellow',
  },
  {
    id: 'tekhen',
    src: tekhenIcon,
    alt: 'tekhen_icon',
    appId: '2136783867072234',
    url: 'https://fb.gg/play/2136783867072234',
    fallback: 'TK',
    theme: 'purple',
  },
]

function markImageFailed(src) {
  imageFailed[src] = true
}

async function onGameEntryActivate(clickEvent, gameEntry) {
  if (!isFBInstantInitialized()) {
    return
  }
  clickEvent.preventDefault()
  const switchResult = await switchGameAsync(gameEntry.appId)
  if (switchResult.success) {
    return
  }
  const topNavigationResult = tryNavigatePlayUrlViaTopWindow(gameEntry.url)
  if (!topNavigationResult.success) {
    console.warn(
      '[GameIconGrid] Could not open other game. Fix same-business linking for switchGameAsync, or rely on opening outside Instant Games.'
    )
  }
}
</script>

<style scoped>
.game-icon-grid {
  width: 100%;
  max-width: none;
}

.game-icon-grid--stack {
  max-width: 118px;
}

.game-icon-grid__inner {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  align-items: stretch;
}

.game-icon-grid--compact .game-icon-grid__inner {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(82px, 1fr));
  gap: 0.55rem;
}

.game-icon-grid__cell {
  appearance: none;
  -webkit-appearance: none;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.28rem;
  padding: 0;
  border: none;
  background: transparent;
  text-decoration: none;
  cursor: pointer;
  border-radius: 0;
  color: #f5f5f4;
  min-width: 0;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  cursor: pointer;
}

.game-icon-grid__cell:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.9);
  outline-offset: 3px;
}

.game-icon-grid--stack .game-icon-grid__cell {
  width: 100%;
}

.game-icon-grid__thumb {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 14px;
  overflow: hidden;
  background: radial-gradient(ellipse 120% 100% at 50% 20%, #262626 0%, #0a0a0a 55%, #050505 100%);
  transition:
    box-shadow 0.22s ease,
    transform 0.22s ease;
}

.game-icon-grid__hot {
  position: absolute;
  top: 3px;
  right: 3px;
  z-index: 4;
  padding: 2px 5px 1px;
  border-radius: 4px;
  font-size: 0.44rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  line-height: 1.1;
  color: #fff;
  text-transform: uppercase;
  background: linear-gradient(180deg, #fb7185 0%, #db2777 55%, #be185d 100%);
  box-shadow:
    0 0 8px rgba(244, 63, 94, 0.65),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

.game-icon-grid__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  object-position: center center;
}

.game-icon-grid__emoji-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 1rem;
  font-weight: 900;
  line-height: 1;
}

.game-icon-grid__caption {
  font-size: 0.46rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-align: center;
  color: rgba(250, 250, 249, 0.88);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.85);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.game-icon-grid__cell--cyan .game-icon-grid__thumb {
  box-shadow:
    0 0 0 1px rgba(34, 211, 238, 0.55),
    0 0 14px rgba(34, 211, 238, 0.45),
    0 0 28px rgba(34, 211, 238, 0.2),
    inset 0 0 24px rgba(34, 211, 238, 0.06);
  animation: icon-glow-pulse-cyan 2.6s ease-in-out infinite;
}

.game-icon-grid__cell--green .game-icon-grid__thumb {
  box-shadow:
    0 0 0 1px rgba(74, 222, 128, 0.55),
    0 0 14px rgba(74, 222, 128, 0.45),
    0 0 28px rgba(74, 222, 128, 0.2),
    inset 0 0 24px rgba(74, 222, 128, 0.06);
  animation: icon-glow-pulse-green 2.6s ease-in-out infinite;
}

.game-icon-grid__cell--yellow .game-icon-grid__thumb {
  box-shadow:
    0 0 0 1px rgba(250, 204, 21, 0.55),
    0 0 14px rgba(250, 204, 21, 0.45),
    0 0 28px rgba(250, 204, 21, 0.2),
    inset 0 0 24px rgba(250, 204, 21, 0.06);
  animation: icon-glow-pulse-yellow 2.6s ease-in-out infinite;
}

.game-icon-grid__cell--purple .game-icon-grid__thumb {
  box-shadow:
    0 0 0 1px rgba(192, 132, 252, 0.6),
    0 0 16px rgba(168, 85, 247, 0.55),
    0 0 32px rgba(147, 51, 234, 0.28),
    inset 0 0 28px rgba(168, 85, 247, 0.1);
  animation: icon-glow-pulse-purple 2.4s ease-in-out infinite;
}

.game-icon-grid__cell:hover .game-icon-grid__thumb {
  transform: scale(1.05);
}

.game-icon-grid__cell--cyan:hover .game-icon-grid__thumb {
  box-shadow:
    0 0 0 1px rgba(34, 211, 238, 0.85),
    0 0 22px rgba(34, 211, 238, 0.65),
    0 0 40px rgba(34, 211, 238, 0.35),
    inset 0 0 28px rgba(34, 211, 238, 0.1);
}

.game-icon-grid__cell--green:hover .game-icon-grid__thumb {
  box-shadow:
    0 0 0 1px rgba(74, 222, 128, 0.85),
    0 0 22px rgba(74, 222, 128, 0.65),
    0 0 40px rgba(74, 222, 128, 0.35),
    inset 0 0 28px rgba(74, 222, 128, 0.1);
}

.game-icon-grid__cell--yellow:hover .game-icon-grid__thumb {
  box-shadow:
    0 0 0 1px rgba(250, 204, 21, 0.85),
    0 0 22px rgba(250, 204, 21, 0.65),
    0 0 40px rgba(250, 204, 21, 0.35),
    inset 0 0 28px rgba(250, 204, 21, 0.1);
}

.game-icon-grid__cell--purple:hover .game-icon-grid__thumb {
  box-shadow:
    0 0 0 1px rgba(216, 180, 254, 0.9),
    0 0 24px rgba(168, 85, 247, 0.75),
    0 0 48px rgba(147, 51, 234, 0.45),
    inset 0 0 32px rgba(168, 85, 247, 0.15);
}

@keyframes icon-glow-pulse-cyan {
  0%,
  100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.08);
  }
}

@keyframes icon-glow-pulse-green {
  0%,
  100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.08);
  }
}

@keyframes icon-glow-pulse-yellow {
  0%,
  100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.08);
  }
}

@keyframes icon-glow-pulse-purple {
  0%,
  100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .game-icon-grid__cell--cyan .game-icon-grid__thumb,
  .game-icon-grid__cell--green .game-icon-grid__thumb,
  .game-icon-grid__cell--yellow .game-icon-grid__thumb,
  .game-icon-grid__cell--purple .game-icon-grid__thumb {
    animation: none;
  }

  .game-icon-grid__cell:hover .game-icon-grid__thumb {
    transform: none;
  }
}

@media (max-width: 900px) {
  .game-icon-grid__inner {
    grid-template-columns: repeat(auto-fit, minmax(82px, 1fr));
  }
}

@media (max-width: 768px) {
  .game-icon-grid--stack {
    max-width: 92px;
  }

  .game-icon-grid__inner {
    gap: 0.35rem;
  }

  .game-icon-grid--compact .game-icon-grid__inner {
    grid-template-columns: repeat(auto-fit, minmax(74px, 1fr));
    gap: 0.42rem;
  }

  .game-icon-grid__thumb {
    border-radius: 11px;
  }

  .game-icon-grid__hot {
    top: 3px;
    right: 3px;
    padding: 1px 4px;
    font-size: 0.38rem;
  }
}
@media(max-width:768px){
  .game-icon-grid__thumb {
    position: relative;
    width: 70%;
    aspect-ratio: 1 / 1;
    border-radius: 12px;
    overflow: hidden;
    background: radial-gradient(ellipse 120% 100% at 50% 20%, #262626 0%, #0a0a0a 55%, #050505 100%);
    transition:
      box-shadow 0.22s ease,
      transform 0.22s ease;
  }
}
</style>
