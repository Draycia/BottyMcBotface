import Botty from "./Botty";

// import ApiStatus from "./ApiStatus";
// import AutoReact from "./AutoReact";
// import ForumReader from "./ForumReader";
// import Info from "./Info";
// import JoinMessaging from "./JoinMessaging";
// import KeyFinder from "./KeyFinder";
// import Logger from "./Logger";
// import OfficeHours from "./OfficeHours";
// import RiotAPILibraries from "./RiotAPILibraries";
// import Techblog from "./Techblog";
// import Uptime from "./Uptime";
// import VersionChecker from "./VersionChecker";
import ComponentManager from "./ComponentManager";

import { fileBackedObject } from "./FileBackedObject";
import { PersonalSettings } from "./PersonalSettings";
import { SharedSettings } from "./SharedSettings";

declare global {
   interface Array<T> {
      includes(searchElement: T): boolean;
   }
}

// Add Array includes polyfill if needed
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes#Polyfill
if (!Array.prototype.includes) {
   Array.prototype.includes = function (searchElement /*, fromIndex*/) {
      'use strict';
      var O = Object(this);
      var len = parseInt(O.length, 10) || 0;
      if (len === 0) {
         return false;
      }
      var n = parseInt(arguments[1], 10) || 0;
      var k;
      if (n >= 0) {
         k = n;
      } else {
         k = len + n;
         if (k < 0) { k = 0; }
      }
      var currentElement;
      while (k < len) {
         currentElement = O[k];
         if (searchElement === currentElement) { // NaN !== NaN
            return true;
         }
         k++;
      }
      return false;
   };
}

// Load and initialise settings
const sharedSettings = fileBackedObject<SharedSettings>("settings/shared_settings.json");
const personalSettings = fileBackedObject<PersonalSettings>("settings/personal_settings.json");
const bot = new Botty(personalSettings, sharedSettings);

// Load extensions
// const joinMessaging = new JoinMessaging(bot.client, sharedSettings);
// const versionChecker = new VersionChecker(bot.client, sharedSettings, "data/version_data.json");
// const logger = new Logger(bot.client, sharedSettings);
// const uptime = new Uptime(bot.client, sharedSettings, personalSettings, "data/uptime_data.json");
// const keyFinder = new KeyFinder(bot.client, sharedSettings, "data/riot_keys.json");
// const forum = new ForumReader(bot.client, sharedSettings, personalSettings, "data/forum_data.json", keyFinder);
// const autoReact = new AutoReact(bot.client, sharedSettings, "data/thinking_data.json", "data/ignored_react_data.json");
// const officeHours = new OfficeHours(bot.client, sharedSettings, "data/office_hours_data.json");
// const riotAPILibraries = new RiotAPILibraries(bot.client, personalSettings, sharedSettings);
// const techblog = new Techblog(bot.client, sharedSettings, "data/techblog_data.json");
// const info = new Info(bot.client, sharedSettings, "data/info_data.json", versionChecker);
// const apiStatus = new ApiStatus(bot.client, sharedSettings);
const componentManager = new ComponentManager(bot.client);

// start bot
bot.start();
