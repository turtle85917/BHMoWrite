import "dotenv/config";

import { Client, Fragment, createElement } from "discord-tsx-factory";
import { DMChannel, IntentsBitField, Partials, TextChannel, ThreadChannel } from "discord.js";

import { commandData, database, getFileLoad, initData, req, res } from "..";

import { getArgs, mergeBorder } from "./utils/Utility";
import { Logger } from "./utils/Logger";

import i18next from "i18next";
import { i18nInit } from "./i18n";

import { bhmo } from "./interfaces/@data/bhmo";
import { record } from "./interfaces/@data/record";
import { setting } from "./interfaces/@data/setting";
import { minigameResult } from "./interfaces/@data/minigame-result";

import { registerFont } from "canvas";

import { getConfirmPresetComponents } from "./components/ConfirmPreset";

export function main(): void {
    const client = new Client({
        intents: [new IntentsBitField(32767), "MessageContent"],
        partials: [ Partials.Channel, Partials.GuildMember, Partials.Message, Partials.User ]
    });
    
    client.on("ready", async () => {
        let init = i18next.init(i18nInit.options);
        req.i18next = i18next;
        req.t = await init;
    
        getFileLoad();
    
        Logger.success("Discord")
        .next("Name").put(client.user.tag)
        .next("Prefix").put(initData.prefix)
        .next("Command").put(commandData.command.size)
        .out();
    
        database.schema.hasTable("bhmo").then(async (exists) => {
            if (!exists) {
                await database.schema.createTable("bhmo", (t) => {
                    t.string("guildIdExternal");
                    t.string("userIdExternal");
                    t.string("id");
                });
                Logger.success("Create table : bhmo").out();
            } else {
                Logger.success("Has table : bhmo").out();
            }
        });
    
        database.schema.hasTable("setting").then(async (exists) => {
            if (!exists) {
                await database.schema.createTable("setting", (t) => {
                    t.string("id");
                    t.string("locale");
                });
                Logger.success("Create table : setting").out();
            } else {
                Logger.success("Has table : setting").out();
            }
        });
    
        database.schema.hasTable("record").then(async (exists) => {
            if (!exists) {
                await database.schema.createTable("record", (t) => {
                    t.string("id");
                    t.string("damage");
                });
                Logger.success("Create table : record").out();
            } else {
                Logger.success("Has table : record").out();
            }
        });
    
        database.schema.hasTable("minigame-result").then(async (exists) => {
            if (!exists) {
                await database.schema.createTable("minigame-result", (t) => {
                    t.string("guildIdExternal")
                    t.string("id");
                    t.string("path");
                    t.string("locale");
                    t.string("icon");
                    t.string("name");
                    t.string("steps");
                });
                Logger.success("Create table : minigame-result").out();
            } else {
                Logger.success("Has table : minigame-result").out();
            }
        });
    
        registerFont(`${process.cwd()}/src/data/fonts/Yeongdo-Rg.ttf`, {
            family: "yeongdo"
        });
    
        client.on("messageCreate", async (message) => {
            if (message.author.id === process.env.BHMo) {
                if (
                    (message.embeds[0]?.title?.endsWith("만들기 완료!") ||
                    message.embeds[0]?.title?.includes("Crafting")) &&
                    message.channel instanceof ThreadChannel
                ) {
                    let en = message.embeds[0].title.includes("Crafting");
                    let originalContent: string = message.embeds[0].description;
                    let contents: string[] = originalContent.split("\n");
                    let steps: { icon: string; score: number; count: number; }[] = [];
                    let idx: number = 0;
                    let stepIdx: number = 0;
    
                    for (const content of contents) {
                        if (content === "") break;
                        if (content.includes(":bar_chart:")) break;
                        if (content.startsWith(">")) {
                            idx++;
                            continue;
                        }
    
                        let icon = content.split(" ")[0];
                        let score = Number(contents[idx + 1]
                            .split(" ")[1]
                            .replace("점", "")
                            .replace(/,/g, ""));
                        
                        steps.push({ icon, score, count: stepIdx++ });
                        idx += 1;
                    }
    
                    let craftItemIcon = message.embeds[0].title.split(" ")[0];
                    let craftItemName = message.embeds[0].title.split(" ").slice(1, -2).join(" ");
                    if (message.embeds[0].title.includes("Crafting")) craftItemName = message.embeds[0].title.split(" ").slice(2).join(" ");
    
                    let minigames: minigameResult[] = await database("minigame-result").select("").where({ locale: en ? "en" : "ko" });
                    let id: string = minigames.length ? String(Number(minigames.at(-1).id) + 1) : "1";
    
                    let path = message.channel.name.split(" ").slice(-1)[0].toLowerCase();
    
                    res[`${message.channelId}#minigame-result`] = {
                        message: undefined,
                        minigame: {
                            id, path, locale: en ? "en" : "ko", icon: craftItemIcon, name: craftItemName, steps: JSON.stringify(steps, null, 4)
                        }
                    };
                    let originalChannel = message.guild.channels.cache.find(d => {
                        if (d instanceof TextChannel) {
                            if (d.threads.cache.find(d => d.id === message.channelId && !d.locked && !d.archived)) {
                                return true;
                            }
                        }
                    });
                    if (originalChannel && originalChannel instanceof TextChannel) {
                        let originalChannelMessages = await originalChannel.messages.fetch({ limit: 20 });
                        let m = originalChannelMessages.find(d => {
                            if (d.author.id === process.env.BHMo && (d.content.endsWith("has earned:") || d.content.endsWith("님이 아이템을 획득했어요.")) && d.mentions.users.size && d.embeds[0]?.title?.toLowerCase() === `${craftItemIcon} ${craftItemName}`) {
                                return true;
                            }
                        });
                        if (!m) return;
                        message.reply({
                            embeds: (
                                <>
                                    <embed title={req.t("g.component.write.minigame-result-q")}>
                                        {req.t("g.component.write.minigame-result-d0")}
                                        <br />
                                        {req.t("g.component.write.minigame-result-confirm-d")}
                                    </embed>
                                </>
                            ),
                            components: (
                                <>
                                    {getConfirmPresetComponents(`${message.channelId}@${m.mentions.users.first().id}@minigame-result#{action}`)}
                                </>
                            )
                        });
                    }
                }
                if (
                    (message.embeds[0]?.title?.includes("야생동물의 습격") ||
                    message.embeds[0]?.title?.includes("Wild Animal Invasion")) &&
                    message.mentions.users.size
                ) {
                    let user = message.mentions.users.first();
                    let data: bhmo = (await database("bhmo").where({ guildIdExternal: message.guildId, userIdExternal: user.id }))[0];
    
                    if (data) {
                        let set: setting = (await database("setting").where({ id: data.id }))[0];
    
                        if (set.writeDamage === "y") {
                            let en: boolean = message.embeds[0]?.title?.includes("Wild Animal Invasion");
    
                            let damage: number = 0;
                            if (!en) damage = Number(message.embeds[0].description.split(" ")[5].split("%p")[0]);
                            else damage = Number(message.embeds[0].description.split(" ")[8].split("%p")[0]);
    
                            message.reply({
                                embeds: (
                                    <>
                                        <embed title={req.t("g.common.embed.write-t")} color={"Blue"}>
                                            {req.t("g.component.write.wildanimal-damage-d")}
                                        </embed>
                                    </>
                                )
                            });
    
                            let record_: record = (await database("record").where({ id: data.id }))[0];
    
                            let currentDamage = Number(record_.damage);
                            currentDamage += damage;
    
                            await database("record").where({ id: data.id }).update({ damage: String(currentDamage) });
                        }
                    }
                }
            }
            if (message.author.bot || message.system || !message.content.startsWith(initData.prefix)) return;
        
            try {
                let args: string[] = getArgs(message.content.slice(initData.prefix.length).trim());
                let command: string = args.shift();
                
                let findCommand = commandData.command.get(command) || commandData.command.get(commandData.aliases.get(command));
                if (!findCommand) {
                    Logger.error("Command Ignore")
                    .next("User").put(message.author.username + " :: " + message.author.id)
                    .next("Name").put(command)
                    .out();
                    return;
                }
    
                let data: bhmo = (await database("bhmo").where({ guildIdExternal: message.guildId, userIdExternal: message.author.id }))[0];
                if (data) {
                    let set: setting = (await database("setting").where({ id: data.id }))[0];
                    req.i18next.changeLanguage(set.locale);
                } else {
                    req.i18next.changeLanguage("ko");
                }
    
                if (message.channel instanceof DMChannel) {
                    message.reply(req.t("g.common.not-allowed-on-dm"));
                    return;
                }
    
                let intactly = true;
                let reason = "";
    
                if (findCommand.options) {
                    let idx = 0;
                    for (const option of findCommand.options) {
                        if (
                            (option.required && !args[idx]) ||
                            (option.required && args[idx] && option.choices && !option.choices?.includes(args[idx]))
                        ) {
                            intactly = false;
                            reason = "option";
                        }
                        idx += 1;
                    }
                }
                if (findCommand.cooltime) {
                    let key = findCommand.name + "#" + message.author.id;
                    if (!commandData.cooltimes.get(key)) {
                        commandData.cooltimes.set(key, -1);
                    }
    
                    if (commandData.cooltimes.get(key) !== -1 && Date.now() - commandData.cooltimes.get(key) < 1000) {
                        message.reply({
                            embeds: (
                                <>
                                    <embed title={req.t("g.common.error")} color={"DarkRed"}>
                                        {req.t("g.error.cooltime")}
                                    </embed>
                                </>
                            )
                        });
                        intactly = false;
                        return;
                    }
                }
    
                if (!intactly) {
                    if (reason === "option") {
                        message.reply({
                            embeds: (
                                <>
                                    <embed title={req.t("g.common.error")} color={"DarkRed"}>
                                        {req.t("g.error.not-allowed")}
                                        <br />
                                        <br />
                                        {`${req.t("g.common.term.usage")}: \`${initData.prefix}${findCommand.name} ${findCommand.options.map(option => mergeBorder(option.name, option.required ? "()": "[]")).join(" ")}\``}
                                        <br />
                                        {findCommand.options.map(option => `> \`${mergeBorder(option.name, option.required ? "()" : "[]")}\` ${option.description}${option.choices ? ` (${req.t("g.error.one-of")}: ${option.choices.map(cho => `\`${cho}\``)})` : ""}`).join("\n")}
                                    </embed>
                                </>
                            )
                        });
                    }
                    return;
                }
                await findCommand.execute(client, message, args);
            } catch (err) {
                message.reply({
                    embeds: (
                        <>
                            <embed title={req.t("g.common.error")} color={"DarkRed"}>
                                {req.t("g.error.unhandled")}
                            </embed>
                        </>
                    )
                });
                Logger.error("Handling Error").put(err instanceof Error ? err.stack : err).out();
            }
        });
    
        client.on("interactionCreate", async (interaction) => {
            if (interaction.type === 3) {
                let findRes =
                    res[`${interaction.customId.get("channel-id")}#${interaction.customId.get("user-id")}#${interaction.customId.get("command-name")}`] ||
                    res[`${interaction.customId.get("channel-id")}#minigame-result`];
                if (findRes === undefined) {
                    interaction.reply({
                        content: req.t("g.error.bot-restart"),
                        ephemeral: true
                    });
                    return;
                }
    
                if (interaction.customId.get("user-id") !== interaction.user.id) {
                    interaction.reply({
                        content: req.t("g.error.exclusive"),
                        ephemeral: true
                    });
                    return;
                }
                
                if (interaction.customId.get("action").includes("no")) {
                    interaction.update({
                        content: req.t("g.common.expired"), files: [], embeds: [], components: []
                    });
                    return;
                }
    
                if (interaction.customId.get("command-name") === "minigame-result") {
                    let minigameResult = res[`${interaction.channelId}#minigame-result`];
                    interaction.update({
                        embeds: (<>
                            <embed title={req.t("g.common.information")} color={"Blue"}>
                                {req.t("g.component.write.minigame-result-d0")}
                                <br />
                                {req.t("g.component.write.minigame-result-d1")}
                            </embed>
                        </>),
                        components: []
                    });
                    await database("minigame-result").insert({
                        guildIdExternal: interaction.guildId,
                        id: minigameResult.minigame.id,
                        path: minigameResult.minigame.path,
                        locale: minigameResult.minigame.locale,
                        icon: minigameResult.minigame.icon,
                        name: minigameResult.minigame.name,
                        steps: minigameResult.minigame.steps,
                    });
                    delete res[`${interaction.channelId}#minigame-result`];
                    return;
                }
    
                await commandData.command.get(interaction.customId.get("command-name")).interaction(client, interaction);
            }
        })
    
        client.on("debug", e => {
            if (e.startsWith("Hit a 429")) {
                Logger.warning("Rate Limit").put(e).out();
            }
        })
    });
    
    client.login(process.env.TOKEN);
}