import {
  EmbedBuilder,
  type Client,
  type TextChannel,
  type GuildMember,
  type Message,
  type GuildBan,
  type PartialMessage,
  type PartialGuildMember,
} from "discord.js";
import { getGuildConfig } from "../utils/storage.js";
import { Colors } from "../utils/colors.js";

async function getLogChannel(
  client: Client,
  guildId: string,
): Promise<TextChannel | null> {
  const config = getGuildConfig(guildId);
  if (!config.logConfig?.channelId) return null;
  try {
    const channel = await client.channels.fetch(config.logConfig.channelId);
    if (channel?.isTextBased() && "send" in channel) {
      return channel as TextChannel;
    }
  } catch {
    return null;
  }
  return null;
}

export async function logTicketOpen(
  client: Client,
  guildId: string,
  userId: string,
  ticketType: string,
  channelId: string,
  ticketNumber: number,
): Promise<void> {
  const ch = await getLogChannel(client, guildId);
  if (!ch) return;
  const embed = new EmbedBuilder()
    .setColor(Colors.Success)
    .setTitle("🎫 Ticket Opened")
    .addFields(
      { name: "User", value: `<@${userId}>`, inline: true },
      { name: "Type", value: ticketType, inline: true },
      { name: "Channel", value: `<#${channelId}>`, inline: true },
      {
        name: "Ticket #",
        value: String(ticketNumber).padStart(4, "0"),
        inline: true,
      },
    )
    .setTimestamp();
  await ch.send({ embeds: [embed] }).catch(() => undefined);
}

export async function logTicketClose(
  client: Client,
  guildId: string,
  userId: string,
  closedBy: string,
  ticketType: string,
  channelName: string,
): Promise<void> {
  const ch = await getLogChannel(client, guildId);
  if (!ch) return;
  const embed = new EmbedBuilder()
    .setColor(Colors.Warning)
    .setTitle("🔒 Ticket Closed")
    .addFields(
      { name: "Ticket Owner", value: `<@${userId}>`, inline: true },
      { name: "Closed By", value: `<@${closedBy}>`, inline: true },
      { name: "Type", value: ticketType, inline: true },
      { name: "Channel", value: channelName, inline: true },
    )
    .setTimestamp();
  await ch.send({ embeds: [embed] }).catch(() => undefined);
}

export async function logTicketDelete(
  client: Client,
  guildId: string,
  userId: string,
  deletedBy: string,
  ticketType: string,
  channelName: string,
): Promise<void> {
  const ch = await getLogChannel(client, guildId);
  if (!ch) return;
  const embed = new EmbedBuilder()
    .setColor(Colors.Error)
    .setTitle("🗑️ Ticket Deleted")
    .addFields(
      { name: "Ticket Owner", value: `<@${userId}>`, inline: true },
      { name: "Deleted By", value: `<@${deletedBy}>`, inline: true },
      { name: "Type", value: ticketType, inline: true },
      { name: "Channel", value: channelName, inline: true },
    )
    .setTimestamp();
  await ch.send({ embeds: [embed] }).catch(() => undefined);
}

export async function logTicketClaim(
  client: Client,
  guildId: string,
  staffId: string,
  ticketType: string,
  channelId: string,
): Promise<void> {
  const ch = await getLogChannel(client, guildId);
  if (!ch) return;
  const embed = new EmbedBuilder()
    .setColor(Colors.Info)
    .setTitle("✋ Ticket Claimed")
    .addFields(
      { name: "Claimed By", value: `<@${staffId}>`, inline: true },
      { name: "Type", value: ticketType, inline: true },
      { name: "Channel", value: `<#${channelId}>`, inline: true },
    )
    .setTimestamp();
  await ch.send({ embeds: [embed] }).catch(() => undefined);
}

export async function logMemberJoin(
  client: Client,
  member: GuildMember,
): Promise<void> {
  const ch = await getLogChannel(client, member.guild.id);
  if (!ch) return;
  const embed = new EmbedBuilder()
    .setColor(Colors.Success)
    .setTitle("✅ Member Joined")
    .setThumbnail(member.user.displayAvatarURL())
    .addFields(
      {
        name: "User",
        value: `${member.user.tag} (<@${member.user.id}>)`,
        inline: true,
      },
      { name: "ID", value: member.user.id, inline: true },
      {
        name: "Account Created",
        value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
        inline: true,
      },
    )
    .setTimestamp();
  await ch.send({ embeds: [embed] }).catch(() => undefined);
}

