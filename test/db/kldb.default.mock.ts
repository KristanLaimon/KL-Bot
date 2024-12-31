import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended'
import { Tournaments, Players} from "./jsontypes";

import kldb from "../../src/utils/kldb";

jest.mock('../../src/utils/kldb', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}))

beforeEach(() => {
  mockReset(prismaMock)
  prismaMock.tournament.findMany.mockResolvedValue(Tournaments as any)
  prismaMock.player.findMany.mockResolvedValue(Players as any)
})

export const prismaMock = kldb as unknown as DeepMockProxy<PrismaClient>