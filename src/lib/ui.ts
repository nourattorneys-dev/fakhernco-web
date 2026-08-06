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
  },
} as const;

export const t = (locale: Locale) => UI[locale];

/** Prefix a path for the locale. Arabic lives under /ar. */
export const href = (locale: Locale, path: string) =>
  locale === 'ar' ? (path === '/' ? '/ar' : `/ar${path}`) : path;
