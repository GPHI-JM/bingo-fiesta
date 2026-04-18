<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import Phaser from 'phaser'
import BingoScene from './phaser/BingoScene'
import BingoCard from './components/BingoCard.vue'
import BingoWinModal from './components/BingoWinModal.vue'
import PhoneVerifyModal from './components/PhoneVerifyModal.vue'
import GameIconGrid from './components/GameIconGrid.vue'
import { useBingoStore } from './store/gameStore'
import { buildFakeGameScores, fetchGameScores } from './lib/gameScoresApi'
import { isRunningInFBInstant } from './services/fbInstant.js'

const store = useBingoStore()
const invalidCell = ref(null)
const invalidCellSecond = ref(null)
const showVerifyModal = ref(false)
const isPortrait = ref(false)
const isInstantLayout = isRunningInFBInstant()
let phaserGame = null
let ballTimer = null
let orientationMediaQuery = null
let orientationChangeHandler = null

const getBingoLetter = (number) => {
  if (number >= 1 && number <= 15) return 'B'
  if (number >= 16 && number <= 30) return 'I'
  if (number >= 31 && number <= 45) return 'N'
  if (number >= 46 && number <= 60) return 'G'
  if (number >= 61 && number <= 75) return 'O'
  return ''
}

const currentBallCallout = computed(() => {
  if (!store.currentBall?.number) return ''
  return `Letter ${getBingoLetter(store.currentBall.number)}, number ${store.currentBall.number}`
})

const onCellClick = ({ row, col, number }) => {
  if (!store.gameActive) return
  if (!store.calledBalls.some((b) => Number(b) === Number(number))) {
    invalidCell.value = { row, col }
    setTimeout(() => {
      invalidCell.value = null
    }, 500)
    return
  }
  store.markPlayerCell(row, col)
}

const onSecondCardCellClick = ({ row, col, number }) => {
  if (!store.gameActive) return
  if (!store.calledBalls.some((b) => Number(b) === Number(number))) {
    invalidCellSecond.value = { row, col }
    setTimeout(() => {
      invalidCellSecond.value = null
    }, 500)
    return
  }
  store.markSecondCardCell(row, col)
}

function ensureBallDrawTimer() {
  if (ballTimer) {
    clearInterval(ballTimer)
    ballTimer = null
  }
  ballTimer = setInterval(() => {
    if (store.gameActive && store.availableBalls.length > 0) {
      store.pickRandomBall()
    } else {
      clearInterval(ballTimer)
      ballTimer = null
    }
  }, 3000)
}

const startNewGame = () => {
  store.startGame()
  ensureBallDrawTimer()
}

const onPhoneVerified = () => {
  showVerifyModal.value = false
  store.addSecondCard()
}

const scoreRows = ref(buildFakeGameScores())

const marqueeItems = computed(() =>
  scoreRows.value.map((row) => `${String(row.phone).trim()} BINGO!`),
)

async function loadMarqueeScores() {
  try {
    const rowsFromApi = await fetchGameScores()
    if (rowsFromApi.length > 0) {
      scoreRows.value = rowsFromApi
    } else {
      scoreRows.value = buildFakeGameScores()
    }
  } catch {
    scoreRows.value = buildFakeGameScores()
  }
}

const marqueeContainerRef = ref(null)
let marqueePopFrameId = null

function updateMarqueeCenterPop() {
  const containerElement = marqueeContainerRef.value
  if (!containerElement) return

  const containerRect = containerElement.getBoundingClientRect()
  if (containerRect.width < 8) return

  const containerCenterX = containerRect.left + containerRect.width / 2
  const centerBandPx = containerRect.width * 0.13

  const chipElements = containerElement.querySelectorAll('.bingo-marquee-chip')
  chipElements.forEach((chipElement) => {
    const chipRect = chipElement.getBoundingClientRect()
    if (chipRect.width < 1) return
    const chipCenterX = chipRect.left + chipRect.width / 2
    const distanceFromCenter = Math.abs(chipCenterX - containerCenterX)
    const isNearCenter = distanceFromCenter < centerBandPx
    chipElement.classList.toggle('bingo-marquee-chip--active', isNearCenter)
  })
}

function marqueeCenterPopLoop() {
  updateMarqueeCenterPop()
  marqueePopFrameId = window.requestAnimationFrame(marqueeCenterPopLoop)
}

function startMarqueeCenterPopLoop() {
  if (typeof window === 'undefined') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  marqueeCenterPopLoop()
}

function stopMarqueeCenterPopLoop() {
  if (marqueePopFrameId !== null) {
    window.cancelAnimationFrame(marqueePopFrameId)
    marqueePopFrameId = null
  }
}

