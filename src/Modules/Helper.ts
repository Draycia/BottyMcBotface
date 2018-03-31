import Discord = require('discord.js');
import Command from './Command';
import KeyValueArray, { Cmd } from './KeyValue';


export default class Helper {
    private Client: Discord.Client

    public register() {
        return {"help": {
            aliases:["help", "halp", "hlp"],
            description: "Displays help information, duh!",
            handler: this.testCommand,
            prefix: "~",
            isActive: false,
            isPrivileged: false,
            allowedUsers: ["184165847940464641", "214775036119089156"]}
        }
    }
    public readonly fileName = __filename.substr(__filename.lastIndexOf('\\') + 1, __filename.lastIndexOf('.'));
    public readonly className = this.constructor.name;
    public init(client: Discord.Client) {
        if (!client) console.log("Bot is null :(");
        console.log(`'${this.className}' module loaded from file '${this.fileName}'!`);
        this.Client = client;
    }
    public deinit() {
        console.log(`'${this.className}' module unloaded from file '${this.fileName}'!`);
    }
    public testCommand(command: Command) {
        command.message.channel.send("Help! Args: " + command.args.toString());
    }
}