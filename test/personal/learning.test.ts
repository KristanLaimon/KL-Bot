import { WAMessage } from '@whiskeysockets/baileys';
import { ReadJson } from '../../src/utils/filesystem'
import { Logger_Type_MsgsLogJson } from '../../src/bot/logger';

const allMsgs = ReadJson<Logger_Type_MsgsLogJson>('logs/msgslog.json');

it('Shouldnt be nullable', () => {
  expect(allMsgs).not.toBeNull();
})

// it("Should spy on math add function", () => {
//   expect((math.add as jest.Mock).mock.calls.length).toBe(1);
// });

// console.log(math.add(2, 3)); // Output: 10