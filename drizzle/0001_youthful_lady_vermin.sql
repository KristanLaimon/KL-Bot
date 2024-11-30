PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_Tournament_Rank_RanksAdmitted` (
	`tournamentId` integer NOT NULL,
	`rankId` text NOT NULL,
	PRIMARY KEY(`tournamentId`, `rankId`),
	CONSTRAINT "Tournament_Rank_RanksAdmitted_check_1" CHECK(LENGTH(rankID),
	CONSTRAINT "Role_check_2" CHECK(LENGTH("ID"),
	CONSTRAINT "Rank_check_3" CHECK(LENGTH("id"),
	CONSTRAINT "Rank_check_4" CHECK(LENGTH("id"),
	CONSTRAINT "Rank_check_5" CHECK(LENGTH("id"),
	CONSTRAINT "Player_check_6" CHECK(LENGTH("actualRank"),
	CONSTRAINT "Player_check_7" CHECK(LENGTH("role")
);
--> statement-breakpoint
INSERT INTO `__new_Tournament_Rank_RanksAdmitted`("tournamentId", "rankId") SELECT "tournamentId", "rankId" FROM `Tournament_Rank_RanksAdmitted`;--> statement-breakpoint
DROP TABLE `Tournament_Rank_RanksAdmitted`;--> statement-breakpoint
ALTER TABLE `__new_Tournament_Rank_RanksAdmitted` RENAME TO `Tournament_Rank_RanksAdmitted`;--> statement-breakpoint
PRAGMA foreign_keys=ON;