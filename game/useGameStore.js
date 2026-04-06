"use client";

import { create } from "zustand";
import {
  PLAYER_MAX_HEALTH,
  createPlayer,
  getInitialZoneState,
} from "./gameLogic";

function createInitialState() {
  return {
    screen: "start",
    score: 0,
    player: createPlayer(),
    enemies: [],
    lastFrameAt: 0,
    lastSpawnAt: 0,
    roundStartedAt: 0,
    zone: getInitialZoneState(),
  };
}

export const useGameStore = create((set) => ({
  ...createInitialState(),

  startGame: () =>
    set(() => ({
      ...createInitialState(),
      screen: "playing",
    })),

  restartGame: () =>
    set(() => ({
      ...createInitialState(),
      screen: "playing",
    })),

  endGame: () =>
    set((state) => ({
      ...state,
      screen: "gameOver",
      lastFrameAt: 0,
    })),

  setSnapshot: ({
    player,
    enemies,
    score,
    timestamp,
    roundStartedAt,
    lastSpawnAt,
    zone,
  }) =>
    set((state) => ({
      ...state,
      player: {
        ...player,
        health: Math.max(0, Math.min(PLAYER_MAX_HEALTH, player.health)),
      },
      enemies,
      score,
      lastFrameAt: timestamp,
      lastSpawnAt,
      roundStartedAt,
      zone,
    })),
}));
