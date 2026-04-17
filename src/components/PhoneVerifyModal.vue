<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      @click.self="emit('close')"
    >
      <div class="fiesta-panel relative w-full max-w-sm rounded-[28px] p-6 mx-4 shadow-2xl">
        <h2 class="fiesta-panel-title mb-1">Add Free Card</h2>
        <p class="mb-5 text-sm text-amber-900/70 font-medium">
          Enter your phone number to unlock a second bingo card — free of charge!
        </p>

        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-amber-950">
              Phone Number
            </label>
            <input
              v-model="phoneNumber"
              type="tel"
              placeholder="+1 555 000 0000"
              class="w-full rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 font-semibold placeholder:text-amber-400 focus:border-amber-500 focus:outline-none"
              @keyup.enter="submitPhone"
            />
          </div>
          <p v-if="phoneError" class="text-xs font-bold text-red-600">{{ phoneError }}</p>
          <button
            type="button"
            @click="submitPhone"
            class="w-full rounded-2xl bg-amber-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-amber-400"
          >
            Add free card
          </button>
        </div>

        <button
          type="button"
          @click="emit('close')"
          class="absolute right-4 top-4 rounded-full p-1 text-amber-900/50 hover:text-amber-950 transition"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { loadStoredPhone, saveStoredPhone } from '../lib/phoneStorage'

const emit = defineEmits(['close', 'verified'])

const phoneNumber = ref('')
const phoneError = ref('')

const validatePhoneNumber = (phone) => {
  const digitsOnly = phone.replace(/\D/g, '')
  return digitsOnly.length >= 7
}

onMounted(() => {
  const saved = loadStoredPhone()
  if (saved) {
    phoneNumber.value = saved
  }
})

const submitPhone = () => {
  phoneError.value = ''
  if (!validatePhoneNumber(phoneNumber.value)) {
    phoneError.value = 'Please enter a valid phone number.'
    return
  }
  saveStoredPhone(phoneNumber.value)
  emit('verified')
}
</script>
