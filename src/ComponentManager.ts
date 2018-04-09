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
const fileExists = (source: fs.PathLike) => fs.existsSync(source);
const ModuleDataFiles: string[] = ["Module_Data_Collection.json", "Module_Cmd_Persistence.json", "Module_Env_Settings.json"];

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
  private iImpt: KeyValueArray<any> = new KeyValueArray<any>();

  private ignores: string[] = ["Command.ts", "KeyValue.ts", "InDev.ts", "app.ts", "Botty.ts", "FileBackedObject.ts", "PersonalSettings.ts", "SharedSettings.ts"];

  private workSpaceDir = __dirname.split('\\').slice(0, __dirname.split('\\').length - 1).join('/');

  constructor(bot: Discord.Client) {
    console.log("Module Loader loaded. Giggity.");
    if (bot) {
      this.bot = bot;
      this.bot.on("ready", this.onBot.bind(this));
      this.bot.on("message", this.onMessage.bind(this));
    }
    this.getModuleFiles().forEach(ModuleFile => this.loadModuleFile(ModuleFile));
    this.iMods.Item("ComponentManager").values.forEach(v => { /*console.log(v.handler);*/ v.handler = v.handler.bind(this) });
  }

  private onBot() {

  }

  public getModuleFiles(): string[] {
    const workSpaceDir = __dirname.split('\\').slice(0, __dirname.split('\\').length - 1).join('/');
    const files = getFiles(workSpaceDir + '/src/Modules').filter((f: string) => this.ignores.indexOf(f.split('\\').reverse()[0]) === -1).map(f => f.split('\\').reverse()[0]);
    const files2 = getFiles(workSpaceDir + '/src').filter((f: string) => this.ignores.indexOf(f.split('\\').reverse()[0]) === -1).map(f => f.split('\\').reverse()[0]);
    const dirs = getDirectories(workSpaceDir + '/src/Modules').map(d => d.split('\\').reverse()[0]);
    return intersect(files.concat(files2), dirs, (s: string) => s.split('.')[0]);
  }

  private fileProperties: string[] = ['aliases', 'description', 'handlerName', 'prefix', 'isActive', 'isPrivileged', 'allowedUsers', 'stopPropagation', 'fallbackName'];
  private ModuleDataFiles: string[] = ["Module_Data_Collection.json", "Module_Cmd_Persistence.json", "Module_Env_Settings.json"];
  public loadModuleFile(name: string, channel?: Discord.TextChannel) {
    //-> Gets all files that have a corresponding Module folder with the same name.
    const intersection: string[] = this.getModuleFiles();
    //-> Remove TypeScript extension if it is in the 'name' arg provided. 
    name = (name.endsWith('.ts') ? name.slice(0, name.lastIndexOf('.')) : name);
    //-> Ensure the Module name given is one of the Modules that have a Module folder.
    if (intersection.map(i => i.toLowerCase().replace('.ts', '')).includes(name.toLowerCase())) {
      //-> Return if Module is already loaded.
      if (this.iMods.hasKey(name)) return;
      //-> Logging.
      console.log("\n|Module File:");
      console.log(`|---${name}.ts`);
      console.log('|\n|Loading Module Data Files\n|');
      console.log(`|${name}`)
      //-> Initialize object under the file's name in the cache arrays.
      this.iMods.Add(name, new KeyValueArray<Command>());
      this.iRefs.Add(name, new KeyValueArray<DataReference>());
      this.iEnvs.Add(name, new KeyValueArray<any>());
      //-> Constructs the Module folder with the file name.
      const ModuleDataDir: string = `${__dirname.split('\\').reverse().splice(1).reverse().join('/')}/src/Modules/${name}`;
      //-> Log the directory.
      console.log(`|${ModuleDataDir}`);
      //-> Temp Cache object.
      let Module_Data_Collection: any = {};
      //-> Iterate the files that should be within the named Module's folder.
      ModuleDataFiles.forEach(fileName => {
        //-> Directory must exist.
        if (fs.existsSync(ModuleDataDir + '/' + fileName)) {
          //-> Log file name.
          console.log('|---' + fileName);
          switch (fileName) {
            //-> If the file name is the one that declares any custom Module dependant values for use in the scope of the Module.
            case 'Module_Data_Collection.json':
              //-> Assign temp object to parsed json of that file.
              Module_Data_Collection = JSON.parse(fs.readFileSync(ModuleDataDir + '/' + fileName).toString());
              //-> Log all json 'keys' and their value(s).
              for (const key in Module_Data_Collection)
                if (Module_Data_Collection.hasOwnProperty(key))
                  console.log(`|---|---${key}: ${JSON.stringify(Module_Data_Collection[key])}`);
              break;
            //-> If the file name is the file that contains/defines the callable commands with this Module.
            case 'Module_Cmd_Persistence.json':
              //-> Get parsed data from the file about the commands.
              const Module_Cmd_Persistence = JSON.parse(fs.readFileSync(ModuleDataDir + '/' + fileName).toString());
              //-> Iterate each command object within the json array in the file.
              (<any[]>Module_Cmd_Persistence).forEach(command => {
                const commandObj: any = {};
                //-> Iterate each property that we need cache.
                this.fileProperties.forEach(requiredProperty => {
                  let customID: string = ''; let value = null;
                  //-> If the type of the property's value is 'string' then set 'customID' to the value, skipping the first 3 chars.
                  (typeof command[requiredProperty]) === 'string' ? customID = (command[requiredProperty].toString().slice(3)) : null;
                  //-> Attempt to match a regex to the 'value' of the aforementioned property.
                  const customMatch = /^\$(.)\/.+/.exec(command[requiredProperty]);
                  //-> If 'customID' is not blank (type of the 'value' was 'string') and if there was a match from the regex then assign 'customScope' to the char ['l' or 'g']:
                  //-> ('l' beiung a locally [Module dependant variable] or 'g' being globally [declared in main file, can override local]) that the regex captured.
                  const customScope: string = customID !== '' ? (customMatch ? customMatch[1] : '') : '';
                  //-> Yeah, this just gets the value, either the custom defined value, or if none exists with that name then just the value as is.
                  value = (customID !== '' ? (customMatch ? (customScope !== '' ? (customScope === 'l' ? (Module_Data_Collection[`$/${customID}`] !== undefined ? Module_Data_Collection[`$/${customID}`] : command[requiredProperty]) : command[requiredProperty]) : command[requiredProperty]) : command[requiredProperty]) : command[requiredProperty]);
                  //-> Set the property name within the temp object to the value.
                  commandObj[requiredProperty] = value
                  //-> Cache the name of the custom variable Id [name] and the value.
                  if (customScope !== '')
                    this.iRefs.Item(name).Add(`${command['name']}>${requiredProperty}`, { reference: `$${customScope}/${customID}`, data: value })
                  //-> Adds this command and it's temp object's data to 'iMods'.
                  this.iMods.Item(name).Add(command['name'], commandObj);
                });
                //-> If this Module had no commands cached [not from error, but there was none to cache] then remove it from 'iMods'.
                if (this.iMods.Item(name).keys.length === 0)
                  this.iMods.Remove(name);
                //-> Logs.
                console.log('|---|---' + command['name']);
              });
              break;
            //-> If file name is the file that contains the Enironment Settings (ex: 'anableLogging', 'relativePath' [for a Module file that is not in the 'Modules' folder], etc).
            case 'Module_Env_Settings.json':
              //-> Parse the json to temp object.
              const Module_Env_Settings: any = JSON.parse(fs.readFileSync(ModuleDataDir + '/' + fileName).toString());
              //-> Iterate the objects keys, logging and caching the properties and their values.
              for (const jsonkey in Module_Env_Settings) {
                if (Module_Env_Settings.hasOwnProperty(jsonkey)) {
                  this.iEnvs.Item(name).Add(jsonkey, Module_Env_Settings[jsonkey]);
                  console.log('|---|---' + jsonkey + ': ' + JSON.stringify(Module_Env_Settings[jsonkey]));
                }
              }
              //-> Logs.
              console.log('|---Loading ' + name + ': ' + Module_Env_Settings['relativePath'])
              //-> Calls method to link all the commands cached in 'iMods' to their function/method handlers from string 'handlerName'.
              this.linkModuleHandlers(name, (Module_Env_Settings['relativePath'] ? Module_Env_Settings['relativePath'] : channel));
              break;
            //-> Will never trigger, but for good measure just in case.
            default:
              break;
          }
        }
      });
      //-> Send Message if 'channel' was provided [was called from command, not on start-up].
      if (channel)
        channel.send(`Loaded module **${name}**`);
    }
  }

  public linkModuleHandlers(name: string, relDir?: string | null, channel?: Discord.TextChannel) {
    //-> Remove trailing TypeScript file extension.
    if (name.endsWith('.ts')) name = name.substr(0, name.lastIndexOf('.'));
    const that: any = this;
    //-> Separate ComponentManager's handler assigning.
    if (name === 'ComponentManager')
      //-> Iterate through each key, 'mod' being an integer indexing number.
      for (let mod in this.iMods.Item(name).keys)
        //-> Index 'this' (cast as 'any') with the handlerName of the command value at the specified index number.
        this.iMods.Item(name).values[parseInt(mod)].handler = (<Function>(that[that.iMods.Item(name).values[parseInt(mod)].handlerName]));
    else
      //-> For all other Module files, use 'import' which'll return the file as an object type of 'any' so it can be indexed.
      import((relDir ? relDir : this.moduleDir) + name).then(importedModule => {
        this.iImpt.Add(name, { module: importedModule });
        //-> Get the default export within the imported object
        const botModule = new importedModule.default;
        //-> Assign 'data' accordingly; Essentially, 'iMods' should always have the 'key' unless the module has no commands.
        const data = (this.iMods.hasKey(name) ? this.iMods.Item(name).keys : { name: {} });
        //-> Log if Data is found for that Module.
        if (this.iMods.hasKey(name))
          console.log(`|---Module Data exists for: ${name}`);
        //-> Logs.
        console.log('|---Module `init()` message:')
        console.log('|---')
        //-> Call if defined. 'init()' is used if the Module uses variables that it gets from this main file: 'bot', 'iMods', 'adminUsers': Are always passed and usable within the Module if this ['init()'] method exists.
        if (typeof botModule.init !== "undefined")
          botModule.init({ bot: this.bot, commandObj: this.iMods, deinitFunctions: this.deinitFuncs, admins: this.adminUsers });
        //-> Caches 'deinit()' if declared. Called when Module is unloaded if anything (events, etc) needs to be unregistered or done before it's unloaded: that is done here [within the Module's 'deinit()'].
        if (typeof botModule.deinit !== "undefined")
          this.deinitFuncs[name] = botModule;
        //-> Logs.
        console.log('|---');
        //-> Iterate 'keys' [as their index position in variable 'mod'] from 'data'. 
        for (let mod in data)
          //-> Index 'botModule' [the Module's default exported class] with the handlerName from the command value at the specified index number. Also binding the method/function to 'botModule', setting the context of the method.
          this.iMods.Item(name).values[parseInt(mod)].handler = botModule[this.iMods.Item(name).values[parseInt(mod)].handlerName].bind(botModule);
        //-> Message in channel if channel arg was provided (this method was called from a command and not on startup). 
        if (channel)
          channel.send(`Loaded module **${name}**`);
        //-> Logs.
        console.log(`|---|---Loaded: ${relDir || this.moduleDir}${name}`);
      });
  }

  private onMessage(message: Discord.Message) {
    this.createDataFiles('Pleb');
    // if (message.author.bot)
    //   console.log(message.embeds);
    // if (!message.author.bot)
    //   message.channel.send(new Discord.RichEmbed({
    //     'fields': [
    //       { value: '[](184165847940464641,184165847940464641,184165847940464641,184165847940464641,184165847940464641,184165847940464641,184165847940464641,184165847940464641,184165847940464641,184165847940464641)', name: '.' }
    //     ]
    //   }))
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

  public createDataFiles(moduleName: string) {
    const dataDirPath: string = this.workSpaceDir + '/src/Modules/' + (moduleName.endsWith('.ts') ? moduleName.slice(0, moduleName.lastIndexOf('.')) : moduleName);
    if (fileExists(dataDirPath)) { } else { fs.mkdirSync(dataDirPath); }
    const defaultData = [[], {}, {}];
    ModuleDataFiles.forEach(file => {
      if (!fileExists(dataDirPath + '/' + file)) fs.writeFileSync(dataDirPath + '/' + file, JSON.stringify(defaultData[ModuleDataFiles.indexOf(file)], null, 2));
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
    console.log(args[0]);
    //if (this.adminUsers.indexOf(author.id) !== -1) return;
    console.log(args[0]);
    if (!args) return;
    console.log(args[0]);
    if (this.iMods.hasKey(args[0])) {
      this.unloadModule(args[0], <Discord.TextChannel>callerDataObj.message.channel);
    }
  }
  
  public loadCommand(callerDataObj: CallerDataObject) {
    const author = callerDataObj.author;
    const args = callerDataObj.args;
    //if (this.adminUsers.includes(author.id) === true) return;
    if (!args[0]) return;
    if (!this.iMods.hasKey(args[0])) {
      this.loadModuleFile(args[0], <Discord.TextChannel>callerDataObj.message.channel);
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
    //if (!this.iMods.hasKey(name)) this.loadModulesFromFiles();
    if (name.endsWith('.ts')) name = name.substr(0, name.lastIndexOf('.'));
    if (name === 'ComponentManager') {
      for (let mod in this.iMods.Item(name).keys) {
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
        console.log('|---Module `init()` message:')
        console.log('|---')
        if (typeof botModule.init !== "undefined")
          botModule.init({ bot: this.bot, commandObj: this.iMods, deinitFunctions: this.deinitFuncs, admins: this.adminUsers });
        if (typeof botModule.deinit !== "undefined")
          this.deinitFuncs[name] = botModule;
        console.log('|---')
        if (!fromFile) this.iMods.Add(name, new KeyValueArray<Command>()); else this.iMods.Item(name);
        //console.log(data);
        for (let mod in data) {
          fromFile ? this.iMods.Item(name).values[parseInt(mod)].handler = botModule[this.iMods.Item(name).values[parseInt(mod)].handlerName].bind(botModule) : this.iMods.Item(name).Add(mod, data[mod]);
        }
        if (channel) channel.send(`Loaded module **${name}**`);
        console.log(`|---|---Loaded: ${relDir || this.moduleDir}${name}`);
      });
    }
  }
  
  public unloadModule(name: string, channel?: Discord.TextChannel) {
    console.log('unload')
    if (this.deinitFuncs[name])
      this.deinitFuncs[name].deinit();
    //delete this.modules[name];
    delete this.deinitFuncs[name];
    //delete this.modules2.toObj()[name];
    delete this.iImpt.Item(name).module;
    //this.modules2.Remove(name);
    this.iMods.Item(name).keys.forEach(k => { delete this.iMods.Item(name).Item(k).handler; this.iMods.Item(name).Remove(k); })
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
