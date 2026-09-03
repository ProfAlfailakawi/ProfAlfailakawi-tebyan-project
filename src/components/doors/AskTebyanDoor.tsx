import React, { useState, Suspense } from "react";
import { Loader2, MessageCircleQuestion, Lightbulb, Network, BookOpenText, Hourglass, ScrollText } from "lucide-react";
import { DoorShell, DoorMode } from "./DoorShell";

/**
 * باب «اسأل تبيان» — ست خدمات قديمة صارت أنماط جواب على صندوق واحد:
 * المستشار (الأساس) · بسّط لي · خريطة · قصة · عبر الزمن · تأملي
 */
const OracleTab = React.lazy(() =>
  import("../tabs/OracleTab").then((m) => ({ default: m.OracleTab })),
);
const ConceptsTab = React.lazy(() =>
  import("../tabs/ConceptsTab").then((m) => ({ default: m.ConceptsTab })),
);
const MindMapTab = React.lazy(() =>
  import("../tabs/MindMapTab").then((m) => ({ default: m.MindMapTab })),
);
const StoryTab = React.lazy(() =>
  import("../tabs/StoryTab").then((m) => ({ default: m.StoryTab })),
);
const TimeMachineTab = React.lazy(() =>
  import("../tabs/TimeMachineTab").then((m) => ({ default: m.TimeMachineTab })),
);
const TruthManuscriptTab = React.lazy(() =>
  import("../tabs/TruthManuscriptTab").then((m) => ({
    default: m.TruthManuscriptTab,
  })),
);

const MODES: DoorMode[] = [
  { id: "counsel", labelAr: "مستشار", labelEn: "Counsel", hintAr: "جواب متوازن وشامل", hintEn: "A balanced, complete answer", icon: MessageCircleQuestion },
  { id: "simplify", labelAr: "بسّط لي", labelEn: "Simplify", hintAr: "يفكك الفكرة المعقدة خطوة خطوة", hintEn: "Breaks the complex idea down step by step", icon: Lightbulb },
  { id: "map", labelAr: "خريطة", labelEn: "Map", hintAr: "يرتب الجواب خريطة متفرعة تربط الفكرة بجذورها", hintEn: "Arranges the answer as a branching map", icon: Network },
  { id: "story", labelAr: "قصة", labelEn: "Story", hintAr: "يحوّل الجواب قصة ممتعة لطفل أو طالب", hintEn: "Turns the answer into an engaging story", icon: BookOpenText },
  { id: "eras", labelAr: "عبر الزمن", labelEn: "Through time", hintAr: "يعرض الفكرة أمس واليوم وغداً", hintEn: "Shows the idea across past, present and future", icon: Hourglass },
  { id: "reflect", labelAr: "تأملي", labelEn: "Reflective", hintAr: "جواب بلغة الحكمة والسكينة", hintEn: "An answer in the language of calm wisdom", icon: ScrollText },
];

const Fallback = () => (
  <div className="flex justify-center py-16">
    <Loader2 className="w-6 h-6 animate-spin text-[#8E7AAE]" />
  </div>
);

export const AskTebyanDoor = ({
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
    MODES.some((m) => m.id === initialMode) ? (initialMode as string) : "counsel",
  );

  const common = { language, handleTabChange, initialValue } as any;

  return (
    <DoorShell
      titleAr="اسأل تبيان"
      titleEn="Ask Tebyan"
      subtitleAr="اكتب سؤالك، واختر الأسلوب الذي يريحك"
      subtitleEn="Write your question, then pick the style that suits you"
      modes={MODES}
      activeMode={mode}
      onModeChange={setMode}
      language={language}
    >
      <Suspense fallback={<Fallback />}>
        {mode === "counsel" && <OracleTab {...common} />}
        {mode === "simplify" && <ConceptsTab {...common} />}
        {mode === "map" && <MindMapTab {...common} />}
        {mode === "story" && <StoryTab {...common} />}
        {mode === "eras" && <TimeMachineTab {...common} />}
        {mode === "reflect" && <TruthManuscriptTab {...common} />}
      </Suspense>
    </DoorShell>
  );
};

export default AskTebyanDoor;
