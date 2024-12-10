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
  tournamentSelected: number | null;
  phoneNumber: string;
  whatsappNickName: string;
  role: HelperRoleId;
  joined_date: bigint;
}