import path from 'path'
import fs from "fs";

const imgPlayersPath = path.join("db", "players");
const imgRanksPath = path.join("db", "ranks");

export function PlayerImage(playerName: string): string | null {
  const allImgsNames = fs.readdirSync(imgPlayersPath);
  const playerImgName = allImgsNames.find(imgName => {
    const threeParts = imgName.split("-");
    const playerNameFound = threeParts[1]; //Second part is the player name
    return playerName === playerNameFound;
  })
  if (playerImgName) return playerImgName; else return null;
}