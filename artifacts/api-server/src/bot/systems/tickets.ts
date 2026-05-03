import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
  type ButtonInteraction,
  type StringSelectMenuInteraction,
  type ModalSubmitInteraction,
  type Guild,
  type TextChannel,
  type CategoryChannel,
} from "discord.js";
import {
  getGuildConfig,
  saveGuildConfig,
  type TicketData,
} from "../utils/storage.js";
import { Colors, TicketTypeConfig } from "../utils/colors.js";
import {
  logTicketOpen,
  logTicketClose,
  logTicketDelete,
  logTicketClaim,
} from "./logs.js";

export async function sendTicketPanel(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild!;
  const config = getGuildConfig(guild.id);

  let categoryId = config.ticketConfig?.categoryId;
  let panelChannelId = config.ticketConfig?.setupChannelId;

  // Create category if it doesn't exist
  if (!categoryId) {
    const category = await guild.channels.create({
      name: "🎫 Support",
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.SendMessages],
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
        },
      ],
    });
    categoryId = category.id;
  }

  // Create or reuse the ticket panel channel inside the category
  let panelChannel: TextChannel | null = null;

  if (panelChannelId) {
    try {
      const existing = await guild.channels.fetch(panelChannelId);
      if (existing?.isTextBased()) panelChannel = existing as TextChannel;
    } catch {
      panelChannel = null;
    }
  }

  if (!panelChannel) {
    panelChannel = await guild.channels.create({
      name: "🎫・open-ticket",
      type: ChannelType.GuildText,
      parent: categoryId,
      topic: "Open a support ticket here.",
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
          deny: [PermissionFlagsBits.SendMessages],
        },
        {
          id: guild.members.me!.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageMessages,
          ],
        },
      ],
    }) as TextChannel;
    panelChannelId = panelChannel.id;
  }

  config.ticketConfig = {
    setupChannelId: panelChannelId,
    categoryId,
    ticketCounter: config.ticketConfig?.ticketCounter ?? 0,
    supportRoleId: config.ticketConfig?.supportRoleId,
    adminRoleId: config.ticketConfig?.adminRoleId,
  };
  saveGuildConfig(guild.id, config);

  const iconURL = guild.iconURL({ size: 512 }) ?? undefined;

  const embed = new EmbedBuilder()
    .setColor(Colors.Primary)
    .setTitle("🎫 Ticket System")
    .setDescription(
      "Welcome to the ticket system!\nHere you can open a ticket and get help from the staff team.\n\n**Please read the rules before opening a ticket.**",
    )
    .addFields({
      name: "📌 Important Notes",
      value:
        "• Do not abuse the ticket system.\n• Be respectful to staff members.\n• Provide a clear reason when opening a ticket.\n• Tickets are logged for review.",
      inline: false,
    })
    .setTimestamp();

  if (iconURL) embed.setImage(iconURL);

  const openRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_open_button")
      .setLabel("Open Ticket")
      .setEmoji("🎫")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("ticket_info_button")
      .setLabel("Some Information")
      .setStyle(ButtonStyle.Secondary),
  );

  await panelChannel.send({ embeds: [embed], components: [openRow] });

  await interaction.editReply({
    content: `✅ Ticket system is ready!\n📁 Category: **🎫 Support** has been created.\n🎫 Panel sent to <#${panelChannel.id}>`,
  });
}

export async function handleOpenButton(
  interaction: ButtonInteraction,
): Promise<void> {
  const config = getGuildConfig(interaction.guildId!);
  const existingTicket = Object.entries(config.tickets ?? {}).find(
    ([, t]) => t.userId === interaction.user.id && !t.closed,
  );

  if (existingTicket) {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Error)
          .setDescription(
            `❌ You already have an open ticket: <#${existingTicket[0]}>`,
          ),
      ],
      ephemeral: true,
    });
    return;
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId("ticket_type_select")
    .setPlaceholder("Please select a type to open a ticket.")
    .addOptions(
      Object.entries(TicketTypeConfig).map(([value, cfg]) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(cfg.label)
          .setValue(value)
          .setDescription(cfg.description)
          .setEmoji(cfg.emoji),
      ),
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    select,
  );

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(Colors.Primary)
        .setDescription("**Select the type of support you need:**"),
    ],
    components: [row],
    ephemeral: true,
  });
}

