import Discord = require("discord.js");
import Command from "./Command";

export default class AutoReact {
  private bot: Discord.Client;
  private thinkingEmojis: Discord.Emoji[] = [];
  private responseWords: string[] = ["thonk", "think"];
  private responseEmoji: string[] = [];
  private ignoreUsers: string[] = [];
  //private ignoreUsers: string[] = ["184165847940464641"];
  private originalThinkosOnly = false;

  public init(obj: any) {
    console.log("Auto React module loaded!");
    this.bot = obj.bot;
    this.bot.on("message", this.onMessage.bind(this));
  }

  public deinit() {
    console.log("Auto React module unloaded!");
  }

  public onMessage(message: Discord.Message) {
    if (message.author.bot) return;
    if (this.ignoreUsers.includes(message.author.id)) return;
    let hasThinking = false;

    if (message.content.toString().includes("🤔")) {
      hasThinking = true;
    } else {
      const emojiRegex = /\<\:[a-zA-Z0-9_]{1,50}\:[0-9]{18}\>/g;
      const emojis = message.content.toString().match(emojiRegex);
      if (!emojis) return;
      emojis.forEach((emoji: string) => { if (emoji.toLowerCase().match(/(think|thonk)/g)) hasThinking = true });
      }
    if (hasThinking) {
      const guildEmoji = message.guild.emojis.filter((x: Discord.Emoji) => x.name.includes("thinking")).random();
      if (guildEmoji) {
        message.react(guildEmoji);
        return;
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
    let message = this.originalThinkosOnly ? "I will now react to thinkos with custom emojis." : "I will only react to thinkos with � now.";
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