function syncOrientationState() {
  if (typeof window === 'undefined') return
  isPortrait.value = window.matchMedia('(orientation: portrait)').matches
}

onMounted(() => {
  syncOrientationState()
  if (typeof window !== 'undefined') {
    orientationMediaQuery = window.matchMedia('(orientation: portrait)')
    orientationChangeHandler = () => syncOrientationState()
    if (orientationMediaQuery.addEventListener) {
      orientationMediaQuery.addEventListener('change', orientationChangeHandler)
    } else if (orientationMediaQuery.addListener) {
      orientationMediaQuery.addListener(orientationChangeHandler)
    }
  }

  loadMarqueeScores()

  store.startGame()

  phaserGame = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'phaser-root',
    width: 480,
    height: 270,
    transparent: true,
    scene: [BingoScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
    },
  })

  ensureBallDrawTimer()
  startMarqueeCenterPopLoop()
})

onBeforeUnmount(() => {
  stopMarqueeCenterPopLoop()
  if (orientationMediaQuery && orientationChangeHandler) {
    if (orientationMediaQuery.removeEventListener) {
      orientationMediaQuery.removeEventListener('change', orientationChangeHandler)
    } else if (orientationMediaQuery.removeListener) {
      orientationMediaQuery.removeListener(orientationChangeHandler)
    }
    orientationMediaQuery = null
    orientationChangeHandler = null
  }
  if (phaserGame) {
    phaserGame.destroy(true)
    phaserGame = null
  }
  if (ballTimer) {
    clearInterval(ballTimer)
    ballTimer = null
  }
})
</script>

