import Discord = require("discord.js");
const util = require("util");
import Params from "./Modules/Command";
import KeyValueArray, { KeyValue, Command } from './Modules/KeyValue';

export default class ModuleLoader {
  private bot: Discord.Client;
  private deinitFuncs: any = {};
  private moduleDir = './Modules/';
  private fileDir = './src' + this.moduleDir.substring(1);

  private adminUsers = ["184165847940464641", "214775036119089156"];
  private modules2: KeyValueArray<any> = new KeyValueArray<any>();

  private iModules: KeyValueArray<KeyValueArray<Command>> = new KeyValueArray<KeyValueArray<Command>>();

  private managerCommands: any = {
    "load": {
      aliases: [ "load" ],
      description: "Loads the specified Module if currently unloaded.",
      handler: this.loadCommand.bind(this),
      prefix: "~",
      isActive: true,
      isPrivileged: true,
      allowedUsers: this.adminUsers
    },
    "unload": {
    aliases: [ "unload", "uload" ],
    description: "Unloads the specified Module if it is currently loaded.",
    handler: this.unloadCommand.bind(this),
    prefix: "~",
    isActive: true,
    isPrivileged: true,
    allowedUsers: this.adminUsers
  },
  "reload": {
    aliases: [ "reload", "rload" ],
    description: "Unloads then loads the specified Module.",
    handler: this.reloadCommand.bind(this),
    prefix: "~",
    isActive: true,
    isPrivileged: true,
    allowedUsers: this.adminUsers
  },
  "list_modules": {
    aliases: [ "list_modules", "lmod", "lmodules", "listmod" ],
    description: "Lists all loaded Modules.",
    handler: this.listModules.bind(this),
    prefix: "~",
    isActive: true,
    isPrivileged: true,
    allowedUsers: this.adminUsers
  },
  "get_module": {
    aliases: [ "get_module", "gmod", "gmodule", "getmod" ],
    description: "Gets the data object for the specified Module.",
    handler: this.getModuleData.bind(this),
    prefix: "~",
    isActive: true,
    isPrivileged: true,
    allowedUsers: this.adminUsers
  },
  "edit_module": {
    aliases: [ "edit_module", "emod", "emodule", "editmod" ],
    description: "Modify a given Module params object property to a specified value.",
    handler: this.editModuleData.bind(this),
    prefix: "~",
    isActive: true,
    isPrivileged: true,
    allowedUsers: this.adminUsers
  },
  "list_paramss": {
    aliases: [ "list_paramss", "lcmds", "lparamss", "listcmds" ],
    description: "Lists all active paramss.",
    handler: this.listparamss.bind(this),
    prefix: "~",
    isActive: true,
    isPrivileged: true,
    allowedUsers: this.adminUsers
  },
  "toggle_params": {
    aliases: [ "toggle_params", "togglecmd", "tglcmd" ],
    description: "Toggles the paramss current state.",
    handler: this.onparamsActiveChange.bind(this),
    prefix: "~",
    isActive: true,
    isPrivileged: true,
    allowedUsers: this.adminUsers
  }
}

  
  constructor(bot: Discord.Client) {
    console.log("Module Loader loaded. Giggity.");

    this.bot = bot;
    this.bot.on("ready", this.onBot.bind(this));
    this.bot.on("message", this.onMessage.bind(this));
  }

  private ignores: string[] = ["params.ts", "KeyValue.ts"]
  private onBot() {
    const fs = require('fs');
    this.modules2.Add("ComponentManager", this.managerCommands);
    this.iModules.Add("ComponentManager", new KeyValueArray<Command>());
    // console.log("- ComponentManager")
    for(let mod in this.managerCommands) {
      // console.log(mod)
      this.iModules.Item("ComponentManager").Add(mod, this.oldparamss[mod]);
    }

    fs.readdir(this.fileDir, (err: Error, files: string[]) => {
      if (err) { console.log(err); return; }

      files.filter((value: string) => (value.endsWith('.ts') && this.ignores.indexOf(value) === -1)).forEach((file: string) => {
        this.loadModule(file);
      });
    });
  } 

  
  private onMessage(message: Discord.Message) {
    const author = message.author;
    if (!message.cleanContent || message.author.bot || !(message.channel instanceof Discord.TextChannel)) return;
    if (!message.cleanContent[0].match(/[-!$%^&+|~=\\;<>?\/]/)) return;
    const args = message.cleanContent.replace(/\n/g, "").split(" ").filter(c => ["", " "].indexOf(c) === -1);
    const params = args[0].substring(1);

    if (!args) return;
    const objs:any[] = []
    this.iModules.values.forEach((v,i) => {
      v.values.forEach(innerValue => {
       if(innerValue.aliases?(innerValue.aliases.indexOf(params) !== -1):false && innerValue.prefix === args[0][0]) {
          if (innerValue.isActive === true) objs.push(innerValue);
        }
      });
    });
    args.shift();
    objs.forEach((value) => { if (value.isActive) value.handler({ author, args, message }); });
  }


