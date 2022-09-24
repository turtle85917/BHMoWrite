import { Client } from "discord-tsx-factory";
import { Message } from "discord.js";

import { Interaction } from "../../..";

export interface Option {
  name: string;
  description: string;

  required: boolean;
  choices?: string[];
}

export default abstract class Command {
  public name: string;
  public aliases: string[];
  public description: {
    ko: string; en: string;
  };

  public category: string;
  
  public cooltime?: boolean;
  public dev?: boolean;

  public options?: Option[];

  public interaction?: (client: Client, interaction: Interaction) => Promise<void>;
  abstract execute(client: Client, message: Message, args: string[], interaction?: Interaction): Promise<void>;
}