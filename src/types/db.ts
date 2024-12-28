import Kldb from '../utils/db';

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
  phoneNumber: string;
  whatsappNickName: string;
  role: string;
  joined_date: bigint;
} & { Role: { id: string; name: string; }; Rank: { id: string; name: string; logoImagePath: string; }; }

export type KlGetTableType<T extends (...args: any[]) => any> = NonNullable<Awaited<ReturnType<T>>>;
export type KlTournament = KlGetTableType<typeof Kldb.tournament.findFirst>;
export type KlScheduledMatchWindow = KlGetTableType<typeof Kldb.scheduledMatchWindow.findFirst>;