export async function handleInfoButton(
  interaction: ButtonInteraction,
): Promise<void> {
  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(Colors.Info)
        .setTitle("ℹ️ Ticket System Information")
        .addFields(
          {
            name: "🎫 Support Ticket",
            value: "General support for any issue.",
            inline: false,
          },
          {
            name: "🎉 Event Ticket",
            value: "Questions or issues related to server events.",
            inline: false,
          },
          {
            name: "🏢 Division Ticket",
            value: "Support for a specific division.",
            inline: false,
          },
          {
            name: "👑 Administrator Ticket",
            value: "Speak directly with an administrator.",
            inline: false,
          },
          {
            name: "🚨 Report Ticket",
            value: "Report a member for rule violations.",
            inline: false,
          },
        )
        .setFooter({ text: "MA • Ticket System" }),
    ],
    ephemeral: true,
  });
}

export async function handleTypeSelect(
  interaction: StringSelectMenuInteraction,
): Promise<void> {
  const type = interaction.values[0]!;
  const modal = new ModalBuilder()
    .setCustomId(`ticket_reason_modal:${type}`)
    .setTitle("Open a Ticket");

  const reasonInput = new TextInputBuilder()
    .setCustomId("ticket_reason_input")
    .setLabel("Reason for opening this ticket")
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder("Please describe your issue in detail...")
    .setMinLength(10)
    .setMaxLength(500)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput),
  );

  await interaction.showModal(modal);
}

