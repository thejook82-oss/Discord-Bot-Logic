import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const DATA_DIR = join(process.cwd(), "data");
const DATA_FILE = join(DATA_DIR, "bot-data.json");

export interface TicketData {
  userId: string;
  type: string;
  typeName: string;
  number: number;
  claimed: boolean;
  claimedBy: string | null;
  closed: boolean;
  reason: string;
  createdAt: string;
}

export interface GuildConfig {
  ticketConfig?: {
    setupChannelId: string;
    categoryId: string;
    supportRoleId?: string;
    adminRoleId?: string;
    ticketCounter: number;
  };
  logConfig?: {
    channelId: string;
  };
  tickets: Record<string, TicketData>;
}

interface BotData {
  guilds: Record<string, GuildConfig>;
}

let data: BotData = { guilds: {} };

export function loadData(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  if (existsSync(DATA_FILE)) {
    try {
      data = JSON.parse(readFileSync(DATA_FILE, "utf-8")) as BotData;
    } catch {
      data = { guilds: {} };
    }
  }
}

export function saveData(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export function getGuildConfig(guildId: string): GuildConfig {
  if (!data.guilds[guildId]) {
    data.guilds[guildId] = { tickets: {} };
  }
  return data.guilds[guildId]!;
}

export function saveGuildConfig(guildId: string, config: GuildConfig): void {
  data.guilds[guildId] = config;
  saveData();
}
