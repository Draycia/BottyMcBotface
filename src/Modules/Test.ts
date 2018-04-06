import Discord = require("discord.js");
import Command from "./Command";

export default class Test {
  private bot: Discord.Client;

  public register() {
    return {
      "test": {
        aliases: ["test", "tost", "tust"],
        description: "Refreshes reactions.",
        handler: this.testCommand,
        prefix: "~",
        isActive: true
      }
    }
  }

  public init(obj: any) {
    console.log("Test module loaded!");
    this.bot = obj.bot;
  }

  public deinit() {
    console.log("Test module unloaded!");
  }

  public testCommand(command: Command) {
    command.message.channel.send("Test! Args: " + command.args.toString());
  }
}