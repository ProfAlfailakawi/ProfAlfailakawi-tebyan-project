import React, { useMemo, useState } from 'react';
import { ArrowLeft, Search, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  SERVICE_CATEGORIES,
  TEBYAN_SERVICES,
  getServiceBrand,
  getServiceDescription,
  getServiceLabel,
} from '../constants/serviceRegistry';

type Props = {
  language: 'ar' | 'en';
  handleTabChange: (id: any, context?: string) => void;
};

export const ServiceExplorer: React.FC<Props> = ({ language, handleTabChange }) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredServices = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return TEBYAN_SERVICES.filter((service) => {
      if (activeCategory !== 'all' && service.category !== activeCategory) return false;
      if (!needle) return true;
      const haystack = [
        service.titleAr,
        service.titleEn,
        service.brandAr,
        service.brandEn,
        service.descriptionAr,
        service.descriptionEn,
        ...service.keywordsAr,
        ...service.keywordsEn,
      ].join(' ').toLowerCase();
      return haystack.includes(needle);
    });
  }, [activeCategory, query]);

  return (
    <section className="tebyan-service-explorer mx-auto w-full max-w-6xl pb-28" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <header className="mx-auto max-w-3xl text-center pt-2 md:pt-6">
        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-[#8E7AAE]/16 bg-white/70 px-4 py-2 text-sm font-black text-[#6E5F8E] shadow-sm backdrop-blur-xl">
          <Sparkles className="h-4 w-4" />
          {language === 'ar' ? 'كل إمكانات تبيان في مكان واحد' : 'All Tebyan capabilities in one place'}
        </div>
        <h1 className="text-3xl font-black tracking-tight text-[#182231] md:text-5xl">
          {language === 'ar' ? 'شنو تحتاج تسوي؟' : 'What do you need to do?'}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base font-bold leading-8 text-[#64788D] md:text-lg">
          {language === 'ar'
            ? 'اختر حاجتك بكلمات واضحة. الاسم الإبداعي موجود، لكن الفائدة دائماً تظهر أولاً.'
            : 'Choose your need in plain language. The creative name remains, but the benefit always comes first.'}
        </p>
      </header>

      <div className="tebyan-service-filter sticky top-[72px] z-20 mx-auto mt-8 max-w-4xl rounded-[24px] border border-[#8FA9C7]/16 bg-[#F8F5EF]/96 p-3 shadow-[0_12px_34px_rgba(24,34,49,0.07)]">
        <div className="flex items-center gap-3 rounded-[20px] border border-[#8FA9C7]/18 bg-white px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-[#8E7AAE]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-0 flex-1 border-0 bg-transparent text-base font-bold text-[#182231] outline-none placeholder:text-[#7C8796]/55"
            placeholder={language === 'ar' ? 'ابحث: قرار، شرح، تدريب، خطة، فكرة…' : 'Search: decision, explanation, practice, plan, idea…'}
            aria-label={language === 'ar' ? 'البحث في خدمات تبيان' : 'Search Tebyan services'}
          />
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={cn(
              'min-h-11 shrink-0 rounded-full border px-4 text-sm font-black transition-all',
              activeCategory === 'all'
                ? 'border-[#8E7AAE] bg-[#8E7AAE] text-white shadow-md'
                : 'border-[#8FA9C7]/18 bg-white text-[#64788D] hover:border-[#8E7AAE]/35',
            )}
          >
            {language === 'ar' ? 'الكل' : 'All'}
          </button>
          {SERVICE_CATEGORIES.map((category) => (
            <button
              type="button"
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                'min-h-11 shrink-0 rounded-full border px-4 text-sm font-black transition-all',
                activeCategory === category.id
                  ? 'border-[#8E7AAE] bg-[#8E7AAE] text-white shadow-md'
                  : 'border-[#8FA9C7]/18 bg-white text-[#64788D] hover:border-[#8E7AAE]/35',
              )}
            >
              {language === 'ar' ? category.titleAr : category.titleEn}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 space-y-10">
        {SERVICE_CATEGORIES.map((category) => {
          const services = filteredServices.filter((service) => service.category === category.id);
          if (!services.length) return null;
          return (
            <section key={category.id} className="space-y-4">
              <div className="px-1">
                <h2 className="text-xl font-black text-[#182231] md:text-2xl">
                  {language === 'ar' ? category.titleAr : category.titleEn}
                </h2>
                <p className="mt-1 text-sm font-bold leading-7 text-[#7C8796]">
                  {language === 'ar' ? category.descriptionAr : category.descriptionEn}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {services.map((service) => {
                  const Icon = service.icon;
                  return (
                    <button
                      type="button"
                      key={service.id}
                      onClick={() => handleTabChange(service.id)}
                      className="group min-h-[190px] rounded-[28px] border border-[#8FA9C7]/14 bg-white/88 p-5 text-right shadow-[0_10px_28px_rgba(24,34,49,0.045)] transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-[#8E7AAE]/28 hover:shadow-[0_16px_38px_rgba(24,34,49,0.08)] active:scale-[0.985]"
                    >
                      <div className="flex h-full flex-col">
                        <div className="flex items-start justify-between gap-4">
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[17px] border border-[#8E7AAE]/12 bg-[#F4F0F8] text-[#6E5F8E] transition-colors group-hover:bg-[#8E7AAE] group-hover:text-white">
                            <Icon className="h-5 w-5" />
                          </span>
                          {service.featured && (
                            <span className="rounded-full bg-[#EEF4F1] px-3 py-1 text-xs font-black text-[#4D766B]">
                              {language === 'ar' ? 'مقترح للبداية' : 'Good starting point'}
                            </span>
                          )}
                        </div>
                        <h3 className="mt-4 text-lg font-black leading-7 text-[#182231]">
                          {getServiceLabel(service, language)}
                        </h3>
                        <p className="mt-1 text-xs font-black tracking-wide text-[#8E7AAE]">
                          {getServiceBrand(service, language)}
                        </p>
                        <p className="mt-3 flex-1 text-sm font-bold leading-7 text-[#64788D]">
                          {getServiceDescription(service, language)}
                        </p>
                        <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[#182231]">
                          {language === 'ar' ? 'افتح الخدمة' : 'Open service'}
                          <ArrowLeft className={cn('h-4 w-4 text-[#8E7AAE]', language === 'ar' ? '' : 'rotate-180')} />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {!filteredServices.length && (
        <div className="mt-12 rounded-[30px] border border-[#8FA9C7]/14 bg-white/80 p-8 text-center">
          <h2 className="text-xl font-black text-[#182231]">
            {language === 'ar' ? 'ما لقينا خدمة بهذا الاسم' : 'No matching service found'}
          </h2>
          <p className="mt-2 text-sm font-bold text-[#64788D]">
            {language === 'ar' ? 'اكتب حاجتك بكلمة أبسط، مثل: قرار أو شرح أو خطة.' : 'Try a simpler need such as decision, explain, or plan.'}
          </p>
        </div>
      )}
    </section>
  );
};

export default ServiceExplorer;
