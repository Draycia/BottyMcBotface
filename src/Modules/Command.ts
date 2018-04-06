import Discord = require("discord.js");

export default interface CallerDataObj {
    author: Discord.User,
    args: string[],
    message: Discord.Message
}
