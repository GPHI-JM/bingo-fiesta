<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-3 py-3 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6"
      @click.self="emit('close')"
    >
      <div class="fiesta-panel relative my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-[92vw] overflow-y-auto rounded-[24px] p-4 shadow-2xl sm:max-w-sm sm:rounded-[28px] sm:p-6">
        <h2 class="fiesta-panel-title mb-1 text-xl sm:text-2xl">Add Free Card</h2>
        <p class="mb-4 text-sm font-medium leading-snug text-amber-900/70 sm:mb-5">
          Enter your Philippine mobile number to unlock a second bingo card free of charge.
        </p>

        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-amber-950">
              Phone Number
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
              @keyup.enter="submitPhone"
            />
          </div>
          <p v-if="phoneError" class="text-xs font-bold text-red-600">{{ phoneError }}</p>
          <button
            type="button"
            @click="submitPhone"
            :disabled="isSubmitting"
            class="w-full rounded-2xl bg-amber-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-amber-200 disabled:text-amber-900/50"
          >
            {{ isSubmitting ? 'Verifying...' : 'Add free card' }}
          </button>
        </div>

        <button
          type="button"
          @click="emit('close')"
          class="absolute right-3 top-3 rounded-full p-1 text-amber-900/50 transition hover:text-amber-950"
          aria-label="Close"
        >
          x
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { postGameLogin } from '../lib/gameLoginApi'
import { loadStoredPhone, saveStoredPhone } from '../lib/phoneStorage'
import {
  isValidPhilippineMobileNumber,
  normalizePhilippineMobileNumber,
  sanitizePhilippineMobileInput,
} from '../lib/phoneValidation'

const props = defineProps({
  gameId: {
    type: [String, Number],
    default: '',
  },
  gameIconPath: {
    type: String,
    default: '',
  },
  points: {
    type: [String, Number],
    default: 0,
  },
})

const emit = defineEmits(['close', 'verified'])

const phoneNumber = ref('')
const phoneError = ref('')
const isSubmitting = ref(false)

onMounted(() => {
  const saved = loadStoredPhone()
  if (saved) {
    phoneNumber.value = sanitizePhilippineMobileInput(saved)
  }
})

const handlePhoneInput = () => {
  phoneNumber.value = sanitizePhilippineMobileInput(phoneNumber.value)
}

const submitPhone = async () => {
  phoneError.value = ''
  handlePhoneInput()
  if (!isValidPhilippineMobileNumber(phoneNumber.value)) {
    phoneError.value = 'Please enter a valid Philippine mobile number starting with 9.'
    return
  }

  isSubmitting.value = true
  try {
    const normalizedPhone = normalizePhilippineMobileNumber(phoneNumber.value)
    await postGameLogin(normalizedPhone, {
      gameId: props.gameId,
      gameIconPath: props.gameIconPath,
      points: props.points,
    })
    saveStoredPhone(normalizedPhone)
    emit('verified')
  } catch (error) {
    if (error instanceof Error && error.code === 'PHONE_EXISTS') {
      phoneError.value = error.message
      return
    }
    phoneError.value = error instanceof Error ? error.message : 'Verification failed. Try again.'
  } finally {
    isSubmitting.value = false
  }
}
</script>
