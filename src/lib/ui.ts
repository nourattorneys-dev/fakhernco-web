import { DEFAULT_LOCALE, pathIn, type Locale } from './locale';

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
    /** Prefix on the numbered process cards: "STEP 01". */
    step: 'STEP',

    // Offices — the city names are content, not chrome, but there is no CMS
    // field for them, so they live here rather than rendering English on an
    // Arabic page.
    cities: { abuDhabi: 'Abu Dhabi', mansoura: 'Mansoura', newDelhi: 'New Delhi' },
    countries: { uae: 'UAE', egypt: 'Egypt', india: 'India' },

    // 404
    errorCode: 'Error 404',
    notFoundTitle: 'This page could not be found',
    notFoundBody:
      'The page may have moved. You can browse our services or get in touch and we will point you in the right direction.',
    backToHome: 'Back to home',

    // Floating WhatsApp button
    whatsappLabel: 'Chat with us on WhatsApp',
    whatsappPrefill: "Hello, I'd like to speak to a lawyer about a legal matter.",
    officeHours: 'Office hours',
    hoursValue: 'Saturday – Friday, 8AM – 8PM (GST). Closed Sunday.',
    mainOffice: 'Main Office',
    weekdays: 'Saturday – Friday',
    hours: '8AM – 8PM',

    firm: 'Firm',
    federation: 'SKP Federation',
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

    /**
     * The campaign landing pages under /legal-services.
     *
     * Every string on those pages that is not CMS content lives here, because
     * the English and Arabic routes render the same component and the only
     * thing that differs is this object.
     */
    landing: {
      eyebrow: 'Fakher & Co · Abu Dhabi & Dubai',
      askAbout: (s: string) => `Hello, I'd like to ask about: ${s}.`,
      whatsapp: 'WhatsApp',
      /** The sticky mobile bar's second button. Short: it sits beside a
          full-width primary action and must not wrap. */
      call: 'Call',
      callAria: (n: string) => `Call ${n}`,

      /*
        Rotated rather than repeated: the same sentence three times down one
        page reads as a template and stops being read. Each offers a different
        reason to make contact, so a reader who ignored the first meets a
        different hook at the second.
      */
      ctas: [
        {
          line: 'Not sure whether you have a case, or whether it is worth pursuing?',
          sub: 'A confidential consultation will tell you, with no obligation.',
        },
        {
          line: 'Working to a deadline?',
          sub: 'Tell us when you make contact and we will say honestly whether it is achievable.',
        },
        {
          line: 'Would it be easier to talk it through?',
          sub: 'We advise in Arabic and English, in person in Abu Dhabi and Dubai, or by call.',
        },
      ],

      ratherNotFormLead: 'Would you rather not fill in a form?',
      ratherNotFormBody: 'Call or message us and we will come back to you.',

      getInTouch: 'Get in touch',
      formLead:
        'Tell us about your matter and a member of our team will respond within one business day. Everything you share is confidential.',

      otherServices: 'Other services',
      howElse: 'How else we can help',
      readMore: 'Read more',

      readyTitle: 'Ready to protect your position?',
      readyBody:
        'A confidential consultation, with no obligation. We will tell you where you stand and what your options cost before you commit to anything.',

      // The index at /legal-services
      indexTitle: 'Legal Services in the UAE',
      indexLead:
        'Practising since 2011, with offices in Abu Dhabi and Dubai. Whatever the matter, the first step is the same — tell us the situation and we will tell you where you stand.',
      howWeHelp: 'How we can help',
      chooseMatter: 'Choose the matter closest to yours',
      chooseLead:
        'Each one sets out what we do, how the process works, what it typically costs you in time, and the questions clients ask most. If your matter spans more than one, start anywhere — the same team handles all of them.',
      notSureTitle: 'Not sure which applies?',
      notSureBody: (n: number) =>
        `Tell us the situation and we will point you to the right place — including telling you when you do not need a lawyer. We also publish ${n} detailed service pages covering the full range of our practice.`,
      browseAll: 'Browse all services',
      helloLawyer: 'Hello, I would like to speak to a lawyer.',
    },
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
    step: 'الخطوة',

    cities: { abuDhabi: 'أبوظبي', mansoura: 'المنصورة', newDelhi: 'نيودلهي' },
    countries: { uae: 'الإمارات', egypt: 'مصر', india: 'الهند' },

    // 404
    errorCode: 'خطأ 404',
    notFoundTitle: 'تعذّر العثور على هذه الصفحة',
    notFoundBody:
      'ربما تكون الصفحة قد نُقلت. يمكنك تصفّح خدماتنا أو التواصل معنا وسنرشدك إلى الوجهة الصحيحة.',
    backToHome: 'العودة إلى الرئيسية',

    // Floating WhatsApp button
    whatsappLabel: 'تحدّث إلينا عبر واتساب',
    whatsappPrefill: 'مرحباً، أودّ التحدث إلى محامٍ بشأن مسألة قانونية.',
    officeHours: 'ساعات العمل',
    hoursValue: 'من السبت إلى الجمعة، 8 صباحاً – 8 مساءً. الأحد إجازة.',
    mainOffice: 'المقر الرئيسي',
    weekdays: 'السبت – الجمعة',
    hours: '8 صباحاً – 8 مساءً',

    firm: 'المكتب',
    federation: 'اتحاد SKP',
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

    landing: {
      eyebrow: 'فاخر ومشاركوه · أبوظبي ودبي',
      askAbout: (s: string) => `مرحباً، أودّ الاستفسار عن: ${s}.`,
      whatsapp: 'واتساب',
      call: 'اتصل',
      callAria: (n: string) => `اتصل على ${n}`,

      ctas: [
        {
          line: 'لست متأكداً مما إذا كانت لديك قضية، أو ما إذا كان من المجدي المضي فيها؟',
          sub: 'استشارة سرّية تُجيبك، دون أي التزام.',
        },
        {
          line: 'هل تعمل ضمن مهلة محددة؟',
          sub: 'أخبرنا بها عند التواصل وسنصارحك بما إذا كانت قابلة للتحقيق.',
        },
        {
          line: 'هل يكون الحديث المباشر أيسر؟',
          sub: 'نقدّم استشاراتنا بالعربية والإنجليزية، حضورياً في أبوظبي ودبي أو عبر الهاتف.',
        },
      ],

      ratherNotFormLead: 'هل تفضّل ألا تملأ نموذجاً؟',
      ratherNotFormBody: 'اتصل بنا أو راسلنا وسنعاود التواصل معك.',

      getInTouch: 'تواصل معنا',
      formLead:
        'أخبرنا بتفاصيل قضيتك وسيتواصل معك أحد أعضاء فريقنا خلال يوم عمل واحد. وكل ما تشاركنا به يبقى سرّياً.',

      otherServices: 'خدمات أخرى',
      howElse: 'كيف يمكننا مساعدتك أيضاً',
      readMore: 'اقرأ المزيد',

      readyTitle: 'هل أنت مستعد لحماية موقفك؟',
      readyBody:
        'استشارة سرّية دون أي التزام. سنوضّح لك موقفك القانوني وتكلفة الخيارات المتاحة قبل أن تلتزم بأي شيء.',

      indexTitle: 'الخدمات القانونية في الإمارات',
      indexLead:
        'نمارس المهنة منذ عام 2011، ولنا مكاتب في أبوظبي ودبي. أياً كانت القضية، تبقى الخطوة الأولى واحدة — أخبرنا بالتفاصيل ونوضّح لك موقفك.',
      howWeHelp: 'كيف يمكننا مساعدتك',
      chooseMatter: 'اختر الخدمة الأقرب إلى قضيتك',
      chooseLead:
        'توضّح كل صفحة ما نقوم به، وكيف تسير الإجراءات، والمدة التي تستغرقها عادةً، والأسئلة الأكثر تكراراً لدى الموكلين. وإذا كانت قضيتك تمتد إلى أكثر من مجال، فابدأ من أيها شئت — الفريق نفسه يتولاها جميعاً.',
      notSureTitle: 'لست متأكداً أيها ينطبق على حالتك؟',
      notSureBody: (n: number) =>
        `أخبرنا بتفاصيل الأمر ونرشدك إلى الجهة الصحيحة — بما في ذلك مصارحتك حين لا تحتاج إلى محامٍ أصلاً. كما ننشر ${n} صفحة خدمات مفصّلة تغطي نطاق ممارستنا بالكامل.`,
      browseAll: 'تصفّح جميع الخدمات',
      helloLawyer: 'مرحباً، أودّ التحدث إلى محامٍ.',
    },
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
 * Pass `available` (the set of real paths in that locale) to enable the check;
 * without it the function assumes the target exists, which is right for links
 * the caller has already verified.
 *
 * The prefixing is delegated to pathIn rather than rebuilt here. It used to be
 * `if (locale !== 'ar') return path`, which reads as "English needs no prefix"
 * but actually means "every locale except Arabic is at the root" — so a third
 * locale would have had every navigation and footer link on every one of its
 * pages resolve silently to the English page. There is no compile error to
 * catch it: the guard is a negation, so widening Locale changes nothing
 * TypeScript can see.
 */
export const href = (locale: Locale, path: string, available?: Set<string> | string[]) => {
  if (locale === DEFAULT_LOCALE) return path;
  const target = pathIn(path, locale);
  if (!available) return target;
  const set = available instanceof Set ? available : new Set(available);
  return set.has(target) ? target : path;
};
