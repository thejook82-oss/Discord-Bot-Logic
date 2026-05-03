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
      .setName("staff-role")
      .setDescription("Staff role — for Support & Report tickets.")
      .setRequired(false),
  )
  .addRoleOption((opt) =>
    opt
      .setName("event-role")
      .setDescription("Event role — for Event tickets.")
      .setRequired(false),
  )
  .addRoleOption((opt) =>
    opt
      .setName("division-role")
      .setDescription("Division role — for Division tickets.")
      .setRequired(false),
  )
  .addRoleOption((opt) =>
    opt
      .setName("admin-role")
      .setDescription("Admin role — for Administrator tickets.")
      .setRequired(false),
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const staffRole = interaction.options.getRole("staff-role");
  const eventRole = interaction.options.getRole("event-role");
  const divisionRole = interaction.options.getRole("division-role");
  const adminRole = interaction.options.getRole("admin-role");

  const config = getGuildConfig(interaction.guildId!);
  if (!config.ticketConfig) {
    config.ticketConfig = {
      setupChannelId: interaction.channelId,
      categoryId: "",
      roles: {},
      ticketCounter: 0,
    };
  }
  if (!config.ticketConfig.roles) config.ticketConfig.roles = {};
  if (staffRole) config.ticketConfig.roles.staff = staffRole.id;
  if (eventRole) config.ticketConfig.roles.event = eventRole.id;
  if (divisionRole) config.ticketConfig.roles.division = divisionRole.id;
  if (adminRole) config.ticketConfig.roles.admin = adminRole.id;
  saveGuildConfig(interaction.guildId!, config);

  await sendTicketPanel(interaction);
}
