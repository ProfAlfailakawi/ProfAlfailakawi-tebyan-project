import React, { useState, Suspense } from "react";
import { Loader2, LibraryBig, TicketPercent, Mail } from "lucide-react";
import { DoorShell, DoorMode } from "./DoorShell";

/**
 * باب «ركني» — مساحتك الشخصية: محفوظاتك، نقاطك، وتواصلك — في مكان واحد.
 */
const MyLibraryTab = React.lazy(() => import("../tabs/MyLibraryTab"));
const LoyaltyTab = React.lazy(() =>
  import("../tabs/LoyaltyTab").then((m) => ({ default: m.LoyaltyTab })),
);
const ContactTab = React.lazy(() =>
  import("../tabs/ContactTab").then((m) => ({ default: m.ContactTab })),
);

const MODES: DoorMode[] = [
  { id: "library", labelAr: "مكتبتي", labelEn: "My library", hintAr: "كل ما حفظته من أبواب تبيان", hintEn: "Everything you saved across Tebyan", icon: LibraryBig },
  { id: "points", labelAr: "نقاطي", labelEn: "My points", hintAr: "تقدمك ومكافآتك", hintEn: "Your progress and rewards", icon: TicketPercent },
  { id: "contact", labelAr: "تواصل معنا", labelEn: "Contact us", hintAr: "نقرأ كل رسالة بعناية", hintEn: "We read every message with care", icon: Mail },
];

const Fallback = () => (
  <div className="flex justify-center py-16">
    <Loader2 className="w-6 h-6 animate-spin text-[#8E7AAE]" />
  </div>
);

export const RukniDoor = ({
  language,
  handleTabChange,
  initialMode,
}: {
  language: "ar" | "en";
  handleTabChange: any;
  initialMode?: string;
}) => {
  const [mode, setMode] = useState(
    MODES.some((m) => m.id === initialMode) ? (initialMode as string) : "library",
  );

  return (
    <DoorShell
      titleAr="ركني"
      titleEn="My Corner"
      subtitleAr="محفوظاتك ونقاطك في مكان واحد"
      subtitleEn="Your saves and points in one place"
      modes={MODES}
      activeMode={mode}
      onModeChange={setMode}
      language={language}
    >
      <Suspense fallback={<Fallback />}>
        {mode === "library" && (
          <MyLibraryTab language={language} handleTabChange={handleTabChange} />
        )}
        {mode === "points" && (
          <LoyaltyTab language={language} handleTabChange={handleTabChange} />
        )}
        {mode === "contact" && <ContactTab language={language} />}
      </Suspense>
    </DoorShell>
  );
};

export default RukniDoor;
