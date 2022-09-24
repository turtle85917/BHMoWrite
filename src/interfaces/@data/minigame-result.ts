export type stepName = {
    "♨": {
        ko: "끓이기",
        en: "Boiling"
    },
    "🫖": {
        ko: "붓기",
        en: "Pour"
    },
    "🍤": {
        ko: "튀기기",
        en: "Fry"
    },
    "🥅": {
        ko: "거르기",
        en: "Filtering"
    },
    "🤔": {
        ko: "기다리기",
        en: "Wait"
    },
    "🔥": {
        ko: "굽기",
        en: "Roast"
    },
    "💫": {
        ko: "휘젓기",
        en: "Stir"
    },
    "🔆": {
        ko: "말리기",
        en: "Dry"
    },
    "🗜": {
        ko: "누르기",
        en: "Pressing"
    },
    "✂": {
        ko: "자르기",
        en: "Cut"
    },
    "🦯": {
        ko: "조각하기",
        en: "Sculpt"
    }
}

export interface Steps {
    icon: keyof stepName;
    score: number;
    count: number;
}

export interface minigameResult {
    guildIdExternal: string;
    id: string;
    path: string;
    locale: string;
    icon: string;
    name: string;
    score: string;
    steps: string;
}