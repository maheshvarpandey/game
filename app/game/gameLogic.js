export const CANVAS_SIZE = 500;
export const PLAYER_SIZE = 22;
export const ENEMY_SIZE = 20;
export const PLAYER_SPEED = 220;
export const ENEMY_SPEED = 72;
export const SPAWN_INTERVAL = 2000;
export const PLAYER_MAX_HEALTH = 100;
export const ENEMY_MAX_HEALTH = 45;
export const ATTACK_DAMAGE_PER_SECOND = 38;
export const CONTACT_DAMAGE_PER_SECOND = 18;
export const INITIAL_ZONE_RADIUS = 235;
export const MIN_ZONE_RADIUS = 90;
export const ZONE_SHRINK_PER_SECOND = 6;
export const ZONE_DAMAGE_PER_SECOND = 15;
export const ZONE_MOVE_SPEED_X = 42;
export const ZONE_MOVE_SPEED_Y = 30;

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `enemy-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getInitialZoneState() {
  return {
    centerX: CANVAS_SIZE / 2,
    centerY: CANVAS_SIZE / 2,
    radius: INITIAL_ZONE_RADIUS,
    velocityX: ZONE_MOVE_SPEED_X,
    velocityY: ZONE_MOVE_SPEED_Y,
  };
}

export function createPlayer() {
  return {
    x: CANVAS_SIZE / 2 - PLAYER_SIZE / 2,
    y: CANVAS_SIZE / 2 - PLAYER_SIZE / 2,
    size: PLAYER_SIZE,
    speed: PLAYER_SPEED,
    health: PLAYER_MAX_HEALTH,
  };
}

export function createEnemy() {
  const side = Math.floor(Math.random() * 4);
  const margin = ENEMY_SIZE + 8;
  let x = 0;
  let y = 0;

  if (side === 0) {
    x = Math.random() * (CANVAS_SIZE - ENEMY_SIZE);
    y = -margin;
  } else if (side === 1) {
    x = CANVAS_SIZE + margin;
    y = Math.random() * (CANVAS_SIZE - ENEMY_SIZE);
  } else if (side === 2) {
    x = Math.random() * (CANVAS_SIZE - ENEMY_SIZE);
    y = CANVAS_SIZE + margin;
  } else {
    x = -margin;
    y = Math.random() * (CANVAS_SIZE - ENEMY_SIZE);
  }

  return {
    id: createId(),
    x,
    y,
    size: ENEMY_SIZE,
    speed: ENEMY_SPEED + Math.random() * 20,
    health: ENEMY_MAX_HEALTH,
  };
}

export function getNearestEnemy(player, enemies) {
  if (!enemies.length) {
    return null;
  }

  const playerCenterX = player.x + player.size / 2;
  const playerCenterY = player.y + player.size / 2;
  let nearestEnemy = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const enemy of enemies) {
    const enemyCenterX = enemy.x + enemy.size / 2;
    const enemyCenterY = enemy.y + enemy.size / 2;
    const dx = enemyCenterX - playerCenterX;
    const dy = enemyCenterY - playerCenterY;
    const distance = dx * dx + dy * dy;

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestEnemy = enemy;
    }
  }

  return nearestEnemy;
}

export function updateZone(previousZone, roundStartedAt, timestamp, deltaSeconds) {
  const elapsedSeconds = Math.max(0, timestamp - roundStartedAt) / 1000;
  const radius = Math.max(
    MIN_ZONE_RADIUS,
    INITIAL_ZONE_RADIUS - elapsedSeconds * ZONE_SHRINK_PER_SECOND,
  );
  const fallbackZone = previousZone || getInitialZoneState();
  const minX = radius;
  const maxX = CANVAS_SIZE - radius;
  const minY = radius;
  const maxY = CANVAS_SIZE - radius;

  let centerX = fallbackZone.centerX + fallbackZone.velocityX * deltaSeconds;
  let centerY = fallbackZone.centerY + fallbackZone.velocityY * deltaSeconds;
  let velocityX = fallbackZone.velocityX;
  let velocityY = fallbackZone.velocityY;

  if (centerX < minX) {
    centerX = minX;
    velocityX = Math.abs(velocityX);
  } else if (centerX > maxX) {
    centerX = maxX;
    velocityX = -Math.abs(velocityX);
  }

  if (centerY < minY) {
    centerY = minY;
    velocityY = Math.abs(velocityY);
  } else if (centerY > maxY) {
    centerY = maxY;
    velocityY = -Math.abs(velocityY);
  }

  return {
    centerX,
    centerY,
    radius,
    velocityX,
    velocityY,
  };
}

export function movePlayer(player, input, deltaSeconds) {
  let horizontal = 0;
  let vertical = 0;

  if (input.left) {
    horizontal -= 1;
  }
  if (input.right) {
    horizontal += 1;
  }
  if (input.up) {
    vertical -= 1;
  }
  if (input.down) {
    vertical += 1;
  }

  const magnitude = Math.hypot(horizontal, vertical) || 1;
  const velocityX = (horizontal / magnitude) * player.speed * deltaSeconds;
  const velocityY = (vertical / magnitude) * player.speed * deltaSeconds;

  player.x = clamp(player.x + velocityX, 0, CANVAS_SIZE - player.size);
  player.y = clamp(player.y + velocityY, 0, CANVAS_SIZE - player.size);
}

export function moveEnemiesTowardPlayer(player, enemies, deltaSeconds) {
  const playerCenterX = player.x + player.size / 2;
  const playerCenterY = player.y + player.size / 2;

  for (const enemy of enemies) {
    const enemyCenterX = enemy.x + enemy.size / 2;
    const enemyCenterY = enemy.y + enemy.size / 2;
    const dx = playerCenterX - enemyCenterX;
    const dy = playerCenterY - enemyCenterY;
    const distance = Math.hypot(dx, dy) || 1;

    enemy.x += (dx / distance) * enemy.speed * deltaSeconds;
    enemy.y += (dy / distance) * enemy.speed * deltaSeconds;
  }
}

export function spawnEnemyIfNeeded(enemies, lastSpawnAt, timestamp) {
  if (timestamp - lastSpawnAt < SPAWN_INTERVAL) {
    return {
      enemies,
      lastSpawnAt,
    };
  }

  return {
    enemies: [...enemies, createEnemy()],
    lastSpawnAt: timestamp,
  };
}

export function applyAutoAttack(player, enemies, deltaSeconds) {
  const target = getNearestEnemy(player, enemies);

  if (!target) {
    return;
  }

  target.health -= ATTACK_DAMAGE_PER_SECOND * deltaSeconds;
}

export function isColliding(a, b) {
  return (
    a.x < b.x + b.size &&
    a.x + a.size > b.x &&
    a.y < b.y + b.size &&
    a.y + a.size > b.y
  );
}

export function applyCollisionDamage(player, enemies, deltaSeconds) {
  let totalDamage = 0;

  for (const enemy of enemies) {
    if (isColliding(player, enemy)) {
      totalDamage += CONTACT_DAMAGE_PER_SECOND * deltaSeconds;
    }
  }

  player.health = clamp(player.health - totalDamage, 0, PLAYER_MAX_HEALTH);
}

export function applyZoneDamage(player, zone, deltaSeconds) {
  const playerCenterX = player.x + player.size / 2;
  const playerCenterY = player.y + player.size / 2;
  const distanceFromCenter = Math.hypot(
    playerCenterX - zone.centerX,
    playerCenterY - zone.centerY,
  );

  if (distanceFromCenter <= zone.radius) {
    return false;
  }

  player.health = clamp(
    player.health - ZONE_DAMAGE_PER_SECOND * deltaSeconds,
    0,
    PLAYER_MAX_HEALTH,
  );
  return true;
}

export function removeDeadEnemies(enemies) {
  const survivingEnemies = [];
  let scoreGained = 0;

  for (const enemy of enemies) {
    if (enemy.health <= 0) {
      scoreGained += 10;
      continue;
    }

    survivingEnemies.push(enemy);
  }

  return {
    enemies: survivingEnemies,
    scoreGained,
  };
}

function drawZone(ctx, zone) {
  ctx.save();
  ctx.fillStyle = "rgba(2, 6, 12, 0.52)";
  ctx.beginPath();
  ctx.rect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  ctx.arc(zone.centerX, zone.centerY, zone.radius, 0, Math.PI * 2, true);
  ctx.fill("evenodd");

  ctx.strokeStyle = "rgba(92, 184, 255, 0.95)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(zone.centerX, zone.centerY, zone.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function drawScene(ctx, state) {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  ctx.fillStyle = "#08111e";
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  ctx.strokeStyle = "rgba(142, 180, 255, 0.18)";
  ctx.lineWidth = 1;
  for (let i = 25; i < CANVAS_SIZE; i += 25) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, CANVAS_SIZE);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(CANVAS_SIZE, i);
    ctx.stroke();
  }

  drawZone(ctx, state.zone);

  const target = getNearestEnemy(state.player, state.enemies);
  if (target) {
    ctx.strokeStyle = "rgba(255, 235, 120, 0.65)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(
      state.player.x + state.player.size / 2,
      state.player.y + state.player.size / 2,
    );
    ctx.lineTo(target.x + target.size / 2, target.y + target.size / 2);
    ctx.stroke();
  }

  ctx.fillStyle = "#3b82f6";
  ctx.fillRect(state.player.x, state.player.y, state.player.size, state.player.size);

  for (const enemy of state.enemies) {
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);

    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(enemy.x, enemy.y - 8, enemy.size, 4);

    ctx.fillStyle = "#7ef29a";
    ctx.fillRect(
      enemy.x,
      enemy.y - 8,
      enemy.size * clamp(enemy.health / ENEMY_MAX_HEALTH, 0, 1),
      4,
    );
  }
}
