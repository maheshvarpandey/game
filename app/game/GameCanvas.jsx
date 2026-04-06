"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "./useGameStore";
import {
  CANVAS_SIZE,
  applyAutoAttack,
  applyCollisionDamage,
  applyZoneDamage,
  drawScene,
  getInitialZoneState,
  moveEnemiesTowardPlayer,
  movePlayer,
  removeDeadEnemies,
  spawnEnemyIfNeeded,
  updateZone,
} from "./gameLogic";

const controls = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
};

const touchButtons = [
  { key: "up", label: "Up", gridArea: "up" },
  { key: "left", label: "Left", gridArea: "left" },
  { key: "down", label: "Down", gridArea: "down" },
  { key: "right", label: "Right", gridArea: "right" },
];

function cloneGameState(state) {
  return {
    score: state.score,
    player: { ...state.player },
    enemies: state.enemies.map((enemy) => ({ ...enemy })),
    lastFrameAt: state.lastFrameAt,
    roundStartedAt: state.roundStartedAt,
    zone: state.zone ? { ...state.zone } : getInitialZoneState(),
  };
}

export default function GameCanvas() {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(0);
  const touchButtonRefs = useRef({});
  const inputRef = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
  });
  const touchOwnershipRef = useRef({});

  const screen = useGameStore((state) => state.screen);
  const score = useGameStore((state) => state.score);
  const health = useGameStore((state) => Math.ceil(state.player.health));
  const zoneRadius = useGameStore((state) => Math.round(state.zone.radius));
  const startGame = useGameStore((state) => state.startGame);
  const restartGame = useGameStore((state) => state.restartGame);

  useEffect(() => {
    function handleKeyChange(event, isPressed) {
      const direction = controls[event.code];
      if (!direction) {
        return;
      }

      event.preventDefault();
      inputRef.current[direction] = isPressed;
    }

    const handleKeyDown = (event) => handleKeyChange(event, true);
    const handleKeyUp = (event) => handleKeyChange(event, false);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return undefined;
    }

    let isMounted = true;

    function frame(timestamp) {
      if (!isMounted) {
        return;
      }

      const store = useGameStore.getState();

      if (store.screen !== "playing") {
        drawScene(context, {
          player: store.player,
          enemies: store.enemies,
          zone: store.zone,
        });
        animationFrameRef.current = window.requestAnimationFrame(frame);
        return;
      }

      const previousState = cloneGameState(store);
      const roundStartedAt = previousState.roundStartedAt || timestamp;
      const previousFrameAt = previousState.lastFrameAt || timestamp;
      const deltaSeconds = Math.min((timestamp - previousFrameAt) / 1000, 0.05);

      movePlayer(previousState.player, inputRef.current, deltaSeconds);
      moveEnemiesTowardPlayer(previousState.player, previousState.enemies, deltaSeconds);

      const spawned = spawnEnemyIfNeeded(previousState.enemies, store.lastSpawnAt, timestamp);
      previousState.enemies = spawned.enemies;
      const lastSpawnAt = spawned.lastSpawnAt;

      applyAutoAttack(previousState.player, previousState.enemies, deltaSeconds);
      applyCollisionDamage(previousState.player, previousState.enemies, deltaSeconds);

      const zone = updateZone(previousState.zone, roundStartedAt, timestamp, deltaSeconds);
      applyZoneDamage(previousState.player, zone, deltaSeconds);

      const { enemies, scoreGained } = removeDeadEnemies(previousState.enemies);
      const nextScore = previousState.score + scoreGained;

      store.setSnapshot({
        player: previousState.player,
        enemies,
        score: nextScore,
        timestamp,
        roundStartedAt,
        lastSpawnAt,
        zone,
      });

      const updatedState = useGameStore.getState();
      if (updatedState.player.health <= 0) {
        updatedState.endGame();
      }

      drawScene(context, {
        player: updatedState.player,
        enemies: updatedState.enemies,
        zone: updatedState.zone,
      });

      animationFrameRef.current = window.requestAnimationFrame(frame);
    }

    animationFrameRef.current = window.requestAnimationFrame(frame);

    return () => {
      isMounted = false;
      window.cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  function syncTouchDirections() {
    const nextInput = {
      up: false,
      down: false,
      left: false,
      right: false,
    };

    for (const direction of Object.values(touchOwnershipRef.current)) {
      nextInput[direction] = true;
    }

    inputRef.current.up = nextInput.up;
    inputRef.current.down = nextInput.down;
    inputRef.current.left = nextInput.left;
    inputRef.current.right = nextInput.right;
  }

  function getDirectionFromPoint(clientX, clientY) {
    for (const button of touchButtons) {
      const element = touchButtonRefs.current[button.key];
      if (!element) {
        continue;
      }

      const rect = element.getBoundingClientRect();
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        return button.key;
      }
    }

    return null;
  }

  function updateTouchAssignments(touches) {
    const nextOwnership = {};

    for (const touch of touches) {
      const direction = getDirectionFromPoint(touch.clientX, touch.clientY);
      if (direction) {
        nextOwnership[touch.identifier] = direction;
      }
    }

    touchOwnershipRef.current = nextOwnership;
    syncTouchDirections();
  }

  function clearTouchAssignments() {
    touchOwnershipRef.current = {};
    syncTouchDirections();
  }

  const isStartScreen = screen === "start";
  const isGameOver = screen === "gameOver";

  return (
    <main style={styles.page}>
      <section style={styles.shell}>
        <div style={styles.header}>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>Score</span>
            <strong style={styles.statValue}>{score}</strong>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>Health</span>
            <strong style={styles.statValue}>{health}</strong>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>Zone</span>
            <strong style={styles.statValue}>{zoneRadius}</strong>
          </div>
        </div>

        <div style={styles.canvasFrame}>
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            style={styles.canvas}
          />

          {(isStartScreen || isGameOver) && (
            <div style={styles.overlay}>
              <div style={styles.overlayCard}>
                <h1 style={styles.title}>
                  {isStartScreen ? "Mini Battle Survival" : "Game Over"}
                </h1>
                <p style={styles.subtitle}>
                  {isStartScreen
                    ? "Move with WASD, arrow keys, or touch controls. Keep your blue square inside the moving safe zone while auto-firing at the nearest enemy."
                    : `Final score: ${score}. The moving storm closed to ${zoneRadius}px.`}
                </p>
                <button
                  type="button"
                  onClick={isStartScreen ? startGame : restartGame}
                  style={styles.button}
                >
                  {isStartScreen ? "Start Game" : "Restart"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div
          style={styles.touchPanel}
          aria-label="Touch controls"
          onTouchStart={(event) => {
            event.preventDefault();
            updateTouchAssignments(event.touches);
          }}
          onTouchMove={(event) => {
            event.preventDefault();
            updateTouchAssignments(event.touches);
          }}
          onTouchEnd={(event) => {
            event.preventDefault();
            updateTouchAssignments(event.touches);
          }}
          onTouchCancel={() => {
            clearTouchAssignments();
          }}
        >
          {touchButtons.map((button) => (
            <button
              key={button.key}
              ref={(element) => {
                touchButtonRefs.current[button.key] = element;
              }}
              type="button"
              style={{
                ...styles.touchButton,
                gridArea: button.gridArea,
              }}
              onPointerDown={(event) => {
                event.preventDefault();
                touchOwnershipRef.current[event.pointerId] = button.key;
                syncTouchDirections();
                event.currentTarget.setPointerCapture?.(event.pointerId);
              }}
              onPointerUp={(event) => {
                event.preventDefault();
                delete touchOwnershipRef.current[event.pointerId];
                syncTouchDirections();
              }}
              onPointerCancel={(event) => {
                delete touchOwnershipRef.current[event.pointerId];
                syncTouchDirections();
              }}
              onPointerLeave={(event) => {
                if ((event.buttons & 1) === 0) {
                  delete touchOwnershipRef.current[event.pointerId];
                  syncTouchDirections();
                }
              }}
            >
              {button.label}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "32px 16px",
  },
  shell: {
    width: "min(100%, 680px)",
    padding: 24,
    borderRadius: 28,
    border: "1px solid rgba(123, 167, 255, 0.2)",
    background: "rgba(6, 15, 27, 0.82)",
    boxShadow: "0 24px 80px rgba(0, 0, 0, 0.35)",
    backdropFilter: "blur(14px)",
  },
  header: {
    display: "flex",
    gap: 16,
    justifyContent: "space-between",
    marginBottom: 20,
    flexWrap: "wrap",
  },
  statCard: {
    minWidth: 140,
    padding: "14px 16px",
    borderRadius: 18,
    background: "rgba(17, 31, 53, 0.92)",
    border: "1px solid rgba(112, 153, 255, 0.18)",
  },
  statLabel: {
    display: "block",
    fontSize: 12,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#aac0e7",
    marginBottom: 6,
  },
  statValue: {
    fontSize: 28,
    lineHeight: 1,
    color: "#edf4ff",
  },
  canvasFrame: {
    position: "relative",
    width: "fit-content",
    margin: "0 auto",
    borderRadius: 22,
    overflow: "hidden",
    border: "1px solid rgba(113, 159, 255, 0.22)",
  },
  canvas: {
    display: "block",
    width: "min(500px, calc(100vw - 80px))",
    height: "min(500px, calc(100vw - 80px))",
    background: "#08111e",
    touchAction: "none",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "center",
    padding: 24,
    background: "rgba(2, 7, 14, 0.62)",
  },
  overlayCard: {
    maxWidth: 320,
    padding: "28px 24px",
    textAlign: "center",
    borderRadius: 24,
    background: "rgba(8, 17, 30, 0.95)",
    border: "1px solid rgba(116, 157, 255, 0.22)",
  },
  title: {
    margin: "0 0 10px",
    fontSize: 32,
  },
  subtitle: {
    margin: "0 0 20px",
    lineHeight: 1.6,
    color: "#aac0e7",
  },
  button: {
    border: "none",
    borderRadius: 999,
    padding: "12px 22px",
    background: "linear-gradient(135deg, #59b2ff 0%, #2d8cff 100%)",
    color: "#f8fbff",
    cursor: "pointer",
  },
  touchPanel: {
    display: "grid",
    gridTemplateAreas: '". up ." "left down right"',
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 12,
    width: "min(320px, 100%)",
    margin: "18px auto 0",
    userSelect: "none",
  },
  touchButton: {
    minHeight: 62,
    border: "1px solid rgba(110, 167, 255, 0.24)",
    borderRadius: 18,
    background: "rgba(17, 31, 53, 0.92)",
    color: "#edf4ff",
    fontSize: 16,
    touchAction: "none",
  },
};
