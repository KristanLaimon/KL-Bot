//@ts-ignore
export default class c implements ICommandExtension {
  //@ts-ignore
  async onMsgReceived(bot: Bot, args: BotCommandArgs, originalCommand: ICommand) {
    //@ts-ignore
    const chat = new SpecificChat(bot, args);
    //@ts-ignore
    const dialog = new SpecificDialog(bot, args);
    try {

    } catch (e) {
      //@ts-ignore
      Msg_DefaultHandleError(bot, args.chatId, e);
    }
  }
}

