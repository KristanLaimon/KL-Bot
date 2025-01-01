import { Tournaments, Players } from "../db/jsontypes";
import { GenericTournament } from "../../src/logic/GenericTournament";
import { KlSubscriptionEnhanced, KlTournamentEnhanced } from "../../src/types/db";
import moment from "moment";


const SubscriptionsMax20Players: KlSubscriptionEnhanced[] = [
  {
    Player: {
      id: 1,
      username: "Player1",
      profilePicturePath: "path/to/picture1",
      actualRank: "Rank1",
      phoneNumber: "1234567890",
      whatsappNickName: "NickName1",
      role: "Role1",
      joined_date: BigInt(Date.now()),
      Rank: { id: "AD", name: "Administrador", logoImagePath: "path/to/rank1.png" },
      Role: { id: "MB", name: "Miembro" }
    },
    tournament_id: 1,
    player_id: 1,
    subscription_date: BigInt(Date.now())
  },
  {
    Player: {
      id: 2,
      username: "Player2",
      profilePicturePath: "path/to/picture2",
      actualRank: "Rank2",
      phoneNumber: "0987654321",
      whatsappNickName: "NickName2",
      role: "Role2",
      joined_date: BigInt(Date.now()),
      Rank: { id: "Rank2", name: "Rank 2", logoImagePath: "path/to/rank2.png" },
      Role: { id: "Role2", name: "Role 2" }
    },
    tournament_id: 1,
    player_id: 2,
    subscription_date: BigInt(Date.now())
  },
  {
    Player: {
      id: 3,
      username: "Player3",
      profilePicturePath: "path/to/picture3",
      actualRank: "Rank3",
      phoneNumber: "1122334455",
      whatsappNickName: "NickName3",
      role: "Role3",
      joined_date: BigInt(Date.now()),
      Rank: { id: "Rank3", name: "Rank 3", logoImagePath: "path/to/rank3.png" },
      Role: { id: "Role3", name: "Role 3" }
    },
    tournament_id: 1,
    player_id: 3,
    subscription_date: BigInt(Date.now())
  },
  {
    Player: {
      id: 4,
      username: "Player4",
      profilePicturePath: "path/to/picture4",
      actualRank: "Rank4",
      phoneNumber: "5566778899",
      whatsappNickName: "NickName4",
      role: "Role4",
      joined_date: BigInt(Date.now()),
      Rank: { id: "Rank4", name: "Rank 4", logoImagePath: "path/to/rank4.png" },
      Role: { id: "Role4", name: "Role 4" }
    },
    tournament_id: 1,
    player_id: 4,
    subscription_date: BigInt(Date.now())
  },
  {
    Player: {
      id: 5,
      username: "Player5",
      profilePicturePath: "path/to/picture5",
      actualRank: "Rank5",
      phoneNumber: "6677889900",
      whatsappNickName: "NickName5",
      role: "Role5",
      joined_date: BigInt(Date.now()),
      Rank: { id: "Rank5", name: "Rank 5", logoImagePath: "path/to/rank5.png" },
      Role: { id: "Role5", name: "Role 5" }
    },
    tournament_id: 1,
    player_id: 5,
    subscription_date: BigInt(Date.now())
  },
  {
    Player: {
      id: 6,
      username: "Player6",
      profilePicturePath: "path/to/picture6",
      actualRank: "Rank6",
      phoneNumber: "7788990011",
      whatsappNickName: "NickName6",
      role: "Role6",
      joined_date: BigInt(Date.now()),
      Rank: { id: "Rank6", name: "Rank 6", logoImagePath: "path/to/rank6.png" },
      Role: { id: "Role6", name: "Role 6" }
    },
    tournament_id: 1,
    player_id: 6,
    subscription_date: BigInt(Date.now())
  },
  {
    Player: {
      id: 7,
      username: "Player7",
      profilePicturePath: "path/to/picture7",
      actualRank: "Rank7",
      phoneNumber: "8899001122",
      whatsappNickName: "NickName7",
      role: "Role7",
      joined_date: BigInt(Date.now()),
      Rank: { id: "Rank7", name: "Rank 7", logoImagePath: "path/to/rank7.png" },
      Role: { id: "Role7", name: "Role 7" }
    },
    tournament_id: 1,
    player_id: 7,
    subscription_date: BigInt(Date.now())
  },
  {
    Player: {
      id: 8,
      username: "Player8",
      profilePicturePath: "path/to/picture8",
      actualRank: "Rank8",
      phoneNumber: "9900112233",
      whatsappNickName: "NickName8",
      role: "Role8",
      joined_date: BigInt(Date.now()),
      Rank: { id: "Rank8", name: "Rank 8", logoImagePath: "path/to/rank8.png" },
      Role: { id: "Role8", name: "Role 8" }
    },
    tournament_id: 1,
    player_id: 8,
    subscription_date: BigInt(Date.now())
  },
  {
    Player: {
      id: 9,
      username: "Player9",
      profilePicturePath: "path/to/picture9",
      actualRank: "Rank9",
      phoneNumber: "1011121314",
      whatsappNickName: "NickName9",
      role: "Role9",
      joined_date: BigInt(Date.now()),
      Rank: { id: "Rank9", name: "Rank 9", logoImagePath: "path/to/rank9.png" },
      Role: { id: "Role9", name: "Role 9" }
    },
    tournament_id: 1,
    player_id: 9,
    subscription_date: BigInt(Date.now())
  },
  {
    Player: {
      id: 10,
      username: "Player10",
      profilePicturePath: "path/to/picture10",
      actualRank: "Rank10",
      phoneNumber: "1112131415",
      whatsappNickName: "NickName10",
      role: "Role10",
      joined_date: BigInt(Date.now()),
      Rank: { id: "Rank10", name: "Rank 10", logoImagePath: "path/to/rank10.png" },
      Role: { id: "Role10", name: "Role 10" }
    },
    tournament_id: 1,
    player_id: 10,
    subscription_date: BigInt(Date.now())
  },
  {
    Player: {
      id: 11,
      username: "Player11",
      profilePicturePath: "path/to/picture11",
      actualRank: "Rank11",
      phoneNumber: "1213141516",
      whatsappNickName: "NickName11",
      role: "Role11",
      joined_date: BigInt(Date.now()),
      Rank: { id: "Rank11", name: "Rank 11", logoImagePath: "path/to/rank11.png" },
      Role: { id: "Role11", name: "Role 11" }
    },
    tournament_id: 1,
    player_id: 11,
    subscription_date: BigInt(Date.now())
  },
  {
    Player: {
      id: 12,
      username: "Player12",
      profilePicturePath: "path/to/picture12",
      actualRank: "Rank12",
      phoneNumber: "1314151617",
      whatsappNickName: "NickName12",
      role: "Role12",
      joined_date: BigInt(Date.now()),
      Rank: { id: "Rank12", name: "Rank 12", logoImagePath: "path/to/rank12.png" },
      Role: { id: "Role12", name: "Role 12" }
    },
    tournament_id: 1,
    player_id: 12,
    subscription_date: BigInt(Date.now())
  },
  {
    Player: {
      id: 13,
      username: "Player13",
      profilePicturePath: "path/to/picture13",
      actualRank: "Rank13",
      phoneNumber: "1415161718",
      whatsappNickName: "NickName13",
      role: "Role13",
      joined_date: BigInt(Date.now()),
      Rank: { id: "Rank13", name: "Rank 13", logoImagePath: "path/to/rank13.png" },
      Role: { id: "Role13", name: "Role 13" }
    },
    tournament_id: 1,
    player_id: 13,
    subscription_date: BigInt(Date.now())
  },
  {
    Player: {
      id: 14,
      username: "Player14",
      profilePicturePath: "path/to/picture14",
      actualRank: "Rank14",
      phoneNumber: "1516171819",
      whatsappNickName: "NickName14",
      role: "Role14",
      joined_date: BigInt(Date.now()),
      Rank: { id: "Rank14", name: "Rank 14", logoImagePath: "path/to/rank14.png" },
      Role: { id: "Role14", name: "Role 14" }
    },
    tournament_id: 1,
    player_id: 14,
    subscription_date: BigInt(Date.now())
  },
  {
    Player: {
      id: 15,
      username: "Player15",
      profilePicturePath: "path/to/picture15",
      actualRank: "Rank15",
      phoneNumber: "1617181920",
      whatsappNickName: "NickName15",
      role: "Role15",
      joined_date: BigInt(Date.now()),
      Rank: { id: "Rank15", name: "Rank 15", logoImagePath: "path/to/rank15.png" },
      Role: { id: "Role15", name: "Role 15" }
    },
    tournament_id: 1,
    player_id: 15,
    subscription_date: BigInt(Date.now())
  },
  {
    Player: {
      id: 16,
      username: "Player16",
      profilePicturePath: "path/to/picture16",
      actualRank: "Rank16",
      phoneNumber: "1718192021",
      whatsappNickName: "NickName16",
      role: "Role16",
      joined_date: BigInt(Date.now()),
      Rank: { id: "Rank16", name: "Rank 16", logoImagePath: "path/to/rank16.png" },
      Role: { id: "Role16", name: "Role 16" }
    },
    tournament_id: 1,
    player_id: 16,
    subscription_date: BigInt(Date.now())
  },
  {
    Player: {
      id: 17,
      username: "Player17",
      profilePicturePath: "path/to/picture17",
      actualRank: "Rank17",
      phoneNumber: "1820212223",
      whatsappNickName: "NickName17",
      role: "Role17",
      joined_date: BigInt(Date.now()),
      Rank: { id: "Rank17", name: "Rank 17", logoImagePath: "path/to/rank17.png" },
      Role: { id: "Role17", name: "Role 17" }
    },
    tournament_id: 1,
    player_id: 17,
    subscription_date: BigInt(Date.now())
  },
  {
    Player: {
      id: 18,
      username: "Player18",
      profilePicturePath: "path/to/picture18",
      actualRank: "Rank18",
      phoneNumber: "1920212224",
      whatsappNickName: "NickName18",
      role: "Role18",
      joined_date: BigInt(Date.now()),
      Rank: { id: "Rank18", name: "Rank 18", logoImagePath: "path/to/rank18.png" },
      Role: { id: "Role18", name: "Role 18" }
    },
    tournament_id: 1,
    player_id: 18,
    subscription_date: BigInt(Date.now())
  },
  {
    Player: {
      id: 19,
      username: "Player19",
      profilePicturePath: "path/to/picture19",
      actualRank: "Rank19",
      phoneNumber: "2021222324",
      whatsappNickName: "NickName19",
      role: "Role19",
      joined_date: BigInt(Date.now()),
      Rank: { id: "Rank19", name: "Rank 19", logoImagePath: "path/to/rank19.png" },
      Role: { id: "Role19", name: "Role 19" }
    },
    tournament_id: 1,
    player_id: 19,
    subscription_date: BigInt(Date.now())
  },
  {
    Player: {
      id: 20,
      username: "Player20",
      profilePicturePath: "path/to/picture20",
      actualRank: "Rank20",
      phoneNumber: "2122232425",
      whatsappNickName: "NickName20",
      role: "Role20",
      joined_date: BigInt(Date.now()),
      Rank: { id: "Rank20", name: "Rank 20", logoImagePath: "path/to/rank20.png" },
      Role: { id: "Role20", name: "Role 20" }
    },
    tournament_id: 1,
    player_id: 20,
    subscription_date: BigInt(Date.now())
  }
];

