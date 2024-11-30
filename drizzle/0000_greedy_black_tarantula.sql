-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `Tournament_Rank_RanksAdmitted` (
	`tournamentID` integer NOT NULL,
	`rankID` text NOT NULL,
	PRIMARY KEY(`tournamentID`, `rankID`),
	CONSTRAINT "Tournament_Rank_RanksAdmitted_check_1" CHECK(LENGTH(rankID),
	CONSTRAINT "Role_check_2" CHECK(LENGTH("ID"),
	CONSTRAINT "Rank_check_3" CHECK(LENGTH("id"),
	CONSTRAINT "Rank_check_4" CHECK(LENGTH("id"),
	CONSTRAINT "Rank_check_5" CHECK(LENGTH("id"),
	CONSTRAINT "Player_check_6" CHECK(LENGTH("actualRank"),
	CONSTRAINT "Player_check_7" CHECK(LENGTH("role")
);
--> statement-breakpoint
CREATE TABLE `Role` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	CONSTRAINT "Tournament_Rank_RanksAdmitted_check_1" CHECK(LENGTH(rankID),
	CONSTRAINT "Role_check_2" CHECK(LENGTH("ID"),
	CONSTRAINT "Rank_check_3" CHECK(LENGTH("id"),
	CONSTRAINT "Rank_check_4" CHECK(LENGTH("id"),
	CONSTRAINT "Rank_check_5" CHECK(LENGTH("id"),
	CONSTRAINT "Player_check_6" CHECK(LENGTH("actualRank"),
	CONSTRAINT "Player_check_7" CHECK(LENGTH("role")
);
--> statement-breakpoint
CREATE TABLE `Rank` (
	`id` text NOT NULL,
	`name` text NOT NULL,
	`logoImagePath` text NOT NULL,
	CONSTRAINT "Tournament_Rank_RanksAdmitted_check_1" CHECK(LENGTH(rankID),
	CONSTRAINT "Role_check_2" CHECK(LENGTH("ID"),
	CONSTRAINT "Rank_check_3" CHECK(LENGTH("id"),
	CONSTRAINT "Rank_check_4" CHECK(LENGTH("id"),
	CONSTRAINT "Rank_check_5" CHECK(LENGTH("id"),
	CONSTRAINT "Player_check_6" CHECK(LENGTH("actualRank"),
	CONSTRAINT "Player_check_7" CHECK(LENGTH("role")
);
--> statement-breakpoint
CREATE TABLE `Tournament` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`creationDate` integer NOT NULL,
	`beginDate` integer NOT NULL,
	`matchPeriodTime` integer NOT NULL,
	`endDate` integer NOT NULL,
	CONSTRAINT "Tournament_Rank_RanksAdmitted_check_1" CHECK(LENGTH(rankID),
	CONSTRAINT "Role_check_2" CHECK(LENGTH("ID"),
	CONSTRAINT "Rank_check_3" CHECK(LENGTH("id"),
	CONSTRAINT "Rank_check_4" CHECK(LENGTH("id"),
	CONSTRAINT "Rank_check_5" CHECK(LENGTH("id"),
	CONSTRAINT "Player_check_6" CHECK(LENGTH("actualRank"),
	CONSTRAINT "Player_check_7" CHECK(LENGTH("role")
);
--> statement-breakpoint
CREATE TABLE `Player` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`profilePicturePath` text NOT NULL,
	`actualRank` text NOT NULL,
	`tournamentSelected` integer,
	`phoneNumber` text NOT NULL,
	`whatsappNickName` text NOT NULL,
	`role` text NOT NULL,
	FOREIGN KEY (`tournamentSelected`) REFERENCES `Tournament`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actualRank`) REFERENCES `Rank`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "Tournament_Rank_RanksAdmitted_check_1" CHECK(LENGTH(rankID),
	CONSTRAINT "Role_check_2" CHECK(LENGTH("ID"),
	CONSTRAINT "Rank_check_3" CHECK(LENGTH("id"),
	CONSTRAINT "Rank_check_4" CHECK(LENGTH("id"),
	CONSTRAINT "Rank_check_5" CHECK(LENGTH("id"),
	CONSTRAINT "Player_check_6" CHECK(LENGTH("actualRank"),
	CONSTRAINT "Player_check_7" CHECK(LENGTH("role")
);

*/