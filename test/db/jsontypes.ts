import { ReadJson } from "../../src/utils/filesystem";

export const Tournaments = ReadJson<JsonTournament[]>('./test/db/tournaments.json');
export const Players = ReadJson<JsonPlayer[]>('./test/db/players.json')

export interface JsonTournament {
   id: number;
   name: string;
   description: string;
   creationDate: BigInt;
   beginDate: BigInt;
   matchPeriodTime: number;
   endDate: BigInt;
   cover_img_name: string;
   tournament_type: string;
   max_players: number;
   match_format: string;
   custom_players_per_team: number;
   TournamentType: TournamentType;
   MatchFormat: MatchFormat;
   Tournament_Player_Subscriptions: TournamentPlayerSubscriptions[];
}

export interface TournamentType {
   id?: string;
   name?: string;
}

export interface MatchFormat {
   id?: string;
   name?: string;
   players_per_team?: number;
}

export interface TournamentPlayerSubscriptions {
   tournament_id?: number;
   player_id?: number;
   subscription_date?: string;
   Player?: JsonPlayer;
}


export interface JsonPlayer {
   id: number;
   username: string;
   profilePicturePath: string;
   actualRank: string;
   phoneNumber: string;
   whatsappNickName: string;
   role: string;
   joined_date: BigInt;
   tournamentId?: string;
   Rank: Rank;
   Role?: Role;
}

export interface Rank {
   id?: string;
   name?: string;
   logoImagePath?: string;
}

export interface Role {
   id?: string;
   name?: string;
}