import {
  REST,
  Routes,
  type Client,
} from "discord.js";
import { logger } from "../../lib/logger.js";
import { data as setupTickets } from "../commands/setup-tickets.js";
import { data as setupLogs } from "../commands/setup-logs.js";
import { data as ticket } from "../commands/ticket.js";

const commands = [setupTickets, setupLogs, ticket].map((c) => c.toJSON());

export async function handleReady(client: Client): Promise<void> {
  logger.info(`Bot logged in as ${client.user?.tag}`);

  const token = process.env["DISCORD_TOKEN"];
  if (!token || !client.user) return;

  const rest = new REST().setToken(token);

  try {
    // Clear global commands to avoid duplicates
    await rest.put(Routes.applicationCommands(client.user.id), { body: [] });

    // Register guild-specific commands (instant update)
    logger.info("Registering slash commands per guild...");
    const guilds = client.guilds.cache;
    for (const [guildId] of guilds) {
      await rest.put(
        Routes.applicationGuildCommands(client.user.id, guildId),
        { body: commands },
      );
      logger.info(`Registered ${commands.length} slash commands in guild ${guildId}.`);
    }
  } catch (err) {
    logger.error({ err }, "Failed to register slash commands");
  }
}
