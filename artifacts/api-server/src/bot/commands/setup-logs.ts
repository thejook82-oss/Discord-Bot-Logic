import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { getGuildConfig, saveGuildConfig } from "../utils/storage.js";
import { Colors } from "../utils/colors.js";

export const data = new SlashCommandBuilder()
  .setName("setup-logs")
  .setDescription("Set the channel where bot logs will be sent.")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addChannelOption((opt) =>
    opt
      .setName("channel")
      .setDescription("The channel to send logs to.")
      .setRequired(true),
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const channel = interaction.options.getChannel("channel", true);
  const config = getGuildConfig(interaction.guildId!);

  config.logConfig = { channelId: channel.id };
  saveGuildConfig(interaction.guildId!, config);

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(Colors.Success)
        .setTitle("✅ Logs Channel Set")
        .setDescription(`All bot logs will now be sent to <#${channel.id}>.`)
        .addFields(
          {
            name: "Logged Events",
            value:
              "• Ticket open / close / claim / delete\n• Member join / leave\n• Message delete / edit\n• Member ban / unban",
          },
        )
        .setTimestamp()
        .setFooter({ text: "MA • Log System" }),
    ],
    ephemeral: true,
  });
}
