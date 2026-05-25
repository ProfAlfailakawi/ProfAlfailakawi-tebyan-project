/**
 * Gender detection and Arabic white dialect (اللهجة البيضاء المقروءة واللطيفة) helpers.
 * This file helps classify Arabic first names as Male, Female, or Neutral, and format 
 * UI addressing in a smooth, elegant, gender-sensitive white dialect.
 */

// Comprehensive lists of common Arabic names for high-accuracy local matching.
const FAMOUS_FEMALE_NAMES = new Set([
  'مريم', 'مارية', 'فاطمة', 'فاطمه', 'عائشة', 'عائشه', 'نورة', 'نوره', 'سارة', 'ساره', 'شريفة', 'شريفه',
  'وضحة', 'وضحه', 'بلقيس', 'لمياء', 'دانة', 'دانه', 'عهود', 'لولوة', 'لؤلؤة', 'لؤلؤه', 'منيرة', 'منيره',
  'هيا', 'لطيفة', 'لطيفه', 'بدرية', 'بدريه', 'أميرة', 'اميره', 'أمل', 'امال', 'العنود', 'مشاعل', 'تغريد',
  'حنان', 'ميساء', 'ميس', 'خلود', 'غدير', 'منال', 'أسماء', 'اسماء', 'هناء', 'عبير', 'رشا', 'رنيم', 'نغم',
  'ياسمين', 'زينب', 'زينة', 'زينه', 'ريم', 'ريما', 'رانيا', 'داليا', 'رناد', 'جود', 'جوري', 'لوجين', 'لجين',
  'شهد', 'روان', 'نجلاء', 'شيماء', 'ريهام', 'مروة', 'مروه', 'رند', 'رندة', 'رنده', 'نادين', 'جنى', 'جنه',
  'تالا', 'ليان', 'صبا', 'فرح', 'رغد', 'هديل', 'تسنيم', 'مرام', 'أسيل', 'اسيل', 'ميعاد', 'نادية', 'ناديه',
  'هالة', 'هاله', 'كوثر', 'ندى', 'منى', 'ضحى', 'نهى', 'رشا', 'بشرى', 'سلوى', 'نجوى', 'لبنى', 'ليلى', 'عبير',
  'هنوف', 'اريج', 'وفاء', 'امال', 'هند', 'مها', 'وئام', 'سحر', 'شروق', 'دلال', 'نهال', 'فاتن', 'تولين',
  'مرام', 'مرح', 'يسرى', 'بشرى', 'شمس', 'قمر', 'غادة', 'غاده', 'جواهر', 'هيا', 'أريج', 'روعة', 'روعه',
  'جميلة', 'جميله', 'حسناء', 'صفاء', 'جيهان', 'خلود', 'شروق', 'رهف', 'حنين', 'بدور', 'نجد', 'هلا', 'هبة',
  'هبه', 'وجدان', 'ميسون', 'إيمان', 'ايمان', 'إسراء', 'اسراء', 'إلهام', 'الهام', 'سوسن', 'لمى', 'حلا',
  'كاميليا', 'ديمة', 'ديمه', 'رولا', 'سلوى', 'منى', 'نرمين', 'مي', 'علا', 'رنا', 'رند', 'آية', 'ايه', 'آلاء'
]);

