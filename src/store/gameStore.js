import { defineStore } from 'pinia'

const range = (min, max) => Array.from({ length: max - min + 1 }, (_, i) => i + min)
const randomSample = (arr, count) => {
  const copy = [...arr]
  const selected = []
  while (selected.length < count && copy.length > 0) {
    const i = Math.floor(Math.random() * copy.length)
    selected.push(copy.splice(i, 1)[0])
  }
  return selected
}

const createCard = () => {
  const columns = [range(1, 15), range(16, 30), range(31, 45), range(46, 60), range(61, 75)]
  const card = Array.from({ length: 5 }, () => Array(5).fill(null))

  columns.forEach((colNumbers, colIndex) => {
    const values = randomSample(colNumbers, 5)
    for (let row = 0; row < 5; row++) {
      card[row][colIndex] = values[row]
    }
  })

  card[2][2] = 'FREE'
  return card
}

const emptyMarks = () => Array.from({ length: 5 }, () => Array(5).fill(false))

const pickRandom = (available) => {
  if (available.length === 0) return null
  const i = Math.floor(Math.random() * available.length)
  return available[i]
}

export const useBingoStore = defineStore('bingo', {
  state: () => ({
    calledBalls: [],
    playerCard: [],
    playerMarks: emptyMarks(),
    secondCard: null,
    secondMarks: null,
    currentBall: null,
    gameActive: false,
    playerWon: false,
    message: '',
  }),
  getters: {
    availableBalls: (state) => range(1, 75).filter((n) => !state.calledBalls.includes(n)),
    hasSecondCard: (state) => state.secondCard !== null,
    activeCardCount: (state) => (state.secondCard !== null ? 2 : 1),
  },
  actions: {
    resetMarks() {
      this.playerMarks = emptyMarks()
      this.playerMarks[2][2] = true
    },
    startGame() {
      this.calledBalls = []
      this.playerCard = createCard()
      this.secondCard = null
      this.secondMarks = null
      this.currentBall = null
      this.gameActive = true
      this.playerWon = false
      this.message = 'Game Started - Good Luck!'
      this.resetMarks()
    },
    addSecondCard() {
      this.secondCard = createCard()
      this.secondMarks = emptyMarks()
      this.secondMarks[2][2] = true

      // Auto-mark any balls already called on the new card
      for (const ball of this.calledBalls) {
        this.markByNumber(this.secondCard, this.secondMarks, ball)
      }
    },
    validateBingo(marks) {
      const size = 5
      // Rows
      for (let row = 0; row < size; row++) {
        if (marks[row].every((v) => v)) return true
      }
      // Cols
      for (let col = 0; col < size; col++) {
        let ok = true
        for (let row = 0; row < size; row++) {
          if (!marks[row][col]) {
            ok = false
            break
          }
        }
        if (ok) return true
      }
      // Diagonals
      let diag1 = true
      let diag2 = true
      for (let i = 0; i < size; i++) {
        if (!marks[i][i]) diag1 = false
        if (!marks[i][size - 1 - i]) diag2 = false
      }
      return diag1 || diag2
    },
    markByNumber(card, marks, number) {
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          if (card[row][col] === number) {
            marks[row][col] = true
          }
          if (card[row][col] === 'FREE') {
            marks[row][col] = true
          }
        }
      }
    },
    markPlayerCell(row, col) {
      if (!this.gameActive) return
      if (this.playerCard[row][col] === 'FREE') {
        this.playerMarks[row][col] = true
        return
      }
      const value = this.playerCard[row][col]
      if (this.calledBalls.includes(value)) {
        this.playerMarks[row][col] = true
      }
    },
    markSecondCardCell(row, col) {
      if (!this.gameActive || !this.secondCard) return
      if (this.secondCard[row][col] === 'FREE') {
        this.secondMarks[row][col] = true
        return
      }
      const value = this.secondCard[row][col]
      if (this.calledBalls.includes(value)) {
        this.secondMarks[row][col] = true
      }
    },
    pickRandomBall() {
      if (!this.gameActive) return
      const remaining = this.availableBalls
      if (remaining.length === 0) {
        this.message = 'All balls called - Game Over.'
        this.gameActive = false
        return
      }
      const ball = pickRandom(remaining)
      if (ball === null) return
      this.calledBalls.push(ball)
      this.currentBall = { number: ball }

      this.markByNumber(this.playerCard, this.playerMarks, ball)
      if (this.secondCard) {
        this.markByNumber(this.secondCard, this.secondMarks, ball)
      }

      const firstCardBingo = this.validateBingo(this.playerMarks)
      const secondCardBingo = this.secondCard ? this.validateBingo(this.secondMarks) : false

      if (firstCardBingo || secondCardBingo) {
        this.playerWon = true
        this.gameActive = false
        this.message = 'BINGO! You win!'
        return
      }
    },
    claimBingo() {
      if (!this.gameActive) return
      const firstCardBingo = this.validateBingo(this.playerMarks)
      const secondCardBingo = this.secondCard ? this.validateBingo(this.secondMarks) : false
      if (firstCardBingo || secondCardBingo) {
        this.playerWon = true
        this.gameActive = false
        this.message = 'BINGO! You claimed the win!'
      }
    },
  },
})
