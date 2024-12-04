import path from 'path'
import fs from "fs";
const playersImgsPath = path.join("db", "players");
const getFullPlayerImgPath = (imgPlayer: string) => path.join("db", "players", imgPlayer);

export function PlayerImage(playerName: string): string | null {
  const allImgsNames = fs.readdirSync(playersImgsPath);
  const playerImgName = allImgsNames.find(imgName => {
    const threeParts = imgName.split("-");
    const playerNameFound = threeParts[1]; //Second part is the player name
    return playerName === playerNameFound;
  })
  if (playerImgName) return getFullPlayerImgPath(playerImgName); else return null;
}