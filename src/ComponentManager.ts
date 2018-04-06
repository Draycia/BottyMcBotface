import Discord = require("discord.js");
const util = require("util");
import CallerDataObject from "./Modules/Command";
import KeyValueArray, { KeyValue, Command, DataReference } from './Modules/KeyValue';
import Helper from './Modules/Helper';
import fs = require('fs');
import path = require('path')

//

const isDirectory = (source: fs.PathLike) => fs.lstatSync(source).isDirectory();
const isFile = (source: fs.PathLike) => !fs.lstatSync(source).isDirectory();
const getDirectories = (source: fs.PathLike) => fs.readdirSync(source).map(name => path.join(source.toString(), name)).filter(isDirectory);
const getFiles = (source: fs.PathLike) => fs.readdirSync(source).map(name => path.join(source.toString(), name)).filter(isFile);
const logArray = (source: any[], prefixStr: string) => source.forEach(s => console.log(prefixStr + s));
const intersect = <T>(array1: T[], array2: T[], comparisonConverter: Function | null) => array1.filter((value: T) => array2.indexOf(comparisonConverter ? comparisonConverter(value) : value) !== -1);
const intersectMulti = <T>(against1: T[], comparisonConverter: Function | null, source1: T[], ...sources: T[][]) => { (sources.map(a => { source1.concat(a); })); return source1.filter((value: T) => against1.indexOf(comparisonConverter ? comparisonConverter(value) : value) !== -1) };

//

export default class ComponentManager {
  private bot: Discord.Client;
  private deinitFuncs: any = {};
  private moduleDir = './Modules/';
  private fileDir = './src' + this.moduleDir.substring(1);
  private commandsFile: string = __dirname.split('\\').slice(0, __dirname.split('\\').length - 1).join('/') + '/settings/commands.json';
  private adminUsers = ["184165847940464641", "214775036119089156"];

  private iMods: KeyValueArray<KeyValueArray<Command>> = new KeyValueArray<KeyValueArray<Command>>();
  private iRefs: KeyValueArray<KeyValueArray<DataReference>> = new KeyValueArray<KeyValueArray<DataReference>>();
  private iEnvs: KeyValueArray<KeyValueArray<any>> = new KeyValueArray<KeyValueArray<any>>();

  private ignores: string[] = ["Command.ts", "KeyValue.ts", "InDev.ts", "app.ts", "Botty.ts", "FileBackedObject.ts", "PersonalSettings.ts", "SharedSettings.ts"];

