import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";

// Shared types for game logic
export interface GamePlayer {
  _id: Id<"players">;
  name: string;
  currentPoints?: number;
  totalPoints?: number;
  totalEliminations?: number;
}

export interface GameElimination {
  _id: Id<"eliminations"> | Id<"heatEliminations">;
  eliminatedPlayerId: Id<"players">;
  eliminatorPlayerId: Id<"players">;
  eliminationOrder: number;
  isReverted: boolean;
}

export interface GameRound {
  _id: Id<"rounds"> | Id<"heatSets">;
  roundNumber?: number;
  setNumber?: number;
  playerOrder: Id<"players">[];
  currentPlayerOrder?: Id<"players">[];
  serverId: Id<"players">;
  status: "active" | "completed";
  winner?: Id<"players">;
}

// Shared shuffle function with better randomness
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  
  const getRandomInt = (max: number) => {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      return array[0] % max;
    }
    return Math.floor(Math.random() * max);
  };
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = getRandomInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Shared function to determine eliminator using circular logic
export function calculateEliminator(
  eliminatedPlayerId: Id<"players">,
  currentPlayerOrder: Id<"players">[],
  eliminatedPlayerIds: Id<"players">[]
): Id<"players"> {
  const playerIndex = currentPlayerOrder.indexOf(eliminatedPlayerId);
  if (playerIndex === -1) {
    throw new Error("Player not in current order");
  }

  // The eliminator is the player who comes BEFORE the eliminated player in the circle
  let eliminatorIndex = playerIndex === 0 ? currentPlayerOrder.length - 1 : playerIndex - 1;
  let eliminatorId = currentPlayerOrder[eliminatorIndex];
  
  // If the calculated eliminator is already eliminated, find the next active player going backwards
  while (eliminatedPlayerIds.includes(eliminatorId) && eliminatorId !== eliminatedPlayerId) {
    eliminatorIndex = eliminatorIndex === 0 ? currentPlayerOrder.length - 1 : eliminatorIndex - 1;
    eliminatorId = currentPlayerOrder[eliminatorIndex];
  }
  
  // Safety check - if we've gone full circle, something is wrong
  if (eliminatorId === eliminatedPlayerId) {
    throw new Error("Cannot determine eliminator - invalid game state");
  }

  return eliminatorId;
}

// Shared function to get next server (avoiding same server)
export function getNextServer(
  remainingPlayerIds: Id<"players">[],
  currentServerId?: Id<"players">
): Id<"players"> {
  if (remainingPlayerIds.length === 0) {
    throw new Error("No players remaining");
  }

  let newPlayerOrder = shuffleArray(remainingPlayerIds);
  
  // Ensure the new server is not the same as current server
  if (currentServerId && newPlayerOrder[0] === currentServerId && newPlayerOrder.length > 1) {
    let attempts = 0;
    while (newPlayerOrder[0] === currentServerId && attempts < 10) {
      newPlayerOrder = shuffleArray(remainingPlayerIds);
      attempts++;
    }
    // If still the same after 10 attempts, just swap the first two players
    if (newPlayerOrder[0] === currentServerId && newPlayerOrder.length > 1) {
      [newPlayerOrder[0], newPlayerOrder[1]] = [newPlayerOrder[1], newPlayerOrder[0]];
    }
  }
  
  return newPlayerOrder[0];
}

// Shared function to reshuffle remaining players
export function reshuffleRemainingPlayers(
  remainingPlayerIds: Id<"players">[],
  currentServerId?: Id<"players">
): Id<"players">[] {
  if (remainingPlayerIds.length === 0) {
    return [];
  }

  let newPlayerOrder = shuffleArray(remainingPlayerIds);
  
  // Ensure the new server is not the same as current server
  if (currentServerId && newPlayerOrder[0] === currentServerId && newPlayerOrder.length > 1) {
    let attempts = 0;
    while (newPlayerOrder[0] === currentServerId && attempts < 10) {
      newPlayerOrder = shuffleArray(remainingPlayerIds);
      attempts++;
    }
    // If still the same after 10 attempts, just swap the first two players
    if (newPlayerOrder[0] === currentServerId && newPlayerOrder.length > 1) {
      [newPlayerOrder[0], newPlayerOrder[1]] = [newPlayerOrder[1], newPlayerOrder[0]];
    }
  }
  
  return newPlayerOrder;
}

// Game mode types
export type GameMode = "firstToX" | "fixedSets";

export interface GameConfig {
  mode: GameMode;
  winningPoints?: number; // For firstToX mode
  setsPerGame?: number;   // For fixedSets mode
}

// Check if game/heat should end based on mode
export function shouldEndGame(
  mode: GameMode,
  config: { winningPoints?: number; setsPerGame?: number },
  currentState: { setsCompleted?: number; maxPoints?: number }
): boolean {
  switch (mode) {
    case "firstToX":
      return (currentState.maxPoints || 0) >= (config.winningPoints || 0);
    case "fixedSets":
      return (currentState.setsCompleted || 0) >= (config.setsPerGame || 0);
    default:
      return false;
  }
}
