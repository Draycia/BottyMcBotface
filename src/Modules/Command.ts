import Discord = require("discord.js");

export default interface Command {
    author: Discord.User,
    args: string[],
    message: Discord.Message
}
