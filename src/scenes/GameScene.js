// Starter scene: a jumping player collects coins on platforms.
// All art is generated in code so the game works with zero asset files.
// To use real art, put PNGs in /assets and load them in preload().

import { Fx } from '../fx.js'
import { Rain } from '../rain.js'

// HUD sits above every rain layer (front streaks are depth 200).
const HUD_DEPTH = 400

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene')
  }

  preload() {
    const g = this.make.graphics({ x: 0, y: 0, add: false })
    g.fillStyle(0x4cc9f0).fillRoundedRect(0, 0, 32, 40, 6)
    g.generateTexture('player', 32, 40)
    g.clear().fillStyle(0x3a4a6b).fillRect(0, 0, 64, 20)
    g.generateTexture('ground', 64, 20)
    g.clear().fillStyle(0xffd166).fillCircle(10, 10, 10)
    g.generateTexture('coin', 20, 20)
    g.destroy()
  }

  create() {
    this.score = 0
    this.fx = new Fx(this)

    // Top edges of every surface, so the rain can splash and ripple on them.
    const surfaces = [{ x: 0, y: 520, w: 960 }]

    this.platforms = this.physics.add.staticGroup()
    for (let x = 32; x < 960; x += 64) this.platforms.create(x, 530, 'ground')
    ;[[200, 400], [460, 320], [720, 240], [300, 200]].forEach(([x, y]) => {
      for (let i = 0; i < 3; i++) this.platforms.create(x + i * 64, y, 'ground')
      surfaces.push({ x: x - 32, y: y - 10, w: 192 })
    })

    this.rain = new Rain(this, surfaces)

    this.player = this.physics.add.sprite(100, 450, 'player')
    this.player.setCollideWorldBounds(true)
    this.physics.add.collider(this.player, this.platforms)

    // Jump state: 2 jumps available, refreshed whenever the player is grounded.
    this.maxJumps = 2
    this.jumpsUsed = 0
    // Coyote window: for a few frames after leaving the ground (e.g. walking off
    // a ledge) the first press still counts as a real ground jump.
    this.coyoteMs = 100
    this.lastGroundedAt = 0
    // Jump buffer: a press slightly before landing still fires on touchdown.
    this.bufferMs = 120
    this.jumpBufferedAt = -1000

    this.coins = this.physics.add.group({ allowGravity: false })
    this.spawnCoins()
    this.physics.add.overlap(this.player, this.coins, (_p, coin) => {
      coin.disableBody(true, true)
      this.score += 10
      this.scoreText.setText(`Score: ${this.score}`)
      if (this.coins.countActive(true) === 0) this.spawnCoins()
    })

    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      fontFamily: 'system-ui, sans-serif', fontSize: '24px', color: '#ffffff'
    }).setDepth(HUD_DEPTH)
    this.add.text(16, 48, 'Arrows / WASD to move, Up / W / Space to jump (press again in mid-air to double jump), R for rain', {
      fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#9fb0cc'
    }).setDepth(HUD_DEPTH)

    this.jumpPips = []
    for (let i = 0; i < this.maxJumps; i++) {
      const x = 920 - (this.maxJumps - 1 - i) * 26
      this.jumpPips.push(this.add.circle(x, 28, 9, 0x4cc9f0).setAlpha(0.35).setDepth(HUD_DEPTH))
    }
    this.refreshJumpUi()

    this.cursors = this.input.keyboard.createCursorKeys()
    this.keys = this.input.keyboard.addKeys('W,A,D,SPACE,R')
    this.input.keyboard.on('keydown-R', () => {
      const on = this.rain.toggle()
      this.weatherText.setText(on ? 'Weather: rain' : 'Weather: clear')
    })

    this.weatherText = this.add.text(16, 70, 'Weather: rain', {
      fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#9fb0cc'
    }).setDepth(HUD_DEPTH)
  }

  spawnCoins() {
    ;[[230, 360], [520, 280], [780, 200], [360, 160], [600, 480], [880, 480]].forEach(([x, y]) => {
      const c = this.coins.get(x, y, 'coin')
      c.enableBody(true, x, y, true, true)
    })
  }

  update(time, delta) {
    this.rain.update(time, delta)

    const left = this.cursors.left.isDown || this.keys.A.isDown
    const right = this.cursors.right.isDown || this.keys.D.isDown
    const grounded = this.player.body.blocked.down
    const inCoyote = time - this.lastGroundedAt < this.coyoteMs

    if (grounded) {
      this.lastGroundedAt = time
      if (this.jumpsUsed !== 0) {
        this.jumpsUsed = 0
        this.refreshJumpUi()
      }
    } else if (this.jumpsUsed === 0 && !inCoyote) {
      // Walked or fell off a ledge: the ground jump is spent, one air jump left.
      this.jumpsUsed = 1
      this.refreshJumpUi()
    }

    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.keys.W) ||
      Phaser.Input.Keyboard.JustDown(this.keys.SPACE)
    if (jumpPressed) this.jumpBufferedAt = time

    if (left) this.player.setVelocityX(-260)
    else if (right) this.player.setVelocityX(260)
    else this.player.setVelocityX(0)

    // A press is honoured for a moment after release, so jumping the instant
    // you touch down (chaining double jumps) never feels dropped.
    const buffered = time - this.jumpBufferedAt < this.bufferMs
    const canGroundJump = grounded || inCoyote
    const wantAirJump = this.jumpsUsed > 0

    if (buffered && this.jumpsUsed < this.maxJumps && (wantAirJump || canGroundJump)) {
      const isDoubleJump = this.jumpsUsed > 0
      this.jumpsUsed++
      this.jumpBufferedAt = -1000
      this.refreshJumpUi()
      this.player.setVelocityY(isDoubleJump ? -460 : -520)
      if (isDoubleJump) this.fx.doubleJump(this.player)
    }
  }

  // Jump pips in the top-right: lit while that jump is still available.
  refreshJumpUi() {
    const left = this.maxJumps - this.jumpsUsed
    this.jumpPips.forEach((pip, i) => {
      pip.setAlpha(i < left ? 1 : 0.22)
      pip.setScale(i < left ? 1 : 0.8)
    })
  }
}
