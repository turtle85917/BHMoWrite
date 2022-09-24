import { createElement } from "discord-tsx-factory";
import { type Message } from "discord.js";
import { database, req } from "../..";
import { bhmo } from "../interfaces/@data/bhmo";
import { record } from "../interfaces/@data/record";
import { setting } from "../interfaces/@data/setting";

export default async (message: Message) => {
  const titleCondition = message.embeds[0]?.title?.includes("야생동물의 습격") || message.embeds[0]?.title?.includes("Wild Animal Invasion");
  const mentionCondition = message.mentions.users.size;
  if (titleCondition && mentionCondition) {
    const user = message.mentions.users.first();
    const data: bhmo = (await database("bhmo").where({ guildIdExternal: message.guildId, userIdExternal: user.id }))[0];

    if (data) {
      const set: setting = (await database("setting").where({ id: data.id }))[0];
      if (set.writeDamage === "y") {
        const first = message.embeds[0];
        const en: boolean = first.title.includes("Wild Animal Invasion");
        const damage: number = +first.description.split(" ")[en ? 8 : 5].split("%p")[0];

        message.reply({
          embeds: (
            <embed title={req.t("g.common.embed.write-t")} color={"Blue"}>
              {req.t("g.component.write.wildanimal-damage-d")}
            </embed>
          )
        });

        const $record: record = (await database("record").where({ id: data.id }))[0];
        await database("record").where({ id: data.id }).update({ damage: (+$record.damage + damage).toString() });
      }
    }
  }
}