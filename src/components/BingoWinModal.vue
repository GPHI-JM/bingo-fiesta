<template>
  <Teleport to="body">
    <div
      class="bingo-win-overlay fixed inset-0 z-[60] flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bingo-win-title"
    >
      <!-- Backdrop layer: confetti + balloons sit beside / behind dialog edges -->
      <div class="bingo-win-fx pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <span
          v-for="piece in confettiPieces"
          :key="piece.id"
          class="bingo-confetti-piece"
          :style="{
            left: `${piece.leftPct}%`,
            animationDelay: `${piece.delayS}s`,
            animationDuration: `${piece.durationS}s`,
            backgroundColor: piece.color,
            '--drift': `${piece.driftPx}px`,
            '--spin': `${piece.spinDeg}deg`,
          }"
        />
        <!-- Floating balloons -->
        <div class="bingo-balloon bingo-balloon--a" aria-hidden="true">
          <span class="bingo-balloon-bubble" />
          <span class="bingo-balloon-string" />
        </div>
        <div class="bingo-balloon bingo-balloon--b" aria-hidden="true">
          <span class="bingo-balloon-bubble" />
          <span class="bingo-balloon-string" />
        </div>
        <div class="bingo-balloon bingo-balloon--c" aria-hidden="true">
          <span class="bingo-balloon-bubble" />
          <span class="bingo-balloon-string" />
        </div>
        <div class="bingo-balloon bingo-balloon--d" aria-hidden="true">
          <span class="bingo-balloon-bubble" />
          <span class="bingo-balloon-string" />
        </div>
      </div>

      <div
        class="fiesta-panel relative z-10 w-full max-w-md rounded-[28px] p-8 text-center shadow-2xl ring-4 ring-amber-200/80"
        @click.stop
      >
        <p class="mb-2 text-5xl" aria-hidden="true">🎉</p>
        <h2 id="bingo-win-title" class="fiesta-panel-title mb-2 text-2xl md:text-3xl">BINGO!</h2>
        <p class="mb-6 text-base font-semibold text-amber-900/85">
          {{ displayMessage }}
        </p>

        <div class="mb-6 text-left">
          <label class="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-amber-950">
            Phone number
          </label>
          <input
            v-model="phoneNumber"
            type="tel"
            inputmode="numeric"
            autocomplete="tel"
            maxlength="10"
            placeholder="9651212789"
            class="w-full rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 font-semibold placeholder:text-amber-400 focus:border-amber-500 focus:outline-none"
            @input="handlePhoneInput"
            @keyup.enter="tryPlayAgain"
          />
          <p v-if="phoneError" class="mt-2 text-xs font-bold text-red-600">{{ phoneError }}</p>
          <p v-if="apiError" class="mt-2 text-xs font-bold text-red-600">{{ apiError }}</p>
          <p class="mt-2 text-xs font-medium text-amber-800/70">Enter your phone number to verify and continue.</p>
        </div>

        <button
          type="button"
          class="w-full rounded-2xl px-4 py-3.5 text-sm font-bold shadow-md transition md:text-base"
          :class="
            phoneValid && !isSubmitting
              ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
              : 'cursor-not-allowed bg-amber-200/80 text-amber-900/50'
          "
          :disabled="!phoneValid || isSubmitting"
          @click="tryPlayAgain"
        >
          {{ isSubmitting ? 'Verifying…' : 'Verify Phone and Play again' }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { postGameLogin } from '../lib/gameLoginApi'
import { loadStoredPhone, saveStoredPhone } from '../lib/phoneStorage'
import {
  isValidPhilippineMobileNumber,
  normalizePhilippineMobileNumber,
  sanitizePhilippineMobileInput,
} from '../lib/phoneValidation'

const props = defineProps({
  message: { type: String, default: '' },
})

const emit = defineEmits(['play-again'])

const displayMessage = computed(() => props.message || 'You filled a winning line — nice work!')

const phoneNumber = ref('')
const phoneError = ref('')
const apiError = ref('')
const isSubmitting = ref(false)

const phoneValid = computed(() => isValidPhilippineMobileNumber(phoneNumber.value))

const handlePhoneInput = () => {
  phoneNumber.value = sanitizePhilippineMobileInput(phoneNumber.value)
}

const tryPlayAgain = async () => {
  phoneError.value = ''
  apiError.value = ''
  handlePhoneInput()
  if (!isValidPhilippineMobileNumber(phoneNumber.value)) {
    phoneError.value = 'Please enter a valid 10-digit mobile number.'
    return
  }

  isSubmitting.value = true
  try {
    const normalizedPhone = normalizePhilippineMobileNumber(phoneNumber.value)
    await postGameLogin(normalizedPhone)
    saveStoredPhone(normalizedPhone)
    emit('play-again')
  } catch (error) {
    if (error instanceof Error && error.code === 'PHONE_EXISTS') {
      apiError.value = error.message
      return
    }
    const messageText = error instanceof Error ? error.message : 'Verification failed. Try again.'
    apiError.value = messageText
  } finally {
    isSubmitting.value = false
  }
}

const CONFETTI_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#ec4899', '#a855f7', '#fbbf24', '#14b8a6']

const confettiPieces = ref([])

function buildConfettiPieces() {
  const count = 56
  const pieces = []
  for (let index = 0; index < count; index++) {
    pieces.push({
      id: index,
      leftPct: Math.random() * 100,
      delayS: Math.random() * 0.35,
      durationS: 1.8 + Math.random() * 1.4,
      driftPx: (Math.random() - 0.5) * 140,
      spinDeg: 360 + Math.random() * 540,
      color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    })
  }
  return pieces
}

/**
 * Short celebratory fanfare + piñata "pop" cluster using Web Audio (no asset files).
 */
function playCelebrationSounds() {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) {
    return
  }

  const audioContext = new AudioContextClass()
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {})
  }

  const masterGain = audioContext.createGain()
  masterGain.gain.value = 0.11
  masterGain.connect(audioContext.destination)

  const scheduleTone = (frequencyHz, startTime, durationSec, type = 'triangle') => {
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequencyHz, startTime)
    gainNode.gain.setValueAtTime(0.0001, startTime)
    gainNode.gain.exponentialRampToValueAtTime(0.2, startTime + 0.02)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec)
    oscillator.connect(gainNode)
    gainNode.connect(masterGain)
    oscillator.start(startTime)
    oscillator.stop(startTime + durationSec + 0.05)
  }

  // Fanfare: ascending festive notes (major-ish arpeggio)
  const fanfareFreqs = [523.25, 659.25, 783.99, 1046.5, 1318.51]
  const step = 0.11
  let time = audioContext.currentTime + 0.05
  for (let index = 0; index < fanfareFreqs.length; index++) {
    scheduleTone(fanfareFreqs[index], time, 0.22, 'triangle')
    time += step
  }

  // Piñata "pops" — quick noise-like bursts (stacked detuned squares)
  const popTimes = [0.65, 0.72, 0.82, 0.9]
  for (let popIndex = 0; popIndex < popTimes.length; popIndex++) {
    const popStart = audioContext.currentTime + popTimes[popIndex]
    scheduleTone(880 + popIndex * 40, popStart, 0.06, 'square')
    scheduleTone(660 + popIndex * 30, popStart + 0.015, 0.05, 'square')
  }

  setTimeout(() => {
    audioContext.close().catch(() => {})
  }, 2200)
}

