"use client";

import { useState } from "react";
import { OnboardingModal } from "./OnboardingModal";
import { LanguageStep } from "./LanguageStep";
import { FeatureIntroStep } from "./FeatureIntroStep";
import { markWelcomeTourSeen } from "@/lib/storage/onboardingStorage";

interface WelcomeTourProps {
  onComplete: () => void;
}

export function WelcomeTour({ onComplete }: WelcomeTourProps) {
  const [step, setStep] = useState<0 | 1>(0);

  function finish() {
    markWelcomeTourSeen();
    onComplete();
  }

  return (
    <OnboardingModal progress={(step + 1) / 2}>
      {step === 0 ? (
        <LanguageStep onNext={() => setStep(1)} />
      ) : (
        <FeatureIntroStep onNext={finish} />
      )}
    </OnboardingModal>
  );
}
