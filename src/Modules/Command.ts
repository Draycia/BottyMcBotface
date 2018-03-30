import Discord = require("discord.js");

export default interface Command {
    author: Discord.User,
    args: String[],
    message: Discord.Message
}
