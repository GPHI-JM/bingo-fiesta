import Phaser from 'phaser'
import { useBingoStore } from '../store/gameStore'
import { pinia } from '../store/pinia'

/** Anime-style poof: bright whites and cool grays (Kage Bunshin read) */
const SMOKE_COLORS_CORE = [0xffffff, 0xf8fafc, 0xf1f5f9, 0xe8eef5]
const SMOKE_COLORS_EDGE = [0xd1d5db, 0xcbd5e1, 0x9ca3af]

const BOUNCE_DURATION_MS = 680
const BOUNCE_LIFT_PX = 56
/** Pause after bounce before the ball hides and smoke pops */
const SMOKE_POP_DELAY_MS = 1000
const SMOKE_TO_FADE_DELAY_MS = 780
const BALL_FADE_IN_DURATION_MS = 1500

export default class BingoScene extends Phaser.Scene {
  constructor() {
    super('BingoScene')
    this.store = null
    this.storeUnsubscribe = null
    this.syncBallLayoutBound = null
    this.ballAnimSequenceId = 0
  }

  preload() {
    // no assets required
  }

  create() {
    this.store = useBingoStore(pinia)
    this.lastBallNumber = null

    this.syncBallLayoutBound = () => {
      this.syncBallLayout()
    }
    this.scale.on('resize', this.syncBallLayoutBound)

    this.ballShadow = this.add.ellipse(0, 0, 78, 24, 0x020617, 0.25)
    this.ballGlow = this.add.circle(0, 0, 43, 0xfb7185, 0.18)
    this.ballOuter = this.add.circle(0, 0, 36, 0xdc2626, 1)
    this.ballInner = this.add.circle(0, 0, 30, 0xf87171, 1)
    this.ballHighlight = this.add.circle(0, 0, 10, 0xffffff, 0.3)
    this.ballNum = this.add
      .text(0, 0, '--', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '30px',
        color: '#ffffff',
        stroke: '#7f1d1d',
        strokeThickness: 5,
        shadow: {
          offsetX: 0,
          offsetY: 3,
          color: '#7f1d1d',
          blur: 6,
          fill: true,
        },
      })
      .setOrigin(0.5)

    // Stack: shadow → glow → sphere → highlight → SMOKE → digit
    this.ballShadow.setDepth(2)
    this.ballGlow.setDepth(8)
    this.ballOuter.setDepth(10)
    this.ballInner.setDepth(11)
    this.ballHighlight.setDepth(12)
    this.ballNum.setDepth(14)

    this.syncBallLayout()

    this.updateBallDisplay()

    this.storeUnsubscribe = this.store.$subscribe(() => {
      this.updateBallDisplay()
    })