  public listModules(params: Params) {
    params.message.channel.send(`List of Modules:\n${this.iModules.keys.join(", ")}`);
  }
  public getModuleData(params: Params) {
      console.log(this.iModules.Item(params.args[0]));
      const send = this.iModules.Item(params.args[0]);
      if (send) params.message.channel.send("```json\n" + JSON.stringify(send, null, '  ') + "\n```");
  }
  public editModuleData(params: Params) {
    const [moduleName, paramsName, objectProperty] = params.args.slice(0, 3);
    const propertyValue = params.args.slice(3).join(" ");
    (<any>this.iModules.Item(moduleName).Item(paramsName))[objectProperty] = propertyValue;
    params.message.channel.send(`Updated Module \`${moduleName}\`'s \`${paramsName}\` params property \`${objectProperty}\` to \`"${propertyValue}"\` \n \`\`\`json\n"${paramsName}": \{\n  . . .\n  "${objectProperty}": "${propertyValue}"\,\n  . . .\n\}\`\`\``);
  }


  public onparamsActiveChange(params: Params) {
    const paramsObj = this.iModules.Item(params.args[0]).Item(params.args[1]);
    paramsObj.isActive = !paramsObj.isActive;
    params.message.channel.send(`${paramsObj.isActive ? 'Activated' : 'Deactivated'} params \`${params.args[1]}\` from Module \`${params.args[0]}\`.`);
  }
  public listparamss(params: Params) {
    let paramss: any[] = [];
    this.iModules.values.forEach(value => {
      value.values.forEach(valueInner => {
        paramss.push({name: value.keys[value.values.indexOf(valueInner)], obj: valueInner});
      });
    });
    params.message.channel.send(`List of params:\n${paramss.map((value) => `**\`${value.name}${value.obj.aliases.length !== 0 ? ` (${value.obj.aliases.join(', ')})` : ''}\: \`**_\`${value.obj.description}\`_`).join('\n')}`);
  }


  public unloadCommand(params: Params) {
    const author = params.author;
    const args = params.args;
    if (this.adminUsers.indexOf(author.id) === -1) return;
    if (!args) return;
    if (this.iModules.hasKey(args[0])) {
      this.unloadModule(args[0], <Discord.TextChannel>params.message.channel);
    }
    
  }
  public loadCommand(params: Params) {
    const author = params.author;
    const args = params.args;
    if (this.adminUsers.indexOf(author.id) === -1) return;
    if (!args[0]) return;
    if (!this.iModules.hasKey(args[0])) {
      this.loadModule(args[0], <Discord.TextChannel>params.message.channel);
    } 
  }
  public reloadCommand(params: Params) {
    const author = params.author;
    const args = params.args;
    if (this.adminUsers.indexOf(author.id) === -1) return;
    if (!args[0]) return;
    if (this.iModules.hasKey(args[0])) {
      this.reloadModule(args[0], <Discord.TextChannel>params.message.channel);
    }
  }


  private loadModule(name: string, channel?: Discord.TextChannel) {
    if (name.endsWith('.ts')) name = name.substr(0,name.lastIndexOf('.'));
    import(this.moduleDir + name).then(importedModule => {
      let botModule = new importedModule.default;
      let data;
      if (typeof botModule.register !== "undefined") {
        data = botModule.register();
      } else {
        data = { name: { } };
      }
      const ary = [ this.bot ];
      if (typeof botModule.init !== "undefined")
        botModule.init(...ary);
      if (typeof botModule.deinit !== "undefined")
        this.deinitFuncs[name] = botModule;
      //this.modules2.Add(name, data);
      console.log("-" + name)
      this.iModules.Add(name, new KeyValueArray<Command>());
      for(let mod in data) {
        console.log(mod)
        console.log("-> " + data[mod].isActive);
        this.iModules.Item(name).Add(mod, data[mod]);
      }
      //this.modules[name] = data;
      if (channel) channel.send(`Loaded module **${name}**`);
    });
  }
  private unloadModule(name: string, channel?: Discord.TextChannel) {
    if (this.deinitFuncs[name])
      this.deinitFuncs[name].deinit();
    //delete this.modules[name];
    delete this.deinitFuncs[name];
    delete this.modules2.toObj()[name];
    this.modules2.Remove(name);
    this.iModules.Remove(name)
    if (channel) channel.send(`Unloaded module **${name}**`);
  }
  private reloadModule(name: string, channel?: Discord.TextChannel) {
    this.unloadModule(name);
    this.loadModule(name);
    if (channel) channel.send(`Reloaded module **${name}**`);
  }

  // Credit for getParamNames(), STRIP_COMMENTS, && ARGUMENT_NAMES goes to
  // https://stackoverflow.com/a/9924463
  // Why did you null check with === though?
  private STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
  private ARGUMENT_NAMES = /([^\s,]+)/g;

  private getParamNames(func: Function) {
    var fnStr = func.toString().replace(this.STRIP_COMMENTS, '');
    var result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(this.ARGUMENT_NAMES);
    if (!result) result = [];
    return result;
  }
}
