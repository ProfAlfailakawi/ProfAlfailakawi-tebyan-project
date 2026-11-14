import React from "react";
import { ArrowLeft, Lightbulb, type LucideIcon } from "lucide-react";
import {
  SERVICE_CATEGORIES,
  TEBYAN_SERVICES,
  getServiceLabel,
  getServiceBrand,
  getServiceDescription,
} from "../constants/serviceRegistry";

/**
 * الصفحة المقابلة في وضع الكتاب (الشاشة الداخلية لـ iPhone Duo مفتوحًا، ~669×867 و~951×585).
 *
 * الشاشة الداخلية تُعرض كصفحتين متقابلتين بينهما كعب. الصفحة اليمنى (الأولى في RTL)
 * تحمل المهمة نفسها؛ وهذه الصفحة تحمل سياقها: الفهرس في الرئيسية، وفي الخدمات بطاقة
 * الخدمة وشرحها وأخواتها من الباب نفسه. كل النصوص هنا موجودة أصلًا (سجل الخدمات
 * وشرح الصفحة)، فلا نص جديد ولا منطق جديد.
 *
 * تُرسم دائمًا ويخفيها CSS خارج مقاسات الكتاب (src/index.css: «Book spread»)، فلا
 * يُعاد تركيب أي مكوّن عند الطي والفتح. العناوين role="heading" لا h2، لأن قواعد
 * main h2 القديمة (‎!important) تفرض عليها مقاس عناوين المحتوى.
 */

type HelpDetails = { title: string; intro: string; steps: string[]; tip: string };

interface BookContextPageProps {
  activeTab: string;
  language: "ar" | "en";
  help: HelpDetails;
  onOpen: (tab: string) => void;
}

const BookContextPage: React.FC<BookContextPageProps> = ({ activeTab, language, help, onOpen }) => {
  const isAr = language === "ar";
  const service = TEBYAN_SERVICES.find((s) => s.id === activeTab);
  const Arrow = (
    <ArrowLeft className={isAr ? "tebyan-book-arrow" : "tebyan-book-arrow rotate-180"} aria-hidden="true" />
  );

  if (activeTab === "home") {
    return (
      <aside className="tebyan-book-aside" aria-label={isAr ? "كل الخدمات" : "All services"}>
        <div className="tebyan-book-aside__inner">
          <p className="tebyan-book-kicker">{isAr ? "كل الخدمات" : "All services"}</p>
          {SERVICE_CATEGORIES.map((cat) => {
            const items = TEBYAN_SERVICES.filter((s) => s.category === cat.id);
            if (!items.length) return null;
            return (
              <section key={cat.id} className="tebyan-book-index">
                <p role="heading" aria-level={2} className="tebyan-book-index__title">{isAr ? cat.titleAr : cat.titleEn}</p>
                <ul>
                  {items.map((s) => (
                    <li key={s.id}>
                      <button type="button" className="tebyan-book-link" onClick={() => onOpen(s.id)}>
                        <span>{getServiceLabel(s, language)}</span>
                        {Arrow}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </aside>
    );
  }

  const category = service ? SERVICE_CATEGORIES.find((c) => c.id === service.category) : undefined;
  const siblings = service ? TEBYAN_SERVICES.filter((s) => s.category === service.category && s.id !== service.id) : [];
  const Icon = (service?.icon ?? Lightbulb) as LucideIcon;

  return (
    <aside className="tebyan-book-aside" aria-label={help.title}>
      <div className="tebyan-book-aside__inner">
        {service && (
          <header className="tebyan-book-service">
            {category && <p className="tebyan-book-kicker">{isAr ? category.titleAr : category.titleEn}</p>}
            <div className="tebyan-book-service__head">
              <span className="tebyan-book-service__icon" aria-hidden="true">
                <Icon strokeWidth={1.6} />
              </span>
              <div className="min-w-0">
                <p role="heading" aria-level={2} className="tebyan-book-service__name">{getServiceLabel(service, language)}</p>
                <p className="tebyan-book-service__brand">{getServiceBrand(service, language)}</p>
              </div>
            </div>
            <p className="tebyan-book-service__desc">{getServiceDescription(service, language)}</p>
          </header>
        )}

        <section className="tebyan-book-help">
          <p className="tebyan-book-help__intro">{help.intro}</p>
          <ol className="tebyan-book-steps">
            {help.steps.map((step, idx) => (
              <li key={idx}>
                <span className="tebyan-book-steps__num" aria-hidden="true">{idx + 1}</span>
                <span>{step.replace(/^•\s*/, "")}</span>
              </li>
            ))}
          </ol>
          <p className="tebyan-book-tip">
            <Lightbulb aria-hidden="true" />
            <span>{help.tip}</span>
          </p>
        </section>

        {siblings.length > 0 && category && (
          <nav className="tebyan-book-index" aria-label={isAr ? category.titleAr : category.titleEn}>
            <p role="heading" aria-level={2} className="tebyan-book-index__title">{isAr ? category.titleAr : category.titleEn}</p>
            <ul>
              {siblings.map((s) => (
                <li key={s.id}>
                  <button type="button" className="tebyan-book-link" onClick={() => onOpen(s.id)}>
                    <span>{getServiceLabel(s, language)}</span>
                    {Arrow}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </aside>
  );
};

export default BookContextPage;
