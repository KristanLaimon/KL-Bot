//Not a test, just a helper code to store an actual copy of some database tables and test with them
import fs from "fs";
import { FileSystem_DeleteDirectory, FileSystem_SaveObjToJSON } from "../../src/utils/filesystem";
import path from "path";
import Kldb from "../../src/utils/kldb";

const getPath = (name: string) => path.join("./", name);

async function main(){
  await FileSystem_SaveObjToJSON(await Kldb.player.findMany({ include: { Rank: true, Role: true } }), getPath("players.json"));
  await FileSystem_SaveObjToJSON(await Kldb.tournament.findMany({ include: { TournamentType: true, MatchFormat: true, Tournament_Player_Subscriptions: {include: { Player: { include: { Rank: true, Role: true } }} } } }), getPath("tournaments.json"));
}

main().then(r => "Copy done!").catch((e) => console.error(e));
