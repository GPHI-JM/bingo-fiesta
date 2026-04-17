<template>
  <div class="rounded-xl p-3 bg-slate-50 shadow-inner border border-slate-300 max-w-lg">
    <div class="grid grid-cols-5 gap-2 text-sm font-bold mb-2">
      <div class="text-center text-blue-700">B</div>
      <div class="text-center text-emerald-700">I</div>
      <div class="text-center text-orange-600">N</div>
      <div class="text-center text-cyan-700">G</div>
      <div class="text-center text-rose-700">O</div>
    </div>
    <div class="grid grid-cols-5 gap-2">
      <div
        v-for="(row, r) in card"
        :key="`row-${r}`"
        class="contents"
      >
        <div
          v-for="(cell, c) in row"
          :key="`cell-${r}-${c}`"
          class="h-14 flex items-center justify-center text-lg font-semibold rounded-md border cursor-pointer relative select-none transition-all duration-200"
          :class="[
            marks[r][c]
              ? 'bg-gradient-to-br from-red-500 to-red-700 text-white border-red-600 font-bold shadow-lg ring-2 ring-red-300'
              : cell !== 'FREE' && calledBalls.some((b) => Number(b) === Number(cell))
              ? 'bg-indigo-600 text-white border-indigo-700 font-bold shadow-lg ring-2 ring-indigo-300 animate-pulse'
              : 'bg-white text-slate-800 border-slate-300',
            invalidCell && invalidCell.row === r && invalidCell.col === c ? 'animate-shake border-red-500' : ''
          ]"
          @click="onCellClick(r, c)"
        >
          <span v-if="cell === 'FREE'">FREE</span>
          <span v-else>{{ cell }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  card: { type: Array, required: true },
  marks: { type: Array, required: true },
  calledBalls: { type: Array, required: true },
  invalidCell: { type: Object, default: null }
})
const emit = defineEmits(['cell-click'])

const onCellClick = (row, col) => {
  const value = props.card[row][col]
  if (value === 'FREE') return
  emit('cell-click', { row, col, number: value })
}
</script>
