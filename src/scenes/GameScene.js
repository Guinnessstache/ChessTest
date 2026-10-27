// Starter scene: a jumping player collects coins on platforms.
// All art is generated in code so the game works with zero asset files.
// To use real art, put PNGs in /assets and load them in preload().

import { Fx } from '../fx.js'

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

    this.platforms = this.physics.add.staticGroup()
    for (let x = 32; x < 960; x += 64) this.platforms.create(x, 530, 'ground')
    ;[[200, 400], [460, 320], [720, 240], [300, 200]].forEach(([x, y]) => {
      for (let i = 0; i < 3; i++) this.platforms.create(x + i * 64, y, 'ground')
    })

    this.player = this.physics.add.sprite(100, 450, 'player')
    this.player.setCollideWorldBounds(true)
    this.physics.add.collider(this.player, this.platforms)

    // Jump state: 2 jumps available, refreshed whenever the player is grounded.
    this.maxJumps = 2
    this.jumpsUsed = 0

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
    })
    this.add.text(16, 48, 'Arrows / WASD to move, Up / W / Space to jump (press again in mid-air to double jump)', {
      fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#9fb0cc'
    })

    this.jumpPips = []
    for (let i = 0; i < this.maxJumps; i++) {
      const x = 920 - (this.maxJumps - 1 - i) * 26
      this.jumpPips.push(this.add.circle(x, 28, 9, 0x4cc9f0).setAlpha(0.35))
    }
    this.refreshJumpUi()

    this.cursors = this.input.keyboard.createCursorKeys()
    this.keys = this.input.keyboard.addKeys('W,A,D,SPACE')
  }

  spawnCoins() {
    ;[[230, 360], [520, 280], [780, 200], [360, 160], [600, 480], [880, 480]].forEach(([x, y]) => {
      const c = this.coins.get(x, y, 'coin')
      c.enableBody(true, x, y, true, true)
    })
  }

  update() {
    const left = this.cursors.left.isDown || this.keys.A.isDown
    const right = this.cursors.right.isDown || this.keys.D.isDown

    if (this.player.body.blocked.down && this.jumpsUsed !== 0) {
      this.jumpsUsed = 0
      this.refreshJumpUi()
    }

    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.keys.W) ||
      Phaser.Input.Keyboard.JustDown(this.keys.SPACE)

    if (left) this.player.setVelocityX(-260)
    else if (right) this.player.setVelocityX(260)
    else this.player.setVelocityX(0)

    if (jumpPressed && this.jumpsUsed < this.maxJumps) {
      const isDoubleJump = this.jumpsUsed > 0
      this.jumpsUsed++
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
