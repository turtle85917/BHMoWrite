import { Client, Fragment, createElement } from "discord-tsx-factory";
import { Message } from "discord.js";
import { bhmo } from "../../interfaces/@data/bhmo";
import Command from "../../interfaces/structures/Command";
import { linkByDiscord } from "../../interfaces/endpoint/BHMo/user/link-by-discord";
import { commandData, database, Interaction, req, res } from "../../..";
import { Logger } from "../../utils/Logger";
import { allFetch } from "../../utils/BHMo";
import { getConfirmPresetComponents } from "../../components/ConfirmPreset";

export default class Link extends Command {
  constructor() {
    super();

    this.name = "link";
    this.aliases = ["연동", "링크"];
    this.description = {
      ko: "파란 머리 모레미와 디스코드 계정을 연동시켜요.",
      en: "Link your Discord account with BHMo."
    };

    this.cooltime = true;

    this.interaction = async (client: Client, interaction: Interaction): Promise<void> => {
      if (interaction.customId.get("action").includes("no")) return;
      const linkRes = res[`${interaction.customId.get("channel-id")}#${interaction.user.id}#link`];
      const guildId = interaction.customId.get("action").split("#")[1];
      const data: bhmo = (await database("bhmo").where({ guildIdExternal: guildId, userIdExternal: interaction.user.id, id: linkRes.link.id }))[0];
      if (data) {
        interaction.reply({
          embeds: (
            <embed title={req.t("g.common.error")} color={"DarkRed"}>
              {req.t("command.link.error-existing-link")}
            </embed>
          ),
          ephemeral: true
        });
        return;
      }

      interaction.update({
        embeds: (
          <embed title={req.t("g.common.information")} color={"Blue"}>
            {req.t("command.link.already-d")}
          </embed>
        ),
        components: []
      });
      await database("bhmo").insert({ guildIdExternal: guildId, userIdExternal: interaction.user.id, id: linkRes.link.id });
      await database("setting").insert({ id: linkRes.link.id, locale: "ko", writeDamage: "y" });
      await database("record").insert({ id: linkRes.link.id, damage: "0" });

      Logger.info("Insert Table : bhmo").next("guildIdExternal").put(guildId).next("userIdExternal").put(interaction.user.id).next("id").put(linkRes.link.id).out();
      Logger.info("Insert Table : setting").next("id").put(linkRes.link.id).next("locale").put("ko").next("writeDamage").put("y").out();
      Logger.info("Insert Table : record").next("id").put(linkRes.link.id).next("damage").put("0").out();
    }
  }

  async execute(client: Client, message: Message<boolean>): Promise<void> {
    const currentData = await allFetch("/link/by-discord/{guild}/{user}".format({ guild: message.guildId, user: message.author.id }));
    if (typeof currentData.error === "object") {
      message.reply({
        embeds: (
          <embed title={req.t("g.common.error")} color={"DarkRed"}>
            {req.t(`blue-haired-moremi.api-error.${currentData.error.code}`)}
          </embed>
        )
      });

      commandData.cooltimes.set(`${this.name}#${message.author.id}`, Date.now());
      return;
    }

    const realResult: linkByDiscord = currentData.result;
    const data: bhmo = (await database("bhmo").where({ guildIdExternal: message.guildId, userIdExternal: message.author.id, id: realResult.id }))[0];
    if (data) {
      message.reply({
        embeds: (
          <embed title={req.t("g.common.error")} color={"DarkRed"}>
            {req.t("command.link.error-existing-link")}
          </embed>
        )
      });

      commandData.cooltimes.set(`${this.name}#${message.author.id}`, Date.now());
      return;
    }

    message.author.send({
      embeds: (
        <embed title={req.t("command.link.already-t")} color={"Blue"}>
          {req.t("command.link.already-q")}
        </embed>
      ),
      components: (
        <>
          {getConfirmPresetComponents(`${message.channelId}@${message.author.id}@link#{action}#${message.guildId}`)}
        </>
      )
    })
    .then(m => {
      const initData = { message: undefined, link: { id: realResult.id } };

      let linkRes = res[`${message.channelId}#${message.author.id}#link`];
      if (!linkRes) {
        res[`${message.channelId}#${message.author.id}#link`] = initData;
        linkRes = initData;
      }

      linkRes.link.id = realResult.id;
      linkRes.message?.delete().catch(() => undefined);
      linkRes.message = m;

      commandData.cooltimes.set(`${this.name}#${message.author.id}`, Date.now());
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