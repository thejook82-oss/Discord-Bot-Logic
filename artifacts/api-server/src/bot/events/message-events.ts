import {
  type Client,
  type Message,
  type PartialMessage,
} from "discord.js";
import { logMessageDelete, logMessageUpdate } from "../systems/logs.js";

export function registerMessageEvents(client: Client): void {
  client.on(
    "messageDelete",
    async (message: Message | PartialMessage) => {
      await logMessageDelete(client, message);
    },
  );

  client.on(
    "messageUpdate",
    async (
      oldMessage: Message | PartialMessage,
      newMessage: Message | PartialMessage,
    ) => {
      await logMessageUpdate(client, oldMessage, newMessage);
    },
  );
}