const FAMOUS_MALE_NAMES = new Set([
  'أحمد', 'احمد', 'محمد', 'محمود', 'علي', 'على', 'حسن', 'حسين', 'خالد', 'وليد', 'عمر', 'عمرو', 'زيد', 'بكر',
  'عثمان', 'ابوبكر', 'أبو بكر', 'عادل', 'سالم', 'طارق', 'فهد', 'فيصل', 'سلطان', 'عبدالعزيز', 'عبد العزيز',
  'عبدالرحمن', 'عبد الرحمن', 'عبدالله', 'عبد الله', 'سعد', 'سعود', 'مشعل', 'صالح', 'إبراهيم', 'ابراهيم',
  'إسماعيل', 'اسماعيل', 'يوسف', 'يحيى', 'موسى', 'عيسى', 'نوح', 'سليمان', 'داوود', 'داود', 'أيوب', 'ايوب',
  'ريان', 'رائد', 'ماجد', 'نايف', 'بندر', 'عبدالإله', 'عبد الإله', 'عبدالاله', 'حمزة', 'حمزه', 'حذيفة',
  'حذيفه', 'أسامة', 'اسامه', 'طلحة', 'طلحه', 'عقبة', 'عقبه', 'عبيدة', 'عبيده', 'قتيبة', 'قتيبه', 'شيبة',
  'شيبه', 'عكرمة', 'عكرمه', 'سلامة', 'سلامه', 'عطية', 'عطيه', 'خليفة', 'خليفه', 'بجاد', 'عبدالملك', 'عبد الملك',
  'عبدالوهاب', 'عبد الوهاب', 'مصطفى', 'مرتضى', 'مجتبى', 'علاء', 'بهاء', 'ضياء', 'صفاء', 'براء', 'رجاء', 'وفاء',
  'ياسر', 'هشام', 'سفيان', 'رواد', 'مروان', 'غازي', 'جاسم', 'بشار', 'براء', 'جهاد', 'منذر', 'سامر', 'رائد',
  'أمجد', 'امجد', 'هاني', 'مؤيد', 'معتصم', 'عدنان', 'منصور', 'غازي', 'فواز', 'بدر', 'ناصر', 'باسل', 'حسام',
  'شادي', 'مهند', 'يزيد', 'فارس', 'أيمن', 'ايمن', 'عقاب', 'تميم', 'عساف', 'جراح', 'أنور', 'انور', 'أمير', 'امير',
  'ماهر', 'زهير', 'سامي', 'فادي', 'جمال', 'أنيس', 'انيس', 'وجدي', 'منير', 'رامي', 'فايز', 'تركي', 'سلمان'
]);

/**
 * Normalizes an Arabic string for better matching. Removes diacritics, tanween,
 * and normalizes letters like Alef and Te-Marbouta where appropriate.
 */
export function normalizeArabicString(str: string): string {
  if (!str) return '';
  return str
    .trim()
    .replace(/[\u064B-\u065F]/g, '') // Remove diacritics (Fatha, Damma, Kasra, Shadda, Sukun, Tanween)
    .replace(/[أإآ]/g, 'ا') // Normalize Alef
    .replace(/ى$/g, 'ي') // Normalize Alef Maqsoura to Ya for suffix checking safely, but we keep track of ending
    .toLowerCase();
}

/**
 * Detects the gender based on a given Arabic or English display name.
 * Returns 'male', 'female', or 'neutral'.
 */
