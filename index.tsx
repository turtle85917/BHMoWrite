import fs from "fs";
import { ButtonInteraction, CacheType, Collection, Message, SelectMenuInteraction } from "discord.js";

import { Logger } from "./src/utils/Logger";
import { i18n, TFunction } from "i18next";

import Command from "./src/interfaces/structures/Command";

import knex from "knex";

import { main } from "./src/Main";

type stringGetPath = "channel-id" | "user-id" | "command-name" | "action";

declare global {
    interface String {
        format(...args): string;
        get(path: stringGetPath): string;
    }
}

String.prototype.get = function (this: string, path: stringGetPath): string {
    switch (path) {
        case "channel-id":
            return this.split("@")[0];
        case "user-id":
            return this.split("@")[1];
        case "command-name":
            return this.split("@")[2].split("#")[0];
        case "action":
            return this.split("@")[2].split("#").slice(1).join("#");
    }
}

String.prototype.format = function (this: string, ...args): string {
    let cnt: number = 0;
    let res = this;

    return res.replace(/{(.*?)}/g, (matched: string, p1: string) => {
        let rt: string = args[cnt];
        let first = p1.split(".")[0];

        if (rt === undefined) {
            rt = args.find(d => d && d[first]);
        }
        if (typeof rt === "number") rt = String(rt);
        if (typeof rt === "object" && !Array.isArray(rt)) {
            let re = args[cnt];
            if (re === undefined) {
                re = args.find(d => d && d[first]);
            }
            for (const pd of p1.split(".")) if (re[pd]) re = re[pd];
            rt = re;
        }

        if (rt === undefined) rt = matched;
        if (typeof rt === "object") rt = matched;

        cnt++;
        return String(rt) || matched;
    })
}

export type Interaction = ButtonInteraction<CacheType> | SelectMenuInteraction<CacheType>;

export const initData = {
    prefix: "ㅍㄱ.",
    defaultLangauge: "ko"
};
export const database = knex({
    client: "sqlite3",
    connection: {
        filename: `${process.cwd()}/src/data/data.db`
    }
});
export const BHMoExp = knex({
    client: "sqlite3",
    connection: {
        filename: `${process.cwd()}/src/data/BHMoExp.db`
    }
});

export const Buff = {
    "refreshment": {
        ko: "🥤 상쾌함",
        en: "🥤 Refreshment"
    },
    "tiger-aura": {
        ko: "🐯 호랑이 기운",
        en: "🐯 Tiger aura"
    },
    "drunk": {
        ko: "😚 취기",
        en: "😚 Drunk"
    }
};

export const Color = {
    red: "🟥",
    orange: "🟧",
    yellow: "🟨",
    green: "🟩",
    blue: "🟦",
    purple: "🟪",
    brown: "🟫",
    black: "🔳"
};

export const facilityFeature = {
    make: ["kitchen", "cookhouse"],
    forge: ["forge"],
    compose: ["laboratory"],
    water: ["sprinkler"],
    mine: ["pit"],
    wildanimal: ["fence"]
};

export const featureDesc = {
    make: {
        ko: "🍔 이곳에서는 요리를 만들 수 있어요.",
        en: "🍔 You can cook here."
    },
    forge: {
        ko: "🔨 이곳에서는 아이템을 만들 수 있어요.",
        en: "🔨 You can make item here."
    },
    compose: {
        ko: "⚗ 이곳에서는 아이템을 합성할 수 있어요.",
        en: "⚗ You can compouned item here."
    },
    water: {
        ko: "🚿 자동으로 물을 줘요.",
        en: "🚿 Water it automatically."
    },
    mine: {
        ko: "⛏ 이곳에서는 채굴할 수 있어요.",
        en: "⛏ You can mine here."
    },
    wildanimal: {
        ko: "💥 야생동물을 잡아줘요.",
        en: "💥 Catch the wild animals."
    }
}

interface Response {
    [key: string]: {
        message: Message<boolean>;
        link?: {
            id: string;
        },
        minigame?: {
            id: string;
            path: string;
            locale: "ko" | "en";
            icon: string;
            name: string;
            steps: string;
        }
    }
};
export const res: Response = {};

interface Request { i18next: i18n; t: TFunction; }
export const req: Request = {
    i18next: undefined,
    t: undefined
};

interface data { command: Collection<string, Command>; aliases: Collection<string, string>; cooltimes: Collection<string, number>; };
export const commandData: data = {
    command: new Collection<string, Command>(),
    aliases: new Collection<string, string>(),
    cooltimes: new Collection<string, number>()
};

export function getFileLoad() {
    fs.readdirSync(process.cwd() + "/src/commands").map(dir => {
        fs.readdirSync(process.cwd() + "/src/commands/" + dir).filter(f => f.endsWith(".tsx")).map(file => {
            let command: Command = new (require(process.cwd() + "/src/commands/" + dir + "/" + file).default)();

            command.category = dir;

            commandData.command.set(command.name, command);
            command.aliases.forEach(ali => commandData.aliases.set(ali, command.name));

            Logger.info("Command Loaded")
            .next("Category").put(dir)
            .next("Name").put(command.name)
            .next("Aliases").put(command.aliases.join(" , "))
            .out();
        })
    })
}

main();

process.on("uncaughtException", (err) => {
    Logger.error("Unhandled Exception").put(err.stack).out();
})
.on("unhandledRejection", (err) => {
    Logger.error("Unhandled Rejection").put(err instanceof Error ? err.stack : err).out();
});