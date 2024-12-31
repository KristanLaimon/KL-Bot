import path from "path";
import fs from "fs";
import { downloadMediaMessage, WAMessage } from "@whiskeysockets/baileys";

export function ReadJson<T>(jsonPath: string): T | null {
  try {
    const jsonData = JSON.parse(fs.readFileSync(jsonPath).toString());
    return jsonData as T;
  } catch (error) {
    return null;
  }
}

const playersImgsPath = path.join("db", "players");
const getFullPlayerImgPath = (imgPlayer: string) => path.join("db", "players", imgPlayer);
export function FileSystem_GetPlayerImagePath(playerName: string): string | null {
  if (!playerName) return null;
  const allImgsNames = fs.readdirSync(playersImgsPath);
  const playerImgName = allImgsNames.find(imgName => {
    const threeParts = imgName.split("-");
    const playerNameFound = threeParts[1]; //The Second part is the player name
    return playerNameFound.includes(playerName);
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
export async function FileSystem_TryToDownloadMedia(
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


export async function FileSystem_SaveObjToJSON(data: any, filePath: string):Promise<boolean> {
  try {
    const jsonData = toJSONSafe(data); // Convertimos BigInt antes de guardar
    fs.writeFileSync(filePath, jsonData, "utf-8");
    console.log(`File saved to ${filePath}`);
    return true;
  } catch (err) {
    console.error(`Error saving file ${filePath}:`, err);
    return false;
  }
}
function toJSONSafe(object: any): string {
  return JSON.stringify(object, (_, value) =>
    typeof value === "bigint" ? value.toString() : value, 2
  );
}

export function FileSystem_DeleteDirectory(folderPath: string): void {
  if (!fs.existsSync(folderPath)) {
    console.error(`La carpeta "${folderPath}" no existe.`);
    return;
  }

  // Leer el contenido de la carpeta
  const files = fs.readdirSync(folderPath);
  for (const file of files) {
    const fullPath = path.join(folderPath, file);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      // Si es una carpeta, eliminar recursivamente
      FileSystem_DeleteDirectory(fullPath);
    } else {
      // Si es un archivo, eliminar
      try {
        fs.unlinkSync(fullPath);
      } catch (error) {
        console.error(`Error al eliminar archivo "${fullPath}":`, error);
      }
    }
  }

  // Finalmente eliminar la carpeta vacía
  try {
    fs.rmdirSync(folderPath);
    console.log(`Carpeta "${folderPath}" eliminada correctamente.`);
  } catch (error) {
    console.error(`Error al eliminar la carpeta "${folderPath}":`, error);
  }

  // Finalmente eliminar la carpeta vacía
  fs.rmdirSync(folderPath);
  console.log(`Carpeta "${folderPath}" eliminada correctamente.`);
}