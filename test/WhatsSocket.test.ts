import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys';
import WhatsSocket from '../src/bot/WhatsSocket'



let socket: WhatsSocket;
describe('REAL: General Connection', () => {
  it('Should connect to whatsapp servers', async () => {
    expect(async () => {
      socket = new WhatsSocket();
      const errorTimeout = setTimeout(() => {
        throw new Error("It was a lot of time!");
      }, 7000)
      await socket.Init();
      clearTimeout(errorTimeout);
    }).not.toThrow();
  })
})

