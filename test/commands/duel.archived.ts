import Bot from '../../src/bot';
import { Logger_Type_MsgsLogJson } from '../../src/bot/logger';
import DuelCommand from '../../src/commands/general/duel';
import { BotCommandArgs } from '../../src/types/bot';
import Kldb, { Kldb_Ram_PendingMatches } from '../../src/utils/db';
import { ReadJson } from '../../src/utils/filesystem';
import { Members_GetMemberInfoFromPhone } from '../../src/utils/members';

//Mocking tools
jest.mock('../../src/utils/members');
jest.mock("../../src/utils/db", () => ({
  player: {
    create: jest.fn(),
  },
}));

const bot = { Send: { Text: jest.fn() } };

//Mocking data to use
const msgsMocks = ReadJson<Logger_Type_MsgsLogJson>('./logs/msgslog.json');
if (!msgsMocks) throw new Error('No messages found wtf');
const originalMsgMock = msgsMocks.RegisteredGroup.text[0];
const args: Partial<BotCommandArgs> = {
  originalMsg: originalMsgMock,
  chatId: '12345120363369589465642@g.us',
};

//Initializing direct dependencies
const duelCommand = new DuelCommand();
beforeEach(() => {
  jest.clearAllMocks();
});

//Test!
it('should create a member in the database', async () => {
  const memberInfo = { id: 1, username: 'testuser', role: 'AD' };
  bot.Send.Text = TalkingAsyncMock(bot.Send.Text, [
    "Ahora se está esperando que conteste...",
  ])

  await duelCommand.onMsgReceived(bot as any, args as any);

  expect(Kldb_Ram_PendingMatches.length).toBe(1);
});

function TalkingAsyncMock(functionMock: jest.Mock, msgs: string[]) {
  for (const msg of msgs) {
    functionMock.mockResolvedValueOnce(msg);
  }
  return functionMock;
}

// it('should send a message to the chat if the member is already registered', async () => {
//   const duelCommand = new DuelCommand();
//   const memberInfo = { id: 1, username: 'testuser', role: 'AD' };
//   Members_GetMemberInfoFromPhone.mockResolvedValue(memberInfo);

//   await duelCommand.onMsgReceived(bot, args);

//   expect(bot.Send.Text).toHaveBeenCalledTimes(1);
//   expect(bot.Send.Text).toHaveBeenCalledWith(args.chatId, expect.any(String));
// });

// it('should handle errors when creating a member in the database', async () => {
//   const duelCommand = new DuelCommand();
//   Members_GetMemberInfoFromPhone.mockResolvedValue(null);
//   Kldb.player.create.mockRejectedValue(new Error('Test error'));

//   await duelCommand.onMsgReceived(bot, args);

//   expect(bot.Send.Text).toHaveBeenCalledTimes(1);
//   expect(bot.Send.Text).toHaveBeenCalledWith(args.chatId, expect.any(String));
// });