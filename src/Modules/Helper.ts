import Discord = require('discord.js');
import Command from "./Command";

export default class Helper {
    private Client: Discord.Client
    
    public register() {
        return {
            "help": {
                aliases: ["halp", "hlp"],
                description: "Displays help information.",
                handler: this.testCommand,
                prefix: "~"
            }
        }
    }
    public init(client: Discord.Client) {
        if (!client) console.log("Bot is null :(");
        console.log(`'${__filename.substr(__filename.lastIndexOf('\\') + 1, __filename.lastIndexOf('.'))}' module loaded!`);
        this.Client = client;
    }
    public deinit() {
        console.log(`'${__filename.substr(__filename.lastIndexOf('\\') + 1, __filename.lastIndexOf('.'))}' module unloaded!`);
    }
    public testCommand(command: Command) {
        command.message.channel.send("Help! Args: " + command.args.toString());
    }
}