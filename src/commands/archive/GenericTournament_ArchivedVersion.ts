// import { KlSubscriptionEnhanced, KlTournament, KlTournamentEnhanced, KlTournamentSimple } from "../types/db";
// import moment from "moment/moment";
// import { ScheduledMatch, ScheduledMatchWindow } from "../types/tournament";
// import KlLogger from "../bot/logger";
// import Kldb from "../utils/kldb";
//
// /**
//  * Abstract class that represents a type of tournament.
//  */
// export abstract class GenericTournament {
//
//   private name: string
//   private id: string;
//   constructor(
//     name:string | KlTournament,
//     private description:string,
//     private readonly creationDate: number,
//     private matchPeriodTime: number,
//     private max_players: number,
//     private tournament_type: string,
//     private match_format: string,
//     private custom_players_per_team: number = -1,
//     private beginDate?: number,
//     private endDate?: number,
//     private cover_img_name?: string
//   ){
//     if(this.__isTournamentInfo(name)){
//       this.name = name.name;
//       this.description = name.description;
//       this.creationDate = Number(name.creationDate);
//       this.beginDate = Number(name.beginDate);
//       this.endDate = Number(name.endDate);
//       this.matchPeriodTime = name.matchPeriodTime;
//       this.max_players = name.max_players;
//       this.tournament_type = name.tournament_type;
//       this.match_format = name.match_format;
//       this.custom_players_per_team = name.custom_players_per_team;
//       this.cover_img_name = name.cover_img_name;
//     }else{
//       this.name = name;
//     }
//   }
//
//   public async InsertSelfToDb(){
//     try {
//       await Kldb.tournament.create({
//         data: {
//           name: this.name,
//           description: this.description,
//           endDate: this.endDate,
//           matchPeriodTime: this.matchPeriodTime,
//           max_players: this.max_players,
//           tournament_type: this.tournament_type,
//           match_format: this.match_format,
//           custom_players_per_team: this.custom_players_per_team,
//           creationDate: this.creationDate ? this.creationDate : null,
//           beginDate: this.beginDate ? this.beginDate : null,
//           cover_img_name: this.cover_img_name ? this.cover_img_name : null
//         }
//       });
//       return true;
//     }catch(e){
//       return false;
//     }
//   }
//
//   public async PlanNextPhaseMatches(): Promise<ScheduledMatchWindow|null> {
//     //Check if it's a custom match or a normal one
//     const fullTournamentInfo = await this.__getInfoEnhancedOfthis();
//     if(fullTournamentInfo === null) return null;
//     const participants:KlSubscriptionEnhanced[] = fullTournamentInfo.Tournament_Player_Subscriptions;
//
//     let playersPerTeam = fullTournamentInfo.custom_players_per_team !== -1 ? fullTournamentInfo.custom_players_per_team : fullTournamentInfo.MatchFormat.players_per_team;
//     if (playersPerTeam === -1) throw new Error("Custom players per team not correctly implemented");
//     const numTeams = Math.floor(participants.length / playersPerTeam);
//     const randomizedPlayers = shuffle(participants);
//     const randomizedTeams = new Array(numTeams).fill(0).map((_, index) => randomizedPlayers.slice(index * playersPerTeam, (index + 1) * playersPerTeam));
//
//     if (randomizedTeams.length === 0 || randomizedTeams.length === 1) {
//       throw new Error(`Can't plan a tournament with less than 2 teams. There are ${randomizedTeams.length} teams and received ${participants.length} players`);
//     }
//
//     const toReturn: ScheduledMatch[] = [];
//
//     const perfectLogTwoPlanning = (teams: KlSubscriptionEnhanced[][]) => {
//       //Equipos de 2 en 2
//       for (let i = 0; i < teams.length - 1; i += 2) {
//         toReturn.push({
//           MatchTypeId: fullTournamentInfo.match_format,
//           Team1: teams[i].map(participantInfo => participantInfo.Player),
//           Team2: teams[i + 1].map(participantInfo => participantInfo.Player)
//         });
//       }
//     };
//
//     if (isPositivePowerOfTwo(randomizedTeams.length)) {
//       perfectLogTwoPlanning(randomizedTeams)
//     } else {
//       KlLogger.error("For some reason, the number of teams is not a power of 2, when doing the planning!");
//       const leftOversCount = GetRemindedCountByLogTwo(randomizedTeams.length);
//       const leftOvers = randomizedTeams.splice((randomizedTeams.length - 1) - leftOversCount, leftOversCount);
//       perfectLogTwoPlanning(randomizedTeams);
//     }
//
//     return {
//       StartDate: Date.now(),
//       EndDate: moment().add(fullTournamentInfo.matchPeriodTime, 'days').valueOf(),
//       ScheduledMatches: toReturn
//     }
//   }
//
//   private __isTournamentInfo(obj: any): obj is KlTournament{
//     return (
//       typeof obj.name === 'string' &&
//       typeof obj.description === 'string' &&
//       (typeof obj.creationDate === 'number' || (typeof obj.creationDate === 'bigint' && typeof Number(obj.creationDate) === 'number')) &&
//       (typeof obj.beginDate === 'number' || (typeof obj.beginDate === 'bigint' && typeof Number(obj.beginDate) === 'number')) &&
//       (typeof obj.endDate === 'number' || (typeof obj.endDate === 'bigint' && typeof Number(obj.endDate) === 'number')) &&
//       typeof obj.matchPeriodTime === 'number' &&
//       typeof obj.max_players === 'number' &&
//       typeof obj.tournament_type === 'string' &&
//       typeof obj.match_format === 'string' &&
//       typeof obj.custom_players_per_team === 'number' &&
//       typeof obj.cover_img_name === 'string'
//     );
//   }
//   private async __getMoreInfoFromThis():Promise<KlTournamentSimple | null>{
//     try{
//       return await Kldb.tournament.findFirstOrThrow({
//         where: {
//           name: this.name
//         },
//         include: {
//           TournamentType: true,
//           MatchFormat: true,
//         }
//       })
//     }catch(e){
//       return null;
//     }
//   }
//   private async __getSubscriptionsFromThis():Promise<KlSubscriptionEnhanced[] | null>{
//     try{
//       return await Kldb.tournament.findFirstOrThrow({
//         where: {
//           id: this.id
//         },
//         include: {
//           Tournament_Player_Subscriptions: { include: { Player: { include: { Rank: true, Role: true } } } }
//         }
//       }).then(tournament => tournament.Tournament_Player_Subscriptions);
//     }catch(e){
//       return null;
//     }
//   }
// }
//
// //#region Utils (GenericTournament)
// function shuffle<T>(array: T[]): T[] {
//   const toReturn = structuredClone(array);
//   for (let i = toReturn.length - 1; i > 0; i--) {
//     let j = Math.floor(Math.random() * (i + 1));
//     [toReturn[i], toReturn[j]] = [toReturn[j], toReturn[i]];
//   }
//   return toReturn;
// }
// function GetRemindedCountByLogTwo(num: number) {
//   const log = Math.floor(Math.log2(num));
//   const actualTwoPow = Math.pow(2, log);
//   return num % actualTwoPow;
// }
//
// function isPositivePowerOfTwo(num: number): boolean {
//   return num > 0 && Math.log2(num) % 1 === 0;
// }
//
// function LogInBase(number: number, base: number) {
//   return Math.log(number) / Math.log(base);
// }
// //#endregion
//
//
//
//
//
