export interface StoredMessage {
  role: "user" | "assistant";
  content: string; // display text only — never a raw data URL
  hasImage?: boolean; // small indicator on the bubble
  hidden?: boolean; // setup context sent to the model but not shown as artificial chat dialogue
}

export interface Conversation {
  id: string;
  title: string;
  programFile: string;
  programLabel: string;
  messages: StoredMessage[]; // excludes system prompt (rebuilt server-side)
  createdAt: number;
  updatedAt: number;
}

export interface ChatStore {
  version: 1;
  conversations: Conversation[];
  activeConversationId: string | null;
}
