import { Fragment, createElement } from "discord-tsx-factory";
import { req, res } from "../..";

export function getConfirmPresetComponents(customId: string) {
    return (
        <row>
            <button
                type={2}
                style={3}
                customId={customId.format({ action: "yes" })}
            >
                {req.t("g.component.confirm.yes")}
            </button>
            <button
                type={2}
                style={2}
                customId={customId.format({ action: "no" })}
            >
                {req.t("g.component.confirm.no")}
            </button>
        </row>
    )
}