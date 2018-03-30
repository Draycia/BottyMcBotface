import Discord = require("discord.js");
import Command from "./Command";

export default class HelloWorld {
  private bot: Discord.Client;

  public register() {
    return {
      "test": {
        aliases: ["tost", "tust"],
        description: "Refreshes reactions.",
        handler: this.testCommand,
        prefix: "~"
      }
    }
  }

  public init(bot: Discord.Client) {
    if (!bot) console.log("Bot is null :(");
    console.log("Hello World module loaded!");

    this.bot = bot;
  }

  public deinit() {
    console.log("Hello World module unloaded!");
  }

  public testCommand(command: Command) {
    command.message.channel.send("Test! Args: " + command.args.toString());
  }
}