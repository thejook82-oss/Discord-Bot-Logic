import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  type ChatInputCommandInteraction,
  type TextChannel,
} from "discord.js";
import { Colors } from "../utils/colors.js";

export const data = new SlashCommandBuilder()
  .setName("clear")
  .setDescription("Delete a number of messages from this channel.")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addIntegerOption((opt) =>
    opt
      .setName("amount")
      .setDescription("Number of messages to delete (1–100).")
      .setMinValue(1)
      .setMaxValue(100)
      .setRequired(true),
  )
  .addUserOption((opt) =>
    opt
      .setName("user")
      .setDescription("Only delete messages from this user.")
      .setRequired(false),
  )
  .addStringOption((opt) =>
    opt
      .setName("reason")
      .setDescription("Reason for clearing messages.")
      .setRequired(false),
  )
  .addChannelOption((opt) =>
    opt
      .setName("channel")
      .setDescription("Channel to clear (defaults to current channel).")
      .setRequired(false),
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const amount = interaction.options.getInteger("amount", true);
  const targetUser = interaction.options.getUser("user");
  const reason = interaction.options.getString("reason") ?? "No reason provided";
  const targetChannel = (interaction.options.getChannel("channel") ?? interaction.channel) as TextChannel;

  if (!targetChannel?.isTextBased()) {
    await interaction.reply({ content: "❌ Invalid channel.", ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    let deleted = 0;

    if (targetUser) {
      // Fetch messages and filter by user
      const messages = await targetChannel.messages.fetch({ limit: 100 });
      const userMessages = messages
        .filter((m) => m.author.id === targetUser.id)
        .first(amount);

      if (userMessages.length === 0) {
        await interaction.editReply({
          content: `❌ No recent messages found from ${targetUser.tag}.`,
        });
        return;
      }

      const ids = userMessages.map((m) => m.id);
      await targetChannel.bulkDelete(ids, true);
      deleted = ids.length;
    } else {
      const messages = await targetChannel.messages.fetch({ limit: amount });
      await targetChannel.bulkDelete(messages, true);
      deleted = messages.size;
    }

    const embed = new EmbedBuilder()
      .setColor(Colors.Success)
      .setTitle("🗑️ Messages Cleared")
      .addFields(
        { name: "Channel", value: `<#${targetChannel.id}>`, inline: true },
        { name: "Deleted", value: `${deleted} messages`, inline: true },
        { name: "By", value: `${interaction.user}`, inline: true },
        { name: "Reason", value: reason, inline: false },
      )
      .setTimestamp();

    if (targetUser) {
      embed.addFields({ name: "Filtered User", value: `${targetUser}`, inline: true });
    }

    await interaction.editReply({ embeds: [embed] });
  } catch {
    await interaction.editReply({
      content: "❌ Failed to delete messages. Messages older than 14 days cannot be bulk deleted.",
    });
  }
}
