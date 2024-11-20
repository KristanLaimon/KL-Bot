import Bot from "./src/bot";

async function Main() {
  const klBot = new Bot({ prefix: "!" });
  await klBot.StartBot();
}

Main();
