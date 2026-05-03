import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
} from "discord.js";
import { addUserToTicket, removeUserFromTicket } from "../systems/tickets.js";

export const data = new SlashCommandBuilder()
  .setName("ticket")
  .setDescription("Manage the current ticket.")
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
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const sub = interaction.options.getSubcommand();
  if (sub === "add") {
    await addUserToTicket(interaction);
  } else if (sub === "remove") {
    await removeUserFromTicket(interaction);
  }
}