  constructor(bot: Discord.Client) {
    console.log("Module Loader loaded. Giggity.");
    if (bot) {
      this.bot = bot;
      this.bot.on("ready", this.onBot.bind(this));
      this.bot.on("message", this.onMessage.bind(this));
    }

    const workSpaceDir = __dirname.split('\\').slice(0, __dirname.split('\\').length - 1).join('/');
    const files = getFiles(workSpaceDir + '/src/Modules').filter((f: string) => this.ignores.indexOf(f.split('\\').reverse()[0]) === -1).map(f => f.split('\\').reverse()[0]);
    const files2 = getFiles(workSpaceDir + '/src').filter((f: string) => this.ignores.indexOf(f.split('\\').reverse()[0]) === -1).map(f => f.split('\\').reverse()[0]);
    const dirs = getDirectories(workSpaceDir + '/src/Modules').map(d => d.split('\\').reverse()[0]);

    const intersection: string[] = intersect(files.concat(files2), dirs, (s: string) => s.split('.')[0]);

    console.log("\n|Found Module Files:")
    logArray(intersection, '|---');
    console.log('|\n|Loading Module Data Files\n|');

    const modProperties: string[] = ['aliases', 'description', 'handler', 'prefix', 'isActive', 'isPrivileged', 'allowedUsers', 'stopPropagation', 'fallback'];
    const fileProperties: string[] = ['aliases', 'description', 'handlerName', 'prefix', 'isActive', 'isPrivileged', 'allowedUsers', 'stopPropagation', 'fallbackName'];

    intersection.forEach(pathFile => {
      const name = pathFile.split('.')[0];
      console.log(`|${name}`)
      this.iMods.Add(name, new KeyValueArray<Command>());
      this.iRefs.Add(name, new KeyValueArray<DataReference>());
      this.iEnvs.Add(name, new KeyValueArray<any>());
      const ModuleDataFiles: string[] = ["Module_Data_Collection.json", "Module_Cmd_Persistence.json", "Module_Env_Settings.json"];
      const ModuleDataDir: string = `${__dirname.split('\\').reverse().splice(1).reverse().join('/')}/src/Modules/${name}`;
      console.log(`|${ModuleDataDir}`)
      let Module_Data_Collection: any = {};
      ModuleDataFiles.forEach(fileName => {
        if (fs.existsSync(ModuleDataDir + '/' + fileName)) {
          console.log('|---' + fileName);
          switch (fileName) {
            case 'Module_Data_Collection.json':
              Module_Data_Collection = JSON.parse(fs.readFileSync(ModuleDataDir + '/' + fileName).toString());
              for (const key in Module_Data_Collection)
                if (Module_Data_Collection.hasOwnProperty(key))
                  console.log(`|---|---${key}: ${JSON.stringify(Module_Data_Collection[key])}`);
              break;
            case 'Module_Cmd_Persistence.json':
              const Module_Cmd_Persistence = JSON.parse(fs.readFileSync(ModuleDataDir + '/' + fileName).toString());
              (<any[]>Module_Cmd_Persistence).forEach(command => {
                const commandObj: any = {};
                fileProperties.forEach(requiredProperty => {
                  let customID: string = ''; let value = null;
                  (typeof command[requiredProperty]) === 'string' ? customID = (command[requiredProperty].toString().slice(3)) : null;
                  const customMatch = /^\$(.)\/.+/.exec(command[requiredProperty]);
                  const customScope: string = customID !== '' ? (customMatch ? customMatch[1] : '') : '';
                  value = (customID !== '' ? (customMatch ? (customScope !== '' ? (customScope === 'l' ? (Module_Data_Collection[`$/${customID}`] !== undefined ? Module_Data_Collection[`$/${customID}`] : command[requiredProperty]) : command[requiredProperty]) : command[requiredProperty]) : command[requiredProperty]) : command[requiredProperty]);
                  commandObj[requiredProperty] = value
                  if (customScope !== '') this.iRefs.Item(name).Add(`${command['name']}>${requiredProperty}`, { reference: `$${customScope}/${customID}`, data: value })
                  this.iMods.Item(name).Add(command['name'], commandObj);
                });
                console.log('|---|---' + command['name']);
              });
              break;
            case 'Module_Env_Settings.json':
              const Module_Env_Settings: any = JSON.parse(fs.readFileSync(ModuleDataDir + '/' + fileName).toString());
              for (const jsonkey in Module_Env_Settings) {
                if (Module_Env_Settings.hasOwnProperty(jsonkey)) {
                  this.iEnvs.Item(name).Add(jsonkey, Module_Env_Settings[jsonkey]);
                  console.log('|---|---' + jsonkey + ': ' + JSON.stringify(Module_Env_Settings[jsonkey]));
                }
              }
              console.log('|---Loading ' + name + ': ' + Module_Env_Settings['relativePath'])
              this.loadModule(name, (Module_Env_Settings['relativePath'] ? Module_Env_Settings['relativePath'] : null));
              break;
            default:
              break;
          }
        }
      });
    });

    this.iMods.Item("ComponentManager").values.forEach(v => { /*console.log(v.handler);*/ v.handler = v.handler.bind(this) });

    // const localCommandData: any = {}
    // if (intersection) return;
    // for (const key in (localCommandData)) {
    //   if ((localCommandData).hasOwnProperty(key)) {
    //     const element = (localCommandData)[key];
    //     this.iMods.Add(key, new KeyValueArray<Command>());
    //     for (const innerkey in element) {
    //       if (element.hasOwnProperty(innerkey)) {
    //         console.log('->>> ' + innerkey);
    //         const elementkey = element[innerkey];
    //         const commandElementConstruct: any = {};
    //         this.iMods.Item(key).Add(elementkey['name'], commandElementConstruct);
    //         //properties.forEach(requiredProperty => { commandElementConstruct[requiredProperty] = elementkey[requiredProperty] ? (elementkey[requiredProperty] instanceof String ? ((<string>elementkey[requiredProperty]).startsWith('$/') ? Module_Data_Collection[elementkey[requiredProperty]] : elementkey[requiredProperty]) : elementkey[requiredProperty]) : null; });
    //         console.log(this.iMods.Item(key).Item(innerkey));
    //       }
    //     }
    //   }
    //   console.log(this.iMods.Item(key));
    // }

    // fs.readdir(this.fileDir, (err: Error, files: string[]) => {
    //   if (err) { console.log(err); return; }

    //   files.filter((value: string) => (value.endsWith('.ts') && this.ignores.includes(value) === true)).forEach((file: string) => {
    //     this.loadModule(file);
    //   });
    // });
  }

