import GlobalCache from '../../src/bot/cache/GlobalCache';
import Kldb from '../../src/utils/db';

jest.mock("../../src/utils/db", () => ({
  __esModule: true,
  default: {
    registeredWhatsappGroups: {
      findMany: jest.fn()
    },
    tournament: {
      findMany: jest.fn(),
      update: jest.fn()
    },
    scheduledMatchWindow: {
      create: jest.fn()
    },
    scheduledMatch: {
      create: jest.fn()
    },
    scheduledMatch_Player: {
      createMany: jest.fn()
    }
  }
}));
// {
//   name: string;
//   id: number;
//   description: string;
//   creationDate: bigint;
//   beginDate: bigint;
//   matchPeriodTime: number;
//   endDate: bigint | null;
//   cover_img_name: string | null;
//   tournament_type: string;
//   max_players: number;
// } []
(Kldb.registeredWhatsappGroups.findMany as jest.Mock).mockResolvedValue([]);
(Kldb.tournament.findMany as jest.Mock).mockResolvedValue([
  {
    name: "Dummy Tournament",
    id: 123,
    description: "This is a dummy tournament description.",
    creationDate: BigInt(Date.now()),
    beginDate: BigInt(Date.now() + 1000 * 5 /* 5 seconds */),
    matchPeriodTime: 7,
    endDate: null,
    cover_img_name: null,
    tournament_type: "SE",
    max_players: 16
  }
]);
