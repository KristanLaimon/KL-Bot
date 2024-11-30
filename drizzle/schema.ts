import { sqliteTable, AnySQLiteColumn, primaryKey, check, integer, text, foreignKey } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"
import { HelperRankId, HelperRoleId, HelperRankName, HelperRoleName } from './helper_types';

export const tournamentRankRanksAdmitted = sqliteTable("Tournament_Rank_RanksAdmitted", {
	tournamentId: integer().notNull(),
	rankId: text().$type<HelperRankId>().notNull(),
},
	(table) => ({
		pk0: primaryKey({ columns: [table.tournamentId, table.rankId], name: "Tournament_Rank_RanksAdmitted_tournamentID_rankID_pk" }),
		tournamentRankRanksAdmittedCheck1: check("Tournament_Rank_RanksAdmitted_check_1", sql`LENGTH(rankID`),
		roleCheck2: check("Role_check_2", sql`LENGTH("ID"`),
		rankCheck3: check("Rank_check_3", sql`LENGTH("id"`),
		rankCheck4: check("Rank_check_4", sql`LENGTH("id"`),
		rankCheck5: check("Rank_check_5", sql`LENGTH("id"`),
		playerCheck6: check("Player_check_6", sql`LENGTH("actualRank"`),
		playerCheck7: check("Player_check_7", sql`LENGTH("role"`),
	}));

export const role = sqliteTable("Role", {
	id: text().$type<HelperRoleId>().primaryKey().notNull(),
	name: text().$type<HelperRoleName>().notNull(),
},
	(table) => {
		return {
			tournamentRankRanksAdmittedCheck1: check("Tournament_Rank_RanksAdmitted_check_1", sql`LENGTH(rankID`),
			roleCheck2: check("Role_check_2", sql`LENGTH("ID"`),
			rankCheck3: check("Rank_check_3", sql`LENGTH("id"`),
			rankCheck4: check("Rank_check_4", sql`LENGTH("id"`),
			rankCheck5: check("Rank_check_5", sql`LENGTH("id"`),
			playerCheck6: check("Player_check_6", sql`LENGTH("actualRank"`),
			playerCheck7: check("Player_check_7", sql`LENGTH("role"`),
		}
	});

export const rank = sqliteTable("Rank", {
	id: text().$type<HelperRankId>().notNull(),
	name: text().$type<HelperRankName>().notNull(),
	logoImagePath: text().notNull(),
},
	(table) => {
		return {
			tournamentRankRanksAdmittedCheck1: check("Tournament_Rank_RanksAdmitted_check_1", sql`LENGTH(rankID`),
			roleCheck2: check("Role_check_2", sql`LENGTH("ID"`),
			rankCheck3: check("Rank_check_3", sql`LENGTH("id"`),
			rankCheck4: check("Rank_check_4", sql`LENGTH("id"`),
			rankCheck5: check("Rank_check_5", sql`LENGTH("id"`),
			playerCheck6: check("Player_check_6", sql`LENGTH("actualRank"`),
			playerCheck7: check("Player_check_7", sql`LENGTH("role"`),
		}
	});

export const tournament = sqliteTable("Tournament", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	name: text().notNull(),
	description: text().notNull(),
	creationDate: integer().notNull(),
	beginDate: integer().notNull(),
	matchPeriodTime: integer().notNull(),
	endDate: integer().notNull(),
},
	(table) => {
		return {
			tournamentRankRanksAdmittedCheck1: check("Tournament_Rank_RanksAdmitted_check_1", sql`LENGTH(rankID`),
			roleCheck2: check("Role_check_2", sql`LENGTH("ID"`),
			rankCheck3: check("Rank_check_3", sql`LENGTH("id"`),
			rankCheck4: check("Rank_check_4", sql`LENGTH("id"`),
			rankCheck5: check("Rank_check_5", sql`LENGTH("id"`),
			playerCheck6: check("Player_check_6", sql`LENGTH("actualRank"`),
			playerCheck7: check("Player_check_7", sql`LENGTH("role"`),
		}
	});

export const player = sqliteTable("Player", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	username: text().notNull(),
	profilePicturePath: text().notNull(),
	actualRank: text().$type<HelperRankId>().notNull().references(() => rank.id),
	tournamentSelected: integer().references(() => tournament.id),
	phoneNumber: text().notNull(),
	whatsappNickName: text().notNull(),
	role: text().$type<HelperRoleId>().notNull(),
},
	(table) => {
		return {
			tournamentRankRanksAdmittedCheck1: check("Tournament_Rank_RanksAdmitted_check_1", sql`LENGTH(rankID`),
			roleCheck2: check("Role_check_2", sql`LENGTH("ID"`),
			rankCheck3: check("Rank_check_3", sql`LENGTH("id"`),
			rankCheck4: check("Rank_check_4", sql`LENGTH("id"`),
			rankCheck5: check("Rank_check_5", sql`LENGTH("id"`),
			playerCheck6: check("Player_check_6", sql`LENGTH("actualRank"`),
			playerCheck7: check("Player_check_7", sql`LENGTH("role"`),
		}
	});

