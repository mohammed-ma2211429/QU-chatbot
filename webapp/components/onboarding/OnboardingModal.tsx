"use client";

import { CloseButton } from "@/components/ui/CloseButton";

interface OnboardingModalProps {
  children: React.ReactNode;
  progress: number; // 0-1
  onClose?: () => void;
}

export function OnboardingModal({ children, progress, onClose }: OnboardingModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#201a1c]/40 p-3 backdrop-blur-[5px] sm:p-5">
      <div className="relative max-h-[94dvh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-white/50 bg-[#fffdfd] p-6 shadow-[0_30px_90px_rgba(35,20,25,0.25)] sm:p-8">
        {onClose && <CloseButton onClick={onClose} className="absolute right-4 top-4" />}
        <div className="mb-7 flex items-center gap-3 pr-10">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#eee5e8]">
            <div
              className="h-full rounded-full bg-qu-maroon transition-all duration-300"
              style={{ width: `${Math.max(8, progress * 100)}%` }}
            />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-qu-muted">
            {Math.round(progress * 100)}%
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
