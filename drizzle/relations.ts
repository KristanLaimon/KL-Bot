import { relations } from "drizzle-orm/relations";
import { tournament, player, rank } from "./schema";

export const playerRelations = relations(player, ({ one }) => ({
	tournament: one(tournament, {
		fields: [player.tournamentSelected],
		references: [tournament.id]
	}),
	rank: one(rank, {
		fields: [player.actualRank],
		references: [rank.id]
	}),
}));

export const tournamentRelations = relations(tournament, ({ many }) => ({
	players: many(player),
}));

export const rankRelations = relations(rank, ({ many }) => ({
	players: many(player),
}));