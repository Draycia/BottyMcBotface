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
  //-> Module's file-stored custom defined variables.
  private customData: KeyValueArray<DataReference> = new KeyValueArray<DataReference>();

  private dataStream: DataStream;
  //-> Get the current File name without the path.
  public readonly fileName = __filename.substr(__filename.lastIndexOf('\\') + 1, __filename.lastIndexOf('.'));
  //-> Get the current Class name from the Contructor keyword.
  public readonly className = this.constructor.name;
  //-> The 'message' handler, for unregistering it on 'deinit()'.
  private readonly handler = this.onMessage.bind(this);

  private greetingWords: string[];

  public init(obj: any) {
    //-> Log the initiation of this Module.
    console.log(`'${this.className}' module loaded from file '${this.fileName}'!`);
    //-> Assign 'bot' and add 'message' handler.
    this.bot = obj.bot;
    this.bot.addListener("message", this.handler);
    //-> Get passed 'customData' object and get 'greetingWords' from it.
    this.customData = obj.customData;
    this.greetingWords = this.customData.Item('greetingWords').data;
    //-> Instatiate new DataStream and read 'Data.json' file and get 'ignoredUsers' JSON property if defined.
    this.dataStream = new DataStream();
    this.ignoreUsers = this.dataStream.get("Data.json", "ignoredUsers") || [];
    //-> Also get 'originalThinkosOnly' as a boolean.
    this.originalThinkosOnly = this.dataStream.get("Data.json", "originalThinkosOnly") || false;
  }

  public deinit() {
    //-> Log the deinitiation of the Module.
    console.log(`'${this.className}' module unloaded from file '${this.fileName}'!`);
    //-> Remove the 'message' handler.
    this.bot.removeListener("message", this.handler);
    //-> Save these values to their corresponding file(s) if they've been changed durring runtime.
    this.dataStream.set("Data.json", this.ignoreUsers, "ignoredUsers");
    this.dataStream.set("Data.json", this.originalThinkosOnly, "originalThinkosOnly");
  }

  public onMessage(message: Discord.Message) {
    //-> Filter out Messages from non-human bot users.
    if (message.author.bot) return;
    //-> Filter out those from users we should ignore.
    if (this.ignoreUsers.includes(message.author.id)) return console.log("Returning!");
    //-> Initialze variable.
    let hasThinking = false;
    //-> Construct regex using the 'greetingWords'.
    const helloRegex = new RegExp(`^(${this.greetingWords.join("|")})\\b`);
    //-> If it starts with any of those words then react with the custom emote/emoji.
    if (helloRegex.test(message.cleanContent)) message.react("408527155891273738");
    //-> Set 'hasThinking' to true if the Message includes a 'thinking_face' emoji.
    if (message.content.toString().includes("🤔")) {
      hasThinking = true;
    } else {
      //-> Otherwise, check all emojis in message to see if they contain any of the 'responseWords' text.
      const emojiRegex = /\<\:[a-zA-Z0-9_]{1,50}\:[0-9]{18}\>/g;
      const emojis = message.content.toString().match(emojiRegex);
      if (!emojis) return;
      emojis.forEach((emoji: string) => { if (emoji.toLowerCase().match(`/(${this.responseWords.join("|")})/g`)) hasThinking = true });
    }
    //-> If a thining was used.
    if (hasThinking) {
      //-> React with a original thinking face, if specified to.
      if (this.originalThinkosOnly) {
        message.react("🤔");
      } else {
        //-> Otherwise use a random thinking face and react to the Message.
        const guildEmoji = message.guild.emojis.filter((x: Discord.Emoji) => x.name.includes("thinking")).random();
        //-> React if there are any custom ones in the server.
        if (guildEmoji) {
          message.react(guildEmoji);
          return;
        }
      }
    }
  }

  public toggleReact(command: Command) {
    //-> Set Message text according to whether the user is currently ignored or not.
    let message = this.ignoreUsers.includes(command.author.id) ? "I will now react to your messages." : "I will no longer react to your messages";
    //-> If the user is ignored, remove them from the array.
    if (this.ignoreUsers.includes(command.author.id)) this.ignoreUsers = this.ignoreUsers.splice(this.ignoreUsers.indexOf(command.author.id) + 1, 1);
    //-> Otherwise add them to be ignored from now onward.
    else this.ignoreUsers.push(command.author.id);
    //-> Reply to the user with the 'message' text.
    command.message.reply(message);
  }

  public toggleOriginalThinkos(command: Command) {
    //-> Set Message text according to whether 'originalThinkosOnly' is true or not.
    let message = this.originalThinkosOnly ? "I will now react to thinkos with custom emojis." : "I will only react to thinkos with 🤔 now.";
    //-> Toggle the value (taking the inverse of the cuirrent boolean value).
    this.originalThinkosOnly = !this.originalThinkosOnly;
    //-> Rely with 'message' text.
    command.message.reply(message)
  }

  public refreshThinkingEmojis(command: Command) {
    //-> Get all of the server's Guilds
    const guilds = this.bot.guilds.array();
    //-> iterate each Guild.
    for (const guild of guilds) {
      //-> Filter to only include emojis with 'thinking' in their name/id.
      const emojiSet = guild.emojis.filter((x: Discord.Emoji) => x.name.includes("thinking"));
      //-> Add the array of filtered emotes to 'this.thinkingEmojis'.
      this.thinkingEmojis = this.thinkingEmojis.concat(emojiSet.array());
    }
  }
}