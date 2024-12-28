//@ts-ignore
export default class c implements ICommand {
  commandName: string = "";
  description: string = "";
  //@ts-ignore
  maxScope: CommandScopeType = "Group";
  //@ts-ignore
  minimumRequiredPrivileges: CommandAccessibleRoles = "Cualquiera";
  //@ts-ignore
  helpMessage?: CommandHelpInfo;
  //@ts-ignore
  async onMsgReceived(bot: Bot, args: BotCommandArgs) {
    //@ts-ignore
    const chat = new SpecificChat(bot, args);
    try {

    } catch (e) {
      //@ts-ignore
      Msg_DefaultHandleError(bot, args.chatId, e);
    }
  }
}

//@ts-ignore
async function Help1(chat: SpecificChat) {
}

//@ts-ignore
async function Help2(chat: SpecificChat) {
}

//@ts-ignore
async function Help3(chat: SpecificChat) {
}

//@ts-ignore
async function Help4(chat: SpecificChat) {
}
