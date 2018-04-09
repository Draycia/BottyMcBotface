import Discord = require('discord.js');
import Params from './Command';
import KeyValueArray, { KeyValue, Command } from './KeyValue';

export default class Helper {
    private Bot: Discord.Client
    private commandStates: KeyValueArray<KeyValueArray<boolean>> = new KeyValueArray<KeyValueArray<boolean>>();
    private commandCaches: KeyValueArray<KeyValueArray<Command>> = new KeyValueArray<KeyValueArray<Command>>();

    public readonly fileName = __filename.substr(__filename.lastIndexOf('\\') + 1, __filename.lastIndexOf('.'));
    public readonly className = this.constructor.name;
    public init(obj: any) {
        console.log(`'${this.className}' module loaded from file '${this.fileName}'!`);
        this.Bot = obj.bot;
        const commands = (<KeyValueArray<KeyValueArray<Command>>>obj.commandObj);
        commands.keys.forEach((classKey, index, array) => {
            this.commandStates.Add(classKey, new KeyValueArray<boolean>());
            this.commandCaches.Add(classKey, new KeyValueArray<Command>());
            commands.Item(classKey).keys.forEach((cmdKey, index, array) => {
                this.commandStates.Item(classKey).Add(cmdKey, commands.Item(classKey).Item(cmdKey).isActive);
                this.commandCaches.Item(classKey).Add(cmdKey, commands.Item(classKey).Item(cmdKey));
            });
        });
    }

    public deinit() {
        console.log(`'${this.className}' module unloaded from file '${this.fileName}'!`);
    }

