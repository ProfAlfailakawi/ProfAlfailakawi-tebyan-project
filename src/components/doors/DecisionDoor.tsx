import React, { useState, Suspense } from "react";
import { Loader2, Command, Users } from "lucide-react";
import { DoorShell, DoorMode } from "./DoorShell";

/**
 * باب «غرفة القرار» — أدوات الحسم الكاملة + مجلس الحكماء تحت سقف واحد.
 */
const DecisionExecutiveTab = React.lazy(() =>
  import("../tabs/DecisionExecutiveTab").then((m) => ({
    default: m.DecisionExecutiveTab,
  })),
);
const CouncilTab = React.lazy(() =>
  import("../tabs/CouncilTab").then((m) => ({ default: m.CouncilTab })),
);

const MODES: DoorMode[] = [
  { id: "tools", labelAr: "أدوات الحسم", labelEn: "Decision tools", hintAr: "ميزان الخيارات، المخاطر، الفريق الأحمر، والمزيد", hintEn: "Weigh options, risks, red team, and more", icon: Command },
  { id: "council", labelAr: "مجلس الحكماء", labelEn: "Council", hintAr: "مائدة خبراء يتناقشون حول قضيتك أمامك", hintEn: "A roundtable of experts debating your case", icon: Users },
];

const Fallback = () => (
  <div className="flex justify-center py-16">
    <Loader2 className="w-6 h-6 animate-spin text-[#8E7AAE]" />
  </div>
);

export const DecisionDoor = ({
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
    MODES.some((m) => m.id === initialMode) ? (initialMode as string) : "tools",
  );
  const common = { language, handleTabChange, initialValue } as any;

  return (
    <DoorShell
      titleAr="غرفة القرار"
      titleEn="Decision Room"
      subtitleAr="اكتب قضيتك مرة واحدة — وكل أدوات الحسم حولك"
      subtitleEn="Write your case once — every decision tool around you"
      modes={MODES}
      activeMode={mode}
      onModeChange={setMode}
      language={language}
    >
      <Suspense fallback={<Fallback />}>
        {mode === "tools" && <DecisionExecutiveTab {...common} />}
        {mode === "council" && <CouncilTab {...common} />}
      </Suspense>
    </DoorShell>
  );
};

export default DecisionDoor;
