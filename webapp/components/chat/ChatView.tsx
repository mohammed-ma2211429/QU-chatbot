"use client";

import { useState } from "react";
import { StudyInfoStep } from "@/components/onboarding/StudyInfoStep";
import { CoursePickerModal } from "@/components/onboarding/CoursePicker/CoursePickerModal";
import { getProgramDataByFile } from "@/lib/program-data/loadProgramData";
import { OPENING_MESSAGE } from "@/lib/prompt/basePrompt";
import { sendChat } from "@/lib/api/sendChat";
import { createConversation, appendMessages, getConversation } from "@/lib/storage/chatStorage";
import { getConversationDisplayTitle } from "@/lib/storage/conversationTitles";
import type { StoredMessage } from "@/lib/storage/types";
import { MessageList } from "./MessageList";
import { ChatInput, type PendingImage } from "./ChatInput";
import { LandingPrompt } from "./LandingPrompt";
import { NewChatLanding } from "./NewChatLanding";

type OnboardingStage = "welcome" | "study-info" | "course-picker" | "landing" | "loading";

interface ChatViewProps {
  activeConversationId: string | null;
  onConversationCreated: (id: string) => void;
  onOnboardingCancelled: () => void;
}

/**
 * The parent (AppShell) renders this with `key={activeConversationId}`, so
 * React fully remounts it whenever the active conversation changes — that's
 * what resets all local state below, instead of a useEffect watching the id
 * prop and manually resetting state (an anti-pattern: syncing state to a
 * changing prop belongs in the key/remount mechanism, not an effect).
 */
