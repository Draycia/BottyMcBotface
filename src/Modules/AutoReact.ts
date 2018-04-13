import Discord = require("discord.js");
import Command from "./Command";
import DataStream from "../DataStream";
import KeyValueArray, { DataReference } from "./KeyValue";

export default class AutoReact {
  private bot: Discord.Client;
  private thinkingEmojis: Discord.Emoji[] = [];
  private responseWords: string[] = ["thonk", "think"];
  private responseEmoji: string[] = [];
  private ignoreUsers: string[] = [];
  private originalThinkosOnly = false;
  private customData: KeyValueArray<DataReference> = new KeyValueArray<DataReference>();
  
  private dataStream: DataStream;

  public readonly fileName = __filename.substr(__filename.lastIndexOf('\\') + 1, __filename.lastIndexOf('.'));
  public readonly className = this.constructor.name;
  private readonly handler  = this.onMessage.bind(this);

  private greetingWords: string[];

  public init(obj: any) {
    console.log(`'${this.className}' module loaded from file '${this.fileName}'!`);
    this.bot = obj.bot;
    this.bot.addListener("message", this.handler);
    this.customData = obj.customData;
    this.dataStream = new DataStream();
    this.greetingWords = this.customData.Item('greetingWords').data;
    this.ignoreUsers = this.dataStream.get("Data.json", "ignoredUsers") || [];
    this.originalThinkosOnly = this.dataStream.get("Data.json", "originalThinkosOnly") || false;
  }

  public deinit() {
    console.log(`'${this.className}' module unloaded from file '${this.fileName}'!`);
    this.bot.removeListener("message", this.handler);
    this.dataStream.set("Data.json", this.ignoreUsers, "ignoredUsers");
    this.dataStream.set("Data.json", this.originalThinkosOnly, "originalThinkosOnly");
  }

  public onMessage(message: Discord.Message) {
    if (message.author.bot) return;
    if (this.ignoreUsers.includes(message.author.id)) return console.log("Returning!");
    let hasThinking = false;

    const helloRegex = new RegExp(`^(${this.greetingWords.join("|")})\\b`);
    if (helloRegex.test(message.cleanContent)) message.react("408527155891273738");

    if (message.content.toString().includes("🤔")) {
      hasThinking = true;
    } else {
      const emojiRegex = /\<\:[a-zA-Z0-9_]{1,50}\:[0-9]{18}\>/g;
      const emojis = message.content.toString().match(emojiRegex);
      if (!emojis) return;
      emojis.forEach((emoji: string) => { if (emoji.toLowerCase().match(`/(${this.responseWords.join("|")})/g`)) hasThinking = true });
    }
    if (hasThinking) {
      if (this.originalThinkosOnly) {
        message.react("🤔");
      } else {
        const guildEmoji = message.guild.emojis.filter((x: Discord.Emoji) => x.name.includes("thinking")).random();
        if (guildEmoji) {
          message.react(guildEmoji);
          return;
        }
      }
    }
  }

  public toggleReact(command: Command) {
    let message = this.ignoreUsers.includes(command.author.id) ? "I will now react to your messages." : "I will no longer react to your messages";
    if (this.ignoreUsers.includes(command.author.id)) this.ignoreUsers = this.ignoreUsers.splice(this.ignoreUsers.indexOf(command.author.id) + 1, 1);
    else this.ignoreUsers.push(command.author.id);
    command.message.reply(message);
  }

  public toggleOriginalThinkos(command: Command) {
    let message = this.originalThinkosOnly ? "I will now react to thinkos with custom emojis." : "I will only react to thinkos with 🤔 now.";
    this.originalThinkosOnly = !this.originalThinkosOnly;
    command.message.reply(message)
  }

  public refreshThinkingEmojis(command: Command) {
    const guilds = this.bot.guilds.array();
    for (const guild of guilds) {
      const emojiSet = guild.emojis.filter((x: Discord.Emoji) => x.name.includes("thinking"));
      this.thinkingEmojis = this.thinkingEmojis.concat(emojiSet.array());
    }
  }

}