export function detectGender(displayName: string | null | undefined): 'male' | 'female' | 'neutral' {
  if (!displayName) return 'neutral';

  // Extract first name (first word)
  const parts = displayName.trim().split(/\s+/);
  const firstNameRaw = parts[0];
  if (!firstNameRaw) return 'neutral';

  const normalized = normalizeArabicString(firstNameRaw);

  // Check explicit lists first
  if (FAMOUS_FEMALE_NAMES.has(firstNameRaw) || FAMOUS_FEMALE_NAMES.has(normalized)) {
    return 'female';
  }
  if (FAMOUS_MALE_NAMES.has(firstNameRaw) || FAMOUS_MALE_NAMES.has(normalized)) {
    return 'male';
  }

  // Heuristic checks for Arabic name patterns
  const originalCleanObj = firstNameRaw.trim();
  
  // Male exceptions with female endings (checked first via FAMOUS_MALE_NAMES but as backup)
  const endsWithTeMarbouta = originalCleanObj.endsWith('ة') || originalCleanObj.endsWith('ه');
  const endsWithAlefMaqsoura = originalCleanObj.endsWith('ى');
  const endsWithAlefMamdouda = originalCleanObj.endsWith('اء');

  // Female indicator: ends with ة or ه (and not a known male name like Hamza)
  if (endsWithTeMarbouta) {
    // Standard female ending exception
    const maleExceptions = ['حمزة', 'أسامة', 'حذيفة', 'طلحة', 'عقبة', 'عبيدة', 'قتيبة', 'عكرمة', 'سلامة', 'عطية', 'جمعة', 'خليفة', 'حارثة', 'نعمان', 'قتيبه', 'حذيفه', 'اسامه', 'حمزه'];
    if (maleExceptions.includes(originalCleanObj) || maleExceptions.includes(normalized)) {
      return 'male';
    }
    return 'female';
  }

  // Female indicator: ends with ى (and not a known male name like Mostafa, Isa, Musa, Yahya)
  if (endsWithAlefMaqsoura) {
    const maleExceptions = ['مصطفى', 'موسى', 'عيسى', 'يحيى', 'مرتضى', 'مجتبى', 'سويري', 'نهي', 'وجدي'];
    if (maleExceptions.includes(originalCleanObj) || maleExceptions.includes(normalized)) {
      return 'male';
    }
    return 'female';
  }

  // Female indicator: ends with اء (and not a known male name like Alaa, Bahaa, Diaa, Safaa, Baraa)
  if (endsWithAlefMamdouda) {
    const maleExceptions = ['علاء', 'بهاء', 'ضياء', 'صفاء', 'براء', 'وفاء', 'رجاء'];
    if (maleExceptions.includes(originalCleanObj) || maleExceptions.includes(normalized)) {
      return 'male';
    }
    return 'female';
  }

  // Check common English name hints
  const englishLower = firstNameRaw.toLowerCase();
  
  const commonEnglishFemale = [
    'sarah', 'sara', 'mary', 'maria', 'fatima', 'nour', 'nora', 'norah', 'reem', 'reema', 'dana', 'amira',
    'amal', 'yasmin', 'yasmine', 'zeina', 'layan', 'jude', 'jana', 'leila', 'laila', 'mona', 'huda', 'salma',
    'fatemeh', 'zainab', 'shada', 'rawan', 'marian', 'lina', 'deema', 'dina', 'hala', 'hannah', 'maya', 'tara'
  ];
  const commonEnglishMale = [
    'ahmed', 'ahmad', 'mohamad', 'mohamed', 'mohammad', 'muhammad', 'ali', 'hassan', 'hussein', 'khaled',
    'omar', 'osama', 'hamza', 'rayan', 'faisal', 'sultan', 'saad', 'fهد', 'fahad', 'youssef', 'yousef',
    'ibrahim', 'mustafa', 'tarek', 'walid', 'khalid', 'anas', 'bader', 'abdullah', 'abdul'
  ];

  if (commonEnglishFemale.includes(englishLower)) return 'female';
  if (commonEnglishMale.includes(englishLower)) return 'male';

  // Return neutral for ambiguous or un-matchable names
  return 'neutral';
}

/**
 * Returns the customized greeting or pronoun depending on user gender.
 * Works perfectly as a layout and phrase injector.
 */
export function getGenderWord(
  gender: 'male' | 'female' | 'neutral',
  maleWord: string,
  femaleWord: string,
  neutralWord: string
): string {
  if (gender === 'female') return femaleWord;
  if (gender === 'male') return maleWord;
  return neutralWord;
}

/**
 * Standard White Dialect (اللغة العربية العامة الناعمة واللطيفة) translations of core phrases
 * that address users according to their detected gender.
 */
