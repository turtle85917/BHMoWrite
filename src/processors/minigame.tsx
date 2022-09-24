import { Fragment, createElement } from "discord-tsx-factory";
import { type Message, ThreadChannel, TextChannel } from "discord.js";
import { database, req, res } from "../..";
import { getConfirmPresetComponents } from "../components/ConfirmPreset";
import { minigameResult } from "../interfaces/@data/minigame-result";

export default async (message: Message<boolean>) => {
  const titleCondition = message.embeds[0]?.title?.includes("만들기 완료!") || message.embeds[0]?.title?.includes("Crafting");
  const channelCondition = message.channel instanceof ThreadChannel;

  if (titleCondition && channelCondition) {
    const first = message.embeds[0];

    const en = first.title.includes("Crafting");
    const original = first.description;
    const contents = original.split("\n");
    const steps: { icon: string; score: number; count: number; }[] = [];
    
    let idx = 0, stepIdx = 0;

    for (const content of contents) {
      if (content === "") break;
      if (content.includes(":bar_chart:")) break;
      if (content.startsWith(">")) {
          idx++;
          continue;
      }

      const icon = content.split(" ")[0];
      const score = Number(contents[idx + 1]
          .split(" ")[1]
          .replace("점", "")
          .replace(/,/g, ""));
      
      steps.push({ icon, score, count: stepIdx++ });
      idx += 1;
    }

    const $icon = first.title.split(" ")[0];
    let $name = first.title.split(" ").slice(1, -2).join(" ");
    if (en) $name = first.title.split(" ").slice(2).join(" ");

    const minigames: minigameResult[] = await database("minigame-result").select("*").where({ locale: en ? "en" : "ko" });
    const id: string = minigames.length ? String(Number(minigames.at(-1).id) + 1) : "1";

    const path = message.channel.name.split(" ").slice(-1)[0].toLowerCase();

    res[`${message.channelId}#minigame-result`] = {
        message: undefined,
        minigame: {
          id, path, locale: en ? "en" : "ko", icon: $icon, name: $name, steps: JSON.stringify(steps, null, 4)
        }
    };
    let originalChannel = message.guild.channels.cache.find(d => {
      if (d instanceof TextChannel && d.threads.cache.find(d => d.id === message.channelId && !d.locked && !d.archived)) return true;
    });
    if (originalChannel && originalChannel instanceof TextChannel) {
      let originalChannelMessages = await originalChannel.messages.fetch({ limit: 20 });
      let m = originalChannelMessages.find(d => {
        if (d.author.id === process.env.BHMo && (d.content.endsWith("has earned:") || d.content.endsWith("님이 아이템을 획득했어요.")) && d.mentions.users.size && d.embeds[0]?.title?.toLowerCase() === `${$icon} ${$name}`) return true;
      });
      if (!m) return;
      message.reply({
        embeds: (
          <embed title={req.t("g.component.write.minigame-result-q")}>
            {req.t("g.component.write.minigame-result-d0")}
            <br />
            {req.t("g.component.write.minigame-result-confirm-d")}
          </embed>
        ),
        components: (
          <>
            {getConfirmPresetComponents(`${message.channelId}@${m.mentions.users.first().id}@minigame-result#{action}`)}
          </>
        )
      });
    }
  }
}