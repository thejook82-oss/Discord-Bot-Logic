import { type Interaction } from "discord.js";
import { logger } from "../../lib/logger.js";
import { execute as executeSetupTickets } from "../commands/setup-tickets.js";
import { execute as executeSetupLogs } from "../commands/setup-logs.js";
import { execute as executeTicket } from "../commands/ticket.js";
import { execute as executeClear } from "../commands/clear.js";
import {
  handleOpenButton,
  handleInfoButton,
  handleTypeSelect,
  handleReasonModal,
  handleCloseButton,
  handleClaimButton,
  handleOptionsButton,
  handleReopenButton,
  handleDeleteButton,
  handleAddUserPrompt,
  handleRemoveUserPrompt,
  handleAddUserModal,
  handleRemoveUserModal,
} from "../systems/tickets.js";

const commandHandlers: Record<
  string,
  (i: Parameters<typeof executeSetupTickets>[0]) => Promise<void>
> = {
  "setup-tickets": executeSetupTickets,
  "setup-logs": executeSetupLogs,
  ticket: executeTicket,
  clear: executeClear,
};

export async function handleInteractionCreate(
  interaction: Interaction,
): Promise<void> {
  try {
    if (interaction.isChatInputCommand()) {
      const handler = commandHandlers[interaction.commandName];
      if (handler) {
        await handler(interaction);
      }
      return;
    }

    if (interaction.isButton()) {
      const id = interaction.customId;
      if (id === "ticket_open_button") return handleOpenButton(interaction);
      if (id === "ticket_info_button") return handleInfoButton(interaction);
      if (id === "ticket_close") return handleCloseButton(interaction);
      if (id === "ticket_claim") return handleClaimButton(interaction);
      if (id === "ticket_options") return handleOptionsButton(interaction);
      if (id === "ticket_reopen") return handleReopenButton(interaction);
      if (id === "ticket_delete") return handleDeleteButton(interaction);
      if (id === "ticket_add_user_prompt")
        return handleAddUserPrompt(interaction);
      if (id === "ticket_remove_user_prompt")
        return handleRemoveUserPrompt(interaction);
      return;
    }

    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === "ticket_type_select") {
        return handleTypeSelect(interaction);
      }
      return;
    }

    if (interaction.isModalSubmit()) {
      const id = interaction.customId;
      if (id.startsWith("ticket_reason_modal:"))
        return handleReasonModal(interaction);
      if (id === "ticket_add_user_modal") return handleAddUserModal(interaction);
      if (id === "ticket_remove_user_modal")
        return handleRemoveUserModal(interaction);
      return;
    }
  } catch (err) {
    logger.error({ err }, "Error handling interaction");
    try {
      const msg = { content: "❌ An error occurred.", ephemeral: true };
      if (
        "replied" in interaction &&
        "deferred" in interaction &&
        !interaction.replied &&
        !interaction.deferred
      ) {
        if ("reply" in interaction && typeof interaction.reply === "function") {
          await (interaction as { reply: (m: typeof msg) => Promise<void> }).reply(msg);
        }
      }
    } catch {
      // ignore
    }
  }
}