    this.events.once('shutdown', () => {
      this.scale.off('resize', this.syncBallLayoutBound)
      this.syncBallLayoutBound = null
      if (typeof this.storeUnsubscribe === 'function') {
        this.storeUnsubscribe()
        this.storeUnsubscribe = null
      }
    })
  }

  syncBallLayout() {
    this.centerX = this.scale.width / 2
    this.centerY = this.scale.height / 2

    this.ballShadow.setPosition(this.centerX, this.centerY + 26)
    this.ballGlow.setPosition(this.centerX, this.centerY)
    this.ballOuter.setPosition(this.centerX, this.centerY)
    this.ballInner.setPosition(this.centerX, this.centerY - 2)
    this.ballHighlight.setPosition(this.centerX - 12, this.centerY - 14)
    this.ballNum.setPosition(this.centerX, this.centerY)
  }

  setBallLayerAlphasForVisibleState() {
    this.ballShadow.setAlpha(0.25)
    this.ballGlow.setAlpha(1)
    this.ballOuter.setAlpha(1)
    this.ballInner.setAlpha(1)
    this.ballHighlight.setAlpha(0.3)
    this.ballNum.setAlpha(1)
  }

  setBallLayerAlphasHidden() {
    this.ballShadow.setAlpha(0)
    this.ballGlow.setAlpha(0)
    this.ballOuter.setAlpha(0)
    this.ballInner.setAlpha(0)
    this.ballHighlight.setAlpha(0)
    this.ballNum.setAlpha(0)
  }

  getBallTweenTargets() {
    return [this.ballGlow, this.ballOuter, this.ballInner, this.ballHighlight, this.ballNum]
  }

  /**
   * Phase 2: smoke (after bounce). More visible when `enhanced` is true.
   */
  spawnNinjaSmokePuff(enhanced = false) {
    if (!this.canUpdateBallGraphics()) {
      return
    }

    const smokeDepthOnBall = 13
    const alphaBoost = enhanced ? 0.22 : 0
    const scaleBoost = enhanced ? 0.35 : 0
    const durationBoost = enhanced ? 90 : 0

    const spawnOneSmokeCircle = (startX, startY, radius, fillColor, startAlpha, tweenConfig) => {
      const smokeCircle = this.add.circle(startX, startY, radius, fillColor, Math.min(1, startAlpha + alphaBoost))
      smokeCircle.setDepth(smokeDepthOnBall)
      smokeCircle.setBlendMode(Phaser.BlendModes.SCREEN)
      this.tweens.add({
        targets: smokeCircle,
        onComplete: () => {
          smokeCircle.destroy()
        },
        ...tweenConfig,
      })
    }

    const coreRadius = enhanced ? 32 : 26
    const coreAlpha = enhanced ? 0.88 : 0.72
    const corePuff = this.add.circle(this.centerX, this.centerY, coreRadius, 0xffffff, coreAlpha)
    corePuff.setDepth(smokeDepthOnBall)
    corePuff.setBlendMode(Phaser.BlendModes.SCREEN)
    this.tweens.add({
      targets: corePuff,
      scaleX: 2.8 + scaleBoost,
      scaleY: 2.4 + scaleBoost,
      alpha: 0,
      duration: 380 + durationBoost,
      ease: 'Quad.easeOut',
      onComplete: () => {
        corePuff.destroy()
      },
    })

    const waveAParticleCount = enhanced ? 22 : 14
    for (let particleIndex = 0; particleIndex < waveAParticleCount; particleIndex++) {
      const angle = (Math.PI * 2 * particleIndex) / waveAParticleCount + Phaser.Math.FloatBetween(-0.2, 0.2)
      const startOffset = Phaser.Math.FloatBetween(6, 14)
      const startX = this.centerX + Math.cos(angle) * startOffset
      const startY = this.centerY + Math.sin(angle) * startOffset * 0.72
      const burstDistance = Phaser.Math.FloatBetween(42, 58)
      const endX = this.centerX + Math.cos(angle) * burstDistance
      const endY = this.centerY + Math.sin(angle) * burstDistance * 0.72 - Phaser.Math.FloatBetween(10, 26)
      const fillColor = Phaser.Utils.Array.GetRandom(SMOKE_COLORS_CORE)
      const particleRadius = Phaser.Math.FloatBetween(8, 15)
      const startA = Phaser.Math.FloatBetween(0.52, 0.72) + alphaBoost
      spawnOneSmokeCircle(startX, startY, particleRadius, fillColor, startA, {
        x: endX,
        y: endY,
        alpha: 0,
        scaleX: 2.2 + scaleBoost,
        scaleY: 2 + scaleBoost,
        duration: Phaser.Math.Between(280, 400) + durationBoost,
        ease: 'Quad.easeOut',
      })
    }

    const waveBDelayMs = enhanced ? 85 : 70
    const waveBParticleCount = enhanced ? 16 : 10
    this.time.delayedCall(waveBDelayMs, () => {
      if (!this.canUpdateBallGraphics()) {
        return
      }
      for (let particleIndex = 0; particleIndex < waveBParticleCount; particleIndex++) {
        const angle = (Math.PI * 2 * particleIndex) / waveBParticleCount + Phaser.Math.FloatBetween(-0.4, 0.4)
        const startOffset = Phaser.Math.FloatBetween(10, 28)
        const startX = this.centerX + Math.cos(angle) * startOffset
        const startY = this.centerY + Math.sin(angle) * startOffset * 0.65
        const fillColor = Phaser.Utils.Array.GetRandom(SMOKE_COLORS_EDGE)
        const particleRadius = Phaser.Math.FloatBetween(6, 13)
        const startA = Phaser.Math.FloatBetween(0.38, 0.58) + alphaBoost
        const driftX = Phaser.Math.FloatBetween(-24, 24) + Math.cos(angle) * 14
        const driftY = Phaser.Math.FloatBetween(-52, -24)
        spawnOneSmokeCircle(startX, startY, particleRadius, fillColor, startA, {
          x: startX + driftX,
          y: startY + driftY,
          alpha: 0,
          scaleX: 2.8 + scaleBoost,
          scaleY: 2.5 + scaleBoost,
          duration: Phaser.Math.Between(480, 640) + durationBoost,
          ease: 'Cubic.easeOut',
        })
      }
    })
  }

  fadeInBallGraphicsOverDuration(durationMs) {
    const ease = 'Sine.easeOut'
    this.tweens.add({
      targets: this.ballShadow,
      alpha: 0.25,
      duration: durationMs,
      ease,
    })
    this.tweens.add({
      targets: this.ballGlow,
      alpha: 1,
      duration: durationMs,
      ease,
    })
    this.tweens.add({
      targets: this.ballOuter,
      alpha: 1,
      duration: durationMs,
      ease,
    })
    this.tweens.add({
      targets: this.ballInner,
      alpha: 1,
      duration: durationMs,
      ease,
    })
    this.tweens.add({
      targets: this.ballHighlight,
      alpha: 0.3,
      duration: durationMs,
      ease,
    })
    this.tweens.add({
      targets: this.ballNum,
      alpha: 1,
      duration: durationMs,
      ease,
      onComplete: () => {
        this.syncBallLayout()
        this.setBallLayerAlphasForVisibleState()
      },
    })
  }

  /**
   * 1) Ball bounce in (visible)
   * 2) Smoke out (enhanced)
   * 3) Ball fades in over 1.5s
   */
  animateBallPop() {
    if (!this.canUpdateBallGraphics()) {
      return
    }

    this.ballAnimSequenceId += 1
    const sequenceId = this.ballAnimSequenceId

    const ballTweenTargets = this.getBallTweenTargets()
    const shadowOnly = [this.ballShadow]
    this.tweens.killTweensOf([...ballTweenTargets, ...shadowOnly])
    ballTweenTargets.forEach((ballPart) => {
      ballPart.setScale(1)
    })

    this.syncBallLayout()
    this.setBallLayerAlphasForVisibleState()

    const baseY = {
      glow: this.centerY,
      outer: this.centerY,
      inner: this.centerY - 2,
      highlight: this.centerY - 14,
      text: this.centerY,
      shadow: this.centerY + 26,
    }

    this.ballGlow.y = baseY.glow
    this.ballOuter.y = baseY.outer
    this.ballInner.y = baseY.inner
    this.ballHighlight.y = baseY.highlight
    this.ballNum.y = baseY.text
    this.ballShadow.y = baseY.shadow

    const bounceEase = 'Sine.easeInOut'

    this.tweens.add({
      targets: this.ballGlow,
      y: baseY.glow - BOUNCE_LIFT_PX,
      duration: BOUNCE_DURATION_MS,
      yoyo: true,
      ease: bounceEase,
    })
    this.tweens.add({
      targets: this.ballOuter,
      y: baseY.outer - BOUNCE_LIFT_PX,
      duration: BOUNCE_DURATION_MS,
      yoyo: true,
      ease: bounceEase,
    })
    this.tweens.add({
      targets: this.ballInner,
      y: baseY.inner - BOUNCE_LIFT_PX,
      duration: BOUNCE_DURATION_MS,
      yoyo: true,
      ease: bounceEase,
    })
    this.tweens.add({
      targets: this.ballHighlight,
      y: baseY.highlight - BOUNCE_LIFT_PX,
      duration: BOUNCE_DURATION_MS,
      yoyo: true,
      ease: bounceEase,
    })
    this.tweens.add({
      targets: this.ballNum,
      y: baseY.text - BOUNCE_LIFT_PX,
      duration: BOUNCE_DURATION_MS,
      yoyo: true,
      ease: bounceEase,
    })
    this.tweens.add({
      targets: this.ballShadow,
      y: baseY.shadow - BOUNCE_LIFT_PX * 0.35,
      duration: BOUNCE_DURATION_MS,
      yoyo: true,
      ease: bounceEase,
    })

    this.tweens.add({
      targets: ballTweenTargets,
      scale: { from: 1, to: 1.18 },
      duration: BOUNCE_DURATION_MS,
      yoyo: true,
      ease: bounceEase,
    })

    const bounceTotalMs = BOUNCE_DURATION_MS * 2

    this.time.delayedCall(bounceTotalMs, () => {
      if (sequenceId !== this.ballAnimSequenceId) {
        return
      }
      if (!this.canUpdateBallGraphics()) {
        return
      }

      this.time.delayedCall(SMOKE_POP_DELAY_MS, () => {
        if (sequenceId !== this.ballAnimSequenceId) {
          return
        }
        if (!this.canUpdateBallGraphics()) {
          return
        }

        this.setBallLayerAlphasHidden()
        this.spawnNinjaSmokePuff(true)

        this.time.delayedCall(SMOKE_TO_FADE_DELAY_MS, () => {
          if (sequenceId !== this.ballAnimSequenceId) {
            return
          }
          if (!this.canUpdateBallGraphics()) {
            return
          }
          this.syncBallLayout()
          this.fadeInBallGraphicsOverDuration(BALL_FADE_IN_DURATION_MS)
        })
      })
    })
  }

  canUpdateBallGraphics() {
    if (!this.sys?.isActive()) {
      return false
    }
    if (!this.ballNum || !this.ballNum.active || this.ballNum.scene !== this) {
      return false
    }
    return true
  }

  updateBallDisplay() {
    if (!this.canUpdateBallGraphics()) {
      return
    }
    const ballValue = this.store?.currentBall?.number ?? '--'
    this.ballNum.setText(ballValue.toString())
    if (this.store?.currentBall?.number && this.store.currentBall.number !== this.lastBallNumber) {
      this.lastBallNumber = this.store.currentBall.number
      this.animateBallPop()
    }
  }
}