export const whiteDialectPhrases = {
  // Main title subtles
  underOneQuestion: (gender: 'male' | 'female' | 'neutral') => 
    getGenderWord(
      gender,
      'أهلاً بك.. جميع أدوات تبيان في نافذة واحدة لتيسير خطوتك الفكرية وترشيد مستقبلك الواعد ✨',
      'أهلاً بكِ.. جميع أدوات تبيان في نافذة واحدة لتيسير خطوتكِ الفكرية وترشيد مستقبلكِ الواعد ✨',
      'أهلاً بك.. جميع أدوات تبيان في نافذة واحدة لتيسير خطوتك الفكرية وترشيد مستقبلك الواعد ✨'
    ),
    
  mainG: (gender: 'male' | 'female' | 'neutral') => 
    getGenderWord(
      gender,
      'ما الذي يشغل بالك اليوم؟',
      'ما الذي يشغل بالك اليوم؟',
      'ما الذي يشغل بالك اليوم؟'
    ),

  thinkingStyle: (gender: 'male' | 'female' | 'neutral') =>
    getGenderWord(
      gender,
      'هل تفضل تحليلاً سريعاً ومباشراً، أم تود التعمق في المسألة أكثر؟ 🤔',
      'هل تفضلين تحليلاً سريعاً ومباشراً، أم تودين التعمق في المسألة أكثر؟ 🤔',
      'هل تفضلون تحليلاً سريعاً ومباشراً، أم تودون التعمق في المسألة أكثر؟ 🤔'
    ),

  startChallenge: (gender: 'male' | 'female' | 'neutral') => 
    getGenderWord(
      gender,
      'ابدأ رحلتك الآن 🚀',
      'ابدئي رحلتكِ الآن 🚀',
      'ابدأ الرحلة الآن 🚀'
    ),

  readyToDecide: (gender: 'male' | 'female' | 'neutral') => 
    getGenderWord(
      gender,
      'هل أنت مستعد لاتخاذ قرارك الآن بكل ثقة وطمأنينة؟ 👍',
      'هل أنتِ مستعدة لاتخاذ قراركِ الآن بكل ثقة وطمأنينة؟ 👍',
      'هل حان وقت اتخاذ القرار الحاسم؟ 👍'
    ),

  viewManuscript: (gender: 'male' | 'female' | 'neutral') => 
    getGenderWord(
      gender,
      'افتح مخطوطتك الفنية ونسقها بأسلوبك الراقي 📜',
      'افتحي مخطوطتكِ الفنية ونسقيها بأسلوبكِ الراقي 📜',
      'افتح المخطوطة الخاصة بك ونسقها بأسلوبك الراقِ 📜'
    ),

  helloUser: (name: string, gender: 'male' | 'female' | 'neutral') => {
    if (!name || name === 'New User' || name === 'ضيف') {
      return getGenderWord(
        gender,
        'أهلاً بك، سعداء بوجودك معنا في تبيان اليوم! ✨',
        'أهلاً بكِ، سعداء بوجودكِ معنا في تبيان اليوم! ✨',
        'أهلاً بك، سعداء بوجودك معنا في تبيان اليوم! ✨'
      );
    }
    
    return getGenderWord(
      gender,
      `أهلاً بك يا ${name}، سعداء بوجودك معنا في تبيان اليوم! ✨`,
      `أهلاً بكِ يا ${name}، سعداء بوجودكِ معنا في تبيان اليوم! ✨`,
      `أهلاً بك يا ${name}، سعداء بوجودك معنا في تبيان اليوم! ✨`
    );
  }
};

let activeUserGender: 'male' | 'female' | 'neutral' = 'neutral';
let activeUserName: string = '';

export function setActiveUser(name: string, gender: 'male' | 'female' | 'neutral') {
  activeUserName = name;
  activeUserGender = gender;
  try {
    // Also save locally for persistence across simple reloads
    localStorage.setItem('tebyan_active_user_name', name);
    localStorage.setItem('tebyan_active_user_gender', gender);
  } catch (e) {}
}

export function getActiveUser() {
  if (!activeUserName) {
    try {
      const savedName = localStorage.getItem('tebyan_active_user_name');
      const savedGender = localStorage.getItem('tebyan_active_user_gender') as any;
      if (savedName) {
        activeUserName = savedName;
        activeUserGender = savedGender || 'neutral';
      }
    } catch(e) {}
  }
  return { name: activeUserName, gender: activeUserGender };
}