export async function handleReasonModal(
  interaction: ModalSubmitInteraction,
): Promise<void> {
  await interaction.deferReply({ ephemeral: true });

  const type = interaction.customId.split(":")[1]!;
  const reason = interaction.fields.getTextInputValue("ticket_reason_input");
  const cfg = TicketTypeConfig[type]!;
  const guild = interaction.guild!;
  const guildConfig = getGuildConfig(guild.id);

  if (!guildConfig.ticketConfig) {
    await interaction.editReply({
      content:
        "❌ Ticket system is not configured. Ask an admin to run `/setup-tickets`.",
    });
    return;
  }

  const counter = (guildConfig.ticketConfig.ticketCounter ?? 0) + 1;
  guildConfig.ticketConfig.ticketCounter = counter;
  const ticketNumber = String(counter).padStart(4, "0");
  const channelName = `ticket-${ticketNumber}`;

  let category: CategoryChannel | undefined;
  try {
    const ch = await guild.channels.fetch(guildConfig.ticketConfig.categoryId);
    if (ch?.type === ChannelType.GuildCategory) {
      category = ch as CategoryChannel;
    }
  } catch {
    //
  }

  const roles = guildConfig.ticketConfig.roles ?? {};

  // Determine which role gets access + mention per ticket type
  // support  → @Staff can see + owner, mention @Staff + owner
  // event    → @Event can see + owner, mention @Event only
  // division → @Clan Division can see + owner, mention @Clan Division + owner
  // report   → @Staff can see + owner, mention @Staff only
  // administrator → @Admin can see + owner, mention @Admin only
  const typeRoleMap: Record<string, { roleId?: string; mentionOwner: boolean; mentionRole: boolean }> = {
    support:       { roleId: roles.staff,    mentionOwner: true,  mentionRole: true  },
    event:         { roleId: roles.event,    mentionOwner: false, mentionRole: true  },
    division:      { roleId: roles.division, mentionOwner: true,  mentionRole: true  },
    report:        { roleId: roles.staff,    mentionOwner: false, mentionRole: true  },
    administrator: { roleId: roles.admin,    mentionOwner: false, mentionRole: true  },
  };

  const typeRole = typeRoleMap[type] ?? { mentionOwner: true, mentionRole: false };

  const staffPerms = [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.ReadMessageHistory,
    PermissionFlagsBits.ManageMessages,
    PermissionFlagsBits.AttachFiles,
  ];

  const permissionOverwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: interaction.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
      ],
    },
    {
      id: guild.members.me!.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageMessages,
      ],
    },
  ];

  // Only the specific role for this ticket type can see it
  if (typeRole.roleId) {
    permissionOverwrites.push({ id: typeRole.roleId, allow: staffPerms });
  }

  const ticketChannel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: category?.id,
    permissionOverwrites,
    topic: `Ticket opened by ${interaction.user.tag} | Type: ${cfg.label}`,
  });

  // Build mention string
  const mentions: string[] = [];
  if (typeRole.mentionRole && typeRole.roleId) {
    mentions.push(`<@&${typeRole.roleId}>`);
  }
  if (typeRole.mentionOwner) {
    mentions.push(`<@${interaction.user.id}>`);
  }

  const ticketEmbed = new EmbedBuilder()
    .setColor(cfg.color)
    .setTitle(`${cfg.emoji} Ticket Created — ${cfg.label}`)
    .setDescription(
      "Please wait for the staff to assist you.\nTo save time, please describe your issue clearly.",
    )
    .addFields(
      { name: "Opened By", value: `<@${interaction.user.id}>`, inline: true },
      { name: "Type", value: cfg.label, inline: true },
      { name: "Ticket #", value: ticketNumber, inline: true },
      { name: "Reason", value: reason, inline: false },
    )
    .setTimestamp()
    .setFooter({ text: "MA • Ticket System" });

  const guild_icon = guild.iconURL({ size: 64 });
  if (guild_icon) ticketEmbed.setThumbnail(guild_icon);

  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_close")
      .setLabel("Close")
      .setEmoji("🔒")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("ticket_claim")
      .setLabel("Claim")
      .setEmoji("✋")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("ticket_options")
      .setLabel("Options")
      .setEmoji("⚙️")
      .setStyle(ButtonStyle.Secondary),
  );

  await ticketChannel.send({
    content: mentions.length > 0 ? mentions.join(" ") : `<@${interaction.user.id}>`,
    embeds: [ticketEmbed],
    components: [buttonRow],
  });

  if (!guildConfig.tickets) guildConfig.tickets = {};
  const ticketData: TicketData = {
    userId: interaction.user.id,
    type,
    typeName: cfg.label,
    number: counter,
    claimed: false,
    claimedBy: null,
    closed: false,
    reason,
    createdAt: new Date().toISOString(),
  };
  guildConfig.tickets[ticketChannel.id] = ticketData;
  saveGuildConfig(guild.id, guildConfig);

  await logTicketOpen(
    interaction.client,
    guild.id,
    interaction.user.id,
    cfg.label,
    ticketChannel.id,
    counter,
  );

  await interaction.editReply({
    content: `✅ Your ticket has been created: <#${ticketChannel.id}>`,
  });
}

export async function handleCloseButton(
  interaction: ButtonInteraction,
): Promise<void> {
  const guildConfig = getGuildConfig(interaction.guildId!);
  const ticket = guildConfig.tickets?.[interaction.channelId];

  if (!ticket) {
    await interaction.reply({
      content: "❌ This channel is not a ticket.",
      ephemeral: true,
    });
    return;
  }

  if (ticket.closed) {
    await interaction.reply({
      content: "❌ This ticket is already closed.",
      ephemeral: true,
    });
    return;
  }

  ticket.closed = true;
  saveGuildConfig(interaction.guildId!, guildConfig);

  const channel = interaction.channel as TextChannel;

  await channel.permissionOverwrites.edit(ticket.userId, {
    ViewChannel: false,
  });

  const closedEmbed = new EmbedBuilder()
    .setColor(Colors.Closed)
    .setTitle("🔒 Ticket Closed")
    .setDescription(`This ticket has been closed by <@${interaction.user.id}>`)
    .addFields(
      { name: "Ticket Owner", value: `<@${ticket.userId}>`, inline: true },
      { name: "Type", value: ticket.typeName, inline: true },
      { name: "Reason", value: ticket.reason, inline: false },
    )
    .setTimestamp()
    .setFooter({ text: "MA • Ticket System" });

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_reopen")
      .setLabel("Reopen")
      .setEmoji("🔓")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("ticket_delete")
      .setLabel("Delete Ticket")
      .setEmoji("🗑️")
      .setStyle(ButtonStyle.Danger),
  );

  await interaction.reply({ embeds: [closedEmbed], components: [actionRow] });

  await logTicketClose(
    interaction.client,
    interaction.guildId!,
    ticket.userId,
    interaction.user.id,
    ticket.typeName,
    channel.name,
  );
}

