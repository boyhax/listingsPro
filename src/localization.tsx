import React, { createContext, useContext, useState, useEffect } from 'react';

// Live, robust, offline-safe Exchange Rates relative to 1 USD
export const exchangeRates: Record<string, { symbol: string, rate: number, placement: 'before' | 'after', name: string }> = {
  USD: { symbol: '$', rate: 1.0, placement: 'before', name: 'US Dollar' },
  EUR: { symbol: '€', rate: 0.92, placement: 'before', name: 'Euro' },
  GBP: { symbol: '£', rate: 0.79, placement: 'before', name: 'British Pound' },
  AED: { symbol: 'د.إ', rate: 3.67, placement: 'after', name: 'UAE Dirham' },
  SAR: { symbol: 'ر.س', rate: 3.75, placement: 'after', name: 'Saudi Riyal' },
  EGP: { symbol: 'ج.م', rate: 47.5, placement: 'after', name: 'Egyptian Pound' },
  KWD: { symbol: 'د.ك', rate: 0.31, placement: 'after', name: 'Kuwaiti Dinar' },
  QAR: { symbol: 'ر.ق', rate: 3.64, placement: 'after', name: 'Qatari Riyal' },
  OMR: { symbol: 'ر.ع.', rate: 0.38, placement: 'after', name: 'Omani Rial' },
  BHD: { symbol: 'د.ب', rate: 0.38, placement: 'after', name: 'Bahraini Dinar' },
  CAD: { symbol: 'C$', rate: 1.36, placement: 'before', name: 'Canadian Dollar' },
  AUD: { symbol: 'A$', rate: 1.50, placement: 'before', name: 'Australian Dollar' },
  JPY: { symbol: '¥', rate: 156.0, placement: 'before', name: 'Japanese Yen' }
};

export type LanguageCode = 'en' | 'ar';

export interface DetectionInfo {
  country: string;
  city: string;
  currency: string;
  language: LanguageCode;
}

