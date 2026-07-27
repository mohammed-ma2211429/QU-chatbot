import type { ChatStore, Conversation, StoredMessage } from "./types";
import { deriveConversationTitle } from "./conversationTitles";

const KEY = "qu-schedule-planner:chats";

function emptyStore(): ChatStore {
  return { version: 1, conversations: [], activeConversationId: null };
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getStore(): ChatStore {
  if (!isBrowser()) return emptyStore();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as ChatStore;
    if (parsed.version !== 1 || !Array.isArray(parsed.conversations)) return emptyStore();
    return parsed;
  } catch {
    return emptyStore();
  }
}

export function saveStore(store: ChatStore): { ok: boolean; error?: string } {
  if (!isBrowser()) return { ok: false, error: "Not in a browser context" };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
    return { ok: true };
  } catch (e) {
    if (e instanceof DOMException && (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED")) {
      return { ok: false, error: "Storage full — delete an old conversation to free up space." };
    }
    return { ok: false, error: "Could not save conversation." };
  }
}

export function listConversations(): Conversation[] {
  return [...getStore().conversations].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getConversation(id: string): Conversation | undefined {
  return getStore().conversations.find((c) => c.id === id);
}

export function createConversation(
  programFile: string,
  programLabel: string,
  initialMessages: StoredMessage[],
  initialQuestion: string
): Conversation {
  const now = Date.now();
  const conversation: Conversation = {
    id: crypto.randomUUID(),
    title: deriveConversationTitle(initialQuestion),
    programFile,
    programLabel,
    messages: initialMessages,
    createdAt: now,
    updatedAt: now,
  };
  const store = getStore();
  store.conversations.push(conversation);
  store.activeConversationId = conversation.id;
  saveStore(store);
  return conversation;
}

export function appendMessages(id: string, messages: StoredMessage[]): void {
  const store = getStore();
  const conversation = store.conversations.find((c) => c.id === id);
  if (!conversation) return;
  conversation.messages.push(...messages);
  conversation.updatedAt = Date.now();
  saveStore(store);
}

export function deleteConversation(id: string): void {
  const store = getStore();
  store.conversations = store.conversations.filter((c) => c.id !== id);
  if (store.activeConversationId === id) store.activeConversationId = null;
  saveStore(store);
}

export function setActiveConversation(id: string | null): void {
  const store = getStore();
  store.activeConversationId = id;
  saveStore(store);
}
