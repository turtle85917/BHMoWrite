import { Client, createElement } from "discord-tsx-factory";
import { Message } from "discord.js";
import { bhmo } from "../../interfaces/@data/bhmo";
import { bhmoexp } from "../../interfaces/@data/bhmoexp";
import Command from "../../interfaces/structures/Command";
import { BHMoExp, Buff, commandData, database, req } from "../../..";
import { allFetch } from "../../utils/BHMo";
import { getBar } from "../../utils/Utility";

export default class Profileb extends Command {
  constructor() {
    super();

    this.name = "profile";
    this.aliases = ["p", "ㅍㄿ", "ㅍㄹㅍ", "프로필"];
    this.description = {
      ko: "연동된 여행자 정보를 확인해요.",
      en: "Show a linked user's information."
    };

    this.cooltime = true;
  }

  async execute(client: Client, message: Message<boolean>, args: string[]): Promise<void> {
    const data: bhmo = (await database("bhmo").where({ guildIdExternal: message.guildId, userIdExternal: message.author.id }))[0];

    if (!data) {
      message.reply({
        embeds: (
          <embed title={req.t("g.common.error")} color={"DarkRed"}>
            {req.t("g.error.linked-only")}
          </embed>
        )
      });

      commandData.cooltimes.set(`${this.name}#${message.author.id}`, Date.now());
      return;
    }

    const currentData = await allFetch("/link/{id}".format({ id: data.id }));
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

    const realResult: Link = currentData.result;

    const levelUpExp: bhmoexp = (await BHMoExp("BHMoExp").where({ lv: realResult.data.level }))[0];
    const beforeExp: bhmoexp = realResult.data.level === 1 ? { lv: 0, max: 0 } : (await BHMoExp("BHMoExp").where({ lv: realResult.data.level - 1 }))[0];

    const tags = [];
    if (message.member.permissions.has("Administrator")) tags.push(req.t("command.profile.administrator"));
    if (realResult.data.isNewbie) tags.push(req.t("command.profile.newbie"));
    if (!tags.length) tags.push(req.t("g.common.empty"));

    message.reply({
      embeds: (
        <embed title={"[" + req.t("g.common.term.libra") + " ❌] " + (realResult.data.name || message.author.username.slice(0, 50))}>
          {realResult.data.profile || undefined}
          <field name={req.t("command.profile.link")}>
            {"Lv. `" + realResult.data.level.toString().padStart(3, " ") + "` " + message.author.toString()}
            <br />
            {getBar({ current: Number(realResult.data.mileage) - beforeExp.max, maximum: levelUpExp.max - beforeExp.max, length: 12, color: "🟩" })}
            <br />
            {"> " + Number(realResult.data.mileage).toLocaleString() + " / " + levelUpExp.max.toLocaleString() + " (" + (((Number(realResult.data.mileage) - beforeExp.max) / (levelUpExp.max - beforeExp.max)) * 100).toFixed(1) + "%)"}
          </field>
          <field name={req.t("command.profile.health")}>
            {getBar({ current: Math.round(realResult.data.health), maximum: realResult.data.maxHealth, length: 12, color: "🟦" })}
            <br />
            {"> " + Math.round(realResult.data.health) + " / " + String(realResult.data.maxHealth)}
            <br />
            {"> " + req.t("command.profile.healAcceleration", [realResult.data.healAcceleration.toFixed(2)])}
          </field>
          <field name={req.t("g.common.term.strawberry")} inline={true}>
            {"🍓 `" + (+realResult.data.strawberry).toLocaleString() + "`"}
          </field>
          <field name={req.t("g.common.term.gem")} inline={true}>
            {"💎 `" + (+realResult.data.gem).toLocaleString() + "`"}
          </field>
          <field name={req.t("command.profile.buffs")} inline={true}>
            {Object.entries(realResult.data.buffs).map(([k, v]) => {
              return Buff[k].ko + " (" + req.t("g.common.end-in", [Math.round(v / 1000)]) + ")"
            }).join("\n") || req.t("g.common.empty")}
          </field>
          <field name={req.t("command.profile.tags")}>
            {tags.join("\n")}
          </field>
        </embed>
      )
    });

    commandData.cooltimes.set(`${this.name}#${message.author.id}`, Date.now());
  }
}