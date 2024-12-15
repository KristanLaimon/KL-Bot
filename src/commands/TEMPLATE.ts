//@ts-ignore
export default class c implements ICommand {
  commandName: string = "";
  description: string = "";
  //@ts-ignore
  roleCommand: CommandAccessibleRoles = "Cualquiera";
  //@ts-ignore
  maxScope: ScopeType = "Group";
  //@ts-ignore
  async onMsgReceived(bot: Bot, args: BotCommandArgs) {

  }
}