    public getHelpInfo(eventArgs: Params) {
        let text: string = '';
        let response: string[] = [];
        const moduleKeysLC =  this.commandStates.keys.map(k => k.toLowerCase());
        if (eventArgs.args.length === 0 || eventArgs.args[0].toLowerCase() === 'all') {
            this.commandStates.values.forEach((OuterV, OuterI, OuterA) => {
                response.push(`**__\`${this.commandCaches.keys[OuterI]}\`__**`);
                OuterV.values.filter((InnerV, InnerI, InnerA) => InnerV === true).forEach((PassV, PassI, PassA) => {
                    const cmd = this.commandCaches.values[OuterI].values[PassI];
                    response.push(`**    \`${OuterV.keys[PassI]}\`**${cmd.aliases.length !== 0 ? `\` (\`*\`${cmd.aliases.join('\`*\`, \`*\`')}\`*\`)\`` : ''}\:\n    *- ${cmd.description}*`);
                })
            });
            text = (`List of Commands:\n ${response.join('\n')}`);
        } else if (eventArgs.args.length === 1) {
            if (moduleKeysLC.includes(eventArgs.args[0].toLowerCase())) {
                const moduleName: string = this.commandStates.keys[moduleKeysLC.indexOf(eventArgs.args[0].toLowerCase())];
                this.commandCaches.Item(moduleName).keys.forEach((InnerKey, InnerI, InnerA) => {
                    const cmd = this.commandCaches.Item(moduleName).values[InnerI];
                    response.push(`**    \`${InnerKey}\`**${cmd.aliases.length !== 0 ? `\` (\`*\`${cmd.aliases.join('\`*\`, \`*\`')}\`*\`)\`` : ''}\:\n    *- ${cmd.description}*`);
                });
                text = (`Commands within \`${moduleName}\`:\n ${response.join('\n')}`);
            } else {
                this.commandStates.keys.forEach((OuterK, OuterI, OuterA) => {
                    let moduleNameAdded: boolean = false;
                    this.commandCaches.Item(OuterK).values
                        .filter((InnerV, InnerI, InnerA) => (InnerV.isActive) && (InnerV.aliases.map(value => value.toLowerCase()).filter(value => value.includes(eventArgs.args[0])).length > 0 || (InnerV.description.toLowerCase().includes(eventArgs.args[0])) === true))
                        .forEach((PassV, PassI, PassA) => {
                            moduleNameAdded ? null : response.push(`**__\`${OuterK}\`__**`); moduleNameAdded = true;
                            const cmd = this.commandCaches.values[OuterI].values[PassI];
                            const helpData = `**    \`${this.commandCaches.Item(OuterK).keys[PassI]}\`**${cmd.aliases.length !== 0 ? `\` (\`*\`${cmd.aliases.join('\`*\`, \`*\`')}\`*\`)\`` : ''}\:\n    *- ${cmd.description}*`;
                            response.includes(helpData) ? null : response.push(helpData);
                        });
                });
                text = (`Commands with \`${eventArgs.args[0]}\`:\n ${response.join('\n')}`);
            }
        } else if (eventArgs.args.length === 2) {
            const moduleName = moduleKeysLC.includes(eventArgs.args[0].toLowerCase()) ? this.commandStates.keys[moduleKeysLC.indexOf(eventArgs.args[0].toLowerCase())] : ''; 
            if (moduleName !== '') {
                this.commandCaches.Item(moduleName).values.filter(value => value.isActive).filter(value => value.aliases.map(a => a.toLowerCase()).filter(a => a.includes(eventArgs.args[1].toLowerCase())).length > 0).forEach(command => {
                    response.push(`**    \`${command.aliases[0]}\`**${command.aliases.length !== 0 ? `\` (\`*\`${command.aliases.join('\`*\`, \`*\`')}\`*\`)\`` : ''}\:\n    *- ${command.description}*`);
                });
                text = (`Commands in \`${eventArgs.args[0]}\` with \`${eventArgs.args[1]}\`:\n ${response.length === 0 ? 'No Commands matched the specified text inside that Module name.' : response.join('\n')}`);
            } else {
                text = (`No Module exists with name \`${eventArgs.args[0]}\``);
            }
        }
        text === '' ? null : eventArgs.message.channel.send(text);
    }
}




/// /// /// /// ///
/// /// /// ///

/*
import Discord = require("discord.js");
import { fileBackedObject } from "./FileBackedObject";
import { SharedSettings } from "./SharedSettings";

type SingleCommand = (message: Discord.Message, isAdmin: boolean, command: string, args: string[]) => void;

export interface CommandHolder {
    identifier: string;
    command: Command;
    handler: SingleCommand;
    prefix: string;
}

enum CommandStatus {
    ENABLED = 1, DISABLED = 0,
}

export interface Command {
    aliases: string[];
    description: string;
    prefix: string;
    admin: boolean;
}

export interface CommandList {
    controller: {
        toggle: Command;
        help: Command;
    };
    welcome: Command;
    uptime: Command;
    autoReact: {
        toggle_default_thinking: Command;
        toggle_react: Command;
        refresh_thinking: Command;
    };
    info: {
        all: Command,
        note: Command,
    };
    officeHours: {
        open: Command;
        close: Command;
        ask: Command;
        ask_for: Command;
        question_list: Command;
        question_remove: Command;
    };
    riotApiLibraries: Command;
    apiStatus: Command;
}

export default class CommandController {

    private sharedSettings: SharedSettings;
    private commands: CommandHolder[] = [];
    private commandStatuses: { [commandName: string]: CommandStatus } = {};
    private client: Discord.Client;

    constructor(bot: Discord.Client, sharedSettings: SharedSettings, commandData: string) {
        this.sharedSettings = sharedSettings;
        this.client = bot;

        this.commandStatuses = fileBackedObject(commandData);

        //bot.on("message", this.handleCommands.bind(this));
    }

    public onToggle(message: Discord.Message, isAdmin: boolean, command: string, args: string[]) {
        if (args.length !== 1) return;

        const filtered = this.commands.filter(handler => handler.command.aliases.some(alias => handler.prefix + alias === args[0]));
        if (filtered.length === 0) {
            message.channel.send(`No command with the name ${args[0]} was found.`);
            return;
        }

        for (const handler of filtered) {
            this.commandStatuses[handler.identifier] = (this.getStatus(handler) === CommandStatus.DISABLED ? CommandStatus.ENABLED : CommandStatus.DISABLED);
            message.channel.send(`${handler.prefix + handler.command.aliases.join("/")} is now ${this.getStatus(handler) === CommandStatus.ENABLED ? "enabled" : "disabled"}.`);
        }
    }

    public getHelp(isAdmin: boolean = false): string {
        let response = "\n";

        const toString = (holder: CommandHolder) => {

            let str = "";
            if (this.getStatus(holder) === CommandStatus.DISABLED) {
                str += "~~";
            }

            str += `\`${holder.prefix}${holder.command.aliases}\``;

            if (this.getStatus(holder) === CommandStatus.DISABLED) {
                str += "~~";
            }

            str += `: ${holder.command.description}`;
            if (this.getStatus(holder) === CommandStatus.DISABLED) {
                str += " (command is disabled)";
            }

            return str + "\n";
        };

        this.commands
            // ignore "*" commands
            .filter(holder => holder.command.aliases.some(a => a !== "*"))
            // hide admin commands if not admin
            .filter(holder => isAdmin || !holder.command.admin)
            .forEach(holder => response += toString(holder));

        return response;
    }

    public onHelp(message: Discord.Message, isAdmin: boolean, command: string, args: string[]) {

        message.channel.send(this.getHelp(isAdmin));
    }

    public registerCommand(newCommand: Command, commandHandler: SingleCommand) {
        this.commands.push({
            identifier: commandHandler.name,
            command: newCommand,
            handler: commandHandler,
            prefix: newCommand.prefix || this.sharedSettings.commands.default_prefix,
        });
    }

    //   private handleCommands(message: Discord.Message) {
    //       if (message.author.bot) return;

    //       const parts = message.content.split(" ");
    //       const prefix = parts[0][0];
    //       const command = parts[0].substr(1);
    //       const isAdmin = (message.member && this.sharedSettings.commands.adminRoles.some(x => message.member.roles.has(x)));

    //       this.commands.forEach(holder => {

    //           if (this.getStatus(holder) === CommandStatus.DISABLED) return;
    //           if (holder.command.admin && !isAdmin) return;
    //           if (holder.prefix !== prefix) return;

    //           // handlers that register the "*" command will get all commands with that prefix (unless they already have gotten it once)
    //           if (holder.command.aliases.some(x => x === command)) {
    //               holder.handler.call(null, message, isAdmin, command, parts.slice(1));
    //           } else if (holder.command.aliases.some(x => x === "*")) {
    //               holder.handler.call(null, message, isAdmin, "*", Array<string>().concat(command, parts.slice(1)));
    //           }
    //       });
    //   }

    private getStatus(holder: CommandHolder): CommandStatus {
        return this.commandStatuses[holder.identifier];
    }
}
*/
