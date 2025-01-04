import Kldb from "../utils/kldb";


export type HelperRankId =
  "BR" |
  "PL" |
  "OR" |
  "PT" |
  "DI" |
  "CA" |
  "GC"

export type HelperRankName =
  "Bronce" |
  "Plata" |
  "Oro" |
  "Platino" |
  "Diamante" |
  "Campeón" |
  "Gran Campeón"

export type HelperRoleId = "AD" | "MB";

export type PendingTournamentStart = {
  tournamentInfo: KlTournament;
  countdownTimer: NodeJS.Timeout;
}

export type PendingMatch = {
  dateTime: number;
  countDownTimer: NodeJS.Timeout
  challenger: KlPlayer;
  challenged: KlPlayer;
}
export type KlPlayer = {
  id: number;
  username: string;
  profilePicturePath: string;
  actualRank: string;
  whatsapp_id: string;
  whatsappNickName: string;
  role: string;
  joined_date: bigint;
} & { Role: { id: string; name: string; }; Rank: { id: string; name: string; logoImagePath: string; }; }

export type KlGetTableType<T extends (...args: any[]) => any> = NonNullable<Awaited<ReturnType<T>>>;



export type KlScheduledMatchWindow = KlGetTableType<typeof Kldb.scheduledMatchWindow.findFirst>;
export type KlScheduledMatch = KlGetTableType<typeof Kldb.scheduledMatch.findFirst>;
export type KlScheduledMatch_Player = KlGetTableType<typeof Kldb.scheduledMatch_Player.findFirst>;
export type KlTournamentType = KlGetTableType<typeof Kldb.tournamentType.findFirst>;
export type KlTournament_Player_Subscription = KlGetTableType<typeof Kldb.tournament_Player_Subscriptions.findFirst>;
export type KlMatchType = KlGetTableType<typeof Kldb.matchType.findFirst>;
export type KlTournament_Ranks_Admitted = KlGetTableType<typeof Kldb.tournament_Rank_RanksAdmitted.findFirst>
export type KlRegisteredWhatsappGroupType  = KlGetTableType<typeof Kldb.registedWhatsappGroupType.findFirst>

export enum TeamColor {
  Blue = 'BLU',
  Orange = 'ORA'
}

export type KlTournament = KlGetTableType<typeof Kldb.tournament.findFirst>;
export type KlTournamentSimple = KlTournament & {
  TournamentType: KlGetTableType<typeof Kldb.tournamentType.findFirst>
  MatchFormat: KlGetTableType<typeof Kldb.matchType.findFirst>
}

export type KlTournamentEnhanced = KlTournament & {
  TournamentType: KlTournamentType;
  Tournament_Player_Subscriptions: KlTournament_Player_Subscription[];
  MatchFormat: KlMatchType
}

export type KlSubscriptionEnhanced =
  KlGetTableType<typeof Kldb.tournament_Player_Subscriptions.findFirst> & {
    Player: KlPlayer
  }
export type KlTournamentDoubleEnhanced = KlTournamentEnhanced & {
  Tournament_Rank_RanksAdmitteds: KlTournament_Ranks_Admitted[]
}
