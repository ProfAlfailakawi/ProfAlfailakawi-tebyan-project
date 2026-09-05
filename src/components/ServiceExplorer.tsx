import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Grid3X3,
  LibraryBig,
  Lightbulb,
  Route,
  Scale,
  Search,
  Sparkles,
  Wrench,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  SERVICE_CATEGORIES,
  TEBYAN_SERVICES,
  getServiceBrand,
  getServiceDescription,
  getServiceLabel,
  type ServiceCategory,
} from "../constants/serviceRegistry";

type Props = {
  language: "ar" | "en";
  handleTabChange: (id: any, context?: string) => void;
};

const CATEGORY_ICONS: Record<ServiceCategory, React.ElementType> = {
  understand: BookOpenText,
  decide: Scale,
  solve: Wrench,
  create: Lightbulb,
  plan: Route,
  personal: LibraryBig,
};

export const ServiceExplorer: React.FC<Props> = ({
  language,
  handleTabChange,
}) => {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<ServiceCategory | null>(null);
  const [showAll, setShowAll] = useState(true);
  const isArabic = language === "ar";

  const filteredServices = useMemo(() => {
    // Match on individual words, not the whole phrase, and treat common Arabic
    // letter variants as equal — so "ولدي بدا يدخن" still finds the right door.
    const normalize = (value: string) =>
      value
        .toLowerCase()
        .replace(/[إأآا]/g, "ا")
        .replace(/[ىي]/g, "ي")
        .replace(/ة/g, "ه")
        .replace(/[\u064B-\u0652]/g, "");
    const words = normalize(query)
      .split(/[\s،,.؟?!]+/)
      .filter((word) => word.length >= 3);
    const inCategory = TEBYAN_SERVICES.filter(
      (service) => !selectedCategory || service.category === selectedCategory,
    );
    if (!words.length) return inCategory;

    // Score by how well each door matches, then rank — a partial match should
    // reorder the list, never empty it.
    // Compare whole words, not raw substrings: "بدا" must not match inside
    // "الإبداع". Tolerate Arabic possessive endings ("طفلي" ↔ "طفل").
    const tokens = (value: string) =>
      normalize(value)
        .split(/[^\u0621-\u064Aa-z0-9]+/)
        .filter(Boolean);
    const hitScore = (field: string, word: string) => {
      const list = tokens(field);
      if (list.includes(word)) return 2;
      if (
        list.some(
          (item) =>
            (item.length >= 3 && item.startsWith(word)) ||
            (item.length >= 3 && word.startsWith(item)),
        )
      )
        return 1;
      return 0;
    };
    const scored = inCategory.map((service) => {
      const name = [
        service.titleAr,
        service.titleEn,
        service.brandAr,
        service.brandEn,
      ].join(" ");
      const keywords = [...service.keywordsAr, ...service.keywordsEn].join(" ");
      const body = [service.descriptionAr, service.descriptionEn].join(" ");
      let score = 0;
      for (const word of words) {
        score += hitScore(keywords, word) * 3;
        score += hitScore(name, word) * 3;
        score += hitScore(body, word);
      }
      return { service, score };
    });
    const hits = scored.filter((item) => item.score > 0);
    if (!hits.length) return inCategory;
    return hits.sort((a, b) => b.score - a.score).map((item) => item.service);
  }, [query, selectedCategory]);

  const isDirectoryView =
    Boolean(query.trim()) || Boolean(selectedCategory) || showAll;
  const selectedCategoryMeta = selectedCategory
    ? SERVICE_CATEGORIES.find((category) => category.id === selectedCategory)
    : null;

  const resetDirectory = () => {
    setQuery("");
    setSelectedCategory(null);
    setShowAll(false);
  };

  return (
    <section
      className="tebyan-service-explorer mx-auto w-full max-w-6xl px-4 pb-28 md:px-8"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <header className="tebyan-service-hero mx-auto max-w-3xl pt-2 text-center md:pt-6">
        <div className="tebyan-service-kicker mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-[#8E7AAE]/14 bg-white/78 px-3.5 py-2 text-xs font-black text-[#6E5F8E] shadow-sm">
          <Sparkles className="h-4 w-4" />
          {isArabic ? "ابدأ من حاجتك" : "Start from your need"}
        </div>
        <h1 className="tebyan-service-title text-[1.75rem] font-black tracking-tight text-[#182231] md:text-5xl">
          {isArabic ? "وش تحتاج تسوي؟" : "What do you need to do?"}
        </h1>
        <p className="tebyan-service-intro mx-auto mt-2 max-w-2xl text-sm font-bold leading-7 text-[#64788D] md:mt-4 md:text-lg md:leading-8">
          {isArabic
            ? "اختر ما يقربك من هدفك، أو اكتب حاجتك بكلماتك."
            : "Pick what fits your goal, or type your need in your own words."}
        </p>
      </header>

      <div className="tebyan-service-search-wrap mx-auto mt-6 max-w-3xl md:mt-8">
        <label className="tebyan-service-search flex min-h-12 items-center gap-3 rounded-[18px] border border-[#8FA9C7]/18 bg-white px-4 shadow-[0_8px_24px_rgba(24,34,49,0.045)]">
          <Search className="h-5 w-5 shrink-0 text-[#8E7AAE]" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (event.target.value.trim()) setShowAll(false);
            }}
            className="tebyan-service-search-input min-w-0 flex-1 border-0 bg-transparent py-3 text-[15px] font-bold text-[#182231] outline-none placeholder:text-[#7C8796]/60"
            placeholder={
              isArabic
                ? "اكتب حاجتك: قرار، شرح، خطة، فكرة…"
                : "Type your need: decision, explanation, plan, idea…"
            }
            aria-label={
              isArabic ? "البحث في خدمات تبيان" : "Search Tebyan services"
            }
          />
        </label>
      </div>

      {!isDirectoryView && (
        <div className="tebyan-needs-grid mx-auto mt-7 grid max-w-4xl grid-cols-2 gap-3 md:mt-9 md:grid-cols-3">
          {SERVICE_CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICONS[category.id];
            const count = TEBYAN_SERVICES.filter(
              (service) => service.category === category.id,
            ).length;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className="tebyan-need-card group min-h-[142px] rounded-[24px] border border-[#8FA9C7]/14 bg-white/90 p-4 text-right shadow-[0_10px_28px_rgba(24,34,49,0.045)] transition-[transform,border-color,box-shadow] duration-150 hover:-translate-y-0.5 hover:border-[#8E7AAE]/28 hover:shadow-[0_15px_34px_rgba(24,34,49,0.075)] active:scale-[0.985] md:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-[#8E7AAE]/12 bg-[#F4F0F8] text-[#6E5F8E] transition-colors group-hover:bg-[#8E7AAE] group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="rounded-full bg-[#F4F6F8] px-2.5 py-1 text-[11px] font-black text-[#7C8796]">
                    {isArabic ? `${count} خيارات` : `${count} options`}
                  </span>
                </div>
                <h2 className="mt-3 text-[15px] font-black leading-6 text-[#182231] md:text-base">
                  {isArabic ? category.titleAr : category.titleEn}
                </h2>
                <p className="mt-1 text-[13px] font-bold leading-6 text-[#64788D]">
                  {isArabic ? category.descriptionAr : category.descriptionEn}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {!isDirectoryView && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#8FA9C7]/18 bg-white px-4 text-sm font-black text-[#64788D] shadow-sm transition-colors hover:border-[#8E7AAE]/30 hover:text-[#6E5F8E]"
          >
            <Grid3X3 className="h-4 w-4" />
            {isArabic ? "عرض جميع الخدمات" : "Show all services"}
          </button>
        </div>
      )}

      {isDirectoryView && (
        <div className="tebyan-service-directory mx-auto mt-7 max-w-5xl md:mt-9">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="text-right">
              <p className="text-[11px] font-black text-[#8E7AAE]">
                {selectedCategoryMeta
                  ? isArabic
                    ? selectedCategoryMeta.titleAr
                    : selectedCategoryMeta.titleEn
                  : isArabic
                    ? "المناسب لك"
                    : "Suggested for you"}
              </p>
              <h2 className="mt-0.5 text-lg font-black text-[#182231] md:text-2xl">
                {query.trim()
                  ? isArabic
                    ? `نتائج “${query.trim()}”`
                    : `Results for “${query.trim()}”`
                  : selectedCategoryMeta
                    ? isArabic
                      ? selectedCategoryMeta.descriptionAr
                      : selectedCategoryMeta.descriptionEn
                    : isArabic
                      ? "اختر ما يناسبك"
                      : "Choose what fits"}
              </h2>
            </div>
            <button
              type="button"
              onClick={resetDirectory}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#8FA9C7]/18 bg-white px-4 text-sm font-black text-[#64788D] shadow-sm"
            >
              {isArabic ? (
                <ArrowRight className="h-4 w-4" />
              ) : (
                <ArrowLeft className="h-4 w-4" />
              )}
              {isArabic ? "الحاجات الرئيسية" : "Main needs"}
            </button>
          </div>

          <div className="tebyan-service-grid grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((service) => {
              const Icon = service.icon;
              return (
                <button
                  type="button"
                  key={service.id}
                  onClick={() => handleTabChange(service.id)}
                  className="tebyan-service-card group min-h-[164px] rounded-[24px] border border-[#8FA9C7]/14 bg-white/90 p-4 text-right shadow-[0_9px_26px_rgba(24,34,49,0.045)] transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-[#8E7AAE]/28 hover:shadow-[0_15px_34px_rgba(24,34,49,0.075)] active:scale-[0.985] md:p-5"
                >
                  <div className="flex h-full flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] border border-[#8E7AAE]/12 bg-[#F4F0F8] text-[#6E5F8E] transition-colors group-hover:bg-[#8E7AAE] group-hover:text-white">
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      {service.featured && (
                        <span className="rounded-full bg-[#EEF4F1] px-2.5 py-1 text-[10px] font-black text-[#4D766B]">
                          {isArabic ? "مناسب للبداية" : "Good start"}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-3 text-[15px] font-black leading-6 text-[#182231] md:text-base">
                      {getServiceBrand(service, language)}
                    </h3>
                    <p className="mt-0.5 text-[11px] font-black text-[#8E7AAE]">
                      {getServiceLabel(service, language)}
                    </p>
                    <p className="mt-2 flex-1 text-[13px] font-bold leading-6 text-[#64788D]">
                      {getServiceDescription(service, language)}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-2 text-[13px] font-black text-[#182231]">
                      {isArabic ? "افتح" : "Open"}
                      <ArrowLeft
                        className={cn(
                          "h-4 w-4 text-[#8E7AAE]",
                          isArabic ? "" : "rotate-180",
                        )}
                      />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isDirectoryView && !filteredServices.length && (
        <div className="mx-auto mt-8 max-w-3xl rounded-[24px] border border-[#8FA9C7]/14 bg-white/82 p-6 text-center">
          <h2 className="text-lg font-black text-[#182231]">
            {isArabic ? "ما لقينا نتيجة بهذه العبارة" : "No matching result"}
          </h2>
          <p className="mt-2 text-sm font-bold leading-7 text-[#64788D]">
            {isArabic
              ? "جرّب كلمة أبسط مثل: قرار، شرح، خطة أو فكرة."
              : "Try a simpler word such as decision, explain, plan, or idea."}
          </p>
        </div>
      )}
    </section>
  );
};

export default ServiceExplorer;
