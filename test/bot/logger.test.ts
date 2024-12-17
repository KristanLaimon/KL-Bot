import * as fs from 'fs';
import _rawMsgMock from '../_rawMsgMock';
import { Log_LogRawMsg } from '../../src/bot/logger';

it("Should read a json file", () => {
  expect(() => {
    const jsonData = JSON.parse(fs.readFileSync("test/_test.json").toString());
    expect(jsonData).toBeTruthy();
  }).not.toThrow();
})

it('Must register a rawmsg into logs folder', () => {
  expect(() => {
    const allContentBefore = fs.readFileSync('logs/msgslog.json');
    Log_LogRawMsg(_rawMsgMock as any);

    const nowContent = fs.readFileSync('logs/msgslog.json');
    expect(nowContent).not.toEqual(allContentBefore);

    fs.writeFileSync('logs/msgslog.json', allContentBefore);

    const allContentNow = fs.readFileSync('logs/msgslog.json');
    expect(allContentBefore).toEqual(allContentNow);
  }).not.toThrow();

  expect(fs.existsSync("/logs/msgslog.json") === true);
})