  private onBot() {
    //this.modules2.Add("ComponentManager", this.managerCommands);
    // this.iModules.Add("ComponentManager", new KeyValueArray<Command>());
    // // console.log("- ComponentManager")
    // for (let mod in this.managerCommands) {
    //   // console.log(mod)
    //   this.iModules.Item("ComponentManager").Add(mod, this.managerCommands[mod]);
    // }

    // for (const key in testModuleDependentFile_Data) {
    //   if (testModuleDependentFile_Data.hasOwnProperty(key)) {
    //     const element = testModuleDependentFile_Data[key];
    //     console.log(element)
    //   }
    // }

    //if (this.ignores.length = 2) return;

    //const localCommandData = (fs.readFileSync(this.commandsFile).toString());


  }


  private onMessage(message: Discord.Message) {
    //console.log(this.iMods)
    const author = message.author;
    if (!message.cleanContent || message.author.bot || !(message.channel instanceof Discord.TextChannel)) return;
    if (!message.cleanContent[0].match(/[-!$%^&+|~=\\;<>?\/]/)) return;
    const args = message.cleanContent.replace(/\n/g, "").split(" ").filter(c => ["", " "].includes(c) !== true);
    const commandAlias = args[0].substring(1);

    if (!args) return;
    const objs: any[] = []
    this.iMods.values.forEach((v, i) => {
      //console.log(v.keys);
      v.values.forEach(innerValue => {
        if ((innerValue.aliases ? (innerValue.aliases.indexOf(commandAlias) !== -1) : false) && innerValue.prefix === args[0][0]) {
          if (innerValue.isActive === true) objs.push(innerValue);
        }
      });
    });
    args.shift();
    let skipRemaining: boolean = false;
    console.log('matching commands: -> ' + objs.length);
    objs.forEach((value: Command) => {
      console.log(value)
      if (skipRemaining) return;
      if (value.isActive) {
        if (value) skipRemaining = true;
        value.isPrivileged ? (value.allowedUsers && value.allowedUsers.length !== 0 ? (value.allowedUsers.indexOf(message.author.id) !== -1 ? value.handler({ author, args, message }) : (value.fallback ? value.fallback({ author, args, message }) : this.iMods.Item('InDev').Item('defaultFallback').handler({ author, args, message }))) : value.handler({ author, args, message })) : value.handler({ author, args, message });
      }
    });
  }


  public listModules(callerDataObj: CallerDataObject) {
    callerDataObj.message.channel.send(`List of Modules:\n${this.iMods.keys.join(", ")}`);
  }
  public getModuleData(callerDataObj: CallerDataObject) {
    console.log(this.iMods.Item(callerDataObj.args[0]));
    const send = this.iMods.Item(callerDataObj.args[0]);
    if (send) callerDataObj.message.channel.send("```json\n" + JSON.stringify(send, null, '  ') + "\n```");
  }
  public editModuleData(callerDataObj: CallerDataObject) {
    const [moduleName, commandName, objectProperty] = callerDataObj.args.slice(0, 3);
    // (this.propertyValueParser(callerDataObj.args.slice(3).join(" ")));
    const propertyValue = callerDataObj.args.slice(3).join(" ");
    if (propertyValue === null || propertyValue === undefined) return;
    (<any>this.iMods.Item(moduleName).values[this.iMods.Item(moduleName).keys.indexOf(commandName)])[objectProperty] = propertyValue;
    callerDataObj.message.channel.send(`Updated Module \`${moduleName}\`'s \`${commandName}\` command property \`${objectProperty}\` to \`"${propertyValue}"\` \n \`\`\`json\n"${commandName}": \{\n  . . .\n  "${objectProperty}": "${propertyValue}"\,\n  . . .\n\}\`\`\``);
  }
  public propertyValueParser(source: string): any {
    const matches = new RegExp(/^\(([^)]+)\)/).exec(source);
    if (!matches) return null;
    //const typeName = matches[1].toLowerCase().split('<')[0];
    const value = matches[1];
    console.log(value);