// Full-coverage Arabic and English definitions
export const translations: Record<LanguageCode, Record<string, string>> = {
  en: {
    title: "Local Services Marketplace",
    subtitle: "Modern Swiss Directory",
    explore: "Explore",
    myHub: "My Hub",
    publishService: "Publish Service",
    discoverTitle: "Discover Premium Local Services & Assets",
    discoverSub: "Automated schedules, reviews, secure escrows, and customized attributes.",
    placeholderSearch: "Search audi, penthouse, spa, dentist...",
    categoryFilter: "Category Filter",
    allServices: "All Services",
    catCars: "🚗 Cars / Rental Vehicles",
    catProperties: "🏡 Properties / Real Estate",
    catGoods: "📦 Goods & Products",
    catAppointments: "📅 Appointments & Bookings",
    actionModel: "Action Model",
    allActions: "All Actions",
    actionBook: "✓ Book Appointment",
    actionRent: "✓ Available to Rent",
    actionBuy: "✓ Buy Outright",
    noMatches: "No active local service matches found.",
    noMatchesTips: "Try adjusting your filters, search queries, or publish a customized service!",
    btnPublishItem: "Publish Service Item",
    deployService: "Deploy Service",
    price: "Price",
    viewDetails: "View details",
    overview: "Overview",
    attributesMatrix: "Attributes Matrix",
    listedBy: "LISTED BY",
    buyPack: "Buy Pack",
    reserveSchedule: "Reserve & Schedule",
    inquireChat: "Inquire & Chat",
    reviews: "Reviews",
    submitFeedback: "Submit User Feedback & Verification",
    chooseRating: "Choose Rating",
    reviewComments: "Review Comments",
    publishReviewLabel: "Publish Review",
    invoiceGenerated: "Invoices generated! Your service booking code is",
    processEscrow: "Process Escrow Payment",
    availableServiceHours: "Available Service Hours Appointments",
    selectDate: "Select Date (Automated Calendar Scheduler)",
    holderName: "Holder Name",
    cardNumber: "Card Number",
    expiry: "Expiry",
    secureEscrowGateway: "Secure Escrow Credit Card Gateway",
    sandboxMode: "Sandbox Mode Enabled",
    testCardDesc: "Test card:",
    returnToListingsBtn: "Return to Listings",
    securePaymentSuccess: "Secure Payment Succeeded",
    chatSimulation: "Conversation Live Thread Simulation",
    pollModeActive: "Poll Mode active",
    askHostQuestionPlaceholder: "Ask the host a custom question...",
    noPreviousMessages: "No previous messages",
    initiateInquiryMsg: "Initiate inquiry. Host usually replies in seconds!",
    footerDesc: "Local Services Directory Marketplace",
    footerDetails: "Secure card settlement proxies • Automated scheduling logs • 256-Bit TLS verified",
    detectedLocation: "Detected Location",
    changeLanguage: "Language",
    properties: "Properties",
    cars: "Cars",
    products: "Products",
    services: "Services",
    appointment: "Appointment",
    buying: "Buying",
    renting: "Renting",
    booking: "Booking",
    perDay: "/day",
    perSlot: "/slot",
    totalAmount: "Total",
    search: "Search",
    step1Classification: "Step 1: Listing Classification",
    step1Tips: "Choose the category, model pathway, and physical/virtual location for your marketplace entry.",
    categoryType: "Category Type",
    listingActionModel: "Listing Action Model",
    locationRegion: "Location / Region",
    step2CoreDetails: "Step 2: Core Details",
    step2Tips: "Provide a catchy title, price, descriptive layout, and high-resolution thumbnail.",
    listingName: "Listing Name",
    listingDescription: "Listing Description",
    descriptionPlaceholder: "Provide depth about your offer, special instructions, availability schedules or state info...",
    coverImageUrl: "Cover Image URL (Optional)",
    coverImagePlaceholder: "Paste an Unsplash or direct image URL (or leave blank for custom cover)",
    step3Attributes: "Step 3: HivePress Attributes",
    step3Tips: "Fine-tune custom parameters mapped dynamically for Category",
    backBtn: "Back",
    continueBtn: "Continue",
    deployListingBtn: "Deploy Listing",
    publishingSecurelyBtn: "Publishing Securely...",
    stepIndicator: "Step",
    done: "Done",
    sandboxMsg: "Secure payments done through the marketplace handle escrow properly.",
    currencyPref: "Currency Preferences",
    currencyPrefSub: "Select your preferred payment settlement currency. Defaults to auto-detected local currency based on your IP region.",
    preferredCurrency: "Preferred Currency",
    selectCurrency: "Select Currency"
  },
  ar: {
    title: "سوق الخدمات المحلية",
    subtitle: "دليل سويسري عصري وأنيق",
    explore: "استكشف",
    myHub: "لوحتي الشخصية",
    publishService: "نشر خدمة",
    discoverTitle: "اكتشف الخدمات والأصول المحلية المميزة",
    discoverSub: "جداول آلية ومراجعات موثوقة، أنظمة ضمان معلقة آمنة مع مواصفات مخصصة.",
    placeholderSearch: "ابحث عن أودي، بنتهاوس، علاج كلي، طبيب أسنان...",
    categoryFilter: "تصفية الفئات",
    allServices: "جميع الخدمات",
    catCars: "🚗 سيارات ومركبات للإيجار",
    catProperties: "🏡 عقارات وشقق سكنية",
    catGoods: "📦 سلع ومنتجات للبيع",
    catAppointments: "📅 مواعيد وحجوزات مميزة",
    actionModel: "نموذج المعاملة",
    allActions: "جميع المعاملات",
    actionBook: "✓ حجز موعد مباشر",
    actionRent: "✓ متاح للإيجار اليومي",
    actionBuy: "✓ شراء مباشر وتملك",
    noMatches: "لم يتم العثور على خدمات محلية مطابقة لبحثك.",
    noMatchesTips: "يرجى تعديل منقيات البحث، أو إضافة الخدمة الخاصة بك ومشاركتها مع الجميع!",
    btnPublishItem: "أنشئ إعلان الخدمة الآن",
    deployService: "نشر وإعلان الخدمة",
    price: "السعر",
    viewDetails: "تفاصيل الخدمة",
    overview: "وصف الخدمة العامة",
    attributesMatrix: "مصفوفة المواصفات والخصائص",
    listedBy: "الناشر المسؤول",
    buyPack: "شراء العرض",
    reserveSchedule: "جدولة وحجز الموعد",
    inquireChat: "استفسار ودردشة",
    reviews: "الآراء والتقييمات",
    submitFeedback: "إضافة تقييم جديد للمستخدم",
    chooseRating: "اختر درجة التقييم المناسبة",
    reviewComments: "تفاصيل التعليق والمراجعة",
    publishReviewLabel: "أنشئ تقييم المراجعة",
    invoiceGenerated: "تم إنشاء الفواتير بنجاح! كود حجز الخدمة الخاص بك هو",
    processEscrow: "إتمام عملية السداد الآمن",
    availableServiceHours: "مواعيد وجلسات الخدمات المتاحة للتأكيد بالصلاحيات",
    selectDate: "اختر التاريخ (المخطط التلقائي والجدولة الفورية)",
    holderName: "اسم صاحب البطاقة",
    cardNumber: "رقم بطاقة الائتمان",
    expiry: "تاريخ الانتهاء",
    secureEscrowGateway: "بوابة الائتمان المشفرة والآمنة للضمان والوساطة",
    sandboxMode: "الوضع التجريبي الافتراضي نشط",
    testCardDesc: "البطاقة التجريبية المعتمدة:",
    returnToListingsBtn: "العودة لقائمة الإعلانات",
    securePaymentSuccess: "عملية الدفع والوساطة تمت بنجاح وبشكل آمن",
    chatSimulation: "محاكاة فورية للدردشة والمراسلة المباشرة",
    pollModeActive: "الاتصال المباشر مع خادم المضيف فعال",
    askHostQuestionPlaceholder: "اسأل المعلن عن شروط أو تفاصيل الخدمة...",
    noPreviousMessages: "لا توجد مراسلات سابقة مع هذا المعلن",
    initiateInquiryMsg: "ابدأ بطرح أول سؤال لك، سيرد عليك المعلن خلال ثوانٍ معدودة!",
    footerDesc: "منصة وتطبيق سوق الخدمات والدليل المحلي للأعمال",
    footerDetails: "جزيئات تسوية الدفع المشفرة • سجلات الإتاحة المباشرة • 256 بت تشفير TLS معتمد",
    detectedLocation: "موقعك التلقائي",
    changeLanguage: "اللغة",
    properties: "العقارات",
    cars: "السيارات",
    products: "المنتجات",
    services: "الخدمات والوظائف",
    appointment: "موعد مؤكد",
    buying: "شراء وتملك",
    renting: "تأجير يومي",
    booking: "جدولة موعد",
    perDay: " / يومياً",
    perSlot: " / موعد",
    totalAmount: "الإجمالي الكلي",
    search: "البحث السريع",
    step1Classification: "الخطوة الأولى: تحديد تصنيف وتفاصيل نوع المعلن",
    step1Tips: "قم باختيار فئة الخدمة، الخطة التشغيلية وموقع الاستخدام الفعلي محلياً أو عن بعد.",
    categoryType: "تصنيف الفئة",
    listingActionModel: "نموذج المعاملة المقترحة للعميل",
    locationRegion: "موقع تواجد أو تقديم الخدمة",
    step2CoreDetails: "الخطوة الثانية: المعلومات الجوهرية والخصائص العامة",
    step2Tips: "اكتب اسماً ملفتاً للخدمة، حدد السعر المطلوب المناسب، تفاصيل الوصف وصورة الغلاف.",
    listingName: "اسم الإعلان / عنوان الخدمة",
    listingDescription: "وصف الإعلان الكامل والشامل",
    descriptionPlaceholder: "تفاصيل العرض، الشروط، مواعيد الإتاحة، والتعليمات الخاصة بالاستفادة الكاملة من الخدمة...",
    coverImageUrl: "رابط الصورة التوضيحية أو الغلاف (اختياري)",
    coverImagePlaceholder: "ضع رابط مباشر للصورة من Unsplash (أو اترك الحقل فارغاً لصورة افتراضية مميزة)",
    step3Attributes: "الخطوة الثالثة: خصائص مواصفات HivePress المطورة",
    step3Tips: "إدخال مواصفات الخصائص الديناميكية والفرعية المخصصة لنوع الفئة:",
    backBtn: "السابق",
    continueBtn: "التالي والتأكيد",
    deployListingBtn: "انشر إعلانك الآن مفعلاً",
    publishingSecurelyBtn: "جاري تأمين ونشر إعلانك...",
    stepIndicator: "الخطوة",
    done: "مكتمل",
    sandboxMsg: "جميع عمليات السداد مشفرة بنظام الضمان والمستندات السحابية ومؤمنة.",
    currencyPref: "تفضيلات العملة والأسعار",
    currencyPrefSub: "اختر عملة تسوية الدفع المفضلة لديك. يتم تعيين العملة تلقائياً بناءً على بلد أو منطقة عنوان IP الخاص بك بشكل افتراضي.",
    preferredCurrency: "العملة المفضلة",
    selectCurrency: "اختر نوع العملة"
  }
};

