import Discord = require("discord.js");

export default interface Params {
    author: Discord.User,
    args: string[],
    message: Discord.Message
}
