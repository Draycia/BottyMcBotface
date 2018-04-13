//-> Discord, ya pleb!
import Discord = require("discord.js");
//-> Parameter object used for all Command's Function handlers.
import CallerDataObject from "./Modules/Command";
//-> Custom Array, Command, and new (not completely implemented) Data Ref object.
import KeyValueArray, { KeyValue, Command, DataReference } from './Modules/KeyValue';
//-> File System stuff.
import fs = require('fs');
//-> Lazy way to combine paths, but it's helpful so here it is.
import path = require('path');


//-> Is a Directory: boolean.
const isDirectory = (source: fs.PathLike) => fs.lstatSync(source).isDirectory();
//-> Is a File: boolean.
const isFile = (source: fs.PathLike) => !fs.lstatSync(source).isDirectory();
//-> Get Sub-Directories: string[].
const getDirectories = (source: fs.PathLike) => fs.readdirSync(source).map(name => path.join(source.toString(), name)).filter(isDirectory);
//-> Get Files within a Directory (not recurrsive): string[]
const getFiles = (source: fs.PathLike) => fs.readdirSync(source).map(name => path.join(source.toString(), name)).filter(isFile);
//-> Loops an Array of objects and logs each.
const logArray = (source: any[], prefixStr: string) => source.forEach(s => console.log(prefixStr + s));
//-> Get the intersecting / matching values between 2 arrays of <T> after the comparing array is transformed. The original (untransformed) objects are returned: T[]. 
const intersect = <T>(array1: T[], array2: T[], comparisonConverter: Function | null) => array1.filter((value: T) => array2.indexOf(comparisonConverter ? comparisonConverter(value) : value) !== -1);
//-> Get intersecting of multiple (unreliably sporadic): T[].
const intersectMulti = <T>(against1: T[], comparisonConverter: Function | null, source1: T[], ...sources: T[][]) => { (sources.map(a => { source1.concat(a); })); return source1.filter((value: T) => against1.indexOf(comparisonConverter ? comparisonConverter(value) : value) !== -1) };
//-> Shorthand, for lazy people, if the File exists: boolean.
const fileExists = (source: fs.PathLike) => fs.existsSync(source);
//-> The data files within each Modules named data directories.
const ModuleDataFiles: string[] = ["Module_Data_Collection.json", "Module_Cmd_Persistence.json", "Module_Env_Settings.json"];


export default class ComponentManager {
  //-> The 'bot' (Client)!
  private bot: Discord.Client;
  //-> Stores the Functions that are called when their corresponding Module is unloaded to unregister / save/ etc before being completly unloaded. Opposite of a Module's 'init()' function.
  private deinitFuncs: any = {};
  //-> Well, the workspace directory; Specifically, this directory: '\...\Documents\GitHub\BottyMcBotface'.
  private workSpaceDir = __dirname.split('\\').slice(0, __dirname.split('\\').length - 1).join('/');
  //-> Directory where the named Module data sub directories are.
  private moduleDir = this.workSpaceDir + '/src/Modules';
  //-> Currently bugged, but this is now defined on a per-Module basis, but will be moved to the Global Module Settings file once implemented.
  private adminUsers = ["184165847940464641", "214775036119089156"];

  //-> Stores all Module Command data.
  private iMods: KeyValueArray<KeyValueArray<Command>> = new KeyValueArray<KeyValueArray<Command>>();
  //-> Stores custom defined Module file property variables.
  private iRefs: KeyValueArray<KeyValueArray<DataReference>> = new KeyValueArray<KeyValueArray<DataReference>>();
  //-> Stores Module Environment settings (logging, etc).
  private iEnvs: KeyValueArray<KeyValueArray<any>> = new KeyValueArray<KeyValueArray<any>>();
  //-> Stores the Imported Module files as their raw objects.
  private iImpt: KeyValueArray<any> = new KeyValueArray<any>();