export async function handleReopenButton(
  interaction: ButtonInteraction,
): Promise<void> {
  const guildConfig = getGuildConfig(interaction.guildId!);
  const ticket = guildConfig.tickets?.[interaction.channelId];

  if (!ticket) {
    await interaction.reply({
      content: "❌ This channel is not a ticket.",
      ephemeral: true,
    });
    return;
  }

  ticket.closed = false;
  saveGuildConfig(interaction.guildId!, guildConfig);

  const channel = interaction.channel as TextChannel;
  await channel.permissionOverwrites.edit(ticket.userId, {
    ViewChannel: true,
    SendMessages: true,
    ReadMessageHistory: true,
    AttachFiles: true,
  });

  const reopenEmbed = new EmbedBuilder()
    .setColor(Colors.Success)
    .setTitle("🔓 Ticket Reopened")
    .setDescription(`This ticket has been reopened by <@${interaction.user.id}>`)
    .setTimestamp()
    .setFooter({ text: "MA • Ticket System" });

  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_close")
      .setLabel("Close")
      .setEmoji("🔒")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("ticket_claim")
      .setLabel("Claim")
      .setEmoji("✋")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("ticket_options")
      .setLabel("Options")
      .setEmoji("⚙️")
      .setStyle(ButtonStyle.Secondary),
  );

  await interaction.reply({ embeds: [reopenEmbed], components: [buttonRow] });
}

export async function handleDeleteButton(
  interaction: ButtonInteraction,
): Promise<void> {
  const guildConfig = getGuildConfig(interaction.guildId!);
  const ticket = guildConfig.tickets?.[interaction.channelId];

  if (!ticket) {
    await interaction.reply({
      content: "❌ This channel is not a ticket.",
      ephemeral: true,
    });
    return;
  }

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(Colors.Error)
        .setDescription("🗑️ Deleting ticket in 5 seconds..."),
    ],
  });

  const channelName = (interaction.channel as TextChannel).name;

  await logTicketDelete(
    interaction.client,
    interaction.guildId!,
    ticket.userId,
    interaction.user.id,
    ticket.typeName,
    channelName,
  );

  delete guildConfig.tickets[interaction.channelId];
  saveGuildConfig(interaction.guildId!, guildConfig);

  setTimeout(() => {
    interaction.channel?.delete().catch(() => undefined);
  }, 5000);
}

export async function handleClaimButton(
  interaction: ButtonInteraction,
): Promise<void> {
  const guildConfig = getGuildConfig(interaction.guildId!);
  const ticket = guildConfig.tickets?.[interaction.channelId];

  if (!ticket) {
    await interaction.reply({
      content: "❌ This channel is not a ticket.",
      ephemeral: true,
    });
    return;
  }

  if (ticket.claimed) {
    await interaction.reply({
      content: `❌ This ticket has already been claimed by <@${ticket.claimedBy}>`,
      ephemeral: true,
    });
    return;
  }

  ticket.claimed = true;
  ticket.claimedBy = interaction.user.id;
  saveGuildConfig(interaction.guildId!, guildConfig);

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(Colors.Info)
        .setDescription(
          `✋ This ticket has been claimed by <@${interaction.user.id}>.\nThey will assist you shortly.`,
        )
        .setTimestamp(),
    ],
  });

  await logTicketClaim(
    interaction.client,
    interaction.guildId!,
    interaction.user.id,
    ticket.typeName,
    interaction.channelId,
  );
}

export async function handleOptionsButton(
  interaction: ButtonInteraction,
): Promise<void> {
  const guildConfig = getGuildConfig(interaction.guildId!);
  const ticket = guildConfig.tickets?.[interaction.channelId];

  if (!ticket) {
    await interaction.reply({
      content: "❌ This channel is not a ticket.",
      ephemeral: true,
    });
    return;
  }

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_add_user_prompt")
      .setLabel("Add User")
      .setEmoji("➕")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("ticket_remove_user_prompt")
      .setLabel("Remove User")
      .setEmoji("➖")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("ticket_delete")
      .setLabel("Delete Ticket")
      .setEmoji("🗑️")
      .setStyle(ButtonStyle.Danger),
  );

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(Colors.Primary)
        .setTitle("⚙️ Ticket Options")
        .setDescription("Choose an action for this ticket:"),
    ],
    components: [row],
    ephemeral: true,
  });
}