    const RegExps: any = {
      string: /^(?:"|')(.+)(?:"|')/,
      number: /(\d+)/,
      //array: /\[(.+)\]/,
      //stringArray: /"(.*?)",?\s?/gi,
      //numberArray: /(\d+),?\s?/gi
    }

    for (let key in RegExps) {
      if (RegExps.hasOwnProperty(key)) {
        const Exp: RegExp = RegExps[key];
        if (Exp.test(value)) {
          let parseType = 'string';
          if (key.startsWith('number')) parseType = 'number';
          const temp = Exp.exec(value)
          return temp ? (parseType === 'number' ? parseInt(temp[0]) : temp[0]) : null
        }
      }
    }

  }


  public onCommandsActiveChange(callerDataObj: CallerDataObject) {
    const commandObj = this.iMods.Item(callerDataObj.args[0]).Item(callerDataObj.args[1]);
    commandObj.isActive = !commandObj.isActive;
    callerDataObj.message.channel.send(`${commandObj.isActive ? 'Activated' : 'Deactivated'} command \`${callerDataObj.args[1]}\` from Module \`${callerDataObj.args[0]}\`.`);
  }
  public listCommands(callerDataObj: CallerDataObject) {
    let commands: Array<{ name: string, obj: Command }> = new Array<{ name: string, obj: Command }>()
    this.iMods.values.forEach(value => {
      value.values.forEach(valueInner => {
        commands.push({ name: value.keys[value.values.indexOf(valueInner)], obj: valueInner });
      });
    });
    callerDataObj.message.channel.send(`List of commands:\n${commands.filter(value => value.obj.aliases !== null && value.obj.aliases !== undefined).map((value) => `**\`${value.name}\`**${value.obj.aliases.length !== 0 ? `\` (\`*\`${value.obj.aliases.join('\`*\`, \`*\`')}\`*\`)\`` : ''}\:\n*${value.obj.description}*`).join('\n')}`);
  }


  public unloadCommand(callerDataObj: CallerDataObject) {
    const author = callerDataObj.author;
    const args = callerDataObj.args;
    if (this.adminUsers.includes(author.id) === true) return;
    if (!args) return;
    if (this.iMods.hasKey(args[0])) {
      this.unloadModule(args[0], <Discord.TextChannel>callerDataObj.message.channel);
    }

  }
  public loadCommand(callerDataObj: CallerDataObject) {
    const author = callerDataObj.author;
    const args = callerDataObj.args;
    if (this.adminUsers.includes(author.id) === true) return;
    if (!args[0]) return;
    if (!this.iMods.hasKey(args[0])) {
      this.loadModule(args[0], null, <Discord.TextChannel>callerDataObj.message.channel);
    }
  }
  public reloadCommand(callerDataObj: CallerDataObject) {
    const author = callerDataObj.author;
    const args = callerDataObj.args;
    if (this.adminUsers.includes(author.id) === true) return;
    if (!args[0]) return;
    if (this.iMods.hasKey(args[0])) {
      this.reloadModule(args[0], <Discord.TextChannel>callerDataObj.message.channel);
    }
  }


  public savemodules(callerDataObj: CallerDataObject, channel?: Discord.TextChannel) {
    let message: Discord.Message;
    let done: boolean = false;
    let err: boolean = false;
    callerDataObj.message.channel.send(`Saving Modules . . .`).then((value: Discord.Message) => {
      message = value;
      done ? message.edit(`Moudles Saved ${err ? 'S' : 'Uns'}uccessfully`) : message = value
    });
    const data: any = {}
    const modProperties: string[] = ['aliases', 'description', 'handler', 'prefix', 'isActive', 'isPrivileged', 'allowedUsers', 'stopPropagation', 'fallback'];
    const fileProperties: string[] = ['aliases', 'description', 'handlerName', 'prefix', 'isActive', 'isPrivileged', 'allowedUsers', 'stopPropagation', 'fallbackName'];
    this.iMods.keys.forEach(outerKey => {
      data[outerKey] = {};
      this.iMods.Item(outerKey).keys.forEach(innerKey => {
        data[outerKey][innerKey] = {};
        const element = (<any>this.iMods.Item(outerKey).Item(innerKey));
        modProperties.forEach(requiredProperty => {
          const property = (<any>this.iMods.Item(outerKey).Item(innerKey))[requiredProperty]
          data[outerKey][innerKey][fileProperties[modProperties.indexOf(requiredProperty)]] = (property ? (property instanceof Function ? property['name'] : property) : null);
        });
        data[outerKey][innerKey]['name'] = innerKey;
      });
    });
    fs.writeFile(this.commandsFile, JSON.stringify(data, null, 3), (errr: Error) => {
      done = true;
      err = (errr !== null && err !== undefined);
      message ? message.edit(`Moudles Saved ${err ? 'S' : 'Uns'}uccessfully`) : null;
    });
    //console.log(JSON.stringify(data, null, '    '));
  }
  public loadModule(name: string, relDir?: string | null, channel?: Discord.TextChannel) {
    if (name.endsWith('.ts')) name = name.substr(0, name.lastIndexOf('.'));
    if (name === 'ComponentManager') {
      for (let mod in this.iMods.Item(name).keys) {
        // console.log(mod)
        // console.log("-> " + this.iMods.Item(name).values[parseInt(mod)].isActive);
        // console.log((<any>this)[this.iMods.Item(name).values[parseInt(mod)].handlerName]);
        const that: any = this;
        this.iMods.Item(name).values[parseInt(mod)].handler = (<Function>(that[that.iMods.Item(name).values[parseInt(mod)].handlerName]));
      }
    } else {
      import((relDir ? relDir : this.moduleDir) + name).then(importedModule => {
        let botModule = new importedModule.default;
        let data;
        let fromFile: boolean = false;
        if (typeof botModule.register !== "undefined") {
          data = botModule.register();
        } else {
          if (this.iMods.hasKey(name)) {
            fromFile = true; data = this.iMods.Item(name).keys;
            console.log(`|---Module Data exists for: ${name}`);
          } else {
            data = { name: {} };
          };
        }
        //const ary = [this.bot];
        console.log('|---Module `init()` message:')
        console.log('|---')
        if (typeof botModule.init !== "undefined")
          botModule.init({ bot: this.bot, commandObj: this.iMods, deinitFunctions: this.deinitFuncs, admins: this.adminUsers });
        if (typeof botModule.deinit !== "undefined")
          this.deinitFuncs[name] = botModule;
        console.log('|---')
        //this.modules2.Add(name, data);
        //console.log("-" + name)
        if (!fromFile) this.iMods.Add(name, new KeyValueArray<Command>()); else this.iMods.Item(name);
        //console.log(data);
        for (let mod in data) {
          //console.log(mod)
          //fromFile ? console.log("-> " + this.iMods.Item(name).values[parseInt(mod)].isActive) : null;
          //fromFile ? console.log(botModule[this.iMods.Item(name).values[parseInt(mod)].handlerName]) : null;
          fromFile ? this.iMods.Item(name).values[parseInt(mod)].handler = botModule[this.iMods.Item(name).values[parseInt(mod)].handlerName] : this.iMods.Item(name).Add(mod, data[mod]);
        }
        //this.modules[name] = data;
        if (channel) channel.send(`Loaded module **${name}**`);
        console.log(`|---|---Loaded: ${relDir}${name}`);
      });
    }
  }
  public unloadModule(name: string, channel?: Discord.TextChannel) {
    if (this.deinitFuncs[name])
      this.deinitFuncs[name].deinit();
    //delete this.modules[name];
    delete this.deinitFuncs[name];
    //delete this.modules2.toObj()[name];
    //this.modules2.Remove(name);
    this.iMods.Item(name).keys.forEach(k => delete this.iMods.Item(name).Item(k).handler)
    this.iMods.Remove(name)
    if (channel) channel.send(`Unloaded module **${name}**`);
  }
  public reloadModule(name: string, channel?: Discord.TextChannel) {
    this.unloadModule(name);
    this.loadModule(name);
    if (channel) channel.send(`Reloaded module **${name}**`);
  }

  // // Credit for getParamNames(), STRIP_COMMENTS, && ARGUMENT_NAMES goes to
  // // https://stackoverflow.com/a/9924463
  // // Why did you null check with === though?
  // private STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
  // private ARGUMENT_NAMES = /([^\s,]+)/g;

  // private getParamNames(func: Function) {
  //   var fnStr = func.toString().replace(this.STRIP_COMMENTS, '');
  //   var result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(this.ARGUMENT_NAMES);
  //   if (!result) result = [];
  //   return result;
  // }
}