  //-> Becoming redundant because Module loading only loads those with a named directory in '/Modules/' but will implement ability to have this in file which'll handle persistence of disbaled Modules.
  private ignores: string[] = ["Command.ts", "KeyValue.ts", "InDev.ts", "app.ts", "Botty.ts", "FileBackedObject.ts", "PersonalSettings.ts", "SharedSettings.ts"];
  //-> These are the properties of the Command objects.
  private modProperties: string[] = ['aliases', 'description', 'handler', 'prefix', 'isActive', 'isPrivileged', 'allowedUsers', 'stopPropagation', 'fallback'];
  //-> These are the properties that are stored in the local Module Command files. Functions/Methods are stored as their handler names and assigned to their corresponding function counterpart on-load.
  private fileProperties: string[] = ['aliases', 'description', 'handlerName', 'prefix', 'isActive', 'isPrivileged', 'allowedUsers', 'stopPropagation', 'fallbackName'];


  constructor(bot: Discord.Client) {
    console.log("Module Loader loaded. Giggity.");
    //-> 'bot' should always exists or not be null, but checking just in-case.
    if (bot) {
      //-> Assign this's 'bot' to the passed 'bot' object.
      this.bot = bot;
      //-> Register event 'ready' to method, which is called upon the bot being successfully loaded and is 'ready'.
      this.bot.on("ready", this.onBot.bind(this));
      //-> Register event 'message' to method, which'll handle when a Message is sent and Commands the Message could be calling.
      this.bot.on("message", this.onMessage.bind(this));
    }
<<<<<<< HEAD
    console.log(`|${'―'.repeat(8)}\n|\n|${'―'.repeat(25)} [ Load In All Module Data ]\n|\n|${'―'.repeat(8)}`);
    //-> Get all Files that have a corresponding (existing) directory with a mathcing name, loading all of those Modules in and caching/loading all data.
    this.getModuleFiles().forEach(ModuleFile => this.loadModuleFile(ModuleFile))
=======
    //-> Get all Files that have a corresponding (existing) directory with a mathcing name, loading all of those Modules in and caching/loading all data.
    this.getModuleFiles().forEach(ModuleFile => this.loadModuleFile(ModuleFile));
>>>>>>> b39f3bbb1758e60c7488bb65416cbd2e4ff06968
    //-> After loading all Modules, assign this's Command function handlers to be bound to 'this' to ensure the function's scope is the correct context.
    this.iMods.Item("ComponentManager").values.forEach(v => { /*console.log(v.handler);*/ v.handler = v.handler.bind(this) });
  }

  private onBot() {
    //-> Welp, maybe something will go here, because all of the Module loading had to be moved to the Constructor 👀
  }

  public getModuleFiles(): string[] {
    //-> Gets files in '/Modules/' directory, excludes file name within the 'ignores' array.
    const files = getFiles(this.workSpaceDir + '/src/Modules').filter((f: string) => this.ignores.indexOf(f.split('\\').reverse()[0]) === -1).map(f => f.split('\\').reverse()[0]);
    //-> Get files in the base (top-most level) directory '/src/', again, exclusing files we specified to ignore.
    const files2 = getFiles(this.workSpaceDir + '/src').filter((f: string) => this.ignores.indexOf(f.split('\\').reverse()[0]) === -1).map(f => f.split('\\').reverse()[0]);
    //-> Compile a list of sub-directories in '/Modules/' directory: where the Module named directories are.
    const dirs = getDirectories(this.workSpaceDir + '/src/Modules').map(d => d.split('\\').reverse()[0]);
    //-> return the intersection between the files and the directories. This'll return the names of files that have a matching directory name.
    return intersect(files.concat(files2), dirs, (s: string) => s.split('.')[0]);
  }