export async function logMemberLeave(
  client: Client,
  member: GuildMember | PartialGuildMember,
): Promise<void> {
  const ch = await getLogChannel(client, member.guild.id);
  if (!ch) return;
  const embed = new EmbedBuilder()
    .setColor(Colors.Error)
    .setTitle("❌ Member Left")
    .setThumbnail(member.user?.displayAvatarURL() ?? null)
    .addFields(
      {
        name: "User",
        value: `${member.user?.tag ?? "Unknown"} (<@${member.user?.id ?? "?"}>)`,
        inline: true,
      },
      { name: "ID", value: member.user?.id ?? "Unknown", inline: true },
      {
        name: "Joined At",
        value: member.joinedTimestamp
          ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
          : "Unknown",
        inline: true,
      },
    )
    .setTimestamp();
  await ch.send({ embeds: [embed] }).catch(() => undefined);
}

export async function logMessageDelete(
  client: Client,
  message: Message | PartialMessage,
): Promise<void> {
  if (!message.guild || message.author?.bot) return;
  const ch = await getLogChannel(client, message.guild.id);
  if (!ch) return;
  const embed = new EmbedBuilder()
    .setColor(Colors.Error)
    .setTitle("🗑️ Message Deleted")
    .addFields(
      {
        name: "Author",
        value: message.author
          ? `${message.author.tag} (<@${message.author.id}>)`
          : "Unknown",
        inline: true,
      },
      {
        name: "Channel",
        value: `<#${message.channelId}>`,
        inline: true,
      },
    )
    .setTimestamp();
  if (message.content) {
    embed.addFields({
      name: "Content",
      value: message.content.slice(0, 1000),
      inline: false,
    });
  }
  await ch.send({ embeds: [embed] }).catch(() => undefined);
}

export async function logMessageUpdate(
  client: Client,
  oldMessage: Message | PartialMessage,
  newMessage: Message | PartialMessage,
): Promise<void> {
  if (!newMessage.guild || newMessage.author?.bot) return;
  if (oldMessage.content === newMessage.content) return;
  const ch = await getLogChannel(client, newMessage.guild.id);
  if (!ch) return;
  const embed = new EmbedBuilder()
    .setColor(Colors.Warning)
    .setTitle("✏️ Message Edited")
    .addFields(
      {
        name: "Author",
        value: newMessage.author
          ? `${newMessage.author.tag} (<@${newMessage.author.id}>)`
          : "Unknown",
        inline: true,
      },
      {
        name: "Channel",
        value: `<#${newMessage.channelId}>`,
        inline: true,
      },
      {
        name: "Jump to Message",
        value: `[Click Here](${newMessage.url})`,
        inline: true,
      },
      {
        name: "Before",
        value: (oldMessage.content ?? "Unknown").slice(0, 500),
        inline: false,
      },
      {
        name: "After",
        value: (newMessage.content ?? "Unknown").slice(0, 500),
        inline: false,
      },
    )
    .setTimestamp();
  await ch.send({ embeds: [embed] }).catch(() => undefined);
}

export async function logBanAdd(
  client: Client,
  ban: GuildBan,
): Promise<void> {
  const ch = await getLogChannel(client, ban.guild.id);
  if (!ch) return;
  const embed = new EmbedBuilder()
    .setColor(Colors.Error)
    .setTitle("🔨 Member Banned")
    .setThumbnail(ban.user.displayAvatarURL())
    .addFields(
      {
        name: "User",
        value: `${ban.user.tag} (<@${ban.user.id}>)`,
        inline: true,
      },
      { name: "ID", value: ban.user.id, inline: true },
      {
        name: "Reason",
        value: ban.reason ?? "No reason provided",
        inline: false,
      },
    )
    .setTimestamp();
  await ch.send({ embeds: [embed] }).catch(() => undefined);
}

export async function logBanRemove(
  client: Client,
  ban: GuildBan,
): Promise<void> {
  const ch = await getLogChannel(client, ban.guild.id);
  if (!ch) return;
  const embed = new EmbedBuilder()
    .setColor(Colors.Success)
    .setTitle("✅ Member Unbanned")
    .setThumbnail(ban.user.displayAvatarURL())
    .addFields(
      {
        name: "User",
        value: `${ban.user.tag} (<@${ban.user.id}>)`,
        inline: true,
      },
      { name: "ID", value: ban.user.id, inline: true },
    )
    .setTimestamp();
  await ch.send({ embeds: [embed] }).catch(() => undefined);
}
