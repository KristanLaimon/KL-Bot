import path from 'path';
import fs from 'fs'
import { downloadMediaMessage, WAMessage } from '@whiskeysockets/baileys';

const playersImgsPath = path.join("db", "players");
const getFullPlayerImgPath = (imgPlayer: string) => path.join("db", "players", imgPlayer);
export function GetPlayerImagePath(playerName: string): string | null {
  const allImgsNames = fs.readdirSync(playersImgsPath);
  const playerImgName = allImgsNames.find(imgName => {
    const threeParts = imgName.split("-");
    const playerNameFound = threeParts[1]; //Second part is the player name
    return playerName === playerNameFound;
  })
  if (playerImgName) return getFullPlayerImgPath(playerImgName); else return null;
}

/**
 * Downloads media from a WAMessage and saves it to a specified folder.
 * 
 * @param rawMsg - The raw WhatsApp message containing the media.
 * @param fileName - The desired file name (without extension).
 * @param extension - The file extension (e.g., 'jpg', 'mp4').
 * @param folderToStore - The folder path where the file will be stored.
 * @returns {Promise<boolean>} - True if the media is downloaded successfully, false otherwise.
 */
export async function DownloadMedia(
  rawMsg: WAMessage,
  fileName: string,
  extension: string,
  folderToStore: string
): Promise<boolean> {
  try {
    if (!fs.existsSync(folderToStore)) fs.mkdirSync(folderToStore, { recursive: true });
    const buffer = await downloadMediaMessage(rawMsg, 'buffer', {});
    if (!buffer) return false;
    const outputPath = path.join(folderToStore, `${fileName}.${extension}`);
    fs.writeFileSync(outputPath, buffer);
    return true;
  } catch (error) {
    return false;
  }
}