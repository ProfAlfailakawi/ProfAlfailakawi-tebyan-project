import React, { useState, useEffect } from 'react';
import * as JoyrideModule from 'react-joyride';
import { STATUS } from 'react-joyride';
import type { Step } from 'react-joyride';

const Joyride = (JoyrideModule as any).default || (JoyrideModule as any).Joyride || JoyrideModule;

export const OnboardingTour = ({ language }: { language: 'ar' | 'en' }) => {
  const [run, setRun] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('tebyan_tour_seen');
    if (!hasSeenTour) {
      // Start tour after a small delay
      const timer = setTimeout(() => {
        setRun(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('tebyan_tour_seen', 'true');
    }
  };

  const steps: any[] = [
    {
      target: 'body',
      placement: 'center',
      content: language === 'ar' 
        ? 'مرحباً بك في تبيان! لنأخذك في جولة سريعة لمعرفة كيف تتنقل في هذا العالم.' 
        : 'Welcome to Tebyan! Let\'s take a quick tour to see how to navigate this world.',
      disableBeacon: true,
    },
    {
      target: '.tour-search-input',
      content: language === 'ar' 
        ? 'اكتب سؤالك أو موضوعك هنا. وسنقوم بتحليله بعمق.' 
        : 'Type your question or topic here. We will analyze it deeply.',
    },
    {
      target: '.tour-mood-compass',
      content: language === 'ar' 
        ? 'هنا يمكنك تغيير طابع النظام (هادئ، عميق، أو ثوري) ليتناسب مع حالتك المزاجية.' 
        : 'Here you can change the system mood (calm, deep, or revolutionary) to match your mood.',
    },
    {
      target: '.tour-menu-button',
      content: language === 'ar'
        ? 'من هنا يمكنك استكشاف جميع الأقسام الجانبية مثل المستشار، المختبر، ومجرة الأفكار.'
        : 'From here you can explore all sections like the Counselor, the Lab, and the Galaxy of Ideas.'
    }
  ];

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      showSkipButton
      showProgress
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#000',
          backgroundColor: '#fff',
          textColor: '#333',
          zIndex: 100000,
        },
        buttonClose: {
          display: 'none',
        },
        tooltip: {
          borderRadius: '16px',
          fontFamily: 'inherit',
          padding: '24px',
        },
        buttonNext: {
          backgroundColor: '#000',
          borderRadius: '8px',
          padding: '8px 16px',
        },
        buttonBack: {
          color: '#666',
        },
        buttonSkip: {
          color: '#999',
        }
      }}
      locale={{
        back: language === 'ar' ? 'السابق' : 'Back',
        close: language === 'ar' ? 'إغلاق' : 'Close',
        last: language === 'ar' ? 'إنهاء' : 'Finish',
        next: language === 'ar' ? 'التالي' : 'Next',
        skip: language === 'ar' ? 'تخطي' : 'Skip',
      }}
    />
  );
};
