// Small code-generated visual effects (no asset files needed).

export class Fx {
  constructor(scene) {
    this.scene = scene
    this.makeRingTexture()
  }

  makeRingTexture() {
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false })
    const size = 64
    g.lineStyle(5, 0xffffff, 1)
    g.strokeCircle(size / 2, size / 2, size / 2 - 3)
    g.generateTexture('fx-ring', size, size)
    g.destroy()
  }

  // Expanding ring + puff of dust under the player when they jump in mid-air.
  doubleJump(player) {
    const s = this.scene
    const x = player.x
    const y = player.y + player.displayHeight / 2 - 4

    const ring = s.add.image(x, y, 'fx-ring').setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.85)
    s.tweens.add({
      targets: ring,
      scale: { from: 0.35, to: 1.5 },
      alpha: 0,
      duration: 320,
      ease: 'Cubic.out',
      onComplete: () => ring.destroy()
    })

    for (let i = 0; i < 6; i++) {
      const puff = s.add.circle(
        x + Phaser.Math.Between(-10, 10),
        y + Phaser.Math.Between(-2, 4),
        Phaser.Math.Between(2, 5),
        0xbfe9ff,
        0.9
      )
      s.tweens.add({
        targets: puff,
        x: puff.x + Phaser.Math.Between(-26, 26),
        y: puff.y + Phaser.Math.Between(6, 22),
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(280, 460),
        ease: 'Quad.out',
        onComplete: () => puff.destroy()
      })
    }
  }
}
