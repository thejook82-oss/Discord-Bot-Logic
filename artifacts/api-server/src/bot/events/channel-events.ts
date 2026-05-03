import { type Client, type NonThreadGuildBasedChannel } from "discord.js";
import { getGuildConfig, saveGuildConfig } from "../utils/storage.js";
import { logger } from "../../lib/logger.js";

export function registerChannelEvents(client: Client): void {
  client.on(
    "channelDelete",
    (channel: NonThreadGuildBasedChannel) => {
      if (!channel.guildId) return;

      const config = getGuildConfig(channel.guildId);
      if (!config.tickets?.[channel.id]) return;

      // Channel was manually deleted — clean up ticket record
      logger.info(
        { channelId: channel.id },
        "Ticket channel deleted manually, cleaning up record",
      );

      delete config.tickets[channel.id];
      saveGuildConfig(channel.guildId, config);
    },
  );
}
