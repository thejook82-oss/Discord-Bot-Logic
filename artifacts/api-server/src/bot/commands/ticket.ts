import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { addUserToTicket, removeUserFromTicket } from "../systems/tickets.js";
import { getGuildConfig, saveGuildConfig } from "../utils/storage.js";
import { Colors } from "../utils/colors.js";

export const data = new SlashCommandBuilder()
  .setName("ticket")
  .setDescription("Manage tickets.")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .addSubcommand((sub) =>
    sub
      .setName("add")
      .setDescription("Add a user to this ticket.")
      .addUserOption((opt) =>
        opt.setName("user").setDescription("User to add.").setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("remove")
      .setDescription("Remove a user from this ticket.")
      .addUserOption((opt) =>
        opt
          .setName("user")
          .setDescription("User to remove.")
          .setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("reset")
      .setDescription("Reset a user's ticket — allows them to open a new one.")
      .addUserOption((opt) =>
        opt
          .setName("user")
          .setDescription("The user to reset.")
          .setRequired(true),
      ),
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const sub = interaction.options.getSubcommand();

  if (sub === "add") {
    await addUserToTicket(interaction);
  } else if (sub === "remove") {
    await removeUserFromTicket(interaction);
  } else if (sub === "reset") {
    const user = interaction.options.getUser("user", true);
    const config = getGuildConfig(interaction.guildId!);

    const openTicket = Object.entries(config.tickets ?? {}).find(
      ([, t]) => t.userId === user.id && !t.closed,
    );

    if (!openTicket) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Warning)
            .setDescription(`⚠️ <@${user.id}> doesn't have an open ticket to reset.`),
        ],
        ephemeral: true,
      });
      return;
    }

    // Mark ticket as closed / remove it
    const [channelId] = openTicket;
    delete config.tickets[channelId];
    saveGuildConfig(interaction.guildId!, config);

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Success)
          .setTitle("✅ Ticket Reset")
          .setDescription(`<@${user.id}>'s ticket has been reset. They can now open a new ticket.`)
          .setTimestamp(),
      ],
      ephemeral: true,
    });
  }
}
