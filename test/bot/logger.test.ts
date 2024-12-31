import * as fs from "fs";

it("Should read a json file", () => {
  expect(() => {
    const jsonData = JSON.parse(fs.readFileSync("test/commands/_test.mock.json").toString());
    expect(jsonData).toBeTruthy();
  }).not.toThrow();
})

//I know this works
// it('Must register a rawmsg into logs folder', () => {
//   expect(() => {
//     const allContentBefore = fs.readFileSync('logs/msgslog.json');
//     Log_LogRawMsg(_rawMsgMock as any);
//
//     const nowContent = fs.readFileSync('logs/msgslog.json');
//     expect(nowContent).not.toEqual(allContentBefore);
//
//     fs.writeFileSync('logs/msgslog.json', allContentBefore);
//
//     const allContentNow = fs.readFileSync('logs/msgslog.json');
//     expect(allContentBefore).toEqual(allContentNow);
//   }).not.toThrow();
//
//   expect(fs.existsSync("/logs/msgslog.json") === true);
// })