//Subscriptions sample data
const Subscriptions16Players: KlSubscriptionEnhanced[] = SubscriptionsMax20Players.slice(0, 16);
const Subscriptions12Players: KlSubscriptionEnhanced[] = SubscriptionsMax20Players.slice(0, 12);
const Subscriptions8Players: KlSubscriptionEnhanced[] = SubscriptionsMax20Players.slice(0, 8);
const Subscriptions6Players: KlSubscriptionEnhanced[] = SubscriptionsMax20Players.slice(0, 6);
const Subscriptions4Players: KlSubscriptionEnhanced[] = SubscriptionsMax20Players.slice(0, 4);
const Subscriptions2Players: KlSubscriptionEnhanced[] = SubscriptionsMax20Players.slice(0, 2);

//Tournament sample data
const fullTournamentInfo1S: KlTournamentEnhanced = {
  id: 1,
  name: "Torneo de 1S",
  description: "Torneo de duelos",
  creationDate: BigInt(Date.now()),
  beginDate: null,
  matchPeriodTime: 1,
  endDate: null,
  cover_img_name: "torneo-1s.png",
  tournament_type: "SE",
  max_players: 4,
  match_format: "1S",
  custom_players_per_team: -1,
  TournamentType: {
    id: "SE",
    name: "Eliminación Simple"
  },
  MatchFormat: {
    id: "1S",
    name: "Duelo",
    players_per_team: 1
  },
  Tournament_Player_Subscriptions: SubscriptionsMax20Players
};
const fullTournamentInfo2S: KlTournamentEnhanced = {
  id: 2,
  name: "Torneo de 2S",
  description: "Torneo de 2vs2",
  creationDate: BigInt(Date.now()),
  beginDate: null,
  matchPeriodTime: 1,
  endDate: null,
  cover_img_name: "torneo-2s.png",
  tournament_type: "SE",
  max_players: 4,
  match_format: "2S",
  custom_players_per_team: -1,
  TournamentType: {
    id: "SE",
    name: "Eliminación Simple"
  },
  MatchFormat: {
    id: "2S",
    name: "2vs2",
    players_per_team: 2
  },
  Tournament_Player_Subscriptions: SubscriptionsMax20Players
};
const fullTournamentInfo3S: KlTournamentEnhanced = {
  id: 3,
  name: "Torneo de 3S",
  description: "Torneo de 3vs3",
  creationDate: BigInt(Date.now()),
  beginDate: null,
  matchPeriodTime: 1,
  endDate: null,
  cover_img_name: "torneo-3s.png",
  tournament_type: "SE",
  max_players: 6,
  match_format: "3S",
  custom_players_per_team: -1,
  TournamentType: {
    id: "SE",
    name: "Eliminación Simple"
  },
  MatchFormat: {
    id: "3S",
    name: "3vs3",
    players_per_team: 3
  },
  Tournament_Player_Subscriptions: SubscriptionsMax20Players
};
const fullTournamentInfoBK: KlTournamentEnhanced = {
  id: 4,
  name: "Torneo de BB",
  description: "Torneo de Baloncesto",
  creationDate: BigInt(Date.now()),
  beginDate: null,
  matchPeriodTime: 1,
  endDate: null,
  cover_img_name: "torneo-bb.png",
  tournament_type: "SE",
  max_players: 4,
  match_format: "BB",
  custom_players_per_team: -1,
  TournamentType: {
    id: "SE",
    name: "Eliminación Simple"
  },
  MatchFormat: {
    id: "BK",
    name: "Baloncesto",
    players_per_team: 2
  },
  Tournament_Player_Subscriptions: SubscriptionsMax20Players
};
const fullTournamentInfoCUSTOM5S: KlTournamentEnhanced = {
  id: 5,
  name: "Torneo de BB",
  description: "Torneo de Baloncesto",
  creationDate: BigInt(Date.now()),
  beginDate: null,
  matchPeriodTime: 1,
  endDate: null,
  cover_img_name: "torneo-bb.png",
  tournament_type: "SE",
  max_players: 20,
  match_format: "BB",
  custom_players_per_team: 5,
  TournamentType: {
    id: "SE",
    name: "Eliminación Simple"
  },
  MatchFormat: {
    id: "CU",
    name: "Personalizado",
    players_per_team: -1
  },
  Tournament_Player_Subscriptions: SubscriptionsMax20Players
};


