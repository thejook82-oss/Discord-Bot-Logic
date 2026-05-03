import {
  type Client,
  type GuildMember,
  type GuildBan,
  type PartialGuildMember,
} from "discord.js";
import {
  logMemberJoin,
  logMemberLeave,
  logBanAdd,
  logBanRemove,
} from "../systems/logs.js";

export function registerMemberEvents(client: Client): void {
  client.on("guildMemberAdd", async (member: GuildMember) => {
    await logMemberJoin(client, member);
  });

  client.on(
    "guildMemberRemove",
    async (member: GuildMember | PartialGuildMember) => {
      await logMemberLeave(client, member);
    },
  );

  client.on("guildBanAdd", async (ban: GuildBan) => {
    await logBanAdd(client, ban);
  });

  client.on("guildBanRemove", async (ban: GuildBan) => {
    await logBanRemove(client, ban);
  });
}
