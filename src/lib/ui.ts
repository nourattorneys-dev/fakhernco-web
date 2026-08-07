import type { Locale } from './locale';

/**
 * Interface strings.
 *
 * Page content comes from the CMS; these are the labels the CMS has no field
 * for — button text, form labels, section headings that belong to the design
 * rather than the copy.
 *
 * The Arabic is the firm's own wording wherever their site had an equivalent
 * (نبذة عنا, الخدمات, تواصل معنا, رؤى قانونية come straight from their /ar/
 * navigation). Only the strings with no counterpart on the live site are
 * translated here, and those are deliberately plain — a law firm's own
 * terminology should not be invented.
 */
export const UI = {
  en: {
    about: 'About Us',
    services: 'Services',
    insights: 'Legal Insights',
    contact: 'Contact Us',
    home: 'Home',

    requestConsultation: 'Request a consultation',
    speakToLawyer: 'Speak to a lawyer',
    contactUs: 'Contact us',
    readArticle: 'Read article',
    viewPracticeArea: 'View practice area',
    allServices: 'All services',
    relatedServices: 'Related services',
    servicesInThisArea: 'Services in this area',
    exploreServices: (n: number) => `Explore ${n} services`,

    officeLocations: 'Our office locations',
    officeHours: 'Office hours',
    hoursValue: 'Monday – Friday, 9AM – 6PM (GST)',
    mainOffice: 'Main Office',
    weekdays: 'Monday – Friday',
    hours: '9AM – 6PM',

    firm: 'Firm',
    offices: 'Offices',
    privacy: 'Privacy policy',
    rightsReserved: 'All rights reserved.',

    respondWithinDay:
      'Tell us about your matter and a member of our team will respond within one business day.',
    notSureWhere: 'Not sure where your matter fits? Ask us.',
    noContent: 'This page has no content yet.',
    breadcrumb: 'Breadcrumb',
    mainNav: 'Main',
    sections: 'Sections',

    // Contact form
    formHeading: 'Enquiry form',
    fullName: 'Full name',
    email: 'Email',
    phone: 'Phone',
    howCanWeHelp: 'How can we help?',
    selectService: 'Select a service',
    other: 'Other',
    yourMessage: 'Your message',
    messagePlaceholder: 'Tell us briefly about your matter.',
    sendEnquiry: 'Send enquiry',
    sending: 'Sending…',
    consent:
      'I consent to Fakher & Co storing this enquiry so they can respond to me. Submitting this form does not create a lawyer–client relationship.',
    thanksTitle: 'Thank you — your enquiry has been received.',
    thanksBody:
      'A member of our team will respond within one business day. We have sent a confirmation to your email address. If your matter is urgent, call',
    genericError: 'Something went wrong. Please try again.',
    contactLead:
      'Tell us about your matter and a member of our team will respond within one business day.',

    // Homepage
    insightsHeading: 'Guidance on UAE law',
    allArticles: (n: number) => `All ${n} articles`,
    /** The hero H1 is split here and the tail set in a lighter weight. */
    heroSplit: ' in ',
  },

  ar: {
    about: 'نبذة عنا',
    services: 'الخدمات',
    insights: 'رؤى قانونية',
    contact: 'تواصل معنا',
    home: 'الرئيسية',

    requestConsultation: 'اطلب استشارة',
    speakToLawyer: 'تحدّث إلى محامٍ',
    contactUs: 'تواصل معنا',
    readArticle: 'اقرأ المقال',
    viewPracticeArea: 'عرض مجال الممارسة',
    allServices: 'جميع الخدمات',
    relatedServices: 'خدمات ذات صلة',
    servicesInThisArea: 'الخدمات في هذا المجال',
    exploreServices: (n: number) => `استكشف ${n} خدمة`,

    officeLocations: 'مواقع مكاتبنا',
    officeHours: 'ساعات العمل',
    hoursValue: 'الإثنين – الجمعة، ٩ صباحاً – ٦ مساءً (بتوقيت الخليج)',
    mainOffice: 'المقر الرئيسي',
    weekdays: 'الإثنين – الجمعة',
    hours: '٩ صباحاً – ٦ مساءً',

    firm: 'المكتب',
    offices: 'المكاتب',
    privacy: 'سياسة الخصوصية',
    rightsReserved: 'جميع الحقوق محفوظة.',

    respondWithinDay:
      'أخبرنا بتفاصيل قضيتك وسيتواصل معك أحد أعضاء فريقنا خلال يوم عمل واحد.',
    notSureWhere: 'لست متأكداً أين تندرج قضيتك؟ اسألنا.',
    noContent: 'لا يوجد محتوى لهذه الصفحة بعد.',
    breadcrumb: 'مسار التنقل',
    mainNav: 'التنقل الرئيسي',
    sections: 'الأقسام',

    // Contact form
    formHeading: 'نموذج التواصل',
    fullName: 'الاسم الكامل',
    email: 'البريد الإلكتروني',
    phone: 'رقم الهاتف',
    howCanWeHelp: 'كيف يمكننا مساعدتك؟',
    selectService: 'اختر الخدمة',
    other: 'أخرى',
    yourMessage: 'رسالتك',
    messagePlaceholder: 'أخبرنا باختصار عن قضيتك.',
    sendEnquiry: 'إرسال الطلب',
    sending: 'جارٍ الإرسال…',
    consent:
      'أوافق على احتفاظ مكتب فاخر ومشاركوه بهذا الطلب للرد عليّ. إرسال هذا النموذج لا يُنشئ علاقة بين المحامي والموكل.',
    thanksTitle: 'شكراً لك — تم استلام طلبك.',
    thanksBody:
      'سيتواصل معك أحد أعضاء فريقنا خلال يوم عمل واحد. وقد أرسلنا تأكيداً إلى بريدك الإلكتروني. إذا كان الأمر عاجلاً، يُرجى الاتصال على',
    genericError: 'حدث خطأ ما. يُرجى المحاولة مرة أخرى.',
    contactLead: 'أخبرنا بتفاصيل قضيتك وسيتواصل معك أحد أعضاء فريقنا خلال يوم عمل واحد.',

    // Homepage
    insightsHeading: 'إرشادات في القانون الإماراتي',
    allArticles: (n: number) => `جميع المقالات (${n})`,
    heroSplit: ' في ',
  },
} as const;

export const t = (locale: Locale) => UI[locale];

/**
 * Prefix a path for the locale — but only where that page exists.
 *
 * Blindly prefixing /ar produced links to pages that were never translated:
 * /ar/about-us, /ar/legal-insights and /ar/privacy-policy-2 all 404, and the
 * header and footer linked to all three from every Arabic page. Falling back
 * to the English URL is the honest behaviour, and it matches how the language
 * switcher already decides whether to appear at all.
 *
 * Pass `available` (the set of real /ar paths) to enable the check; without
 * it the function assumes the target exists, which is right for links the
 * caller has already verified.
 */
export const href = (locale: Locale, path: string, available?: Set<string> | string[]) => {
  if (locale !== 'ar') return path;
  const target = path === '/' ? '/ar' : `/ar${path}`;
  if (!available) return target;
  const set = available instanceof Set ? available : new Set(available);
  return set.has(target) ? target : path;
};
