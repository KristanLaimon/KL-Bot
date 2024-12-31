import fs from "fs";
import path from "path";
import { FileSystem_GetPlayerImagePath } from "../../src/utils/filesystem";

const playersImgsPath = path.join("db", "players");
const getFullPlayerImgPath = (imgPlayer: string) => path.join("db", "players", imgPlayer);

jest.mock('fs', () => ({
  readdirSync: jest.fn(() => {
    console.log("Mock called: fs.readdirSync");
    return [];
  }), // Add a debug log to confirm the mock is being used
}));

describe('Get player image name path from local resources', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null when player name is not found', () => {
    (fs.readdirSync as jest.Mock).mockReturnValue(['img1-unknown-player.jpg', 'img2-another-player.jpg']);
    const playerName = 'non-existent-player';
    const result = FileSystem_GetPlayerImagePath(playerName);
    expect(result).toBeNull();
  });

  // it('should return correct image path when player name is found', () => {
  //   (fs.readdirSync as jest.Mock).mockReturnValue(['img1-player1.jpg', 'img2-player2.jpg']);
  //   const playerName = 'player1';
  //   const expectedPath = getFullPlayerImgPath(`img1-${playerName}.jpg`);
  //   const result = FileSystem_GetPlayerImagePath(playerName);
  //   expect(result).toBe(expectedPath);
  // });
  //
  it('should return null when player name is empty', () => {
    const playerName = '';
    const result = FileSystem_GetPlayerImagePath(playerName);
    expect(result).toBeNull();
  });

  it('should return null when player name is null', () => {
    const playerName = null;
    const result = FileSystem_GetPlayerImagePath(playerName);
    expect(result).toBeNull();
  });
});


//I couldn't test Db_TryToDownloadMedia...