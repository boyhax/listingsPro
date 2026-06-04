/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Star, MapPin, Calendar, Clock, CreditCard, Send, 
  User, CheckCircle, ShieldAlert, Sparkles, MessageSquare, Plus, Activity 
} from 'lucide-react';
import { Listing, Review, Message } from '../types';
import { useLocalization } from '../localization';

interface ListingDetailProps {
  listing: Listing;
  onClose: () => void;
  currentUserEmail: string;
  onBookingSuccess: () => void;
}

export function ListingDetail({ listing, onClose, currentUserEmail, onBookingSuccess }: ListingDetailProps) {
  const { language, t, formatPrice } = useLocalization();
  const [activeTab, setActiveTab ] = useState<'overview' | 'booking' | 'chat' | 'reviews'>('overview');
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Review form states
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Booking / Payment states
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [bookingCompleted, setBookingCompleted] = useState<any | null>(null);

  // Poll for messages to simulate real-time replies
  useEffect(() => {
    setActiveMediaIndex(0);
    fetchReviews();
    fetchMessages();
    
    let interval: NodeJS.Timeout;
    if (activeTab === 'chat') {
      interval = setInterval(() => {
        fetchMessages();
      }, 2500); // Poll messages every 2.5s for real-time responsiveness
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [listing.id, activeTab]);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/listings/${listing.id}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages/${listing.id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const body = {
      senderId: "customer",
      senderName: currentUserEmail,
      text: newMessage
    };

    try {
      const res = await fetch(`/api/messages/${listing.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        const dispatched = await res.json();
        setMessages(prev => [...prev, dispatched]);
        setNewMessage('');
        
        // Quick trigger refresh after 1.8s to fetch host simulated response
        setTimeout(() => {
          fetchMessages();
        }, 1800);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    if (!newComment.trim()) {
      setReviewError("Please draft a comment to submit your review.");
      return;
    }

    const payload = {
      userName: currentUserEmail.split("@")[0].toUpperCase() || "Valued Customer",
      userEmail: currentUserEmail,
      rating: newRating,
      comment: newComment
    };

    try {
      const res = await fetch(`/api/listings/${listing.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setReviewSuccess(true);
        setNewComment('');
        setNewRating(5);
        fetchReviews();
        // Clear message
        setTimeout(() => setReviewSuccess(false), 3000);
      } else {
        const err = await res.json();
        setReviewError(err.error || "Failed to post review.");
      }
    } catch (err) {
      setReviewError("Network error occurred.");
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError('');
    setIsSubmittingPayment(true);

    if (!selectedDate) {
      setPaymentError("Kindly choose a target date first.");
      setIsSubmittingPayment(false);
      return;
    }

    if (listing.actionType === 'booking' && !selectedSlot) {
      setPaymentError("Kindly select an appointment hours slot first.");
      setIsSubmittingPayment(false);
      return;
    }

    const checkoutPayload = {
      listingId: listing.id,
      creditCard: cardNumber,
      cardExpiry,
      cardCvc,
      amount: listing.price,
      bookingDate: selectedDate,
      bookingTimeSlot: listing.actionType === 'booking' ? selectedSlot : undefined,
      buyerEmail: currentUserEmail
    };

    try {
      const res = await fetch('/api/payments/checkout', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutPayload)
      });
      if (res.ok) {
        const outcome = await res.json();
        setBookingCompleted(outcome);
        onBookingSuccess();
      } else {
        const issue = await res.json();
        setPaymentError(issue.error || "Transaction declined.");
      }
    } catch (e) {
      setPaymentError("Secure connection error.");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Helper date selectors for calendar mockup
  const getUpcomingDays = () => {
    const dates = [];
    const base = new Date();
    for (let i = 0; i < 7; i++) {
      const future = new Date(base.getTime() + i * 24 * 60 * 60 * 1000);
      const str = future.toISOString().split("T")[0];
      dates.push(str);
    }
    return dates;
  };

  return (
    <div id="listing-detail-overlay" className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl overflow-hidden w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] border border-slate-100"
      >
        {/* Absolute Header with Horizontal Tabs & Close button */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
          <div className="flex bg-slate-200/70 p-1 rounded-xl overflow-x-auto max-w-[calc(100%-48px)] scrollbar-none gap-0.5 select-none">
            <button
              id="tab-btn-overview"
              onClick={() => setActiveTab('overview')}
              className={`px-3 sm:px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'overview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {language === 'ar' ? 'التفاصيل' : t('overview')}
            </button>
            <button
              id="tab-btn-booking"
              onClick={() => setActiveTab('booking')}
              className={`px-3 sm:px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'booking' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {listing.actionType === 'buying' ? t('buyPack') : t('reserveSchedule')}
            </button>
            <button
              id="tab-btn-chat"
              onClick={() => setActiveTab('chat')}
              className={`px-3 sm:px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer relative whitespace-nowrap ${
                activeTab === 'chat' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('inquireChat')}
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
            </button>
            <button
              id="tab-btn-reviews"
              onClick={() => setActiveTab('reviews')}
              className={`px-3 sm:px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'reviews' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('reviews')} ({listing.reviewsCount})
            </button>
          </div>

          <button 
            id="close-detail-modal"
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-200/50 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Workspaces Component Switch */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white min-h-[400px]">
          <AnimatePresence mode="wait">
            
            {/* Tab 0: Overview details workspace */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview-workspace"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Meta Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 text-[10px] font-black uppercase tracking-wider bg-slate-950 text-white rounded-full">
                      {t(listing.category === 'real-estate' ? 'properties' : listing.category)}
                    </span>
                    <span className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-700 rounded-lg">
                      {t(listing.actionType)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{listing.location}</span>
                  </div>
                </div>

                {/* Title and rating */}
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-black font-sans text-slate-900 leading-tight">
                    {listing.title}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded text-amber-700 font-bold border border-amber-100">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {listing.rating.toFixed(1)}
                    </span>
                    <span>({listing.reviewsCount} {language === 'ar' ? 'مراجعة' : 'reviews'})</span>
                  </div>
                </div>

                {/* Media Showcase (Main display + interactive thumbnails) */}
                <div className="space-y-3">
                  {(() => {
                    const galleryItems = listing.medias && listing.medias.length > 0 
                      ? listing.medias 
                      : [{ id: 'fallback', item_id: listing.id, url: listing.image, type: 'image' as const, field: 'main_image' }];
                    
                    const activeMedia = galleryItems[activeMediaIndex] || galleryItems[0];

                    return (
                      <>
                        {/* Selected Media Viewport */}
                        <div className="aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden bg-slate-900 border border-slate-150/60 shadow-sm relative flex items-center justify-center">
                          {activeMedia.type === 'video' ? (
                            <div className="w-full h-full relative bg-slate-950">
                              <video 
                                src={activeMedia.url} 
                                controls 
                                autoPlay={false} 
                                loop
                                className="w-full h-full object-contain"
                              />
                              <span className="absolute top-3 left-3 px-2 py-0.5 bg-slate-900/85 text-amber-400 font-mono font-bold text-[9px] rounded uppercase tracking-wider">
                                {language === 'ar' ? 'فيديو توضيحي' : 'Video Walkthrough'}
                              </span>
                            </div>
                          ) : (
                            <img 
                              src={activeMedia.url} 
                              alt={listing.title} 
                              referrerPolicy="no-referrer"
                              className="object-cover w-full h-full transition-transform duration-500 hover:scale-[1.01]"
                            />
                          )}
                        </div>

                        {/* Slide Thumbnails Tray (Only visible when multi media exists) */}
                        {galleryItems.length > 1 && (
                          <div className="flex gap-2.5 overflow-x-auto pb-1" id="listing-gallery-thumbnails">
                            {galleryItems.map((med, idx) => {
                              const isActive = idx === activeMediaIndex;
                              return (
                                <button
                                  type="button"
                                  key={med.id || idx}
                                  onClick={() => setActiveMediaIndex(idx)}
                                  className={`relative w-20 h-14 sm:w-24 sm:h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                                    isActive 
                                      ? 'border-emerald-500 scale-95 ring-2 ring-emerald-500/25' 
                                      : 'border-slate-150 hover:border-slate-350 opacity-80 hover:opacity-100'
                                  }`}
                                >
                                  {med.type === 'video' ? (
                                    <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center relative">
                                      <span className="text-xl">📹</span>
                                      <span className="text-[8px] font-black uppercase text-amber-400 absolute bottom-1">VIDEO</span>
                                    </div>
                                  ) : (
                                    <img 
                                      src={med.url} 
                                      alt="thumbnail" 
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Quick Price Actions Banner Card */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{t('price')}</span>
                    <span className="text-lg sm:text-2xl font-black text-amber-400">{formatPrice(listing.price, listing.actionType)}</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('booking')}
                    className="px-4 py-2 bg-white text-slate-900 rounded-xl text-xs font-black hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow"
                  >
                    <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
                    <span>{listing.actionType === 'buying' ? t('buyPack') : (language === 'ar' ? 'انتقل إلى حجز الخدمة' : 'Proceed to Booking')}</span>
                  </button>
                </div>

                {/* Detail text description & Category Matrix Attributes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  {/* Left block overview details */}
                  <div className="md:col-span-2 space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('overview')}</h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
                      {listing.description}
                    </p>

                    <div className="pt-2">
                      <div className="flex items-center gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100 max-w-sm">
                        <div className="w-8 h-8 rounded-full bg-slate-200/60 flex items-center justify-center border border-slate-300">
                          <User className="w-4 h-4 text-slate-700" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{t('listedBy')}</span>
                          <span className="text-xs font-bold text-slate-800">{listing.ownerName}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right block: Category dynamic attributes matrices */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('attributesMatrix')}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-2">
                      {Object.entries(listing.attributes).map(([key, val]) => {
                        const attributeLabelMap: Record<string, Record<string, string>> = {
                          transmission: { en: 'Transmission', ar: 'ناقل الحركة' },
                          fuelType: { en: 'Fuel Type', ar: 'نوع الوقود' },
                          seats: { en: 'Seats', ar: 'المقاعد والركاب' },
                          bedrooms: { en: 'Bedrooms', ar: 'غرف النوم' },
                          bathrooms: { en: 'Bathrooms', ar: 'دورات المياه' },
                          areaSquareFeet: { en: 'Area (Sq Ft)', ar: 'المساحة لقدم' },
                          amenities: { en: 'Amenities', ar: 'المرافق والتكييف' },
                          condition: { en: 'Condition', ar: 'حالة السلعة' },
                          brand: { en: 'Brand', ar: 'الماركة والعلامة' },
                          warranty: { en: 'Warranty', ar: 'مدة الضمان' },
                          serviceDurationMinutes: { en: 'Duration (Mins)', ar: 'مدة الجلسة (دقائق)' },
                          professionalExperienceYears: { en: 'Experience (Yrs)', ar: 'سنوات الخبرة' },
                          languagesSpoken: { en: 'Languages Spoken', ar: 'لغات التواصل' }
                        };
                        const label = attributeLabelMap[key] ? (language === 'ar' ? attributeLabelMap[key].ar : attributeLabelMap[key].en) : key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        const formatVal = typeof val === 'boolean' ? (val ? (language === 'ar' ? 'نعم' : 'Yes') : (language === 'ar' ? 'لا' : 'No')) : val;
                        
                        return (
                          <div key={key} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex flex-col justify-center">
                            <span className="text-[9px] text-slate-400 font-bold uppercase">{label}</span>
                            <span className="text-xs font-bold text-slate-800 mt-0.5">
                              {formatVal}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

              {/* Tab 1: Automated Scheduling calendar and credit card processor */}
              {activeTab === 'booking' && (
                <motion.div
                  key="booking-workspace"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {bookingCompleted ? (
                    <div className="text-center py-10 px-4 space-y-4">
                      <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                        <CheckCircle className="w-10 h-10" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800">{t('securePaymentSuccess')}</h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        {t('invoiceGenerated')} <span className="font-mono font-bold text-slate-900">{bookingCompleted.booking.transactionId}</span>.
                      </p>
                      
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-left space-y-2 text-xs max-w-md mx-auto">
                        <div className="flex justify-between"><span className="text-slate-400">{language === 'ar' ? 'التاجر المسؤول:' : 'Merchant:'}</span> <span className="font-semibold text-slate-700">{listing.ownerName}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">{language === 'ar' ? 'التارخ المجدول:' : 'Scheduled Date:'}</span> <span className="font-semibold text-slate-700">{bookingCompleted.booking.bookingDate}</span></div>
                        {bookingCompleted.booking.bookingTimeSlot && (
                          <div className="flex justify-between"><span className="text-slate-400">{language === 'ar' ? 'موعد الجلسة:' : 'Time Slot:'}</span> <span className="font-semibold text-slate-700">{bookingCompleted.booking.bookingTimeSlot}</span></div>
                        )}
                        <div className="flex justify-between border-t border-slate-150 pt-2 font-bold text-slate-900"><span>{language === 'ar' ? 'المبلغ المدفوع (الضمان):' : 'Paid (Escrow):'}</span> <span>{formatPrice(listing.price, listing.actionType)}</span></div>
                      </div>

                      <button
                        id="back-to-listings"
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        {t('returnToListingsBtn')}
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleCheckout} className="space-y-6">
                      <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('price')}</span>
                          <h4 className="text-lg font-black text-slate-900">
                            {formatPrice(listing.price, listing.actionType)}
                          </h4>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Type</span>
                          <span className="block text-xs font-bold text-slate-700 uppercase">
                            {t(listing.actionType)}
                          </span>
                        </div>
                      </div>

                      {/* Scheduling section */}
                      {listing.actionType !== 'buying' && (
                        <div className="space-y-3.5">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            {t('selectDate')}
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {getUpcomingDays().map((dayStr) => {
                              const dateObj = new Date(dayStr);
                              const isBlocked = listing.availability.datesBlocked.includes(dayStr);
                              const isSelected = selectedDate === dayStr;
                              
                              const dayNum = dateObj.getDate();
                              const dayName = dateObj.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short' });

                              return (
                                <button
                                  type="button"
                                  key={dayStr}
                                  id={`cal-date-${dayStr}`}
                                  disabled={isBlocked}
                                  onClick={() => {
                                    setSelectedDate(dayStr);
                                    setSelectedSlot(''); // Reset slot on date change
                                  }}
                                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col justify-center items-center ${
                                    isBlocked 
                                      ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed' 
                                      : isSelected
                                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                                      : 'border-slate-150 hover:border-slate-300 text-slate-700 cursor-pointer'
                                  }`}
                                >
                                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">{dayName}</span>
                                  <span className="text-sm font-extrabold mt-0.5">{dayNum}</span>
                                  {isBlocked && <span className="text-[8px] uppercase mt-1 text-slate-400 font-black">{language === 'ar' ? 'ممتلئ' : 'Full'}</span>}
                                </button>
                              );
                            })}
                          </div>

                          {/* Hourly Slot Selector for appointments */}
                          {listing.actionType === 'booking' && selectedDate && (
                            <div className="space-y-2 mt-4">
                              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                {t('availableServiceHours')}
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {listing.availability.hourlySlots?.map(h => {
                                  const slotId = `${selectedDate}T${h}`;
                                  const isSlotBlocked = listing.availability.datesBlocked.includes(slotId);
                                  const isSlotSelected = selectedSlot === h;

                                  return (
                                    <button
                                      type="button"
                                      key={h}
                                      id={`hour-slot-${h}`}
                                      disabled={isSlotBlocked}
                                      onClick={() => setSelectedSlot(h)}
                                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                                        isSlotBlocked
                                          ? 'bg-slate-50 border-slate-100 text-slate-350 cursor-not-allowed'
                                          : isSlotSelected
                                          ? 'bg-slate-900 border-slate-900 text-white'
                                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                                      }`}
                                    >
                                      {h} {isSlotBlocked ? (language === 'ar' ? '(محجوز)' : '(Booked)') : ""}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Secure credit card checkouts form */}
                      <div className="space-y-4 pt-4 border-t border-slate-100">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-emerald-500" />
                          {t('secureEscrowGateway')}
                        </label>

                        <div className="space-y-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-750 rounded uppercase">{t('sandboxMode')}</span>
                            <span>{t('testCardDesc')} 4242 4242 ...</span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-405">{t('cardNumber')}</span>
                            <input 
                              id="payment-card-number"
                              type="text" 
                              required
                              placeholder="4242 4242 4242 4242"
                              value={cardNumber}
                              maxLength={19}
                              onChange={(e) => setCardNumber(e.target.value)}
                              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 transition-colors"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-2.5">
                            <div className="col-span-2 space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-405">{t('holderName')}</span>
                              <input 
                                id="payment-card-holder"
                                type="text" 
                                required
                                placeholder="J. DOE"
                                value={cardHolder}
                                onChange={(e) => setCardHolder(e.target.value)}
                                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 transition-colors"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-450">{t('expiry')}</span>
                              <input 
                                id="payment-card-expiry"
                                type="text" 
                                required
                                placeholder="MM/YY"
                                value={cardExpiry}
                                maxLength={5}
                                onChange={(e) => setCardExpiry(e.target.value)}
                                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white placeholder-slate-400 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2.5">
                            <div className="col-span-1 space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-450">CVV / CVC</span>
                              <input 
                                id="payment-card-cvc"
                                type="password" 
                                required
                                placeholder="123"
                                value={cardCvc}
                                maxLength={3}
                                onChange={(e) => setCardCvc(e.target.value)}
                                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white placeholder-slate-400 focus:outline-none"
                              />
                            </div>
                            <div className="col-span-2 flex items-end">
                              <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold h-9 pb-2 pl-1">
                                <span>🔒 {language === 'ar' ? 'تشفر SSL آمن 256 بت' : '256-Bit SSL Secured'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {paymentError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 shrink-0" />
                          <span>{paymentError}</span>
                        </div>
                      )}

                      <button
                        id="submit-payment"
                        type="submit"
                        disabled={isSubmittingPayment}
                        className="w-full py-3 text-xs uppercase font-extrabold tracking-wider bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:bg-slate-400 transition-colors cursor-pointer flex items-center justify-center gap-2 shadow"
                      >
                        {isSubmittingPayment 
                          ? (language === 'ar' ? 'جاري تأمين تفاصيل الدفع والضمان...' : 'Securing Transaction...') 
                          : `${t('processEscrow')} • ${formatPrice(listing.price, listing.actionType)}`}
                      </button>
                    </form>
                  )}
                </motion.div>
              )}

              {/* Tab 2: Real-time Messages timeline workspace with organic automated prompt responses */}
              {activeTab === 'chat' && (
                <motion.div
                  key="chat-workspace"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col h-[500px]"
                >
                  <div className="bg-slate-55 p-3 rounded-xl border border-slate-100 flex items-center justify-between mb-3 text-xs bg-slate-50">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5 font-sans">
                      <Clock className="w-3.5 h-3.5 animate-pulse text-emerald-500" />
                      {language === 'ar' ? 'البث المباشر للمحادثة الفورية' : 'Conversation Live Thread Simulation'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{language === 'ar' ? 'نشط الآن' : 'Poll active'}</span>
                  </div>

                  {/* Messages Timeline */}
                  <div className="flex-1 overflow-y-auto space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 mb-4 max-h-[350px]">
                    {messages.length === 0 ? (
                      <div className="text-center py-10 space-y-1">
                        <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="text-xs font-bold text-slate-500">{language === 'ar' ? 'لا توجد رسائل سابقة' : 'No previous messages'}</p>
                        <p className="text-[10px] text-slate-400">{language === 'ar' ? 'ابدأ الاستفسار. عادة ما يقوم المضيف بالرد خلال ثوانٍ!' : 'Initiate inquiry. Host usually replies in seconds!'}</p>
                      </div>
                    ) : (
                      messages.map((m, idx) => {
                        const isMe = m.senderId === 'customer';
                        const isMerchant = m.senderId === listing.ownerId;
                        return (
                          <div 
                            key={m.id || idx} 
                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                          >
                            <span className="text-[9px] font-bold text-slate-400 px-1 mb-0.5">
                              {isMe ? (language === 'ar' ? 'أنت' : 'You') : m.senderName}
                            </span>
                            <div className={`p-3 max-w-[85%] rounded-2xl text-xs leading-normal shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${
                              isMe 
                                ? 'bg-slate-900 text-white rounded-br-none' 
                                : 'bg-white border border-slate-150 text-slate-800 rounded-bl-none'
                            }`}>
                              {m.text}
                            </div>
                            <span className="text-[8px] text-slate-400 px-1 mt-0.5">
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Reply Input Form */}
                  <form onSubmit={handleSendChat} className="flex gap-2.5">
                    <input
                      id="chat-message-inp"
                      type="text"
                      className="flex-1 p-3 text-xs bg-slate-50 border border-slate-205 rounded-xl placeholder-slate-400 font-medium focus:outline-none focus:border-slate-400 focus:bg-white transition-all text-slate-850"
                      placeholder={language === 'ar' ? 'احصل على رد فوري، اكتب تفاصيل سؤالك هنا...' : 'Ask the host a custom question...'}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button
                      id="chat-send-btn"
                      type="submit"
                      className="p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </motion.div>
              )}

              {/* Tab 3: Reviews timeline submission form and results dashboard */}
              {activeTab === 'reviews' && (
                <motion.div
                  key="reviews-workspace"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <h3 className="font-semibold text-sm text-slate-900 border-b border-rose-50/10 pb-2">
                    {language === 'ar' ? 'تقديم المراجعات وتوثيق التقييم' : 'Submit User Feedback & Verification'}
                  </h3>

                  {/* Add Review inline form */}
                  <form onSubmit={handlePostReview} className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-700">{language === 'ar' ? 'اختر التقييم:' : 'Choose Rating:'}</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            type="button"
                            key={s}
                            id={`rating-star-btn-${s}`}
                            onClick={() => setNewRating(s)}
                            className="p-0.5 text-amber-400 flex cursor-pointer"
                          >
                            <Star className={`w-5 h-5 ${s <= newRating ? 'fill-amber-400 animate-pulse' : 'text-slate-350'}`} />
                          </button>
                        ))}
                      </div>
                      <span className="text-xs font-bold text-slate-800 font-mono">({newRating}/5 {language === 'ar' ? 'نجوم' : 'Stars'})</span>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400">{language === 'ar' ? 'تعليقات وملاحظات المراجعة' : 'Review Comments'}</span>
                      <textarea
                        id="review-comment-inp"
                        className="w-full text-xs p-3 min-h-[70px] border border-slate-200 bg-white rounded-xl focus:outline-none text-slate-800"
                        placeholder={language === 'ar' ? 'اكتب مراجعتك الصادقة والبناءة بخصوص موعد تقديم الخدمة أو جودتها...' : 'Draft your honest constructive feedback regarding booking transactions or service handovers...'}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      />
                    </div>

                    {reviewError && <p className="text-[11px] text-rose-500 font-semibold">{reviewError}</p>}
                    {reviewSuccess && <p className="text-[11px] text-emerald-600 font-semibold">{language === 'ar' ? '✓ تم إرسال مراجعتك بنجاح! تم احتساب التقييم الجديد.' : '✓ Review appended! Average scores updated.'}</p>}

                    <button
                      id="submit-review-btn"
                      type="submit"
                      className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 cursor-pointer"
                    >
                      {language === 'ar' ? 'نشر التقييم والتعليق' : 'Publish Review'}
                    </button>
                  </form>

                  {/* Published Review Lists */}
                  <div className="space-y-3.5 mt-6">
                    <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold">{language === 'ar' ? 'مراجعات وتقييمات العملاء السابقين' : 'Feedback history'} ({reviews.length})</h4>
                    {reviews.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">{language === 'ar' ? 'لا توجد تقييمات بعد. كن أول من يكتب مراجعة للخدمة!' : 'No ratings yet. Be the absolute first to submit a review!'}</p>
                    ) : (
                      reviews.map((r, idx) => (
                        <div key={r.id || idx} className="bg-white p-4 rounded-xl border border-slate-100 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-extrabold text-slate-800">{r.userName}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(r.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                            </span>
                          </div>
                          
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-205'}`} />
                            ))}
                          </div>

                          <p className="text-xs text-slate-600 italic leading-relaxed">"{r.comment}"</p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
      </motion.div>
    </div>
  );
}
