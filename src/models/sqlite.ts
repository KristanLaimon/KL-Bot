import sqlite from 'sqlite3'
import { DbPlayer } from '../types/db_types';

const db = new sqlite.Database("db/klbotdb.db", (err) => {
  throw new Error("There was an error opening db, " + err);
});

export function Player_Insert(playerData: DbPlayer): boolean {
  const InsertNewPlayer = db.prepare(PLAYER_INSERT);
  InsertNewPlayer.run(
    playerData.username,
    playerData.profilePicturePath,
    playerData.actualRank,
    playerData.tournamentSelected,
    playerData.phoneNumber,
    playerData.whatsappNickName,
    playerData.role,
    (error) => {
      console.log("There was an error inserting a player record");
      console.log(error);
      return false;
    }
  );
  return true;
}

// Player
const PLAYER_INSERT = `
  INSERT INTO Player
  ( 
    username,
    profilePicturePath,
    actualRank,
    tournamentSelected,
    phoneNumber,
    whatsappNickName,
    role
  )
  VALUES 
  (?, ?, ?, ?, ?, ?, ?)
`