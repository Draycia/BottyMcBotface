import Discord = require("discord.js");
const util = require("util");

interface CommandObject {
  aliases: string[];
  description: string;
  handler: any;
  prefix: string;
}

export default class ModuleLoader {
  private bot: Discord.Client;
  private modules: any = {};
  private deinitFuncs: any = {};
  private moduleDir = './Modules/';
  private fileDir = './src' + this.moduleDir.substring(1);

  constructor(bot: Discord.Client) {
    console.log("Module Loader loaded. Giggity.");

    this.bot = bot;
    this.bot.on("ready", this.onBot.bind(this));
    this.bot.on("message", this.onMessage.bind(this));
  }

  private onBot() {
    const fs = require('fs');

    fs.readdir(this.fileDir, (err: Error, files: string[]) => {
      if (err) { console.log(err); return; }

      files.filter(((value: string) => (value.endsWith('.ts') && value !== "Command.ts"))).forEach((file: string) => {
        this.loadModule(file);
      });
    });
  }

  private onMessage(message: Discord.Message) {
    const author = message.author;
    if (!message.cleanContent || message.author.bot) return;
    //if (!message.cleanContent[0].match(/[-!$%^&()+|~=`{}\[\]\\";'<>?,.\/]/)) return;
    const args = message.cleanContent.replace(/\n/g, "").split(" ").filter(c => ["", " "].indexOf(c) === -1);
    const command = args[0].substring(1);

    if (author.id === "184165847940464641" && args[0].toLowerCase() === "!unload") {
      if (!args[1]) return;
      if (!args[1].toLowerCase().endsWith(".ts")) args[1] += ".ts";
      if (this.modules[args[1]]) {
        this.unloadModule(args[1], message.channel);
      }
    }

    if (author.id === "184165847940464641" && args[0].toLowerCase() === "!load") {
      if (!args[1]) return;
      if (!args[1].toLowerCase().endsWith(".ts")) args[1] += ".ts";
      if (!this.modules[args[1]]) {
        this.loadModule(args[1], message.channel);
      }
    }

    if (author.id === "184165847940464641" && args[0].toLowerCase() === "!reload") {
      if (!args[1]) return;
      if (!args[1].toLowerCase().endsWith(".ts")) args[1] += ".ts";
      if (this.modules[args[1]]) {
        this.reloadModule(args[1], message.channel);
      }
    }

    if (!args) return;
    for (var mod in this.modules) {
      if (!this.modules.hasOwnProperty(mod)) continue;
      for (var cmd in this.modules[mod]) {
        if (!this.modules[mod].hasOwnProperty(cmd)) continue;
        const prefix = this.modules[mod][cmd].prefix ? this.modules[mod][cmd].prefix : '!';
        if (!(cmd === command || this.modules[mod][cmd].aliases.includes(command))) continue;
        if (args[0][0] !== prefix) continue;
        args.shift();
        this.modules[mod][cmd].handler({ author, args, message });
      }
    }
  }

  private loadModule(file: string, channel?: any) {
    import(this.moduleDir + file.substring(0, file.length - 3)).then(importedModule => {
      let botModule = new importedModule.default;
      const data = botModule.register();
      const ary = [ this.bot ];
      botModule.init(...ary);
      //botModule.init(this.bot);
      this.deinitFuncs[file] = botModule;
      console.log(this.getParamNames(botModule.init));
      this.modules[file] = data;
      if (channel) channel.send(`Loaded module **${file}**`);
    });
  }

  private unloadModule(file: string, channel?: any) {
    this.deinitFuncs[file].deinit();
    delete this.modules[file];
    delete this.deinitFuncs[file];
    if (channel) channel.send(`Unloaded module **${file}**`);
  }

  private reloadModule(file: string, channel?: any) {
    this.unloadModule(file);
    this.loadModule(file);
    if (channel) channel.send(`Reloaded module **${file}**`);
  }

  // Credit for getParamNames(), STRIP_COMMENTS, && ARGUMENT_NAMES goes to
  // https://stackoverflow.com/a/9924463
  // Why did you null check with === though?
  private STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
  private ARGUMENT_NAMES = /([^\s,]+)/g;

  private getParamNames(func: any) {
    var fnStr = func.toString().replace(this.STRIP_COMMENTS, '');
    var result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(this.ARGUMENT_NAMES);
    if (!result) result = [];
    return result;
  }
}