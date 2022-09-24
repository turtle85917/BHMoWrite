import { Client, Fragment, createElement } from "discord-tsx-factory";
import { Message } from "discord.js";

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
        let data: bhmo = (await database("bhmo").where({ guildIdExternal: message.guildId, userIdExternal: message.author.id }))[0];
        let lang: "ko" | "en" = "ko";
        if (data) {
            let set: setting = (await database("setting").where({ id: data.id }))[0];
            lang = set.locale;
        } else {
            lang = "ko";
        }

        let getCommands = (category: string): string => {
            return commandData.command.filter(cmd => cmd.category === category).map(cmd => {
                return "> `" + (initData.prefix + cmd.name).padEnd(10, " ") + "` " + cmd.description[lang]
            }).join("\n");
        }

        message.author.send({
            embeds: (
                <>
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
                    </embed>
                </>
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
                    <>
                        <embed>{req.t("command.help.error-sent")}</embed>
                    </>
                )
            });
        })
    }
}