interface LocalizationContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  detectedLocale: DetectionInfo;
  setDetectedLocale: React.Dispatch<React.SetStateAction<DetectionInfo>>;
  setCurrency: (currency: string) => void;
  t: (key: string) => string;
  formatPrice: (usdPrice: number, actionType: string) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>('en');
  const [detectedLocale, setDetectedLocale] = useState<DetectionInfo>({
    country: 'United Kingdom',
    city: 'London',
    currency: localStorage.getItem('user_market_currency') || 'USD',
    language: 'en'
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  const setCurrency = (curr: string) => {
    localStorage.setItem('user_market_currency', curr);
    setDetectedLocale(prev => ({
      ...prev,
      currency: curr
    }));
  };

  useEffect(() => {
    // 1. First trigger server-side detection for safety
    const runDetection = async () => {
      try {
        const localSavedCurrency = localStorage.getItem('user_market_currency');
        const res = await fetch('/api/detect-locale');
        if (res.ok) {
          const data = await res.json();
          const info: DetectionInfo = {
            country: data.country || 'United Kingdom',
            city: data.city || 'London',
            currency: localSavedCurrency || data.currency || 'USD',
            language: data.language || 'en'
          };
          
          setDetectedLocale(info);
          setLanguage(info.language);
          
          // 2. Local fallback if server returns local server IP (loopback)
          if (data.isLocal && !localSavedCurrency) {
            // Fetch direct client-side metadata securely from free browser-side locator
            const clientRes = await fetch('https://ipapi.co/json/');
            if (clientRes.ok) {
              const clientData = await clientRes.json();
              if (clientData && !clientData.error) {
                const updatedInfo: DetectionInfo = {
                  country: clientData.country_name || info.country,
                  city: clientData.city || info.city,
                  currency: clientData.currency || info.currency,
                  language: (clientData.languages && clientData.languages.includes('ar')) ? 'ar' : 'en'
                };
                setDetectedLocale(updatedInfo);
                setLanguage(updatedInfo.language);
              }
            }
          }
        }
      } catch (err) {
        console.error("Localization detection chain exception:", err);
      }
    };
    runDetection();
  }, []);

  const t = (key: string): string => {
    const translationSet = translations[language] || translations.en;
    return translationSet[key] || translations.en[key] || key;
  };

  const formatPrice = (usdPrice: number, actionType: string): string => {
    const selectedCurrency = detectedLocale.currency || 'USD';
    const config = exchangeRates[selectedCurrency] || exchangeRates.USD;
    const converted = Math.round(usdPrice * config.rate);
    const formattedVal = new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US').format(converted);
    
    // Add custom suffixes depending on action Type in current language
    let suffix = '';
    if (actionType === 'renting') {
      suffix = t('perDay');
    } else if (actionType === 'booking') {
      suffix = t('perSlot');
    }

    const priceText = config.placement === 'before'
      ? `${config.symbol}${formattedVal}`
      : `${formattedVal} ${config.symbol}`;

    return `${priceText}${suffix}`;
  };

  return (
    <LocalizationContext.Provider value={{ language, setLanguage, detectedLocale, setDetectedLocale, setCurrency, t, formatPrice }}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be utilized within a LocalizationProvider context wrapper');
  }
  return context;
};
