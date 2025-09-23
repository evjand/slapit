import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    
    return await ctx.db
      .query("players")
      .withIndex("by_creator", (q) => q.eq("createdBy", userId))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to create players");
    }

    return await ctx.db.insert("players", {
      name: args.name,
      totalWins: 0,
      totalPoints: 0,
      totalEliminations: 0,
      createdBy: userId,
    });
  },
});

export const updateStats = mutation({
  args: {
    playerId: v.id("players"),
    wins: v.optional(v.number()),
    points: v.optional(v.number()),
    eliminations: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    const updates: any = {};
    if (args.wins !== undefined) {
      updates.totalWins = player.totalWins + args.wins;
    }
    if (args.points !== undefined) {
      updates.totalPoints = player.totalPoints + args.points;
    }
    if (args.eliminations !== undefined) {
      updates.totalEliminations = player.totalEliminations + args.eliminations;
    }

    await ctx.db.patch(args.playerId, updates);
  },
});