describe("Generic Tournament (Abstract)", () =>{
  it("Plan: 2 people, 1 team, 2vs2. Should fail", () => {
    expect(() => {
      GenericTournament.PlanNextPhaseMatches(fullTournamentInfo2S, Subscriptions2Players);}).toThrow();
  });

  it("Plan: 4 people, 2 teams, 2vs2",async () => {
    const planning = GenericTournament.PlanNextPhaseMatches(fullTournamentInfo2S, Subscriptions4Players);
    expect(planning.ScheduledMatches).toHaveLength(1);
    expect(Math.round(moment.duration(planning.EndDate - planning.StartDate).asDays())).toBe(1);
    expect(moment(planning.StartDate).isSame(moment(), 'day')).toBe(true);
  });

  it("Plan: 20 People, 4 teams, CUSTOM 5vs5", () => {
    const planning = GenericTournament.PlanNextPhaseMatches(fullTournamentInfoCUSTOM5S, SubscriptionsMax20Players);
    expect(planning.ScheduledMatches).toHaveLength(2);
    expect(Math.round(moment.duration(planning.EndDate - planning.StartDate).asDays())).toBe(1);
    expect(moment(planning.StartDate).isSame(moment(), 'day')).toBe(true);
  });

  it("Plan: 8 people, 4 teams, 2vs2", () => {
    const planning = GenericTournament.PlanNextPhaseMatches(fullTournamentInfo2S, Subscriptions8Players);
    expect(planning.ScheduledMatches).toHaveLength(2);
    expect(Math.round(moment.duration(planning.EndDate - planning.StartDate).asDays())).toBe(1);
    expect(moment(planning.StartDate).isSame(moment(), 'day')).toBe(true);
  });

  it("Plan: 6 people, 2 teams, 3vs3", () => {
    const planning = GenericTournament.PlanNextPhaseMatches(fullTournamentInfo3S, Subscriptions6Players);
    expect(planning.ScheduledMatches).toHaveLength(1);
    expect(Math.round(moment.duration(planning.EndDate - planning.StartDate).asDays())).toBe(1);
    expect(moment(planning.StartDate).isSame(moment(), 'day')).toBe(true);
  });

  it("Plan 16 people, 8 teams, 2vs2", () => {
    const planning = GenericTournament.PlanNextPhaseMatches(fullTournamentInfo2S, Subscriptions16Players);
    expect(planning.ScheduledMatches).toHaveLength(4);
    expect(Math.round(moment.duration(planning.EndDate - planning.StartDate).asDays())).toBe(1);
    expect(moment(planning.StartDate).isSame(moment(), 'day')).toBe(true);
  })


  it("Plan: 12 people, 4 teams, 3vs3", () => {
    const planning = GenericTournament.PlanNextPhaseMatches(fullTournamentInfo3S, Subscriptions12Players);
    expect(planning.ScheduledMatches).toHaveLength(2);
    expect(Math.round(moment.duration(planning.EndDate - planning.StartDate).asDays())).toBe(1);
    expect(moment(planning.StartDate).isSame(moment(), 'day')).toBe(true);
  });
})