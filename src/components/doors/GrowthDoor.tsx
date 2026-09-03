import React, { useState, Suspense } from "react";
import { Loader2, Route, Activity, ClipboardCheck } from "lucide-react";
import { DoorShell, DoorMode } from "./DoorShell";

/**
 * باب «خارطة الطريق والتقدم» — رحلة واحدة مكتملة:
 * خطّط (خارطة الطريق) ← تتبّع (رادار السلوك) ← تحقّق (الاختبارات).
 */
const RoadmapTab = React.lazy(() =>
  import("../tabs/RoadmapTab").then((m) => ({ default: m.RoadmapTab })),
);
const AnalyticsTab = React.lazy(() =>
  import("../tabs/AnalyticsTab").then((m) => ({ default: m.AnalyticsTab })),
);
const QuizTab = React.lazy(() =>
  import("../tabs/QuizTab").then((m) => ({ default: m.QuizTab })),
);

const MODES: DoorMode[] = [
  { id: "plan", labelAr: "١ · خطّط", labelEn: "1 · Plan", hintAr: "هدفك يتحول إلى مراحل واضحة قابلة للتنفيذ", hintEn: "Your goal becomes clear actionable stages", icon: Route },
  { id: "track", labelAr: "٢ · تتبّع", labelEn: "2 · Track", hintAr: "سجّل يومك ودع الرادار يقرأ مسارك", hintEn: "Log your days and let the radar read your path", icon: Activity },
  { id: "verify", labelAr: "٣ · تحقّق", labelEn: "3 · Verify", hintAr: "اختبار سريع يثبت ما تعلمته", hintEn: "A quick quiz that proves what you learned", icon: ClipboardCheck },
];

const Fallback = () => (
  <div className="flex justify-center py-16">
    <Loader2 className="w-6 h-6 animate-spin text-[#8E7AAE]" />
  </div>
);

export const GrowthDoor = ({
  language,
  handleTabChange,
  initialValue,
  initialMode,
}: {
  language: "ar" | "en";
  handleTabChange: any;
  initialValue?: string;
  initialMode?: string;
}) => {
  const [mode, setMode] = useState(
    MODES.some((m) => m.id === initialMode) ? (initialMode as string) : "plan",
  );
  const common = { language, handleTabChange, initialValue } as any;

  return (
    <DoorShell
      titleAr="خارطة الطريق والتقدم"
      titleEn="Roadmap & Progress"
      subtitleAr="من هدفك إلى خطة تمشي عليها"
      subtitleEn="From your goal to a plan you can follow"
      modes={MODES}
      activeMode={mode}
      onModeChange={setMode}
      language={language}
    >
      <Suspense fallback={<Fallback />}>
        {mode === "plan" && <RoadmapTab {...common} />}
        {mode === "track" && (
          <AnalyticsTab language={language} handleTabChange={handleTabChange} />
        )}
        {mode === "verify" && <QuizTab {...common} />}
      </Suspense>
    </DoorShell>
  );
};

export default GrowthDoor;
