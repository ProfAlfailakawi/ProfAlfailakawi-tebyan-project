import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpenText,
  Grid3X3,
  LibraryBig,
  Lightbulb,
  Route,
  Scale,
  Search,
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

  const isSearching = Boolean(query.trim());
  const visibleCategories = SERVICE_CATEGORIES.filter(
    (category) => !selectedCategory || category.id === selectedCategory,
  ).filter((category) =>
    TEBYAN_SERVICES.some((service) => service.category === category.id),
  );

  const renderCard = (service: (typeof TEBYAN_SERVICES)[number], idx: number) => {
    const Icon = service.icon;
    return (
      <button
        type="button"
        key={service.id}
        onClick={() => handleTabChange(service.id)}
        style={{ ["--i" as any]: Math.min(idx, 12) }}
        className="tbn-stagger tebyan-service-card group relative min-h-[132px] overflow-hidden rounded-[24px] border border-[color:var(--tb-sky)]/14 bg-white/90 p-4 text-right shadow-[0_9px_26px_rgba(24,34,49,0.045)] transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-[color:var(--tb-lilac-soft)]/28 hover:shadow-[0_15px_34px_rgba(24,34,49,0.075)] active:scale-[0.985] md:p-5"
      >
        <div className="relative flex h-full flex-col">
          <div className="flex items-start justify-between gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-[color:var(--tb-lilac-soft)]/12 bg-[color:var(--tb-c-f4f0f8)] text-[color:var(--tb-lilac-deep)] transition-colors group-hover:bg-[#8E7AAE] group-hover:text-white">
              <Icon className="h-5 w-5" strokeWidth={1.6} />
            </span>
          </div>
          <h3 className="tebyan-service-card-title mt-3 text-[15px] font-black leading-6 text-navy md:text-base">
            {getServiceLabel(service, language)}
          </h3>
          <p className="tebyan-service-card-brand mt-0.5 text-xs font-bold text-lilac">
            {getServiceBrand(service, language)}
          </p>
          <p className="tebyan-service-card-description mt-1.5 flex-1 text-sm font-medium leading-6 text-ink-mute">
            {getServiceDescription(service, language)}
          </p>
          <span className="mt-2 inline-flex items-center gap-2 self-end text-[13px] font-black text-navy">
            <span className="sr-only">{isArabic ? "افتح" : "Open"}</span>
            <ArrowLeft
              className={cn(
                "h-4 w-4 text-lilac transition-transform group-hover:-translate-x-1 rtl:group-hover:-translate-x-1",
                isArabic ? "" : "rotate-180",
              )}
            />
          </span>
        </div>
      </button>
    );
  };

  return (
    <section
      className="tebyan-service-explorer mx-auto w-full max-w-6xl px-4 pb-28 md:px-8"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <header className="tebyan-service-hero mx-auto max-w-3xl pt-2 text-center md:pt-6">
        <h1 className="tebyan-service-title font-serif text-[1.9rem] font-bold text-navy md:text-5xl">
          {isArabic ? "كل الخدمات" : "All services"}
        </h1>
        <p className="tebyan-service-intro mx-auto mt-2 max-w-2xl text-sm font-bold leading-7 text-ink-mute md:mt-4 md:text-lg md:leading-8">
          {isArabic
            ? "اختر الخدمة التي تقرّبك من هدفك، أو اكتب حاجتك بكلماتك."
            : "Pick the service that fits your goal, or type your need in your own words."}
        </p>
      </header>

      <div className="tebyan-service-search-wrap mx-auto mt-6 max-w-3xl md:mt-8">
        <label className="tebyan-service-search flex min-h-12 items-center gap-3 rounded-[18px] border border-[color:var(--tb-sky)]/18 bg-white px-4 shadow-[0_8px_24px_rgba(24,34,49,0.045)]">
          <Search className="h-5 w-5 shrink-0 text-lilac" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="tebyan-service-search-input min-w-0 flex-1 border-0 bg-transparent py-3 text-[15px] font-bold text-navy outline-none placeholder:text-ink-mute/80"
            placeholder={
              isArabic
                ? "ابحث: قرار، شرح، خطة، فكرة"
                : "Search: decision, explanation, plan, idea"
            }
            aria-label={
              isArabic ? "البحث في خدمات تبيان" : "Search Tebyan services"
            }
          />
        </label>
      </div>

      {!isSearching && (
        <div
          className="tebyan-service-filters mx-auto mt-5 flex max-w-4xl flex-wrap items-center justify-center gap-2"
          role="group"
          aria-label={isArabic ? "تصفية حسب الفئة" : "Filter by category"}
        >
          {[null, ...SERVICE_CATEGORIES.filter((c) => TEBYAN_SERVICES.some((s) => s.category === c.id)).map((c) => c.id)].map((id) => {
            const meta = id ? SERVICE_CATEGORIES.find((c) => c.id === id) : null;
            const active = selectedCategory === id;
            const Icon = id ? CATEGORY_ICONS[id] : Grid3X3;
            return (
              <button
                key={id ?? "all"}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedCategory(id)}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-black transition-colors",
                  active
                    ? "border-[color:var(--tb-lilac-soft)] bg-[#8E7AAE] text-white"
                    : "border-[color:var(--tb-sky)]/18 bg-white text-ink-mute hover:border-[color:var(--tb-lilac-soft)]/30 hover:text-[color:var(--tb-lilac-deep)]",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {id ? (isArabic ? meta!.titleAr : meta!.titleEn) : isArabic ? "الكل" : "All"}
              </button>
            );
          })}
        </div>
      )}

      <div className="tebyan-service-directory mx-auto mt-7 max-w-5xl md:mt-9">
        {isSearching ? (
          <>
            <h2 className="mb-4 text-lg font-black text-navy md:text-2xl">
              {isArabic ? `نتائج “${query.trim()}”` : `Results for “${query.trim()}”`}
            </h2>
            <div className="tebyan-service-grid grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredServices.map(renderCard)}
            </div>
          </>
        ) : (
          visibleCategories.map((category) => {
            const CategoryIcon = CATEGORY_ICONS[category.id];
            const items = filteredServices.filter((service) => service.category === category.id);
            return (
              <section key={category.id} className="mb-9" aria-labelledby={`cat-${category.id}`}>
                <div className="mb-3 flex items-start gap-3 text-right">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--tb-c-f4f0f8)] text-[color:var(--tb-lilac-deep)]">
                    <CategoryIcon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 id={`cat-${category.id}`} className="tebyan-service-group-title text-lg font-black text-navy md:text-xl">
                      {isArabic ? category.titleAr : category.titleEn}
                    </h2>
                    <p className="mt-0.5 text-sm font-semibold leading-6 text-ink-mute">
                      {isArabic ? category.descriptionAr : category.descriptionEn}
                    </p>
                  </div>
                </div>
                <div className="tebyan-service-grid grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {items.map(renderCard)}
                </div>
              </section>
            );
          })
        )}
      </div>

      {isSearching && !filteredServices.length && (
        <div className="mx-auto mt-8 max-w-3xl rounded-[24px] border border-[color:var(--tb-sky)]/14 bg-white/82 p-6 text-center">
          <h2 className="text-lg font-black text-navy">
            {isArabic ? "لا توجد نتيجة بهذه العبارة" : "No matching result"}
          </h2>
          <p className="mt-2 text-sm font-bold leading-7 text-ink-mute">
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