export async function addUserToTicket(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const guildConfig = getGuildConfig(interaction.guildId!);
  const ticket = guildConfig.tickets?.[interaction.channelId];

  if (!ticket) {
    await interaction.reply({
      content: "❌ This command can only be used inside a ticket.",
      ephemeral: true,
    });
    return;
  }

  const user = interaction.options.getUser("user", true);
  const channel = interaction.channel as TextChannel;

  await channel.permissionOverwrites.edit(user.id, {
    ViewChannel: true,
    SendMessages: true,
    ReadMessageHistory: true,
  });

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(Colors.Success)
        .setDescription(`✅ <@${user.id}> has been added to the ticket.`),
    ],
  });
}

export async function removeUserFromTicket(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const guildConfig = getGuildConfig(interaction.guildId!);
  const ticket = guildConfig.tickets?.[interaction.channelId];

  if (!ticket) {
    await interaction.reply({
      content: "❌ This command can only be used inside a ticket.",
      ephemeral: true,
    });
    return;
  }

  const user = interaction.options.getUser("user", true);

  if (user.id === ticket.userId) {
    await interaction.reply({
      content: "❌ You cannot remove the ticket owner.",
      ephemeral: true,
    });
    return;
  }

  const channel = interaction.channel as TextChannel;
  await channel.permissionOverwrites.delete(user.id);

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(Colors.Error)
        .setDescription(`✅ <@${user.id}> has been removed from the ticket.`),
    ],
  });
}

export async function handleAddUserPrompt(
  interaction: ButtonInteraction,
): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId("ticket_add_user_modal")
    .setTitle("Add User to Ticket");
  const input = new TextInputBuilder()
    .setCustomId("user_id_input")
    .setLabel("User ID")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Enter the user's Discord ID")
    .setRequired(true);
  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(input),
  );
  await interaction.showModal(modal);
}

export async function handleRemoveUserPrompt(
  interaction: ButtonInteraction,
): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId("ticket_remove_user_modal")
    .setTitle("Remove User from Ticket");
  const input = new TextInputBuilder()
    .setCustomId("user_id_input")
    .setLabel("User ID")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Enter the user's Discord ID")
    .setRequired(true);
  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(input),
  );
  await interaction.showModal(modal);
}

export async function handleAddUserModal(
  interaction: ModalSubmitInteraction,
): Promise<void> {
  const userId = interaction.fields.getTextInputValue("user_id_input").trim();
  const channel = interaction.channel as TextChannel;
  try {
    const member = await interaction.guild!.members.fetch(userId);
    await channel.permissionOverwrites.edit(member.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
    });
    await interaction.reply({
      content: `✅ <@${member.id}> has been added to the ticket.`,
      ephemeral: true,
    });
  } catch {
    await interaction.reply({
      content: "❌ Could not find a user with that ID.",
      ephemeral: true,
    });
  }
}

export async function handleRemoveUserModal(
  interaction: ModalSubmitInteraction,
): Promise<void> {
  const userId = interaction.fields.getTextInputValue("user_id_input").trim();
  const guildConfig = getGuildConfig(interaction.guildId!);
  const ticket = guildConfig.tickets?.[interaction.channelId];
  if (ticket?.userId === userId) {
    await interaction.reply({
      content: "❌ Cannot remove the ticket owner.",
      ephemeral: true,
    });
    return;
  }
  const channel = interaction.channel as TextChannel;
  try {
    await channel.permissionOverwrites.delete(userId);
    await interaction.reply({
      content: `✅ <@${userId}> has been removed from the ticket.`,
      ephemeral: true,
    });
  } catch {
    await interaction.reply({
      content: "❌ Could not remove that user.",
      ephemeral: true,
    });
  }
}