  public loadModuleFile(name: string, channel?: Discord.TextChannel) {
    //-> Gets all files that have a corresponding Module folder with the same name.
    const intersection: string[] = this.getModuleFiles();
    //-> Remove TypeScript extension if it is in the 'name' arg provided. 
    name = (name.endsWith('.ts') ? name.slice(0, name.lastIndexOf('.')) : name);
    //-> Ensure the Module name given is one of the Modules that have a Module folder.
    if (intersection.map(i => i.toLowerCase().replace('.ts', '')).includes(name.toLowerCase())) {
      //-> Return if Module is already loaded.
      if (this.iMods.hasKey(name)) return;
      //-> Initialize object under the file's name in the cache arrays.
      this.iMods.Add(name, new KeyValueArray<Command>());
      this.iRefs.Add(name, new KeyValueArray<DataReference>());
      this.iEnvs.Add(name, new KeyValueArray<any>());
      //-> Logging.
      if (name !== this.iMods.keys[0]) console.log(`|${'―'.repeat(25)}\n|${'―'.repeat(0)}\n|${'―'.repeat(25)}`);
      console.log(`|Module File:`);
      console.log(`|---${name}.ts`);
      //-> Constructs the Module folder with the file name.
      const ModuleDataDir: string = `${__dirname.split('\\').reverse().splice(1).reverse().join('/')}/src/Modules/${name}`;
      //-> Log the directory.
      console.log(`|---${ModuleDataDir}\n|`);
      //-> Logging.
      console.log('|Loading Module Data Files For:');
      console.log(`|${name}`);
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
              for (const key in Module_Data_Collection) {
                if (Module_Data_Collection.hasOwnProperty(key)) {
                  if (key[0] !== '$' && key[2] !== '/') this.iRefs.Item(name).Add(key, { data: Module_Data_Collection[key], reference: key })
                  console.log(`|---|---${key}: ${JSON.stringify(Module_Data_Collection[key])}`);
                }
              }
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
              //console.log(this.iRefs.Item(name));
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
    //-> Logs.
    console.log('|---Loading ' + (relDir ? relDir : this.moduleDir) + name);
    const that = <any>this;
    //-> Separate ComponentManager's handler assigning.
    if (name === 'ComponentManager') {
      //-> Iterate through each key, 'mod' being an integer indexing number.
      for (let mod in this.iMods.Item('ComponentManager').keys)
        //-> Index 'this' (cast as 'any') with the handlerName of the command value at the specified index number.
        this.iMods.Item(name).values[parseInt(mod)].handler = (<Function>(that[that.iMods.Item(name).values[parseInt(mod)].handlerName]));
    } else {
      //-> For all other Module files, use 'import' which'll return the file as an object type of 'any' so it can be indexed.
      import((relDir ? relDir : this.moduleDir) + name).then(importedModule => {
        if (name === this.iMods.keys[0]) console.log(`|${'―'.repeat(8)}\n|\n|${'―'.repeat(25)} [ External Module Function Handler Linking ]\n|\n|${'―'.repeat(8)}`);
        this.iImpt.Add(name, { module: importedModule });
        //-> Get the default export within the imported object
        const botModule = new importedModule.default;
        //-> Assign 'data' accordingly; Essentially, 'iMods' should always have the 'key' unless the module has no commands.
        const data = (this.iMods.hasKey(name) ? this.iMods.Item(name).keys : { name: {} });
        //-> Logging.
        console.log(`|${name}\n|---Linking Function Handlers . . .`);
        //-> Log if Data is found for that Module.
        if (this.iMods.hasKey(name))
          console.log(`|---|---Module Data exists for: ${name}`);
        //-> Logs.
        console.log('|---Module `init()` message:')
        console.log('|---|')
        //-> Call if defined. 'init()' is used if the Module uses variables that it gets from this main file: 'bot', 'iMods', 'adminUsers': Are always passed and usable within the Module if this ['init()'] method exists.
        if (typeof botModule.init !== "undefined")
          botModule.init({ bot: this.bot, commandObj: this.iMods, deinitFunctions: this.deinitFuncs, admins: this.adminUsers, customData: this.iRefs.Item(name) });
        //-> Caches 'deinit()' if declared. Called when Module is unloaded if anything (events, etc) needs to be unregistered or done before it's unloaded: that is done here [within the Module's 'deinit()'].
        if (typeof botModule.deinit !== "undefined")
          this.deinitFuncs[name] = botModule;
        //-> Logs.
        console.log('|---|');
        //-> Iterate 'keys' [as their index position in variable 'mod'] from 'data'.
        for (let mod in data)
          //-> Index 'botModule' [the Module's default exported class] with the handlerName from the command value at the specified index number. Also binding the method/function to 'botModule', setting the context of the method.
          this.iMods.Item(name).values[parseInt(mod)].handler = botModule[this.iMods.Item(name).values[parseInt(mod)].handlerName].bind(botModule);
        //-> Message in channel if channel arg was provided (this method was called from a command and not on startup). 
        if (channel)
          channel.send(`Loaded module **${name}**`);
        //-> Logs.
        console.log(`|---Finalized: ${relDir || this.moduleDir}${name}${(name !== this.iMods.keys[this.iMods.keys.length - 2]) ? `\n|${'―'.repeat(25)}\n|${'―'.repeat(0)}\n|${'―'.repeat(25)}` : ''}`);
        if (name === this.iImpt.keys[this.iImpt.keys.length-1] && name === this.iMods.keys[this.iMods.keys.length - 2]) console.log(`|${'―'.repeat(8)}\n|\n|${'―'.repeat(25)} [ Startup Completed ]\n|\n|${'―'.repeat(8)}`);
      })
    };
  }

  private onMessage(message: Discord.Message) {
    //-> Author (user or bot) that sent the Message.
    const author = message.author;
    //-> Return if Message doesn't contain non-embed content, a bot sent it, or the channel was not a TextChannel.
    if (!message.cleanContent || message.author.bot || !(message.channel instanceof Discord.TextChannel)) return;
    //-> Return if the content doesn't match these 'command prefix' character.
    if (!message.cleanContent[0].match(/[-!$%^&+|~=\\;<>?\/]/)) return;
    //-> Split all text delimited by " " (a blank space).
    const args = message.cleanContent.replace(/\n/g, "").split(" ").filter(c => ["", " "].includes(c) !== true);
    //-> Assign 'commandAlias' to the first 'argument' provided. 
    const commandAlias = args[0].substring(1);
    //-> Return if there are no 'args'.
    if (!args) return;
    //-> Instantiate array that will hold all matching Command objects.
    const objs: any[] = []
    //-> Iterate all stored Modules.
    this.iMods.values.forEach((v, i) => {
      //-> Iterate all Module Command objects.
      v.values.forEach(innerValue => {
        //-> If the Command has 'aliases', 'aliases' contains the used 'commandAlias', and the 'prefix' matches the first char in the string. 
        if ((innerValue.aliases ? (innerValue.aliases.indexOf(commandAlias) !== -1) : false) && innerValue.prefix === args[0][0]) {
          //-> If the Command is currently active, then it has passed all conditions so, add it to the Command object array.
          if (innerValue.isActive === true) objs.push(innerValue);
        }
      });
    });
    //-> Remove the first argument in 'args' (the 'commandAlias') which we no longer need.
    args.shift();
    //-> Command can specify (if more than one command matches) to skip other matching commands (the 'stopPropagation' property).
    let skipRemaining: boolean = false;
    //-> Logs.
    console.log('matching commands: -> ' + objs.length);
    //-> Iterate all Command objects that matched all the conditions.
    objs.forEach((value: Command) => {
      //-> Log the Command object (temp logging for debugging).
      console.log(value)
      //-> Skip the remaining Command objects in the array.
      if (skipRemaining) return;
      //-> If the Command is active (redundant condition, fight me) and the 'stopPropagation' value exists and is 'true' then specify that the remaining will be skipped ('skipRemaining' = true).
      if (value.isActive) {
        if (value.stopPropagation ? true : false) skipRemaining = true;
<<<<<<< HEAD
        //-> Well, this checks if privileged, if you're an allowed user (if specified), if a handler is defined (if you're allowed), if not allowed then check if a fallback function is defined,
        //-> if not then call the default fallback, and if not a privileged command and/or no allowed users are specified then just call the handler.
=======
      //-> Well, this checks if privileged, if you're an allowed user (if specified), if a handler is defined (if you're allowed), if not allowed then check if a fallback function is defined,
      //-> if not then call the default fallback, and if not a privileged command and/or no allowed users are specified then just call the handler.
>>>>>>> b39f3bbb1758e60c7488bb65416cbd2e4ff06968
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
    //-> Send a Message listing all currently loaded Modules.
    callerDataObj.message.channel.send(`List of Modules:\n\`${this.iMods.keys.join("`, `")}\``);
  }

  public getModuleData(callerDataObj: CallerDataObject) {
    console.log(this.iMods.Item(callerDataObj.args[0]));
    //-> If an argument has been provided assign that string to 'send'
    const send = this.iMods.Item(callerDataObj.args[0]);
    //-> If send was assigned then get the parsed JSON data from 'iMods' of the Module name assigned to 'send'. 
    if (send) callerDataObj.message.channel.send("```json\n" + JSON.stringify(send, null, '  ') + "\n```");
  }

  public editModuleData(callerDataObj: CallerDataObject) {
    //-> Get the required arguments from the 'args'.
    const [moduleName, commandName, objectProperty] = callerDataObj.args.slice(0, 3);
    //-> Join the entirety of the rest of the text provided to be the value for the specified Moudle Command Property.
    const propertyValue = callerDataObj.args.slice(3).join(" ");
    //-> Return if no value was provided.
    if (propertyValue === null || propertyValue === undefined) return;
    //-> Assign the Property from the Command from the Module to the given value (string values only [for now]).
    (<any>this.iMods.Item(moduleName).values[this.iMods.Item(moduleName).keys.indexOf(commandName)])[objectProperty] = propertyValue;
    //-> Send Message with a make-shift JSON 'snippet' of the code which includes the name of the modules, the name of the command, and the property name with it's new value. 
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
    //-> Get the specified Command from the given Module name.
    const commandObj = this.iMods.Item(callerDataObj.args[0]).Item(callerDataObj.args[1]);
    //-> Using the object's reference to the original, assign it to the opposite boolean value of it's current value.
    commandObj.isActive = !commandObj.isActive;
    //-> Send Message stating the name of the command, whether it had been activated or deactivated, and the parent Module of that Command. 
    callerDataObj.message.channel.send(`${commandObj.isActive ? 'Activated' : 'Deactivated'} command \`${callerDataObj.args[1]}\` from Module \`${callerDataObj.args[0]}\`.`);
  }

  public listCommands(callerDataObj: CallerDataObject) {
    //-> Temp Array to store -every- Command in 'iMods' regardless of it's active state.
    let commands: Array<{ name: string, obj: Command }> = new Array<{ name: string, obj: Command }>()
    //-> Iterate all Modules in 'iMods'.
    this.iMods.values.forEach(value => {
      //-> Iterate all Command in that Module.
      value.values.forEach(valueInner => {
        //-> Add that Command's name and the object's reference to the temp Array.
        commands.push({ name: value.keys[value.values.indexOf(valueInner)], obj: valueInner });
      });
    });
    //-> List all Commands with their aliases and descriptions (soon to be replaced with 'Helper' when completed, this was temp).
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
    //if (this.adminUsers.includes(author.id) === true) return;
    if (!args[0]) return;
    if (this.iMods.hasKey(args[0])) {
      this.reloadModule(args[0], <Discord.TextChannel>callerDataObj.message.channel);
    }
  }

  public saveModules(callerDataObj: CallerDataObject, channel?: Discord.TextChannel) {
    //-> Temp message that's edited when all files have attempted to be saved.
    let message: Discord.Message;
    //-> Just variables.
    let done: boolean = false;
    let err: boolean = false;
    const modulesStatus: { noErrors: string[], hasErrors: string[] } = { noErrors: [], hasErrors: [] };
    //-> Send pending message, edit it accordingly when the saving has been completed.
    callerDataObj.message.channel.send(`Saving Modules . . .`).then((value: Discord.Message) => {
      message = value;
      //-> Edit message if saving completed before message sends: displaying if all Modules saved successfully, or if there were ones that hadn't.
      done ? (message ? (message.edit(`${modulesStatus.hasErrors.length === 0 ? 'All ' : (modulesStatus.noErrors.length !== 0 ? 'The following ' : '')}${modulesStatus.noErrors.length} Moudles were saved successfully:\n${(modulesStatus.noErrors.length > 0 ? '`' + modulesStatus.noErrors.join('`, `') + '`' : '')}${modulesStatus.hasErrors.length !== 0 ? `\n${modulesStatus.hasErrors.length} Module${modulesStatus.hasErrors.length === 1 ? '' : 's'} encountered errors and were not saved${modulesStatus.hasErrors.length > 0 ? `:\n${'`' + modulesStatus.hasErrors.join('`, `') + '`'}` : '.'}` : ''}`)) : null) : null
    });
    //-> Iterate the Module names within 'iMods'.;
    this.iMods.keys.forEach(outerKey => {
      //-> Instantiate Module's data object.
      const data: Array<{}> = [];
      //-> Iterate all Commands within the Module's data.
      this.iMods.Item(outerKey).keys.forEach(innerKey => {
        //->  Instantiate Command's data object.
        const innerData: any = {};
        //-> Add property 'name'.
        innerData['name'] = innerKey;
        //-> Makes things easier & cleaner.
        const element = (<any>this.iMods.Item(outerKey).Item(innerKey));
        //-> Iterate the properties of the stored Command object
        this.modProperties.forEach(requiredProperty => {
          const property = element[requiredProperty];
          //-> Assign value of the corresponding 'file property' (at same index as 'requiredProperty' within 'fileProperties') to the value, or the name if the property's value is of Function.
          innerData[this.fileProperties[this.modProperties.indexOf(requiredProperty)]] = (property ? (property instanceof Function ? property['name'].replace('bound ', '') : property) : null);
        });
        //-> Add that Command to the soon-to-be-json-stringified Array object.
        data.push(innerData);
      });
      //-> Save the Module's Commands file in the directory corresponding to the name of the file, contents being the object 'data' after JSON.stringify(...).
      fs.writeFile(`${this.moduleDir}/${outerKey}/Module_Cmd_Persistence.json`, JSON.stringify(data, null, 3), (errr: Error) => {
        //-> Keep trrack of all Module names and if saving was successfull.
        (errr !== null && err !== undefined) ? modulesStatus.hasErrors.push(outerKey) : modulesStatus.noErrors.push(outerKey)
      });
    });
    //-> Edit message if saving completes after message sends: displaying if all Modules saved successfully, or if there were ones that hadn't.
    this.iMods.keys.slice(0, 0).forEach(k => { message ? message.edit(`${modulesStatus.hasErrors.length === 0 ? 'All ' : (modulesStatus.noErrors.length !== 0 ? 'The following ' : '')}${modulesStatus.noErrors.length} Moudles were saved successfully:\n${modulesStatus.noErrors.length > 0 ? '`' + modulesStatus.noErrors.join('`, `') + '`' : ''}${modulesStatus.hasErrors.length !== 0 ? `\n${modulesStatus.hasErrors.length} Module${modulesStatus.hasErrors.length === 1 ? '' : 's'} encountered errors and were not saved${modulesStatus.hasErrors.length > 0 ? `:\n${'`' + modulesStatus.hasErrors.join('`, `') + '`'}` : '.'}` : ''}`) : null });
    //-> Set the saving process to be 'done'. This is only used in cases where the above statement doesn't edit the message because the message hadn't sent to the channel yet.
    //-> Using this in it's callback to edit the message from there.
    done = true;
  }

  public unloadModule(name: string, channel?: Discord.TextChannel) {
    //-> Logs.
    console.log('unload')
    //-> If a 'deinit()' function exists then call it.
    if (this.deinitFuncs[name])
      this.deinitFuncs[name].deinit();
    //-> Delete the function from 'deinitFuncs'.
    delete this.deinitFuncs[name];
    //-> Delete the Imported Module from 'iImpt'.
    delete this.iImpt.Item(name).module;
    //-> Remove / Delete all values from the Module's data in 'iMods'.
    this.iMods.Item(name).keys.forEach(k => { delete this.iMods.Item(name).Item(k).handler; this.iMods.Item(name).Remove(k); })
    //-> Finally, remove the Module, by name, from 'iMods'.
    this.iMods.Remove(name)
    //-> If this was called from a Command directly (excluding 'reloadModule') then send Message to that channel for which it was used.
    if (channel) channel.send(`Unloaded module **${name}**`);
  }

  public reloadModule(name: string, channel?: Discord.TextChannel) {
    //-> Unload the Module and it's data.
    this.unloadModule(name);
    //-> Load in the Module and all of it's data.
    this.loadModuleFile(name);
    //-> Send Message to channel after the Module has been loaded back in.
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
