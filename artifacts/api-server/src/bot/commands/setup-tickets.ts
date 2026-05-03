import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
} from "discord.js";
import { sendTicketPanel } from "../systems/tickets.js";
import { getGuildConfig, saveGuildConfig } from "../utils/storage.js";

export const data = new SlashCommandBuilder()
  .setName("setup-tickets")
  .setDescription("Setup the ticket system panel in this channel.")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addRoleOption((opt) =>
    opt
      .setName("support-role")
      .setDescription("Support role — mentioned in all tickets.")
      .setRequired(false),
  )
  .addRoleOption((opt) =>
    opt
      .setName("staff-role")
      .setDescription("Staff role — mentioned in all tickets alongside support.")
      .setRequired(false),
  )
  .addRoleOption((opt) =>
    opt
      .setName("admin-role")
      .setDescription("Admin role — mentioned in Administrator tickets.")
      .setRequired(false),
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const supportRole = interaction.options.getRole("support-role");
  const staffRole = interaction.options.getRole("staff-role");
  const adminRole = interaction.options.getRole("admin-role");

  const config = getGuildConfig(interaction.guildId!);
  if (!config.ticketConfig) {
    config.ticketConfig = {
      setupChannelId: interaction.channelId,
      categoryId: "",
      ticketCounter: 0,
    };
  }
  if (supportRole) config.ticketConfig.supportRoleId = supportRole.id;
  if (staffRole) config.ticketConfig.staffRoleId = staffRole.id;
  if (adminRole) config.ticketConfig.adminRoleId = adminRole.id;
  saveGuildConfig(interaction.guildId!, config);

  await sendTicketPanel(interaction);
}
