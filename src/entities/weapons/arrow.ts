import {
  Canvas2DGraphicsRough,
  circleCircleCollision,
  lerp,
  TAU,
  distance,
  Vector2,
  Canvas2DGraphicsOptions,
  PI
} from 'crco-utils';
import { state } from '../../globals/game';
import { palette } from '../../globals/palette';
import { player } from '../../globals/player';
import { stats } from '../../globals/stats';
import { EntityType } from '../entityType';
import { spriteCoordinateSystem } from '../sprites';
import { Weapon, WeaponInstance } from './weapon';

export class ArrowInstance extends WeaponInstance<Arrow> {
  coordinateSystem = spriteCoordinateSystem.internal;
  spriteSize = 1;
  radius = 0.05;
  spriteKey = EntityType.Arrow;
  options = undefined;
  targetNormalized: Vector2;
  targetAngle: number;
  rotationOptions: Canvas2DGraphicsOptions;

  constructor(parent: Arrow, target: Vector2) {
    super(parent, player.position.clone());
    this.targetNormalized = Vector2.from(target, this.center).normalize();
    this.targetAngle = this.targetNormalized.angle() + PI;
    this.rotationOptions = {
      styles: { rotation: { origin: this.center, rotation: this.targetAngle } }
    };
  }

  handleCollisions = () => {
    for (let i = 0; i < state.enemies.length; i++) {
      const enemy = state.enemies[i];
      if (
        circleCircleCollision(
          this.center.x,
          this.center.y,
          this.radius,
          enemy.center.x,
          enemy.center.y,
          enemy.radius
        )
      ) {
        enemy.destroy(i);
      }
    }
  };

  draw(alpha: number) {
    super.draw(alpha, this.rotationOptions);
  }

  drawSprite = (graphics: Canvas2DGraphicsRough) => {
    graphics.lineSegments([
      [-1, 0],
      [1, 0]
    ]);
    graphics.lineSegments([
      [-0.75, -0.4],
      [-1, 0],
      [-0.75, 0.4]
    ]);
  };

  updatePosition = (elapsed: number, delta: number) => {
    this.positionPrevious.set(this.position);
    this.position.x += this.targetNormalized.x * this.parent.speed;
    this.position.y += this.targetNormalized.y * this.parent.speed;
  };
}

export class Arrow extends Weapon<ArrowInstance> {
  level = 1;
  range = 5;
  speed = 0.1;
  lastFired = 0;

  constructor() {
    super();
  }

  get stats() {
    return stats[EntityType.Arrow];
  }

  get frequency() {
    return 1000 / this.stats.frequency[this.level - 1];
  }

  // get damage() {
  //   return this.stats.damage[this.level - 1];
  // }

  update(elapsed: number, delta: number): void {
    super.update(elapsed, delta);

    if (elapsed - this.lastFired > this.frequency) {
      this.lastFired = elapsed;
      const nearestEnemy = this.findNearestEnemy();
      if (nearestEnemy) {
        this.instances.push(new ArrowInstance(this, nearestEnemy.center));
      }
    }

    for (let i = 0; i < this.instances.length; i++) {
      const arrow = this.instances[i];
      arrow.update(elapsed, delta, i);
      if (arrow.center.distanceTo(player.center) > this.range) {
        this.instances.splice(i, 1);
      }
    }
  }

  // TODO: inefficient. improve this?
  findNearestEnemy() {
    let shortestDistance = Infinity;
    let enemy;
    for (let i = 0; i < state.enemies.length; i++) {
      const enemyDistance = player.center.distanceTo(state.enemies[i].center);
      if (enemyDistance < shortestDistance) {
        shortestDistance = enemyDistance;
        enemy = state.enemies[i];
      }
    }
    return enemy;
  }

  upgrade = () => {
    if (this.canUpgrade()) {
      this.level++;
    }
  };
}
