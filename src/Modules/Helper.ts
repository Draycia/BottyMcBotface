import Discord = require('discord.js');
import Params from './Command';

export default class Helper {
    private Client: Discord.Client

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

    public testCommand(command: Params) {
        command.message.channel.send("Help! Args: " + command.args.toString());
    }
}
