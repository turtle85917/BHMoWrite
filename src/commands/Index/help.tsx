import { Client, createElement } from "discord-tsx-factory";
import { type Message } from "discord.js";
import { bhmo } from "../../interfaces/@data/bhmo";
import { setting } from "../../interfaces/@data/setting";
import Command from "../../interfaces/structures/Command";
import { commandData, database, initData, req } from "../../..";

export default class Help extends Command {
  constructor() {
    super();

    this.name = "help";
    this.aliases = ["도움말", "도움", "?"];
    this.description = {
      ko: "파머모 기록봇이란?",
      en: "Let me introduce myself!"
    };
  }

  async execute(client: Client, message: Message<boolean>, args: string[]): Promise<void> {
    const data: bhmo = (await database("bhmo").where({ guildIdExternal: message.guildId, userIdExternal: message.author.id }))[0];
    let lang: "ko" | "en" = "ko";
    if (data) {
      const set: setting = (await database("setting").where({ id: data.id }))[0];
      lang = set.locale;
    } else lang = "ko";

    const getCommands = (category: string): string => {
      return commandData.command.filter(cmd => cmd.category === category).map(cmd => {
        return "> `" + (initData.prefix + cmd.name).padEnd(15, " ") + "` " + cmd.description[lang]
      }).join("\n");
    }

    message.author.send({
      embeds: (
        <embed title={req.t("command.help.title")} color={"Gold"}>
          {req.t("command.help.commands")}
          <br/>
          {req.t("command.help.category.view")}
          <br />
          {getCommands("Index")}
          <br />
          {req.t("command.help.category.manage")}
          <br/>
          {getCommands("Manage")}
          <footer iconURL="https://cdn.discordapp.com/avatars/674877162557407242/95161c92060e639aa5bb44fcfa965741.png?size=2048&quality=high">
            Made by 플토
          </footer>
        </embed>
      )
    })
    .then(() => {
      message.reply({
        content: req.t("command.help.sent")
      });
    })
    .catch(() => {
      message.channel.send({
        content: message.author.toString(),
        embeds: (
          <embed>{req.t("command.help.error-sent")}</embed>
        )
      });
    });
  }
}