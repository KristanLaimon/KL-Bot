import CommandsHandler from '../src/bot/Commands';
import { ICommand } from '../src/types/commands';

let commandsHandler: CommandsHandler;
const everyoneCommandName = "LOWERCASECOMMAND";
const memberCommandName = "membercommand";
const adminCommandName = "admincommand";

const everyoneCommand: ICommand = {
  commandName: everyoneCommandName,
  description: "lowercase command",
  roleCommand: 'Cualquiera',
  onMsgReceived: jest.fn(),
};
const memberCommand: ICommand = {
  commandName: memberCommandName,
  description: "member command",
  roleCommand: 'Miembro',
  onMsgReceived: jest.fn(),
}
const adminCommand: ICommand = {
  commandName: adminCommandName,
  description: "admin command",
  roleCommand: 'Administrador',
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
      roleCommand: 'Cualquiera',
      onMsgReceived: jest.fn(),
    };
    expect(() => commandsHandler.AddCommand(duplicateCommand)).toThrow(Error);
  });

  it('Should throw an error when adding a command with a role command that is not "Cualquiera", "Administrador", or "Miembro"', () => {
    const invalidRoleCommand: ICommand = {
      commandName: 'INVALIDROLECOMMAND',
      description: "Invalid role command",
      ///@ts-ignore
      roleCommand: 'InvalidRole', // Invalid role command
      onMsgReceived: jest.fn(),
    };
    expect(() => commandsHandler.AddCommand(invalidRoleCommand))
      .toThrow();
  });
})

describe("Checking the existence of a command", () => {
  it('Should return false when the command does not exist', () => {
    const commandsHandler = new CommandsHandler();
    const nonExistentCommand = 'nonexistentcommand';
    const privilege = 'Miembro'; // Any privilege level can be used here
    expect(commandsHandler.HasPermisionToExecute(nonExistentCommand, privilege)).toBe(false);
  });
})

describe("Checking permissions of a command", () => {
  it('Should return true when the command is "Cualquiera"', () => {
    const commandName = 'LOWERCASECOMMAND';
    const expectedResult = true;
    const result = commandsHandler.HasPermisionToExecute(commandName, "Miembro");
    expect(result).toBe(expectedResult);
  });

  // New unit test for checking command permissions
  it('Should return true when the admin user has permission to execute a command', () => {
    const commandName = 'LOWERCASECOMMAND';
    const privilege = 'Administrador'; // User with admin privilege
    const expectedResult = true;
    const result = commandsHandler.HasPermisionToExecute(commandName, privilege);
    expect(result).toBe(expectedResult);
  });


  it('Should return false when the user does not have permission to execute a command', () => {
    const result = commandsHandler.HasPermisionToExecute(adminCommandName, "Miembro");
    expect(result).toBe(false);
  });

  it('Should return true when the command name is in uppercase and the user has "Administrador" privilege', () => {
    const result = commandsHandler.HasPermisionToExecute(adminCommandName.toUpperCase(), "Administrador");
    expect(result).toBe(true);
  });
})
