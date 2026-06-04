/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, CreditCard, ShoppingBag, Landmark, ArrowRight, 
  MessageCircle, XCircle, RefreshCw, Layers, ShieldCheck, Mail, Shield
} from 'lucide-react';
import { Booking, PaymentTransaction, Listing, DashboardHistory } from '../types';
import { useLocalization, exchangeRates } from '../localization';

interface DashboardViewProps {
  currentUserEmail: string;
  onOpenListingChat: (listing: Listing) => void;
  allListings: Listing[]; // Parent listings list to help open chat
  currentUserRole?: 'admin' | 'user';
  onNavigateToAdmin?: () => void;
}

export function DashboardView({ 
  currentUserEmail, 
  onOpenListingChat, 
  allListings,
  currentUserRole,
  onNavigateToAdmin
}: DashboardViewProps) {
  const { language, t, formatPrice, setCurrency, detectedLocale } = useLocalization();
  const [history, setHistory] = useState<DashboardHistory | null>(null);
  const [activeTab, setActiveTab] = useState<'bookings' | 'sales' | 'payments' | 'my-listings'>('bookings');
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    fetchDashboardDetails();
  }, [currentUserEmail]);

  const fetchDashboardDetails = async () => {
    setIsLoading(true);
    setActionError('');
    try {
      const res = await fetch(`/api/dashboard?email=${encodeURIComponent(currentUserEmail)}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      } else {
        setActionError("Failed to fetch dashboard data.");
      }
    } catch (e) {
      setActionError("Network offline.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    const confirmMsg = language === 'ar' 
      ? "هل أنت متأكد من إلغاء هذا الحجز وتحرير المواعيد المحجوزة؟ لا يمكن التراجع عن هذا الإجراء."
      : "Are you sure you want to cancel this booking and release the scheduled date/time slot? This cannot be undone.";
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST"
      });
      if (res.ok) {
        fetchDashboardDetails();
      } else {
        const err = await res.json();
        alert(err.error || (language === 'ar' ? "فشل إلغاء الحجز." : "Failed to cancel booking."));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading && !history) {
    return (
      <div className="py-20 text-center space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-slate-405 mx-auto" />
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
          {language === 'ar' ? 'جاري تجميع وإعداد مصفوفة لوحة التحكم...' : 'Compiling Dashboard Metrics...'}
        </p>
      </div>
    );
  }

  const bookings = history?.bookings || [];
  const transactions = history?.transactions || [];
  const myListings = history?.myListings || [];
  const myListingsBookings = history?.myListingsBookings || [];

  // Derived financials
  const totalSpent = transactions.reduce((sum, t) => sum + (t.status === 'success' ? t.amount : 0), 0);
  const totalSalesRevenue = myListingsBookings.reduce((sum, b) => sum + (b.status === 'confirmed' ? b.pricePaid : 0), 0);

  return (
    <div id="dashboard-workspace-container" className="space-y-6">

      {/* User Header & Currency preferences */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4.5 shadow-sm hover:shadow-[0_4px_24px_rgba(0,0,0,0.01)] transition-shadow">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0 flex-1 lg:flex-none justify-between sm:justify-start">
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">{language === 'ar' ? 'معلومات الحساب النشط' : 'Active Account Profile'}</span>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 mt-1 font-mono flex items-center gap-1.5 break-all">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping shrink-0" />
              <span className="truncate">{currentUserEmail}</span>
            </h2>
          </div>

          {currentUserRole === 'admin' && onNavigateToAdmin && (
            <button
              id="btn-admin-switch-dashboard"
              onClick={onNavigateToAdmin}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-black rounded-xl cursor-pointer transition-all flex items-center gap-1.5 justify-center self-stretch sm:self-center shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.05)] w-full sm:w-auto"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'الذهاب لصفحة المسؤول (لوحة الإشراف)' : 'Admin Control Panel'}</span>
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center bg-slate-50/50 p-3 rounded-2xl border border-slate-100 w-full lg:w-auto justify-between min-w-0 shrink-0">
          <div className="shrink-0 space-y-0.5">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">{t('currencyPref')}</span>
            <span className="text-[10px] text-slate-500 font-medium hidden sm:block max-w-[280px] leading-tight">{t('currencyPrefSub')}</span>
          </div>

          <div className="relative w-full sm:w-auto min-w-0">
            <select
              id="user-currency-selector"
              value={detectedLocale.currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="text-xs font-bold font-mono text-slate-800 bg-white border border-slate-200 pl-3 pr-8 py-2 rounded-xl focus:outline-slate-300 focus:border-slate-300 cursor-pointer shadow-sm w-full sm:w-60 appearance-none"
            >
              {Object.entries(exchangeRates).map(([code, config]) => (
                <option key={code} value={code}>
                  {code} ({config.symbol}) - {config.name}
                </option>
              ))}
            </select>
            <div className={`absolute ${language === 'ar' ? 'left-3' : 'right-3'} top-3 pointer-events-none text-slate-400 text-[10px]`}>
              ▼
            </div>
          </div>
        </div>
      </div>
      
      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="p-3 bg-slate-900 text-white rounded-xl">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{language === 'ar' ? 'حجوزاتي وحساباتي' : 'My Reservations'}</span>
            <span className="text-xl font-bold text-slate-800">{bookings.length} {language === 'ar' ? 'حجز' : 'Orders'}</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{language === 'ar' ? 'إجمالي المشتريات والمدفوعات' : 'Total Spent (USD)'}</span>
            <span className="text-xl font-black text-slate-800">{formatPrice(totalSpent, 'buying')}</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-105">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{language === 'ar' ? 'خدماتي وعروضي المنشورة' : 'My Published Listings'}</span>
            <span className="text-xl font-bold text-slate-800">{myListings.length} {language === 'ar' ? 'نشط' : 'Active'}</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{language === 'ar' ? 'مبيعاتي وأرباحي كتاجر' : 'Merchant Sales (USD)'}</span>
            <span className="text-xl font-black text-amber-700">{formatPrice(totalSalesRevenue, 'buying')}</span>
          </div>
        </div>
      </div>

      {actionError && (
        <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-xl border border-rose-100">
          {actionError}
        </div>
      )}

      {/* Workspace Inner Tabs */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
        <div className="flex border-b border-slate-100 pb-4 mb-6 overflow-x-auto gap-2">
          <button
            id="dash-tab-bookings"
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
              activeTab === 'bookings' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {language === 'ar' ? 'سجل حجوزاتي' : 'My Booking History'} ({bookings.length})
          </button>
          
          <button
            id="dash-tab-listings"
            onClick={() => setActiveTab('my-listings')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
              activeTab === 'my-listings' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {language === 'ar' ? 'خدماتي المنشورة' : 'My Published Catalog'} ({myListings.length})
          </button>

          <button
            id="dash-tab-sales"
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
              activeTab === 'sales' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {language === 'ar' ? 'طلبات الحجز المستلمة' : 'Reservations Received'} ({myListingsBookings.length})
          </button>

          <button
            id="dash-tab-payments"
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
              activeTab === 'payments' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {language === 'ar' ? 'دفتر الفواتير والمدفوعات' : 'Invoices & Payments Ledger'} ({transactions.length})
          </button>
        </div>

        {/* Tab content switcher */}
        <div className="min-h-[250px]">
          
          {/* Tab 1: Personal Bookings List with interactive cancellations and chats */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              {bookings.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-1">
                  <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold">{language === 'ar' ? 'لا توجد حجوزات خدمات مسجلة بعد.' : 'No active service reservations logged.'}</p>
                  <p className="text-[10px]">{language === 'ar' ? 'اختر سيارة أو عقاراً أو موعداً طبياً وسجله فوراً!' : 'Select a car, rental penthouse or dentist appointment from home and register!'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bookings.map((b) => (
                    <div key={b.id} className="border border-slate-105 p-4 rounded-2xl flex gap-3 bg-white hover:border-slate-300 transition-all">
                      <img 
                        src={b.listingImage} 
                        alt={b.listingTitle} 
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-xl object-cover border border-slate-50"
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{b.listingTitle}</h4>
                          <span className={`px-2 py-0.5 text-[8px] font-black tracking-wider rounded uppercase ${
                            b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
                          }`}>
                            {language === 'ar' ? (b.status === 'confirmed' ? 'مؤكد' : 'ملغي') : b.status}
                          </span>
                        </div>
                        
                        <div className="text-[10px] text-slate-500 space-y-0.5">
                          <div>📅 {language === 'ar' ? 'التاريخ:' : 'Date:'} <strong>{b.bookingDate}</strong></div>
                          {b.bookingTimeSlot && <div>🕒 {language === 'ar' ? 'موعد الجلسة:' : 'Time slot:'} <strong>{b.bookingTimeSlot}</strong></div>}
                          <div>🪙 {language === 'ar' ? 'مبلغ الضمان:' : 'Cost:'} <strong>{formatPrice(b.pricePaid, 'buying')}</strong></div>
                        </div>

                        {/* Interactive actions for bookings */}
                        <div className="flex gap-2 pt-2 border-t border-slate-50 mt-2">
                          <button
                            id={`cancel-booking-btn-${b.id}`}
                            disabled={b.status === 'cancelled'}
                            onClick={() => handleCancelBooking(b.id)}
                            className="px-2.5 py-1 text-[9px] font-bold text-slate-500 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 rounded-lg transition-colors border border-slate-100 disabled:opacity-50 disabled:hover:text-slate-500 disabled:hover:bg-slate-50 cursor-pointer"
                          >
                            {language === 'ar' ? 'إلغاء الحجز والطلب' : 'Cancel Reservation'}
                          </button>
                          
                          <button
                            id={`inquire-chat-booking-${b.id}`}
                            onClick={() => {
                              const matchListing = allListings.find(l => l.id === b.listingId);
                              if (matchListing) onOpenListingChat(matchListing);
                              else alert(language === 'ar' ? "فشل العثور على بيانات الخدمة. يرجى التواصل مع الدعم." : "Core listing data not found. Please contact support.");
                            }}
                            className="px-2.5 py-1 text-[9px] font-bold text-slate-900 hover:text-white bg-slate-100 hover:bg-slate-900 rounded-lg transition-colors flex items-center gap-1 border border-slate-100 cursor-pointer"
                          >
                            <MessageCircle className="w-3 h-3" /> {language === 'ar' ? 'مراسلة المسؤول' : 'Chat Host'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: My Published Listings */}
          {activeTab === 'my-listings' && (
            <div className="space-y-4">
              {myListings.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-1">
                  <Layers className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold">{language === 'ar' ? 'لم تقم بإضافة أو نشر أي خدمات محلية بعد.' : "You haven't cataloged any local services yet."}</p>
                  <p className="text-[10px]">{language === 'ar' ? 'استخدم زر "نشر الخدمة والسلع" في شريط الأدوات للإعلان عن أول عرض لك بجميع التفاصيل!' : 'Use the "Publish Service" toolbar button to register the first listing using HivePress attributes.'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myListings.map((l) => (
                    <div key={l.id} className="border border-slate-100 p-4 rounded-2xl flex justify-between items-center bg-white hover:border-slate-205 transition-colors">
                      <div className="flex items-center gap-3">
                        <img 
                          src={l.image} 
                          alt={l.title} 
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{l.title}</h4>
                          <span className="text-[9px] text-slate-405 font-mono uppercase">{t(l.category === 'real-estate' ? 'properties' : l.category)} • {formatPrice(l.price, l.actionType)}</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                        ★ {l.rating.toFixed(1)} ({l.reviewsCount})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Sales Bookings made on owner's items */}
          {activeTab === 'sales' && (
            <div className="space-y-4">
              {myListingsBookings.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-1">
                  <Landmark className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold">{language === 'ar' ? 'لم يتم جدولة أي حجوزات لضيوفك أو عملائك بشكل آمن بعد.' : 'No guest reservations have been secure-scheduled yet.'}</p>
                  <p className="text-[10px]">{language === 'ar' ? 'عندما يشتري العملاء خدماتك أو يستأجرون ممتلكاتك، ستظهر مواعيدهم المجدولة هنا!' : 'When clients purchase or rent your published assets, their schedule blocks list here!'}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-550 uppercase tracking-widest text-[9px] font-black border-b border-slate-100">
                      <tr>
                        <th className="p-3">{language === 'ar' ? 'عنوان الخدمة / السلعة' : 'Listing Title'}</th>
                        <th className="p-3">{language === 'ar' ? 'البريد الإلكتروني للعميل' : 'Client Email'}</th>
                        <th className="p-3">{language === 'ar' ? 'الموعد المحدد' : 'Target Date'}</th>
                        <th className="p-3">{language === 'ar' ? 'الأرباح' : 'Payout'}</th>
                        <th className="p-3">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {myListingsBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-800">{b.listingTitle}</td>
                          <td className="p-3 flex items-center gap-1.5 font-mono text-[10px]">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {b.userEmail}
                          </td>
                          <td className="p-3 font-medium">
                            {b.bookingDate} {b.bookingTimeSlot ? (language === 'ar' ? ` في ${b.bookingTimeSlot}` : ` at ${b.bookingTimeSlot}`) : ''}
                          </td>
                          <td className="p-3 font-bold text-slate-900">{formatPrice(b.pricePaid, 'buying')}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-500'
                            }`}>
                              {language === 'ar' ? (b.status === 'confirmed' ? 'مؤكد' : 'ملغي') : b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Payments and card transaction ledgers */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-1">
                  <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold">{language === 'ar' ? 'لا توجد قيود لمعاملات الخصم الفورية.' : 'No debit transaction records resolved.'}</p>
                  <p className="text-[10px]">{language === 'ar' ? 'قم بإجراء عملية دفع آمنة واختبر المحاكاة للخصم هنا.' : 'Perform premium checkouts to trigger payment ledger listings.'}</p>
                </div>
              ) : (
                <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-550 border-b border-slate-100 font-bold uppercase text-[9px] tracking-wider">
                      <tr>
                        <th className="p-3">{language === 'ar' ? 'رقم المعاملة' : 'Transaction ID'}</th>
                        <th className="p-3">{language === 'ar' ? 'السلعة / الأصل' : 'Listing Asset'}</th>
                        <th className="p-3">{language === 'ar' ? 'تاريخ التسوية الفورية' : 'Settlement Date'}</th>
                        <th className="p-3">{language === 'ar' ? 'رقم البطاقة' : 'Card Used'}</th>
                        <th className="p-3 text-right">{language === 'ar' ? 'المبلغ المخصوم' : 'Debit Sum'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-750">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-800">{tx.id}</td>
                          <td className="p-3 font-sans truncate max-w-[150px]">{tx.listingTitle}</td>
                          <td className="p-3 text-slate-500">{new Date(tx.createdAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</td>
                          <td className="p-3 text-slate-600">•••• {tx.cardLast4}</td>
                          <td className="p-3 text-right font-bold text-emerald-600">{formatPrice(tx.amount, 'buying')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
