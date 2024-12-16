
//@ts-ignore
export default class c implements ICommand {
  commandName: string = "";
  description: string = "";
  //@ts-ignore
  maxScope: ScopeType = "Group";
  //@ts-ignore
  minimumRequiredPrivileges: CommandAccessibleRoles = "Cualquiera";
  //@ts-ignore
  async onMsgReceived(bot: Bot, args: BotCommandArgs) {

  }
}