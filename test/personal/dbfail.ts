import KlLogger from '../../src/bot/logger';
import Kldb, { Db_DeleteTournamentById } from '../../src/utils/db';
import fs from 'fs';

jest.mock('fs', () => ({
  __esModule: true,
  default: {
    ...jest.requireActual('fs'),
    readdirSync: jest.fn(),
    unlinkSync: jest.fn(),
  }
}));

jest.mock('../../src/bot/logger', () => ({
  KlLogger: {
    error: jest.fn(),
  },
}));

jest.mock('../../src/utils/db', () => ({
  __esModule: true,
  ...jest.requireActual('../../src/utils/db'), // keep the original implementation
  tournament: {
    findFirst: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Db_DeleteTournamentById', () => {
  it('should return true when tournament exists and deletion is successful', async () => {
    const tournamentId = 1;
    const date = Date.now()
    const tournamentInfo = { id: tournamentId, name: 'Test Tournament', beginDate: date };
    const coverImgName = `Test Tournament-${date}.jpg`;
    const allCoversImgNames = [coverImgName];

    expect(Kldb).toBeTruthy();
    console.log(JSON.stringify(Kldb, null, 2))
    expect(Kldb.tournament).toBeTruthy();

    (Kldb.tournament.findFirst as jest.Mock).mockResolvedValue(tournamentInfo);
    (fs.readdirSync as jest.Mock).mockReturnValue(allCoversImgNames);
    (fs.unlinkSync as jest.Mock).mockImplementation(() => { });
    (Kldb.tournament.delete as jest.Mock).mockResolvedValue({});

    const result = await Db_DeleteTournamentById(tournamentId);
    expect((fs.unlinkSync as jest.Mock).mock.calls[0][0]).toBe(coverImgName);
    expect(result).toBe(true);
  });

  it('should return false when tournament does not exist', async () => {
    const tournamentId = 1;
    (Kldb.tournament.findFirst as jest.Mock).mockResolvedValue(null);

    const result = await Db_DeleteTournamentById(tournamentId);
    expect(result).toBe(false);
  });

  it('should return false when error deleting tournament cover', async () => {
    const tournamentId = 1;
    const tournamentInfo = { id: tournamentId, name: 'Test Tournament', beginDate: new Date() };
    const allCoversImgNames = ['Test-Tournament-2022-01-01.jpg'];

    (Kldb.tournament.findFirst as jest.Mock).mockResolvedValue(tournamentInfo);
    (fs.readdirSync as jest.Mock).mockReturnValue(allCoversImgNames);
    (fs.unlinkSync as jest.Mock).mockImplementation(() => { throw new Error('Mock error'); });
    (KlLogger.error as jest.Mock).mockImplementation(() => { });

    const result = await Db_DeleteTournamentById(tournamentId);
    expect(result).toBe(false);
  });

  it('should return false when error deleting tournament from database', async () => {
    const tournamentId = 1;
    const tournamentInfo = { id: tournamentId, name: 'Test Tournament', beginDate: new Date() };
    const allCoversImgNames = ['Test-Tournament-2022-01-01.jpg'];
    (Kldb.tournament.findFirst as jest.Mock).mockResolvedValue(tournamentInfo);
    (fs.readdirSync as jest.Mock).mockReturnValue(allCoversImgNames);
    (fs.unlinkSync as jest.Mock).mockImplementation(() => { });
    (Kldb.tournament.delete as jest.Mock).mockRejectedValue(new Error('Mock error'));

    const result = await Db_DeleteTournamentById(tournamentId);
    expect(result).toBe(false);
  });
});