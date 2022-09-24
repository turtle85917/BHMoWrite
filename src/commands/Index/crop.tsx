import { Client, createElement } from "discord-tsx-factory";
import { AttachmentBuilder, Message } from "discord.js";
import { bhmo } from "../../interfaces/@data/bhmo";
import { setting } from "../../interfaces/@data/setting";
import Command from "../../interfaces/structures/Command";
import { staticCrop } from "../../interfaces/endpoint/BHMo/basic/static-crop";
import { database, req } from "../../..";
import { allFetch } from "../../utils/BHMo";
import { createCanvas, loadImage } from "canvas";
import crops from "../../data/crop/crops.json";

export default class Ping extends Command {
  constructor() {
    super();

    this.name = "crop";
    this.aliases = ["작물이미지", "crop-img", "crop-image"];
    this.description = {
      ko: "작물의 성장 과정을 축약해요.",
      en: "Shows the growth stage of the crop."
    };

    this.options = [
      {
        name: "crop",
        description: "Crop",
        required: true
      }
    ];
  }

  async execute(client: Client, message: Message<boolean>, args: string[]): Promise<void> {
    const value = crops[args[0]] || args[0].split(/ +/g).join("-");

    const data: bhmo = (await database("bhmo").where({ guildIdExternal: message.guildId, userIdExternal: message.author.id }))[0];
    let lang: "ko" | "en" = "ko";
    if (data) {
      let set: setting = (await database("setting").where({ id: data.id }))[0];
      lang = set.locale;
    } else {
      lang = "ko";
    }

    let currentData = await allFetch("/static/crop/{id}".format({ id: value }));
    if (typeof currentData.error === "object") {
      message.reply({
        embeds: (
          <embed title={req.t("g.common.error")} color={"DarkRed"}>
              {req.t(`blue-haired-moremi.api-error.${currentData.error.code}`)}
          </embed>
        )
      });
      return;
    }

    const realResult: staticCrop = currentData.result;

    const canvas = createCanvas(540, 390);
    const ctx = canvas.getContext("2d");

    const levels = ["dirt", "germination", "maturity", "fruit"];

    let names = [ req.t("g.common.crop-level.dirt"), req.t("g.common.crop-level.germination"), realResult.data.id === "pumpkin" ? req.t("crop.young-pumpkin.name") : req.t("g.common.crop-level.maturity"), req.t("g.common.crop-level.fruit") ];
    if (realResult.data.isTree) names = ["", req.t("g.common.tree-level.germination"), req.t("g.common.tree-level.maturity"), req.t("g.common.tree-level.fruit")];

    let y = 80, $x = 0;
    for (let x = 0; x < 4; x++) {
      let iconURL = `${process.cwd()}/src/data/crop/img/growth/${realResult.data.isTree ? "tree-" : ""}${levels[x]}.png`;
      const pumpkinYoung = realResult.data.id === "pumpkin" && x === 2;
            
      if (pumpkinYoung) iconURL = `${process.cwd()}/src/data/crop/img/fruit/young-pumpkin.png`;
      if (levels[x] === "fruit") iconURL = `${process.cwd()}/src/data/crop/img/fruit/${realResult.data.id}.png`;
      await ctx.drawImage(await loadImage(iconURL), $x, y - 50, 50, 50);

      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1.7;

      if (!realResult.data.isTree || (realResult.data.isTree && x > 0)) {
        ctx.font = "40px yeongdo";
        ctx.fillStyle = pumpkinYoung
          ? crops.pumpkin.$other["young-pumpkin"].color
          : crops[realResult.data.id].color;

        ctx.fillText(names[x], $x + 28, y - 8);
        ctx.strokeText(names[x], $x + 28, y - 8);

        let imageURL = `https://jjo.kr/box/bhm/crops/${realResult.data.id}-${levels[x][0]}.jpg`;
        if (x === 0) imageURL = "https://jjo.kr/box/bhm/crops/dirt.jpg";
        if (levels[x] === "fruit") imageURL = `https://jjo.kr/box/bhm/crops/${realResult.data.id}.jpg`;

        await ctx.drawImage(await loadImage(imageURL), $x, y, 400 / 2.2, 267 / 2.2);
      }

      if (x > 0) y = 260;
      $x += 300;
      if ($x > 400) $x = 0;
    }

    message.reply({
      embeds: (
        <embed
          title={`${realResult.data.icon} ${realResult.names[lang]}`}
          image={{ url: "attachment://result.png" }}>
        </embed>
      ),
      files: [new AttachmentBuilder(canvas.toBuffer(), { name: "result.png" })]
    });
  }
}