<template>
  <div :class="['fiesta-shell', { 'fiesta-shell--instant': isInstantLayout }]" class="min-h-screen p-3 text-white md:p-4">
    <div class="fiesta-confetti"></div>
    <div class="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-4">
      <header class="fiesta-header">
        <div>
          <p class="fiesta-kicker">Instant Download Party Board</p>
          <h1 class="mb-2 text-4xl font-black uppercase tracking-[0.08em] text-white md:text-5xl">Bingo Fiesta</h1>
          <p class="max-w-2xl text-sm text-amber-50/85 md:text-base">
            Colorful card-play with a festive board, a lively draw machine, and classic bingo energy.
          </p>
        </div>
        <div class="flex shrink-0 flex-col items-end">
          <div class="fiesta-badge">
            <span class="fiesta-badge-number">{{ store.activeCardCount }}</span>
            <span class="fiesta-badge-text">{{ store.activeCardCount === 1 ? 'Active Card' : 'Active Cards' }}</span>
          </div>
        </div>
      </header>

      <section class="fiesta-main-grid grid flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.88fr)]">
        <article class="space-y-4">
          <div class="fiesta-top-grid grid gap-3 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div class="fiesta-panel rounded-[28px] p-5">
              <h2 class="fiesta-panel-title">Current Ball</h2>
              <p class="sr-only" aria-live="polite">{{ currentBallCallout || 'No ball drawn yet' }}</p>
              <div class="mt-4 flex flex-col items-center gap-4">
                <div
                  id="phaser-root"
                  class="fiesta-machine-frame flex w-full max-w-[480px] items-center justify-center overflow-hidden rounded-[22px]"
                  :aria-label="currentBallCallout || 'Ball display'"
                ></div>
                <div class="flex w-full max-w-[480px] flex-col items-center gap-2 text-center">
                  <span
                    v-if="store.currentBall"
                    class="inline-flex rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-bold tracking-[0.08em] text-amber-950 shadow-[0_6px_14px_rgba(120,53,15,0.12)]"
                  >
                    {{ currentBallCallout }}
                  </span>
                  <div class="text-sm font-semibold uppercase tracking-[0.16em] text-amber-900/70">
                    Balls called: {{ store.calledBalls.length }}/75
                  </div>
                </div>
              </div>
            </div>

            <div class="fiesta-panel rounded-[28px] p-4">
              <div class="mb-3 flex items-center justify-between">
                <strong class="text-sm uppercase tracking-[0.24em] text-amber-950">Called Balls</strong>
                <span class="text-xs font-bold text-amber-900/60">{{ store.calledBalls.length }}/75</span>
              </div>
              <div class="max-h-[240px] overflow-y-auto pr-1">
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="ball in store.calledBalls"
                    :key="ball"
                    class="fiesta-called-ball"
                  >
                    {{ ball }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </article>

        <aside class="space-y-4">
          <div
            ref="marqueeContainerRef"
            class="bingo-marquee mb-1"
            role="presentation"
            aria-label="Recent players and bingo callouts"
          >
            <div class="bingo-marquee-track">
              <span class="bingo-marquee-segment">
                <template v-for="(item, itemIndex) in marqueeItems" :key="`marquee-a-${itemIndex}`">
                  <span class="bingo-marquee-chip">{{ item }}</span>
                </template>
              </span>
              <span class="bingo-marquee-segment" aria-hidden="true">
                <template v-for="(item, itemIndex) in marqueeItems" :key="`marquee-b-${itemIndex}`">
                  <span class="bingo-marquee-chip">{{ item }}</span>
                </template>
              </span>
            </div>
          </div>

          <div
            :class="[
              'grid gap-4',
              store.hasSecondCard ? 'md:grid-cols-2 md:items-start' : 'grid-cols-1',
            ]"
          >
            <!-- Card 1 -->
            <div class="fiesta-panel rounded-[28px] p-5">
              <div class="mb-4 flex items-center justify-between gap-2">
                <div>
                  <h2 class="fiesta-panel-title mb-1">Card 1</h2>
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-amber-900/60">Your main card</p>
                </div>
                <button
                  v-if="!store.hasSecondCard"
                  @click="showVerifyModal = true"
                  class="shrink-0 rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-amber-700 transition hover:border-amber-500 hover:bg-amber-100"
                >
                  + Add Free Card
                </button>
              </div>

              <div class="rounded-[24px] border border-amber-200/70 bg-white/55 p-4">
                <BingoCard
                  :card="store.playerCard"
                  :marks="store.playerMarks"
                  :calledBalls="store.calledBalls"
                  :invalidCell="invalidCell"
                  @cell-click="onCellClick"
                />
              </div>
            </div>

            <!-- Card 2 — only shown after phone verification -->
            <div v-if="store.hasSecondCard" class="fiesta-panel rounded-[28px] p-5">
              <div class="mb-4 flex items-center justify-between">
                <div>
                  <h2 class="fiesta-panel-title mb-1">Card 2</h2>
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-amber-900/60">Your free bonus card</p>
                </div>
                <span
                  class="rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-emerald-700"
                >
                  Free
                </span>
              </div>

              <div class="rounded-[24px] border border-amber-200/70 bg-white/55 p-4">
                <BingoCard
                  :card="store.secondCard"
                  :marks="store.secondMarks"
                  :calledBalls="store.calledBalls"
                  :invalidCell="invalidCellSecond"
                  @cell-click="onSecondCardCellClick"
                />
              </div>
            </div>
          </div>

        </aside>
      </section>

      <section v-if="!isInstantLayout && isPortrait" class="fiesta-panel mt-1 rounded-[28px] p-4 more-games-mobile">
        <div class="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 class="fiesta-panel-title mb-1">More Games</h2>
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-amber-900/60">
              Open the other Instant Games
            </p>
          </div>
        </div>
        <GameIconGrid layout="compact" />
      </section>
    </div>

    <div v-if="isInstantLayout || !isPortrait" class="bingo-floating-game-strip more-games-desktop">
      <div class="bingo-floating-game-strip__panel rounded-2xl border border-amber-300/25 bg-black/55 p-2 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md">
        <div class="mb-2 px-1 pt-1">
          <h2 class="text-[0.65rem] font-black uppercase tracking-[0.18em] text-amber-50/95">More Games</h2>
          <p class="text-[0.48rem] font-semibold uppercase tracking-[0.18em] text-amber-50/60">
            Open the other Instant Games
          </p>
        </div>
        <GameIconGrid layout="stack" />
      </div>
    </div>

    <!-- Phone verification modal -->
    <PhoneVerifyModal
      v-if="showVerifyModal"
      @close="showVerifyModal = false"
      @verified="onPhoneVerified"
    />

    <BingoWinModal v-if="store.playerWon" :message="store.message" @play-again="startNewGame" />

    <Teleport to="body">
      <div v-if="isPortrait && !isInstantLayout" class="fiesta-landscape-gate" role="alertdialog" aria-live="assertive">
        <div class="fiesta-panel fiesta-landscape-gate__card rounded-[28px] p-6 text-center">
          <p class="mb-2 text-4xl font-black">Rotate</p>
          <h2 class="fiesta-panel-title mb-2 text-2xl">Landscape Required</h2>
          <p class="text-sm font-semibold text-amber-900/80">
            Please rotate your device to landscape to play Bingo Fiesta.
          </p>
        </div>
      </div>
    </Teleport>
  </div>
</template>
