import { PendingMatch } from '../../types/db';
import Kldb from '../../utils/db';

export default class GlobalCache {
  // ---------------- Automatic Cache ------------------------
  // No need to handle it with UpdateCache(), it works by itself
  public static Auto_PendingMatches: PendingMatch[] = [];
  public static Auto_IdUsersUsingCommands: string[] = [];

  // ------------------ SemiAutomatic ------------------------
  // Needs to be updated with UpdateCache()
  public static SemiAuto_AllowedWhatsappGroups: NonNullable<Awaited<ReturnType<typeof Kldb.registeredWhatsappGroups.findFirst>>>[] = [];

  public static RemoveIdUserUsingCommand(userId: string): boolean {
    const index = this.Auto_IdUsersUsingCommands.indexOf(userId);
    if (index !== -1) {
      this.Auto_IdUsersUsingCommands.splice(index, 1);
      return true;
    }
    return false;
  }

  public static async UpdateCache() {
    this.SemiAuto_AllowedWhatsappGroups = await Kldb.registeredWhatsappGroups.findMany();
  }
}