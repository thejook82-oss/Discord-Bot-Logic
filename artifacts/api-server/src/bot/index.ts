import {
  Client,
  GatewayIntentBits,
  Partials,
} from "discord.js";
import { logger } from "../lib/logger.js";
import { loadData } from "./utils/storage.js";
import { handleReady } from "./events/ready.js";
import { handleInteractionCreate } from "./events/interaction-create.js";
import { registerMemberEvents } from "./events/member-events.js";
import { registerMessageEvents } from "./events/message-events.js";
import { registerChannelEvents } from "./events/channel-events.js";

export function startBot(): void {
  const token = process.env["DISCORD_TOKEN"];
  if (!token) {
    logger.error("DISCORD_TOKEN is not set. Bot will not start.");
    return;
  }

  loadData();

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildModeration,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
    ],
    partials: [
      Partials.Message,
      Partials.Channel,
      Partials.GuildMember,
    ],
  });

  client.once("clientReady", () => handleReady(client));

  client.on("interactionCreate", (interaction) =>
    handleInteractionCreate(interaction),
  );

  registerMemberEvents(client);
  registerMessageEvents(client);
  registerChannelEvents(client);

  client.on("error", (err) => {
    logger.error({ err }, "Discord client error");
  });

  client.login(token).catch((err) => {
    logger.error({ err }, "Failed to login to Discord");
  });

  logger.info("Discord bot starting...");
}
