import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  CategoryChannel,
  TextChannel,
  type ChatInputCommandInteraction,
} from "discord.js";
import { sendTicketPanel } from "../systems/tickets.js";
import { getGuildConfig, saveGuildConfig } from "../utils/storage.js";

export const data = new SlashCommandBuilder()
  .setName("setup-tickets")
  .setDescription("Setup the ticket system panel.")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addChannelOption((opt) =>
    opt
      .setName("category")
      .setDescription("The category where ticket channels will be created.")
      .addChannelTypes(ChannelType.GuildCategory)
      .setRequired(false),
  )
  .addChannelOption((opt) =>
    opt
      .setName("panel-channel")
      .setDescription("The channel where the ticket panel will be posted.")
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false),
  )
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
  const categoryOption = interaction.options.getChannel("category") as CategoryChannel | null;
  const panelChannelOption = interaction.options.getChannel("panel-channel") as TextChannel | null;
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

  // Update category if provided
  if (categoryOption) {
    config.ticketConfig.categoryId = categoryOption.id;
  }

  // Update panel channel if provided
  if (panelChannelOption) {
    config.ticketConfig.setupChannelId = panelChannelOption.id;
  } else if (!config.ticketConfig.setupChannelId) {
    config.ticketConfig.setupChannelId = interaction.channelId;
  }

  // Update roles
  if (!config.ticketConfig.roles) config.ticketConfig.roles = {};
  if (staffRole) config.ticketConfig.roles.staff = staffRole.id;
  if (eventRole) config.ticketConfig.roles.event = eventRole.id;
  if (divisionRole) config.ticketConfig.roles.division = divisionRole.id;
  if (adminRole) config.ticketConfig.roles.admin = adminRole.id;

  saveGuildConfig(interaction.guildId!, config);

  await sendTicketPanel(interaction);
}
