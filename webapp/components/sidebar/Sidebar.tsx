"use client";

import type { Conversation } from "@/lib/storage/types";
import { ConversationListItem } from "./ConversationListItem";

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  mobileOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
}

export function Sidebar({
  conversations,
  activeConversationId,
  mobileOpen,
  onClose,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
}: SidebarProps) {
  return (
    <>
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-[#201a1c]/35 backdrop-blur-[2px] transition-opacity md:hidden ${
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed inset-y-2.5 left-2.5 z-50 flex w-[286px] shrink-0 flex-col overflow-hidden rounded-[24px] border border-black/[0.06] bg-[#fbf9f9] shadow-2xl transition-transform duration-300 md:static md:z-auto md:h-full md:w-[280px] md:translate-x-0 md:rounded-[26px] md:shadow-[0_12px_40px_rgba(60,36,44,0.05)] ${
          mobileOpen ? "translate-x-0" : "-translate-x-[calc(100%+24px)]"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-qu-rose-border/70 px-4 py-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-qu-rose-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/qu-logo.png" alt="" className="h-10 w-10 object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold tracking-[-0.01em] text-qu-ink">QU Schedule Planner</p>
            <p className="mt-0.5 truncate text-[11px] text-qu-muted">Qatar University · Beta</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-qu-muted hover:bg-white md:hidden"
            aria-label="Close navigation"
          >
            <span className="text-xl leading-none" aria-hidden="true">×</span>
          </button>
        </div>

        <div className="px-3 pt-3">
          <button
            type="button"
            onClick={onNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-qu-maroon px-3 py-3 text-sm font-semibold text-white shadow-[0_8px_22px_rgba(138,21,56,0.18)] transition-all hover:-translate-y-0.5 hover:bg-qu-maroon-dark"
          >
            <span className="text-lg font-light leading-none" aria-hidden="true">+</span>
            Start a new plan
          </button>
        </div>

        <div className="soft-scrollbar mt-5 flex-1 overflow-y-auto px-3 pb-4">
          {conversations.length > 0 ? (
            <>
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-qu-muted/70">
                Recent plans
              </p>
              <div className="space-y-1">
                {conversations.map((c) => (
                  <ConversationListItem
                    key={c.id}
                    conversation={c}
                    isActive={c.id === activeConversationId}
                    onSelect={() => onSelectConversation(c.id)}
                    onDelete={() => onDeleteConversation(c.id)}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="mx-1 rounded-2xl border border-dashed border-qu-rose-border bg-white/70 px-4 py-5">
              <p className="text-xs font-semibold text-qu-ink">No saved plans yet</p>
              <p className="mt-1 text-xs leading-relaxed text-qu-muted">
                Your planning conversations will appear here.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-qu-rose-border/70 p-3">
          <div className="rounded-2xl bg-[#f3e9ec] px-3.5 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-qu-maroon">Planning tip</p>
            <p className="mt-1.5 text-xs leading-relaxed text-qu-muted">
              Keep your transcript or degree audit nearby for the most accurate plan.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
