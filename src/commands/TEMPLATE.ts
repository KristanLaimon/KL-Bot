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
    //@ts-ignore
    const dialog = new SpecificDialog(bot, args);
    try {

    } catch (e) {
      //@ts-ignore
      Msg_DefaultHandleError(bot, args, e);
    }
  }
}
