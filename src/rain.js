// Code-generated rain: pooled streak sprites in three parallax layers, wandering
// wind that drifts and tilts them, splash droplets + ripple rings where they land,
// and an occasional lightning flash. No asset files, no particle API needed.

const DROPS = { back: 70, mid: 90, front: 26 }
const SPLASH_BUDGET = 26 // max splash droplets spawned per second

export class Rain {
  // surfaces: [{ x, y, w }] world-space top edges the rain can land on.
  constructor(scene, surfaces = []) {
    this.scene = scene
    this.surfaces = surfaces.length ? surfaces : [{ x: 0, y: scene.scale.height, w: scene.scale.width }]
    this.enabled = true
    this.wind = 0 // -1 (left) .. 1 (right)
    this.windPhase = Math.random() * Math.PI * 2
    this.splashCooldown = 0

    this.makeTextures()

    this.drops = []
    this.addLayer('back', DROPS.back, { depth: -30, alpha: 0.35, speed: [620, 780], scale: [0.45, 0.7] })
    this.addLayer('mid', DROPS.mid, { depth: 10, alpha: 0.7, speed: [900, 1150], scale: [0.8, 1.15] })
    this.addLayer('front', DROPS.front, { depth: 200, alpha: 0.18, speed: [1300, 1550], scale: [1.7, 2.4] })

    this.flash = scene.add.rectangle(
      scene.scale.width / 2, scene.scale.height / 2, scene.scale.width, scene.scale.height,
      0xdff4ff, 1
    ).setDepth(300).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0)

    this.lightningTimer = scene.time.addEvent({
      delay: Phaser.Math.Between(7000, 14000),
      loop: true,
      callback: () => {
        this.strike()
        if (this.lightningTimer) this.lightningTimer.delayToNextCall(Phaser.Math.Between(9000, 20000))
      }
    })
  }

  makeTextures() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false })
    // Streak: soft body with a brighter core.
    g.fillStyle(0xbfe4ff, 0.35).fillRect(1, 0, 2, 26)
    g.fillStyle(0xffffff, 0.9).fillRect(1.4, 6, 1.2, 18)
    g.generateTexture('rain-streak', 4, 26)
    // Splash droplet.
    g.clear().fillStyle(0xdff4ff, 1).fillCircle(3, 3, 3)
    g.generateTexture('rain-splash', 6, 6)
    // Ripple ring that spreads across a wet surface.
    g.clear().lineStyle(2, 0xcfeeff, 1).strokeEllipse(24, 8, 40, 12)
    g.generateTexture('rain-ripple', 48, 16)
    g.destroy()
  }

  addLayer(name, count, o) {
    const W = this.scene.scale.width
    for (let i = 0; i < count; i++) {
      const img = this.scene.add.image(0, 0, 'rain-streak')
        .setDepth(o.depth).setAlpha(o.alpha).setBlendMode(Phaser.BlendModes.ADD)
        .setScale(1, Phaser.Math.FloatBetween(o.scale[0], o.scale[1]))
      this.drops.push({
        img,
        layer: name,
        speed: Phaser.Math.Between(o.speed[0], o.speed[1]),
        x: Phaser.Math.Between(-60, W + 60),
        y: Phaser.Math.Between(-900, this.scene.scale.height),
        surface: this.pickSurface()
      })
    }
  }

  // Weighted so most rain lands on the big ground surface rather than platforms.
  pickSurface() {
    const total = this.surfaces.reduce((n, s) => n + s.w, 0)
    let r = Math.random() * total
    for (const s of this.surfaces) {
      r -= s.w
      if (r <= 0) return s
    }
    return this.surfaces[0]
  }

  resetDrop(d, startY) {
    const W = this.scene.scale.width
    d.surface = this.pickSurface()
    d.x = Phaser.Math.Between(-60, W + 60)
    d.y = startY !== undefined ? startY : Phaser.Math.Between(-400, -20)
    if (d.x < d.surface.x || d.x > d.surface.x + d.surface.w) {
      // Not over its landing surface: aim it at the ground instead.
      d.surface = this.surfaces[0]
    }
  }

  update(time, delta) {
    if (!this.enabled) return

    const dt = Math.min(delta, 50) / 1000
    this.windPhase += delta * 0.00026
    this.wind = Phaser.Math.Clamp(Math.sin(this.windPhase) * 0.75 + Math.sin(this.windPhase * 2.7) * 0.35, -1, 1)

    const windX = this.wind * 260
    const tilt = -Math.atan2(windX, 1050) // streaks lean into their travel direction
    this.splashCooldown -= delta

    for (const d of this.drops) {
      d.y += d.speed * dt
      d.x += windX * dt

      const s = d.surface
      if (d.y >= s.y - 8 && d.x >= s.x - 6 && d.x <= s.x + s.w + 6) {
        if (this.splashCooldown <= 0 && d.layer !== 'back') {
          this.splash(d.x, s.y - 6)
          this.splashCooldown = 1000 / SPLASH_BUDGET
        }
        this.resetDrop(d)
      } else if (d.y > this.scene.scale.height + 40) {
        this.resetDrop(d)
      }

      if (d.x < -80) d.x += this.scene.scale.width + 160
      else if (d.x > this.scene.scale.width + 80) d.x -= this.scene.scale.width + 160

      d.img.setPosition(d.x, d.y).setRotation(tilt)
    }
  }

  splash(x, y) {
    const s = this.scene
    const n = Phaser.Math.Between(1, 2)
    for (let i = 0; i < n; i++) {
      const p = s.add.image(x, y, 'rain-splash')
        .setDepth(5).setBlendMode(Phaser.BlendModes.ADD).setScale(Phaser.Math.FloatBetween(0.3, 0.7))
      s.tweens.add({
        targets: p,
        x: x + Phaser.Math.Between(-16, 16),
        y: y - Phaser.Math.Between(8, 22),
        alpha: 0,
        duration: Phaser.Math.Between(220, 380),
        ease: 'Quad.out',
        onComplete: () => p.destroy()
      })
    }

    // Every so often, leave a spreading ring on the wet surface.
    if (Math.random() < 0.18) {
      const r = s.add.image(x, y + 2, 'rain-ripple')
        .setDepth(4).setBlendMode(Phaser.BlendModes.ADD).setScale(0.15).setAlpha(0.45)
      s.tweens.add({
        targets: r, scale: 1, alpha: 0, duration: 520, ease: 'Sine.out',
        onComplete: () => r.destroy()
      })
    }
  }

  // Brief double-blink of lightning over the whole scene.
  strike() {
    if (!this.enabled) return
    const s = this.scene
    s.tweens.add({
      targets: this.flash, alpha: 0.45, duration: 60, yoyo: true, delay: 0,
      onComplete: () => {
        s.tweens.add({
          targets: this.flash, alpha: 0.22, duration: 70, delay: 110, yoyo: true,
          onComplete: () => this.flash.setAlpha(0)
        })
      }
    })
  }

  // R toggles the weather; drops already falling finish their fall.
  toggle() {
    this.enabled = !this.enabled
    if (this.enabled) {
      this.show()
      this.lightningTimer.resume()
    } else {
      this.lightningTimer.paused = true
      this.wind = 0
      this.drops.forEach((d) => d.img.setVisible(false))
    }
    return this.enabled
  }

  show() {
    this.drops.forEach((d) => d.img.setVisible(true))
  }
}
