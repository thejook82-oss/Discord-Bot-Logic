export const Colors = {
  Primary: 0xf4900c,
  Success: 0x57f287,
  Error: 0xed4245,
  Info: 0x5865f2,
  Warning: 0xfee75c,
  Dark: 0x2b2d31,
  Closed: 0x99aab5,
} as const;

export const TicketTypeConfig: Record<
  string,
  { label: string; emoji: string; description: string; color: number }
> = {
  support: {
    label: "Support Ticket",
    emoji: "🎫",
    description: "Open a ticket for general support.",
    color: Colors.Primary,
  },
  event: {
    label: "Event Ticket",
    emoji: "🎉",
    description: "Open a ticket for event-related questions.",
    color: Colors.Info,
  },
  division: {
    label: "Division Ticket",
    emoji: "🏢",
    description: "Open a ticket for division support.",
    color: Colors.Warning,
  },
  administrator: {
    label: "Administrator Ticket",
    emoji: "👑",
    description: "Open a ticket to speak with an administrator.",
    color: Colors.Error,
  },
  report: {
    label: "Report Ticket",
    emoji: "🚨",
    description: "Open a ticket to report a member.",
    color: 0x992d22,
  },
};