onMounted(() => {
  const savedPhone = loadStoredPhone()
  if (savedPhone) {
    phoneNumber.value = sanitizePhilippineMobileInput(savedPhone)
  }
  confettiPieces.value = buildConfettiPieces()
  playCelebrationSounds()
})
</script>

<style scoped>
.bingo-win-overlay {
  animation: bingo-overlay-in 0.35s ease-out;
}

@keyframes bingo-overlay-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.bingo-win-fx {
  z-index: 0;
}

/* Balloons sit mid-screen at sides so they stay visible next to the dialog */

.bingo-confetti-piece {
  position: absolute;
  top: -8%;
  width: 9px;
  height: 14px;
  border-radius: 2px;
  opacity: 0.95;
  animation-name: bingo-confetti-fall;
  animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  animation-fill-mode: forwards;
  will-change: transform, top, opacity;
}

@keyframes bingo-confetti-fall {
  0% {
    top: -5%;
    opacity: 1;
    transform: translate3d(0, 0, 0) rotate(0deg);
  }
  100% {
    top: 110%;
    opacity: 0.85;
    transform: translate3d(var(--drift, 0px), 0, 0) rotate(var(--spin, 720deg));
  }
}

.bingo-balloon {
  position: absolute;
  top: 22%;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: bingo-balloon-float 3.2s ease-in-out infinite;
}

.bingo-balloon--a {
  left: max(0.5rem, 2vw);
  animation-delay: 0s;
}

.bingo-balloon--b {
  left: min(18%, 6rem);
  top: 38%;
  animation-delay: 0.4s;
}

.bingo-balloon--c {
  right: min(16%, 5.5rem);
  top: 26%;
  animation-delay: 0.2s;
}

.bingo-balloon--d {
  right: max(0.5rem, 2vw);
  top: 40%;
  animation-delay: 0.55s;
}

@media (max-width: 520px) {
  .bingo-balloon--b {
    left: 4%;
  }

  .bingo-balloon--c {
    right: 4%;
  }
}

.bingo-balloon-bubble {
  width: 52px;
  height: 64px;
  border-radius: 50% 50% 48% 48%;
  box-shadow: inset -6px -8px 0 rgba(0, 0, 0, 0.08);
}

.bingo-balloon--a .bingo-balloon-bubble {
  background: linear-gradient(135deg, #fb7185, #e11d48);
}

.bingo-balloon--b .bingo-balloon-bubble {
  background: linear-gradient(135deg, #34d399, #059669);
}

.bingo-balloon--c .bingo-balloon-bubble {
  background: linear-gradient(135deg, #60a5fa, #2563eb);
}

.bingo-balloon--d .bingo-balloon-bubble {
  background: linear-gradient(135deg, #fbbf24, #d97706);
}

.bingo-balloon-string {
  width: 2px;
  height: 56px;
  margin-top: -2px;
  background: linear-gradient(180deg, rgba(60, 40, 20, 0.55), rgba(60, 40, 20, 0.2));
  border-radius: 1px;
}

@keyframes bingo-balloon-float {
  0%,
  100% {
    transform: translateY(0) rotate(-2deg);
  }
  50% {
    transform: translateY(-18px) rotate(3deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .bingo-confetti-piece {
    animation: none;
    opacity: 0;
  }

  .bingo-balloon {
    animation: none;
  }

  .bingo-win-overlay {
    animation: none;
  }
}
</style>
