// import HashMapChaining, { MapToArray } from "./src/lib/HashMapChaining";
// import { KlPlayer } from "./src/types/db";
//
//
// const scheduledMatches = [
//   { scheduled_match_id: 9, team_color_id: "BLU", player_id: 2, Player: { username: "player2", id: 13 } },
//   { scheduled_match_id: 9, team_color_id: "BLU", player_id: 4, Player: { username: "player4", id: 15 } },
//   { scheduled_match_id: 9, team_color_id: "ORA", player_id: 1, Player: { username: "player1", id: 12 } },
//   { scheduled_match_id: 9, team_color_id: "ORA", player_id: 3, Player: { username: "player3", id: 14 } },
//   { scheduled_match_id: 10, team_color_id: "BLU", player_id: 5, Player: { username: "player5", id: 16 } },
//   { scheduled_match_id: 10, team_color_id: "BLU", player_id: 8, Player: { username: "player8", id: 19 } },
//   { scheduled_match_id: 10, team_color_id: "ORA", player_id: 6, Player: { username: "player6", id: 17 } },
//   { scheduled_match_id: 10, team_color_id: "ORA", player_id: 7, Player: { username: "player7", id: 18 } },
//   { scheduled_match_id: 11, team_color_id: "BLU", player_id: 9, Player: { username: "player9", id: 20 } },
//   { scheduled_match_id: 11, team_color_id: "BLU", player_id: 11, Player: { username: "player11", id: 22 } },
//   { scheduled_match_id: 11, team_color_id: "ORA", player_id: 10, Player: { username: "player10", id: 21 } },
//   { scheduled_match_id: 11, team_color_id: "ORA", player_id: 12, Player: { username: "player12", id: 23 } },
// ];
//
//
// //Start
// const matches = new Map<number, HashMapChaining<string, Partial<KlPlayer>>>();
// for (const match of scheduledMatches){
//   if(!matches.has(match.scheduled_match_id))
//     matches.set(match.scheduled_match_id, new HashMapChaining<string, Partial<KlPlayer>>());
//   matches.get(match.scheduled_match_id)!.add(match.team_color_id, match.Player);
// }
// const _ = MapToArray(matches);
// const finalResult = _.map((mapObj) =>
//   ({
//     scheduled_match_id: mapObj.key,
//     BlueTeam: mapObj.value.get('BLU').map(player => JSON.stringify(player)),
//     OrangeTeam: mapObj.value.get('ORA').map(player => JSON.stringify(player))
//   })
// );
// //Finish
//
// console.log(finalResult)