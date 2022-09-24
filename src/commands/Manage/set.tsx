import { Client, createElement } from "discord-tsx-factory";
import { Message } from "discord.js";
import { bhmo } from "../../interfaces/@data/bhmo";
import { setting } from "../../interfaces/@data/setting";
import Command from "../../interfaces/structures/Command";
import { database, req } from "../../..";

export default class Set extends Command {
  constructor() {
    super();

    this.name = "set";
    this.aliases = ["설정"];
    this.description = {
      ko: "환경 변수를 설정해요.",
      en: "Control environmental variables."
    };

    this.options = [
      {
        name: "key",
        description: "Variable name.",
        required: true,
        choices: ["locale", "damageWrite"]
      },
      {
        name: "value",
        description: "Value.",
        required: true
      }
    ]
  }

  async execute(client: Client, message: Message<boolean>, args: string[]): Promise<void> {
    const key = args[0];
    const value = args[1];

    const data: bhmo = (await database("bhmo").where({ guildIdExternal: message.guildId, userIdExternal: message.author.id }))[0];

    if (!data) {
      message.reply({
        embeds: (
          <embed title={req.t("g.common.error")} color={"DarkRed"}>
            {req.t("g.error.linked-only")}
          </embed>
        )
      });
      return;
    }

    const set: setting = (await database("setting").where({ id: data.id }))[0];
    if (!set) {
      message.reply({
        embeds: (
          <embed title={req.t("g.common.error")} color={"DarkRed"}>
            {req.t("g.error.unhandled")}
          </embed>
        )
      });
      return;
    }

    switch (key) {
      case "damageWrite":
        if (!["y", "n", "ㅇ", "ㄴ"].includes(value.toLowerCase())) {
          message.reply({
            embeds: (
              <embed title={req.t("g.common.error")} color={"DarkRed"}>
                {req.t("command.set.error-boolean")}
              </embed>
            )
          });
          return;
        }

        message.reply({
          embeds: (
            <embed title={req.t("g.common.information")} color={"Blue"}>
              {req.t("command.set.d")}
              <br />
              {req.t(`command.set.d-damage-write-${value}`)}
            </embed>
          )
        });
        await database("setting").where({ id: data.id }).update({ writeDamage: value });
        break;
      case "locale":
        if (!["ko", "en"].includes(value)) {
          message.reply({
            embeds: (
              <embed title={req.t("g.common.error")} color={"DarkRed"}>
                {req.t("command.set.error-locale")}
              </embed>
            )
          });
          return;
        }

        message.reply({
          embeds: (
            <embed title={req.t("g.common.information")} color={"Blue"}>
              {req.t("command.set.d")}
              <br />
              {req.t(`command.set.d-locale-${value}`)}
            </embed>
            )
        });
        await database("setting").where({ id: data.id }).update({ locale: value });
        break;
      default:
        message.reply({
          embeds: (
            <embed title={req.t("g.common.error")} color={"DarkRed"}>
              {req.t("g.error.not-allowed")}
            </embed>
          )
        });
        break;
      }
    }
}