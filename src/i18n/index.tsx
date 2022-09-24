import i18next from "i18next";

import en from "./locales/en.json";
import ko from "./locales/ko.json";

interface Init { locales: { [lang: string]: object }; options: { [key: string]: any } };
export const i18nInit: Init = {
    locales: { ko, en },
    options: { resources: { en, ko }, lng: "ko", fallbackLng: ["ko"], debug: true, saveMissing: true, nsSeparator: ".", keySeparator: true, interpolation: { escapeValue: false }, preload: ["ko"] }
}