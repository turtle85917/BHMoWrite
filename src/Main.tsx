import "dotenv/config";
import { Client, createElement } from "discord-tsx-factory";
import { DMChannel, IntentsBitField, Partials } from "discord.js";
import { registerFont } from "canvas";
import { Logger } from "./utils/Logger";
import i18next from "i18next";
import { i18nInit } from "./i18n";
import { getArgs, mergeBorder } from "./utils/Utility";
import { bhmo } from "./interfaces/@data/bhmo";
import { setting } from "./interfaces/@data/setting";
import ProcessorMinigame from "./processors/minigame";
import ProcessorWildanimal from "./processors/wildanimal";
import { commandData, database, getFileLoad, initData, req, res } from "..";

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

      registerFont(`${process.cwd()}/src/data/fonts/Yeongdo-Rg.ttf`, {
          family: "yeongdo"
      });
    
      client.on("messageCreate", async (message) => {
          if (message.author.id === process.env.BHMo) {
            await ProcessorMinigame(message);
            await ProcessorWildanimal(message);
          }
          if (message.author.bot || message.system || !message.content.startsWith(initData.prefix)) return;
        
          try {
            let args: string[] = getArgs(message.content.slice(initData.prefix.length).trim());
            let command: string = args.shift();
               
            let findCommand = commandData.command.get(command) || commandData.command.get(commandData.aliases.get(command));
            if (!findCommand) return;
    
            const data: bhmo = (await database("bhmo").where({ guildIdExternal: message.guildId, userIdExternal: message.author.id }))[0];
            if (data) {
              let set: setting = (await database("setting").where({ id: data.id }))[0];
              req.i18next.changeLanguage(set.locale);
            } else {
              const kr = message.author.username.match(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g);
              req.i18next.changeLanguage(kr ? "ko" : "en");
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
                idx ++;
              }
            }
            if (findCommand.cooltime) {
              let key = findCommand.name + "#" + message.author.id;
              if (!commandData.cooltimes.get(key)) commandData.cooltimes.set(key, -1);

              if (commandData.cooltimes.get(key) !== -1 && Date.now() - commandData.cooltimes.get(key) < 1000) {
                message.reply({
                  embeds: (
                    <embed title={req.t("g.common.error")} color={"DarkRed"}>
                      {req.t("g.error.cooltime")}
                    </embed>
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
                    <embed title={req.t("g.common.error")} color={"DarkRed"}>
                      {req.t("g.error.not-allowed")}
                      <br />
                      <br />
                      {`${req.t("g.common.term.usage")}: \`${initData.prefix}${findCommand.name} ${findCommand.options.map(option => mergeBorder(option.name, option.required ? "()": "[]")).join(" ")}\``}
                      <br />
                      {findCommand.options.map(option => `> \`${mergeBorder(option.name, option.required ? "()" : "[]")}\` ${option.description}${option.choices ? ` (${req.t("g.error.one-of")}: ${option.choices.map(cho => `\`${cho}\``)})` : ""}`).join("\n")}
                    </embed>
                  )
                });
              }
              return;
            }
            await findCommand.execute(client, message, args);
          } catch (err) {
            message.reply({
              embeds: (
                <embed title={req.t("g.common.error")} color={"DarkRed"}>
                  {req.t("g.error.unhandled")}
                </embed>
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
                  embeds: (
                    <embed title={req.t("g.common.information")} color={"Blue"}>
                      {req.t("g.component.write.minigame-result-d0")}
                      <br />
                      {req.t("g.component.write.minigame-result-d1")}
                    </embed>
                  ),
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
        });
    
        client.on("debug", e => {
          if (e.startsWith("Hit a 429")) {
            Logger.warning("Rate Limit").put(e).out();
          }
        });
    });
    
    client.login(process.env.TOKEN);
}