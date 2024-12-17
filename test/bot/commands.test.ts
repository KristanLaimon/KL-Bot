import CommandsHandler from '../../src/bot/Commands';
import { ICommand } from '../../src/types/commands';

let commandsHandler: CommandsHandler;
const everyoneCommandName = "LOWERCASECOMMAND";
const memberCommandName = "membercommand";
const adminCommandName = "admincommand";

const everyoneCommand: ICommand = {
  commandName: everyoneCommandName,
  description: "lowercase command",
  minimumRequiredPrivileges: 'Cualquiera',
  maxScope: 'External',
  onMsgReceived: jest.fn(),
};
const memberCommand: ICommand = {
  commandName: memberCommandName,
  description: "member command",
  minimumRequiredPrivileges: 'Miembro',
  maxScope: 'Group',
  onMsgReceived: jest.fn(),
}
const adminCommand: ICommand = {
  commandName: adminCommandName,
  description: "admin command",
  minimumRequiredPrivileges: 'Administrador',
  maxScope: 'Group',
  onMsgReceived: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks();
  commandsHandler = new CommandsHandler();
  commandsHandler.AddCommand(everyoneCommand);
  commandsHandler.AddCommand(memberCommand);
  commandsHandler.AddCommand(adminCommand);
});

describe("Adding a command", () => {
  it('Should add a new command with lowercase command name', () => {
    expect(commandsHandler.Exists('lowercasecommand')).toBe(true);
  });

  it('Should not add a command with an existing command name', () => {
    const duplicateCommand: ICommand = {
      commandName: 'lowercasecommand', // Existing command name
      description: "duplicate lowercase command",
      minimumRequiredPrivileges: 'Cualquiera',
      maxScope: 'External',
      onMsgReceived: jest.fn(),
    };
    expect(() => commandsHandler.AddCommand(duplicateCommand)).toThrow(Error);
  });
})

describe("Checking the existence of a command", () => {
  it('Should return false when the command does not exist', () => {
    const commandsHandler = new CommandsHandler();
    const nonExistentCommand = 'nonexistentcommand';
    const privilege = 'Miembro'; // Any privilege level can be used here
    expect(commandsHandler.HasPermissionToExecute(nonExistentCommand, privilege)).toBe(false);
  });
})

describe("Checking permissions of a command", () => {
  it('Should return true when the command is "Cualquiera"', () => {
    const commandName = 'LOWERCASECOMMAND';
    const expectedResult = true;
    const result = commandsHandler.HasPermissionToExecute(commandName, "Miembro");
    expect(result).toBe(expectedResult);
  });

  // New unit test for checking command permissions
  it('Should return true when the admin user has permission to execute a command', () => {
    const commandName = 'LOWERCASECOMMAND';
    const privilege = 'Administrador'; // User with admin privilege
    const expectedResult = true;
    const result = commandsHandler.HasPermissionToExecute(commandName, privilege);
    expect(result).toBe(expectedResult);
  });


  it('Should return false when the user does not have permission to execute a command', () => {
    const result = commandsHandler.HasPermissionToExecute(adminCommandName, "Miembro");
    expect(result).toBe(false);
  });

  it('Should return true when the command name is in uppercase and the user has "Administrador" privilege', () => {
    const result = commandsHandler.HasPermissionToExecute(adminCommandName.toUpperCase(), "Administrador");
    expect(result).toBe(true);
  });
})