export function ChatView({ activeConversationId, onConversationCreated, onOnboardingCancelled }: ChatViewProps) {
  const initialConversation = activeConversationId ? getConversation(activeConversationId) : undefined;

  const [stage, setStage] = useState<OnboardingStage>("welcome");
  const [selectedProgramFile, setSelectedProgramFile] = useState<string | null>(null);
  const [selectedProgramLabel, setSelectedProgramLabel] = useState<string>("");
  const [completedCodes, setCompletedCodes] = useState<string[]>([]);
  const [initialQuestion, setInitialQuestion] = useState<string>("");

  const [programFile] = useState<string | null>(initialConversation?.programFile ?? null);
  const [messages, setMessages] = useState<StoredMessage[]>(initialConversation?.messages ?? []);
  const [isSending, setIsSending] = useState(false);

  // --- Onboarding: study info step ---
  function handleStudyInfoFinish(programFile: string, programLabel: string) {
    setSelectedProgramFile(programFile);
    setSelectedProgramLabel(programLabel);
    setStage("course-picker");
  }

  // --- Onboarding: course picker -> defer the actual API call until the
  // student asks their first real question on the landing screen, so
  // "New chat" lands on a blank prompt rather than an immediate reply.
  function handleCoursePickerFinish(codes: string[]) {
    setCompletedCodes(codes);
    if (initialQuestion) {
      void submitFirstQuestion(initialQuestion, codes);
    } else {
      setStage("landing");
    }
  }

  async function submitFirstQuestion(userQuestion: string, codes: string[]) {
    if (!selectedProgramFile) return;
    setStage("loading");

    const completedText =
      codes.length === 0
        ? "I haven't completed any courses yet."
        : `I've completed: ${codes.join(", ")}`;

    try {
      const result = await sendChat({
        messages: [
          { role: "user", content: selectedProgramLabel },
          { role: "assistant", content: `Got it — ${selectedProgramLabel}.` },
          { role: "user", content: completedText },
        ],
        programFile: selectedProgramFile,
        newMessage: userQuestion,
      });

      const seededMessages: StoredMessage[] = [
        { role: "assistant", content: OPENING_MESSAGE, hidden: true },
        { role: "user", content: selectedProgramLabel, hidden: true },
        { role: "assistant", content: `Got it — ${selectedProgramLabel}.`, hidden: true },
        { role: "user", content: completedText, hidden: true },
        { role: "user", content: userQuestion },
        { role: "assistant", content: result.reply },
      ];

      const conversation = createConversation(
        selectedProgramFile,
        selectedProgramLabel,
        seededMessages,
        userQuestion
      );
      onConversationCreated(conversation.id);
    } catch (e) {
      console.error(e);
      // Fall back to the landing screen so the student can retry rather
      // than getting stuck on a silent loading state.
      setStage("landing");
    }
  }

  function handleLandingSubmit(userQuestion: string) {
    void submitFirstQuestion(userQuestion, completedCodes);
  }

  // --- Active conversation: sending a new message ---
  async function handleSend(text: string, image: PendingImage | null) {
    if (!activeConversationId || !programFile) return;
    const displayText = text + (image ? " 📎 [attached image]" : "");
    const userMessage: StoredMessage = { role: "user", content: displayText, hasImage: !!image };

    const historyForRequest = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, userMessage]);
    appendMessages(activeConversationId, [userMessage]);
    setIsSending(true);

    try {
      const result = await sendChat({
        messages: historyForRequest,
        programFile,
        newMessage: text,
        image: image ? { dataUrl: image.dataUrl, name: image.name } : null,
      });
      const assistantMessage: StoredMessage = { role: "assistant", content: result.reply };
      setMessages((prev) => [...prev, assistantMessage]);
      appendMessages(activeConversationId, [assistantMessage]);
    } catch (e) {
      console.error(e);
      const errorMessage: StoredMessage = {
        role: "assistant",
        content: "Sorry, something went wrong reaching the assistant. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
      appendMessages(activeConversationId, [errorMessage]);
    } finally {
      setIsSending(false);
    }
  }

  // --- Active conversation view ---
  if (activeConversationId && programFile) {
    const displayTitle = initialConversation
      ? getConversationDisplayTitle(
          initialConversation.title,
          initialConversation.programLabel
        )
      : "Next-term plan";

    return (
      <div className="flex h-full min-h-0 flex-col bg-[#f6f0f2]">
        <div className="flex min-h-[68px] shrink-0 items-center border-b border-[#decbd1] bg-[#efe2e6] px-16 sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-qu-maroon">
              {initialConversation?.programLabel ?? "Planning session"}
            </p>
            <p className="mt-0.5 line-clamp-1 text-sm font-semibold text-qu-ink">
              {displayTitle}
            </p>
          </div>
          <div className="ml-auto hidden items-center gap-2 rounded-full border border-white/60 bg-white/45 px-3 py-1.5 text-[11px] font-medium text-qu-muted sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4d9563]" />
            Context saved
          </div>
        </div>
        <MessageList messages={messages} isLoading={isSending} />
        <ChatInput onSend={handleSend} disabled={isSending} />
      </div>
    );
  }

  // --- Onboarding flow ---
  const programData = selectedProgramFile ? getProgramDataByFile(selectedProgramFile) : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {stage === "welcome" && (
        <NewChatLanding
          onStart={(question) => {
            setInitialQuestion(question);
            setStage("study-info");
          }}
        />
      )}
      {stage === "study-info" && (
        <StudyInfoStep
          onFinish={handleStudyInfoFinish}
          onClose={() => {
            setStage("welcome");
            onOnboardingCancelled();
          }}
        />
      )}
      {stage === "course-picker" && programData && (
        <CoursePickerModal
          programData={programData}
          programLabel={selectedProgramLabel}
          onFinish={handleCoursePickerFinish}
          onClose={() => {
            setStage("welcome");
            onOnboardingCancelled();
          }}
        />
      )}
      {stage === "landing" && (
        <LandingPrompt programLabel={selectedProgramLabel} onSubmit={handleLandingSubmit} />
      )}
      {stage === "loading" && (
        <div className="qu-pattern flex flex-1 flex-col items-center justify-center gap-4 bg-[#fffdfd]">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-qu-rose-border bg-white shadow-lg">
            <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-qu-rose-border border-t-qu-maroon" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-qu-ink">Getting your course map ready…</p>
            <p className="mt-1 text-xs text-qu-muted">This should only take a moment.</p>
          </div>
        </div>
      )}
    </div>
  );
}
