"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ChatView } from "@/components/chat/ChatView";
import { DisclaimerBar } from "@/components/chat/DisclaimerBar";
import { WelcomeTour } from "@/components/onboarding/WelcomeTour";
import { hasSeenWelcomeTour } from "@/lib/storage/onboardingStorage";
import { listConversations, deleteConversation, setActiveConversation, getStore } from "@/lib/storage/chatStorage";
import type { Conversation } from "@/lib/storage/types";

export function AppShell() {
  const [showWelcomeTour, setShowWelcomeTour] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Bumped on every "New chat" click so ChatView remounts even when it was
  // already showing onboarding (its key would otherwise stay "onboarding").
  const [newChatNonce, setNewChatNonce] = useState(0);

  useEffect(() => {
    // Intentional: this is a one-time sync from localStorage (an external
    // system unavailable during SSR) after hydration, not a derived-state
    // anti-pattern. Rendering the tour/conversations based on localStorage
    // during the initial server/hydration render would cause a hydration
    // mismatch, since the server has no access to it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setShowWelcomeTour(!hasSeenWelcomeTour());
    refreshConversations();
    // Restore whichever conversation was active before a reload, rather
    // than always dropping back to onboarding — reload should resume where
    // the student left off, not just "new chat" navigation.
    const store = getStore();
    if (store.activeConversationId && store.conversations.some((c) => c.id === store.activeConversationId)) {
      setActiveConversationId(store.activeConversationId);
    }
  }, []);

  function refreshConversations() {
    setConversations(listConversations());
  }

  function handleNewChat() {
    setActiveConversationId(null);
    setActiveConversation(null);
    setNewChatNonce((n) => n + 1);
    setSidebarOpen(false);
  }

  function handleSelectConversation(id: string) {
    setActiveConversationId(id);
    setActiveConversation(id);
    setSidebarOpen(false);
  }

  function handleConversationCreated(id: string) {
    refreshConversations();
    setActiveConversationId(id);
  }

  function handleDeleteConversation(id: string) {
    deleteConversation(id);
    refreshConversations();
    if (activeConversationId === id) setActiveConversationId(null);
  }

  // Avoid a hydration mismatch / flash: don't render conversation-dependent
  // UI until we've read localStorage on the client.
  if (!mounted) {
    return <div className="h-dvh w-full bg-[#f4f1f2]" />;
  }

  return (
    <div className="flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-[#f4f1f2]">
      <DisclaimerBar />
      <div className="relative flex min-h-0 flex-1 gap-3 p-2.5 sm:p-3 lg:gap-4 lg:p-4">
        <Sidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          mobileOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
        />
        <main className="relative min-w-0 flex-1 overflow-hidden rounded-[24px] border border-black/[0.06] bg-white shadow-[0_16px_50px_rgba(60,36,44,0.07)] lg:rounded-[30px]">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="absolute left-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-xl border border-qu-rose-border bg-white text-qu-maroon shadow-sm md:hidden"
            aria-label="Open navigation"
          >
            <span className="flex flex-col gap-1" aria-hidden="true">
              <span className="h-0.5 w-4 rounded-full bg-current" />
              <span className="h-0.5 w-4 rounded-full bg-current" />
              <span className="h-0.5 w-4 rounded-full bg-current" />
            </span>
          </button>
          <ChatView
            key={activeConversationId ?? `onboarding-${newChatNonce}`}
            activeConversationId={activeConversationId}
            onConversationCreated={handleConversationCreated}
            onOnboardingCancelled={() => {
              if (conversations.length > 0) {
                handleSelectConversation(conversations[0].id);
              }
            }}
          />
        </main>
      </div>
      {showWelcomeTour && <WelcomeTour onComplete={() => setShowWelcomeTour(false)} />}
    </div>
  );
}
