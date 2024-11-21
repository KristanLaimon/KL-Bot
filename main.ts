import Bot from "./src/bot";

///I should import my commands here on MAIN, and give them to the bot as 
///constructor param
async function Main() {
  const klBot = new Bot({ prefix: "!" });
  await klBot.StartBot();
}

Main();
