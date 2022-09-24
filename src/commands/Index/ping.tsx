import { Client } from "discord-tsx-factory";
import { Message } from "discord.js";

import Command from "../../interfaces/structures/Command";

import { req } from "../../..";

export default class Ping extends Command {
    constructor() {
        super();

        this.name = "ping";
        this.aliases = ["핑"];
        this.description = {
            ko: "살아있는지 확인해요.",
            en: "Make sure you're alive."
        };
    }

    async execute(client: Client, message: Message<boolean>, args: string[]): Promise<void> {
        let m = await message.reply(req.t("command.ping.loading"));
        if (!m.deletable) {
            message.reply(req.t("command.ping.failed"));
            return;
        }
        m.edit(req.t("command.ping.ok").format({ ping: m.createdTimestamp - message.createdTimestamp }));
    }
}