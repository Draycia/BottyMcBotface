import Discord = require("discord.js");
import CallerDataObject from "./Command";

export default class Test {
  private bot: Discord.Client;

  public readonly fileName = __filename.substr(__filename.lastIndexOf('\\') + 1, __filename.lastIndexOf('.'));
  public readonly className = this.constructor.name;
  public init(obj: any) {
    if (!obj.bot) console.log("Bot is null :(");
    console.log(`'${this.className}' module loaded from file '${this.fileName}'!`);
    console.log("Test module loaded!");
    this.bot = obj.bot;
  }

  public deinit() {
    console.log(`'${this.className}' module unloaded from file '${this.fileName}'!`);
  }

  public testCommand(callerDataObj: CallerDataObject) {
    callerDataObj.message.channel.send("Test! Args: " + callerDataObj.args.toString());
  }
}