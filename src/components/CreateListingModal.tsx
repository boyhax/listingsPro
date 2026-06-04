/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Sparkles, MapPin, DollarSign, Image, Clipboard, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { ListingCategory, ListingActionType } from '../types';
import { useLocalization } from '../localization';

interface CreateListingModalProps {
  onClose: () => void;
  currentUserEmail: string;
  onSuccess: () => void;
}

export function CreateListingModal({ onClose, currentUserEmail, onSuccess }: CreateListingModalProps) {
  const { t, detectedLocale, language } = useLocalization();

  // Basic Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ListingCategory>('services');
  const [actionType, setActionType] = useState<ListingActionType>('booking');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  
  // Multiple imagery and video states linked with medias table
  const [additionalMedias, setAdditionalMedias] = useState<{ url: string; type: 'image' | 'video'; field: string; }[]>([]);
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaType, setNewMediaType] = useState<'image' | 'video'>('image');
  
  // Auto-detect & pre-fill location
  const [location, setLocation] = useState(() => {
    if (detectedLocale && detectedLocale.city) {
      return `${detectedLocale.city}, ${detectedLocale.country}`;
    }
    return '';
  });

  // Dynamic attribute specs (Cars)
  const [carMake, setCarMake] = useState('Tesla');
  const [carModel, setCarModel] = useState('');
  const [carYear, setCarYear] = useState('2024');
  const [carMileage, setCarMileage] = useState('');
  const [carFuelType, setCarFuelType] = useState<'Electric' | 'Gas' | 'Hybrid'>('Electric');
  
  // Real Estate
  const [rePropType, setRePropType] = useState<'Apartment' | 'House' | 'Office' | 'Studio'>('Apartment');
  const [reBedrooms, setReBedrooms] = useState('2');
  const [reBathrooms, setReBathrooms] = useState('2');
  const [reSquareFeet, setReSquareFeet] = useState('');
  const [reFurnished, setReFurnished] = useState(true);

  // Products
  const [prodCondition, setProdCondition] = useState<'New' | 'Like New' | 'Very Good' | 'Good' | 'Fair'>('Like New');
  const [prodBrand, setProdBrand] = useState('');
  const [prodWarranty, setProdWarranty] = useState(true);
  const [prodShipping, setProdShipping] = useState(true);

  // Services
  const [servDuration, setServDuration] = useState('60');
  const [servExperience, setServExperience] = useState('5');
  const [servLanguage, setServLanguage] = useState(language === 'ar' ? 'العربية، الانجليزية' : 'English');

  // Load collections and dynamic attributes dynamically
  const [collections, setCollections] = useState<any[]>([]);
  const [dynamicAttrValues, setDynamicAttrValues] = useState<Record<string, any>>({});
  const selectedCollection = collections.find(c => c.key === category);

  useEffect(() => {
    fetch('/api/admin/collections')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setCollections(data);
        const selectedCol = data.find((c: any) => c.key === category);
        if (selectedCol && Array.isArray(selectedCol.attributes)) {
          const defaults: Record<string, any> = {};
          selectedCol.attributes.forEach((attr: any) => {
            if (attr.type === 'boolean') {
              defaults[attr.key] = false;
            } else if (attr.type === 'select' && attr.options && attr.options.length > 0) {
              defaults[attr.key] = attr.options[0];
            } else {
              defaults[attr.key] = '';
            }
          });
          setDynamicAttrValues(defaults);
        }
      })
      .catch(() => {});
  }, [category]);

  // We split the modal into 8 easier and clean screen steps
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Nominatim Autocomplete additions
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [isVerifyingLocation, setIsVerifyingLocation] = useState(false);

  useEffect(() => {
    if (!location.trim() || location.length < 3) {
      setSuggestions([]);
      return;
    }

    const handler = setTimeout(() => {
      setIsSearchingSuggestions(true);
      fetch(`/api/locations/autocomplete?q=${encodeURIComponent(location)}`)
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          setSuggestions(data);
          setShowSuggestions(true);
        })
        .catch(() => {})
        .finally(() => {
          setIsSearchingSuggestions(false);
        });
    }, 400);

    return () => clearTimeout(handler);
  }, [location]);

  const handleSelectSuggestion = (sug: any) => {
    setLocation(sug.display_name);
    setShowSuggestions(false);
    setSubmitError('');
  };

  const nextStep = async () => {
    setSubmitError('');

    if (step === 3) {
      if (!title.trim()) {
        setSubmitError(language === 'ar' ? "يرجى إدخال اسم الخدمة أو الإعلان." : "Please enter a title for the listing.");
        return;
      }
    }

    if (step === 4) {
      if (!price || Number(price) <= 0) {
        setSubmitError(language === 'ar' ? "يرجى تحديد سعر صالح." : "Please enter a valid price.");
        return;
      }
    }

    if (step === 5) {
      if (!description.trim()) {
        setSubmitError(language === 'ar' ? "يرجى كتابة وصف موجز أولاً." : "Please provide a brief description.");
        return;
      }
    }

    if (step === 6) {
      if (!location.trim()) {
        setSubmitError(language === 'ar' ? "يرجى تحديد الموقع الجغرافي." : "Please enter a location.");
        return;
      }

      setIsVerifyingLocation(true);
      try {
        const response = await fetch('/api/locations/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ location })
        });
        const result = await response.json();
        if (!response.ok || !result.valid) {
          setSubmitError(result.error || (language === 'ar' ? "فشل التحقق من الموقع. يرجى إدخال مدينة صالحة." : "Location validation failed. Please specify a city, town, or village. State or country-only entries are not allowed."));
          setIsVerifyingLocation(false);
          return;
        }
      } catch (err) {
        setSubmitError(language === 'ar' ? "حدث خطأ أثناء الاتصال بنظام المواقع." : "Error communicating with the location database.");
        setIsVerifyingLocation(false);
        return;
      } finally {
        setIsVerifyingLocation(false);
      }
    }

    setStep((prev) => Math.min(prev + 1, 8));
  };

  const prevStep = () => {
    setSubmitError('');
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const getCategorizedPlaceholderImage = (cat: ListingCategory) => {
    switch (cat) {
      case 'cars':
        return "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800";
      case 'real-estate':
        return "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800";
      case 'products':
        return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800";
      case 'services':
        return "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=800";
      default:
        return "";
    }
  };

  const handleCategoryChange = (cat: ListingCategory) => {
    setCategory(cat);
    // Align default deal actions corresponding with the listing categories
    if (cat === 'cars') setActionType('renting');
    else if (cat === 'real-estate') setActionType('renting');
    else if (cat === 'products') setActionType('buying');
    else if (cat === 'services') setActionType('booking');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 8) {
      nextStep();
      return;
    }
    setSubmitError('');
    setIsSubmitting(true);

    if (!title.trim() || !description.trim() || !price) {
      setSubmitError(language === 'ar' ? "الرجاء مراجعة تعبئة الحقول الأساسية أولاً." : "Ensure all primary components are compiled.");
      setIsSubmitting(false);
      return;
    }

    const attributesPay: Record<string, any> = {};
    const selectedCol = collections.find(c => c.key === category);
    if (selectedCol && Array.isArray(selectedCol.attributes) && selectedCol.attributes.length > 0) {
      selectedCol.attributes.forEach((attr: any) => {
        const val = dynamicAttrValues[attr.key];
        if (attr.type === 'number') {
          attributesPay[attr.key] = val !== undefined && val !== '' ? Number(val) : 0;
        } else if (attr.type === 'boolean') {
          attributesPay[attr.key] = val === undefined ? false : !!val;
        } else {
          attributesPay[attr.key] = val || '';
        }
      });
    } else {
      if (category === 'cars') {
        attributesPay.make = carMake;
        attributesPay.model = carModel || "Model Y";
        attributesPay.year = Number(carYear) || 2024;
        attributesPay.mileage = Number(carMileage) || 12000;
        attributesPay.transmission = "Automatic";
        attributesPay.fuelType = carFuelType;
      } else if (category === 'real-estate') {
        attributesPay.propertyType = rePropType;
        attributesPay.bedrooms = Number(reBedrooms) || 2;
        attributesPay.bathrooms = Number(reBathrooms) || 2;
        attributesPay.squareFeet = Number(reSquareFeet) || 1100;
        attributesPay.furnished = reFurnished;
      } else if (category === 'products') {
        attributesPay.condition = prodCondition;
        attributesPay.brand = prodBrand || "Brand";
        attributesPay.warranty = prodWarranty;
        attributesPay.shippingAvailable = prodShipping;
      } else if (category === 'services') {
        attributesPay.durationMinutes = Number(servDuration) || 60;
        attributesPay.experienceYears = Number(servExperience) || 5;
        attributesPay.serviceProvider = currentUserEmail.split("@")[0].toUpperCase();
        attributesPay.language = servLanguage;
      }
    }

    const payload = {
      title,
      description,
      category,
      actionType,
      price: Number(price),
      image: image.trim() || getCategorizedPlaceholderImage(category),
      location: location || (language === 'ar' ? "الرياض" : "Greater London Area"),
      attributes: attributesPay,
      ownerEmail: currentUserEmail,
      additionalMedias // Registers items inside server-side media database table using item_id and field properties
    };

    try {
      const res = await fetch('/api/listings', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        onSuccess();
      } else {
        const err = await res.json();
        setSubmitError(err.error || "Failed to create directory catalog item.");
      }
    } catch (e) {
      setSubmitError("Connectivity issue detected. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="create-listing-overlay" className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl overflow-hidden w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] border border-slate-100"
      >
        {/* Spacious, Elegant Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-slate-950 text-amber-400 rounded-xl shadow-xs">
              <Plus className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
                {language === 'ar' ? 'نشر إعلان جديد في المنصة' : t('btnPublishItem')}
              </h3>
              <p className="text-[11px] text-slate-400">
                {language === 'ar' ? 'نموذج بسيط من مرحلة إلى مرحلة متباعدة' : 'Step-by-step relaxed creation wizard'}
              </p>
            </div>
          </div>
          <button 
            id="close-create-modal" 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-all cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Relaxed progress tracker with wider line tracks */}
        <div className="px-8 py-3.5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between text-xs font-sans">
          <span className="text-slate-500 font-extrabold">
            {language === 'ar' ? `الخطوة ${step} من 8` : `Step ${step} of 8`}
          </span>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <div 
                key={s} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === s 
                    ? 'bg-amber-500 w-8 shadow-xs' 
                    : step > s 
                      ? 'bg-slate-900 w-4' 
                      : 'bg-slate-200 w-3'
                }`} 
              />
            ))}
          </div>
        </div>
        <form id="create-listing-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 sm:p-10 space-y-8">
          <AnimatePresence mode="wait">
            
            {/* Step 1: Category Selection */}
            {step === 1 && (
              <motion.div
                key="modal-step-1"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="space-y-6"
              >
                <div className="space-y-2 text-center sm:text-left pb-2">
                  <h4 className="text-xl font-black text-slate-900 tracking-tight">
                    {language === 'ar' ? 'ما هي الفئة التي يناسبها إعلانك؟' : 'What are you listing today?'}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {language === 'ar' ? 'اختر واحدة من الفئات الأساسية لبدء تخصيص مواصفات وخصائص العرض.' : 'Choose the core category that best matches your item or service to load custom specification sheets.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {(['cars', 'real-estate', 'products', 'services'] as ListingCategory[]).map((cat) => {
                    const icons: Record<string, string> = {
                      'cars': '🚗',
                      'real-estate': '🏠',
                      'products': '📦',
                      'services': '🛠️'
                    };
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => handleCategoryChange(cat)}
                        className={`p-6 text-sm font-extrabold rounded-2xl border text-left transition-all duration-300 flex items-center gap-4 cursor-pointer group shadow-xs ${
                          category === cat 
                            ? 'bg-slate-950 border-slate-950 text-white ring-4 ring-slate-100' 
                            : 'border-slate-200 text-slate-700 hover:border-slate-400 bg-white hover:bg-slate-50/50'
                        }`}
                      >
                        <span className="text-2xl p-2.5 bg-slate-100 rounded-xl group-hover:scale-110 transition-transform select-none">
                          {icons[cat] || '✨'}
                        </span>
                        <div>
                          <p className="block text-xs font-black tracking-wide uppercase text-amber-500">
                            {language === 'ar' ? 'فئة رئيسية' : 'Category'}
                          </p>
                          <span className="text-base font-extrabold">
                            {cat === 'real-estate' ? t('properties') : t(cat)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 2: Deal Action/Transaction type */}
            {step === 2 && (
              <motion.div
                key="modal-step-2"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="space-y-6"
              >
                <div className="space-y-2 text-center sm:text-left pb-2">
                  <h4 className="text-xl font-black text-slate-900 tracking-tight">
                    {language === 'ar' ? 'كيف سيتعامل العملاء مع هذا الإعلان؟' : 'Select transaction type'}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {language === 'ar' ? 'اختر الإجراء المناسب لمعرضك: حجز فورى مسبق، تأجير يومي أو سنوي، أو شراء مباشر.' : 'Choose the action flow that fits. You can offer direct booking, renting, or instant purchasing.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  {(['booking', 'renting', 'buying'] as ListingActionType[]).map((mode) => {
                    const icons: Record<string, string> = {
                      'booking': '📅',
                      'renting': '🔑',
                      'buying': '🛍️'
                    };
                    const labelsAr: Record<string, string> = {
                      'booking': 'حجز جدولى',
                      'renting': 'إيجار / تأجير',
                      'buying': 'شراء مباشر'
                    };
                    return (
                      <button
                        type="button"
                        key={mode}
                        onClick={() => setActionType(mode)}
                        className={`p-6 text-sm font-extrabold rounded-2xl border transition-all duration-300 flex flex-col items-center text-center gap-3 cursor-pointer group shadow-xs ${
                          actionType === mode 
                            ? 'bg-emerald-600 border-emerald-600 text-white ring-4 ring-emerald-50 shadow-md' 
                            : 'border-slate-200 text-slate-700 hover:border-slate-400 bg-white hover:bg-slate-50/50'
                        }`}
                      >
                        <span className="text-3xl p-3 bg-slate-105 rounded-2xl group-hover:scale-110 transition-transform select-none">
                          {icons[mode]}
                        </span>
                        <div className="space-y-0.5">
                          <span className="text-sm font-black block">
                            {language === 'ar' ? labelsAr[mode] : t(mode)}
                          </span>
                          <span className={`text-[9.5px] uppercase font-bold ${actionType === mode ? 'text-emerald-100' : 'text-slate-400'}`}>
                            {mode} mode
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 3: Enter Title */}
            {step === 3 && (
              <motion.div
                key="modal-step-3"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="space-y-6"
              >
                <div className="space-y-2 text-center sm:text-left pb-2">
                  <h4 className="text-xl font-black text-slate-900 tracking-tight">
                    {language === 'ar' ? 'ما اسم الخدمة أو الإعلان؟' : 'Give it a descriptive title'}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {language === 'ar' ? 'العنوان الجذاب والموجه يساعد المستخدمين على فهم ما تقدمه فوراً.' : 'A focused and clear title gets 3x more page views. Aim for short but specific.'}
                  </p>
                </div>

                <div className="space-y-2 max-w-xl mx-auto pt-2">
                  <label className="text-[10px] font-black uppercase text-amber-600 tracking-wider">
                    {language === 'ar' ? 'عنوان الإعلان الرئيسي' : t('listingName')}
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder={language === 'ar' ? 'أدخل اسماً جذاباً هنا...' : 'e.g. Premium Tech Support Session, Modern Penthouse Room'}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-base p-4.5 rounded-2xl border-2 border-slate-200 focus:border-slate-800 focus:ring-4 focus:ring-slate-50 focus:outline-none bg-white font-bold text-slate-850 shadow-sm transition-all"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 px-1">
                    <span>{language === 'ar' ? 'يفضل أن لا يتجاوز 60 حرفاً' : 'Recommended length: under 60 characters'}</span>
                    <span className="font-mono">{title.length} chars</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Configure Price */}
            {step === 4 && (
              <motion.div
                key="modal-step-4"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="space-y-6"
              >
                <div className="space-y-2 text-center sm:text-left pb-2">
                  <h4 className="text-xl font-black text-slate-900 tracking-tight">
                    {language === 'ar' ? 'حدد السعر المقترح' : 'Configure listing price'}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {language === 'ar' ? 'حدد السعر برقم صحيح في نطاق العملة المحلية لتسهيل المقارنة والبحث.' : 'Set your standard pricing rate contextually. You can change this rate sheet anytime.'}
                  </p>
                </div>

                <div className="space-y-2 max-w-sm mx-auto pt-4 relative">
                  <label className="text-[10px] font-black uppercase text-amber-600 tracking-wider flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                    <span>{language === 'ar' ? 'القيمة (بالدولار USD)' : `${t('price')} (USD)`}</span>
                  </label>
                  
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black font-mono text-slate-400">$</span>
                    <input 
                      type="number" 
                      required
                      placeholder="120"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full text-xl p-4.5 pl-10 rounded-2xl border-2 border-slate-200 focus:border-slate-800 focus:ring-4 focus:ring-slate-50 focus:outline-none bg-white font-black font-mono text-slate-900 shadow-sm transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 text-center pt-1 font-medium">
                    {language === 'ar' ? 'سيتم احتساب الرسوم والضرائب بناء على المعايير الإدارية' : 'All transactions are secure and subject to normal processing policies'}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 5: Description */}
            {step === 5 && (
              <motion.div
                key="modal-step-5"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="space-y-6"
              >
                <div className="space-y-2 text-center sm:text-left pb-2">
                  <h4 className="text-xl font-black text-slate-900 tracking-tight">
                    {language === 'ar' ? 'اكتب تفاصيل ووصف الخدمة' : 'Describe your offering'}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {language === 'ar' ? 'اكتب مزايا الإعلان وشروطه لكي يثق المشتري بعرضك ويتخذ القرار فوراً.' : 'Explain what is included, scheduling rules, and how it stands out from competitors.'}
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-black uppercase text-amber-600 tracking-wider">
                    {language === 'ar' ? 'تفاصيل الوصف' : t('listingDescription')}
                  </label>
                  <textarea 
                    required
                    rows={5}
                    placeholder={t('descriptionPlaceholder')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-sm p-4.5 rounded-2xl border-2 border-slate-200 focus:border-slate-800 focus:ring-4 focus:ring-slate-50 focus:outline-none bg-white text-slate-700 leading-relaxed shadow-sm transition-all resize-none"
                  />
                  <div className="text-right text-[10px] text-slate-400 font-mono">
                    {description.length} {language === 'ar' ? 'حرفاً' : 'characters'}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 6: Location & Delivery options */}
            {step === 6 && (
              <motion.div
                key="modal-step-6"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="space-y-6"
              >
                <div className="space-y-2 text-center sm:text-left pb-2">
                  <h4 className="text-xl font-black text-slate-900 tracking-tight">
                    {language === 'ar' ? 'أين يقع نطاق التقديم؟' : 'Location & delivery'}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {language === 'ar' ? 'أضف المدينة أو الدولة، أو اكتب (عن بعد / Remote) إذا كانت هذه الخدمة تقدم بشكل افتراضي بالكامل.' : 'Where is this item or service based? Type "Remote" if it is fully online or virtual.'}
                  </p>
                </div>

                <div className="space-y-2 max-w-xl mx-auto pt-2 relative">
                  <label className="text-[10px] font-black uppercase text-amber-600 tracking-wider flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{language === 'ar' ? 'الموقع الجغرافي' : t('locationRegion')}</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="text"
                      required
                      placeholder={language === 'ar' ? 'ابحث عن مدينة (مثال: السيب، مسقط، الرياض...)' : 'Type to search city (e.g. Seeb, London, Muscat)'}
                      value={location}
                      onChange={(e) => {
                        setLocation(e.target.value);
                        setShowSuggestions(true);
                      }}
                      className="w-full text-base p-4.5 rounded-2xl border-2 border-slate-200 focus:border-slate-800 focus:ring-4 focus:ring-slate-50 focus:outline-none bg-white font-bold text-slate-800 shadow-xs transition-style transition-all pr-12"
                    />
                    {(isSearchingSuggestions || isVerifyingLocation) && (
                      <span className="absolute right-4.5 top-4.5 flex h-5 w-5 items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                    )}
                  </div>

                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-56 overflow-y-auto z-50 divide-y divide-slate-100">
                      {suggestions.map((sug, i) => (
                        <div
                          key={i}
                          onClick={() => handleSelectSuggestion(sug)}
                          className="p-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-all"
                        >
                          <span className="truncate max-w-[70%]">{sug.display_name}</span>
                          {!sug.isValid ? (
                            <span className="text-[10px] bg-red-50 text-red-700 px-2.5 py-1 rounded-lg font-mono shrink-0">
                              {language === 'ar' ? '⚠️ اختر مدينة/بلدة' : '⚠️ Need city/town'}
                            </span>
                          ) : (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg font-mono shrink-0">
                              {language === 'ar' ? '✓ صالح' : '✓ Valid City'}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100 flex items-start gap-2.5 mt-4">
                    <span className="text-base">📍</span>
                    <p className="text-[11px] text-slate-550 leading-normal font-sans">
                      {language === 'ar' 
                        ? 'يرجى إدخال مدينة أو بلدة محددة. لا يقبل نظام الخريطة العالمي أسماء الدول أو الولايات بمفردها لتحديد موقع الإعلان بدقة.' 
                        : 'Please enter a specific city, town, or neighborhood. Country-only or state-only locations are rejected to keep our search queries accurate.'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 7: Photography & Media Gallery */}
            {step === 7 && (
              <motion.div
                key="modal-step-7"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="space-y-6"
              >
                <div className="space-y-2 text-center sm:text-left pb-2">
                  <h4 className="text-xl font-black text-slate-900 tracking-tight">
                    {language === 'ar' ? 'الصور وملفات الميديا الإضافية' : 'Bring it to life with media'}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {language === 'ar' ? 'أضف صورة الغلاف الرئيسية، وروابط لملفات الميديا وصور المعرض لزيادة التفاعل والثقة.' : 'An attractive cover image helps convert clients instantly. Paste secondary image URLs or MP4 video links below too.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1 items-start">
                  
                  {/* Left Side: Cover Image */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                        <Image className="w-3.5 h-3.5 text-slate-400" />
                        <span>{language === 'ar' ? 'رابط صورة الغلاف الرئيسي' : 'Primary Cover Image URL'}</span>
                      </label>
                      <input
                        type="text"
                        placeholder={t('coverImagePlaceholder')}
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-slate-350 bg-white text-slate-750 font-medium"
                      />
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-200 border border-slate-300 shadow-xs">
                        <img 
                          src={image.trim() || getCategorizedPlaceholderImage(category)} 
                          alt="Preview" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-amber-600 block">{language === 'ar' ? 'معاينة صورة الغلاف' : 'Cover Preview'}</span>
                        <p className="text-[10.5px] text-slate-400 font-medium leading-snug">
                          {image ? (language === 'ar' ? 'تم تحميل الرابط المخصص' : 'Custom image URL loaded') : (language === 'ar' ? 'سيتم تعيين صورة افتراضية تناسب الفئة المحددة' : 'Fallback image assigned to your category')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Second Gallery Medias */}
                  <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6 pt-4 md:pt-0">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                      {language === 'ar' ? 'روابط المعرض الاختياري (صور/فيديو)' : 'Optional Additional Gallery'}
                    </span>

                    {/* Gallery previews list */}
                    {additionalMedias.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-100 max-h-24 overflow-y-auto">
                        {additionalMedias.map((med, idx) => (
                          <div key={idx} className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1 text-[9.5px] font-semibold text-slate-700 shadow-3xs">
                            <span>{med.type === 'video' ? '📹' : '🖼️'}</span>
                            <span className="max-w-[80px] truncate">{med.url.split('/').pop() || med.url}</span>
                            <button
                              type="button"
                              onClick={() => setAdditionalMedias(prev => prev.filter((_, i) => i !== idx))}
                              className="text-xs text-slate-450 hover:text-rose-600 font-black cursor-pointer ml-1"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder={language === 'ar' ? 'رابط (صورة أو فيديو MP4)...' : 'Gallery link...'}
                          value={newMediaUrl}
                          onChange={(e) => setNewMediaUrl(e.target.value)}
                          className="flex-1 text-[10.5px] p-2.5 rounded-xl border border-slate-200 bg-white"
                        />
                        <select
                          value={newMediaType}
                          onChange={(e) => setNewMediaType(e.target.value as any)}
                          className="w-18 text-[10.5px] p-2.5 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-700 h-full"
                        >
                          <option value="image">IMG</option>
                          <option value="video">VID</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (!newMediaUrl.trim()) return;
                          setAdditionalMedias(prev => [
                            ...prev,
                            { url: newMediaUrl.trim(), type: newMediaType, field: 'gallery' }
                          ]);
                          setNewMediaUrl('');
                        }}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[9.5px] uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-3xs"
                      >
                        + {language === 'ar' ? 'إضافة إلى المعرض' : 'Add Gallery item'}
                      </button>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* Step 8: Dynamic Specifications / Attributes */}
            {step === 8 && (
              <motion.div
                key="modal-step-8"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="space-y-6"
              >
                <div className="space-y-1 text-center sm:text-left pb-2">
                  <span className="px-2 py-0.5 bg-slate-950 text-amber-400 rounded text-[9px] font-bold tracking-wider uppercase inline-block">
                    {category} Specifications Sheet
                  </span>
                  <h4 className="text-xl font-black text-slate-900 tracking-tight pt-1">
                    {language === 'ar' ? 'اللمسة الأخيرة: حدد المواصفات' : 'Final step: Specific fields'}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {language === 'ar' ? 'هذه المواصفات المخصصة تزيد من فاعلية البحث وترتيب تصفية الإعلان للزوار.' : 'Complete the specifications sheet. This helps users search and group Listings easily.'}
                  </p>
                </div>

                <div className="pt-1">
                  {selectedCollection && Array.isArray(selectedCollection.attributes) && selectedCollection.attributes.length > 0 ? (
                    <div className="space-y-4 p-5 bg-slate-50 rounded-2xl border border-slate-150">
                      <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider">
                        {language === 'ar' ? 'خصائص مخصصة من الإدارة' : 'Dynamic Schema Fields'}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {selectedCollection.attributes.map((attr: any) => (
                          <div key={`modal-dyn-attr-${attr.key}`} className={`space-y-1.5 ${attr.type === 'boolean' ? 'sm:col-span-2' : 'col-span-1'}`}>
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] font-extrabold text-slate-550">{attr.label}</span>
                              {attr.required && <span className="text-rose-550 select-none font-bold">*</span>}
                            </div>

                            {attr.type === 'select' ? (
                              <select
                                value={dynamicAttrValues[attr.key] || ''}
                                required={attr.required}
                                onChange={(e) => setDynamicAttrValues({ ...dynamicAttrValues, [attr.key]: e.target.value })}
                                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold"
                              >
                                {(attr.options || []).map((opt: string) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : attr.type === 'boolean' ? (
                              <div className="flex justify-between items-center px-4 py-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                                <span className="text-[11px] text-slate-550 font-bold">{language === 'ar' ? 'متاح / نعم؟' : attr.label}</span>
                                <button
                                  type="button"
                                  onClick={() => setDynamicAttrValues({ ...dynamicAttrValues, [attr.key]: !dynamicAttrValues[attr.key] })}
                                  className={`px-4 py-1.5 rounded-lg text-[10.5px] font-black cursor-pointer transition-all border ${
                                    dynamicAttrValues[attr.key] 
                                      ? 'bg-slate-950 border-slate-950 text-white shadow-xs' 
                                      : 'bg-white border-slate-200 text-slate-500'
                                  }`}
                                >
                                  {dynamicAttrValues[attr.key] ? 'Enabled / نعم' : 'Disabled / لا'}
                                </button>
                              </div>
                            ) : (
                              <input
                                type={attr.type === 'number' ? 'number' : 'text'}
                                value={dynamicAttrValues[attr.key] ?? ''}
                                required={attr.required}
                                placeholder={attr.label}
                                onChange={(e) => setDynamicAttrValues({ ...dynamicAttrValues, [attr.key]: e.target.value })}
                                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 p-5 bg-slate-50 rounded-2xl border border-slate-150">
                      <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider">
                        {category} {language === 'ar' ? 'المواصفات الافتراضية' : 'specifications'}
                      </span>

                      {category === 'cars' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400">{language === 'ar' ? 'الشركة المصنعة' : 'Make'}</span>
                            <input 
                              type="text" 
                              value={carMake}
                              onChange={(e) => setCarMake(e.target.value)}
                              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-700"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400">{language === 'ar' ? 'الطراز' : 'Model'}</span>
                            <input 
                              type="text" 
                              placeholder="Model S"
                              value={carModel}
                              onChange={(e) => setCarModel(e.target.value)}
                              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-700"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400">{language === 'ar' ? 'الموديل (العام)' : 'Year'}</span>
                            <input 
                              type="number" 
                              value={carYear}
                              onChange={(e) => setCarYear(e.target.value)}
                              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white text-slate-700"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400">{language === 'ar' ? 'المسافة (ميل)' : 'Mileage'}</span>
                            <input 
                              type="number" 
                              placeholder="15000"
                              value={carMileage}
                              onChange={(e) => setCarMileage(e.target.value)}
                              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white text-slate-750"
                            />
                          </div>
                          <div className="col-span-2 space-y-1 pt-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">{language === 'ar' ? 'نوع الوقود' : 'Fuel Type'}</span>
                            <div className="flex gap-2">
                              {['Electric', 'Gas', 'Hybrid'].map((ft) => (
                                <button
                                  type="button"
                                  key={ft}
                                  onClick={() => setCarFuelType(ft as any)}
                                  className={`flex-1 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                                    carFuelType === ft ? 'bg-slate-900 border-slate-900 text-white shadow-xs' : 'bg-white border-slate-200 text-slate-650'
                                  }`}
                                >
                                  {ft}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {category === 'real-estate' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1 col-span-2">
                            <span className="text-[10px] uppercase font-bold text-slate-400">{language === 'ar' ? 'نوع العقار' : 'Property Type'}</span>
                            <select 
                              value={rePropType}
                              onChange={(e) => setRePropType(e.target.value as any)}
                              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold"
                            >
                              <option value="Apartment">{language === 'ar' ? 'شقة' : 'Apartment'}</option>
                              <option value="House">{language === 'ar' ? 'فيلا / منزل' : 'House'}</option>
                              <option value="Office">{language === 'ar' ? 'مكتب تجاري' : 'Office'}</option>
                              <option value="Studio">{language === 'ar' ? 'استوديو' : 'Studio'}</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400">{language === 'ar' ? 'غرف النوم' : 'Bedrooms'}</span>
                            <input 
                              type="number" 
                              value={reBedrooms}
                              onChange={(e) => setReBedrooms(e.target.value)}
                              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white text-slate-700"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400">{language === 'ar' ? 'دورات المياه' : 'Bathrooms'}</span>
                            <input 
                              type="number" 
                              value={reBathrooms}
                              onChange={(e) => setReBathrooms(e.target.value)}
                              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white text-slate-700"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase font-bold text-slate-400">{language === 'ar' ? 'المساحة (قدم مربع)' : 'Area (Sq Ft)'}</span>
                            <input 
                              type="number" 
                              placeholder="1100"
                              value={reSquareFeet}
                              onChange={(e) => setReSquareFeet(e.target.value)}
                              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white text-slate-700"
                            />
                          </div>
                          <div className="flex items-center justify-between col-span-1 border-t border-slate-100 pt-3">
                            <span className="text-[10px] text-slate-500 font-bold">{language === 'ar' ? 'مفروش' : 'Furnished'}</span>
                            <button
                              type="button"
                              onClick={() => setReFurnished(!reFurnished)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer border transition-all ${
                                reFurnished ? 'bg-emerald-500 text-white border-emerald-500 shadow-3xs' : 'bg-white text-slate-600'
                              }`}
                            >
                              {reFurnished ? 'Yes' : 'No'}
                            </button>
                          </div>
                        </div>
                      )}

                      {category === 'products' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1 col-span-2">
                            <span className="text-[10px] uppercase font-bold text-slate-400">{language === 'ar' ? 'حالة السلعة' : 'Product Condition'}</span>
                            <select 
                              value={prodCondition}
                              onChange={(e) => setProdCondition(e.target.value as any)}
                              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium"
                            >
                              <option value="New">{language === 'ar' ? 'جديد' : 'Brand New'}</option>
                              <option value="Like New">{language === 'ar' ? 'شبه جديد' : 'Like New'}</option>
                              <option value="Very Good">{language === 'ar' ? 'ممتاز' : 'Very Good'}</option>
                              <option value="Good">{language === 'ar' ? 'جيد' : 'Good'}</option>
                              <option value="Fair">{language === 'ar' ? 'مستعمل' : 'Fair'}</option>
                            </select>
                          </div>
                          <div className="space-y-1 col-span-2">
                            <span className="text-[10px] uppercase font-bold text-slate-400">{language === 'ar' ? 'العلامة التجارية / الماركة' : 'Brand Name'}</span>
                            <input 
                              type="text" 
                              required={category === 'products'}
                              placeholder="e.g. Sony, Apple"
                              value={prodBrand}
                              onChange={(e) => setProdBrand(e.target.value)}
                              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-750"
                            />
                          </div>
                          <div className="flex justify-between items-center col-span-2 text-xs pt-2 border-t border-slate-100">
                            <span className="text-slate-500 font-bold">{language === 'ar' ? 'الضمان متاح' : 'Warranty Available'}</span>
                            <button
                              type="button"
                              onClick={() => setProdWarranty(!prodWarranty)}
                              className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                                prodWarranty ? 'bg-slate-950 text-white shadow-3xs' : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {prodWarranty ? 'Yes' : 'No'}
                            </button>
                          </div>
                        </div>
                      )}

                      {category === 'services' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400">{language === 'ar' ? 'المدة بالدقائق' : 'Duration (Mins)'}</span>
                            <input 
                              type="number" 
                              placeholder="60"
                              value={servDuration}
                              onChange={(e) => setServDuration(e.target.value)}
                              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400">{language === 'ar' ? 'الخبرة بالسنوات' : 'Experience (Yrs)'}</span>
                            <input 
                              type="number" 
                              placeholder="5"
                              value={servExperience}
                              onChange={(e) => setServExperience(e.target.value)}
                              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold"
                            />
                          </div>
                          <div className="space-y-1 col-span-2">
                            <span className="text-[10px] uppercase font-bold text-slate-400">{language === 'ar' ? 'لغة التواصل' : 'Communication Languages'}</span>
                            <input 
                              type="text" 
                              placeholder="English, Arabic..."
                              value={servLanguage}
                              onChange={(e) => setServLanguage(e.target.value)}
                              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {submitError && (
            <p className="text-xs text-rose-500 font-bold p-4 bg-rose-50 rounded-2xl border border-rose-100 animate-pulse">
              {submitError}
            </p>
          )}
        </form>

        {/* Footer Navigation Bar (Sticky bottom) */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 shrink-0">
          {step > 1 ? (
            <button
              id="prev-step-btn"
              type="button"
              onClick={prevStep}
              className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" /> 
              <span>{t('backBtn')}</span>
            </button>
          ) : (
            <div />
          )}

          {step < 8 ? (
            <button
              id="next-step-btn"
              type="button"
              disabled={isVerifyingLocation}
              onClick={nextStep}
              className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 rounded-xl transition-all flex items-center gap-1.5 ml-auto cursor-pointer shadow-sm font-sans"
            >
              <span>{isVerifyingLocation ? (language === 'ar' ? 'جاري التحقق...' : 'Verifying...') : t('continueBtn')}</span> 
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              id="publish-listing-btn"
              form="create-listing-form"
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 text-xs font-extrabold uppercase tracking-widest text-white bg-slate-950 hover:bg-emerald-600 rounded-xl disabled:bg-slate-300 transition-all ml-auto cursor-pointer flex items-center gap-1.5 shadow-md"
            >
              {isSubmitting ? t('publishingSecurelyBtn') : t('deployListingBtn')}
              <Check className="w-4.5 h-4.5 animate-bounce" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
