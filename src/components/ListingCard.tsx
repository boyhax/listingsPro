/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Star, MapPin, Tag, Car, Home, Package, CalendarDays } from 'lucide-react';
import { Listing } from '../types';
import { useLocalization } from '../localization';

interface ListingCardProps {
  listing: Listing;
  onClick: () => void;
}

export function ListingCard({ listing, onClick }: ListingCardProps) {
  const { t, formatPrice, language } = useLocalization();

  // Select dynamic icon based on category
  const getCategoryIcon = () => {
    switch (listing.category) {
      case 'cars':
        return <Car id="cat-icon-car" className="w-4 h-4 text-slate-700" />;
      case 'real-estate':
        return <Home id="cat-icon-home" className="w-4 h-4 text-slate-700" />;
      case 'products':
        return <Package id="cat-icon-pkg" className="w-4 h-4 text-slate-700" />;
      case 'services':
        return <CalendarDays id="cat-icon-cal" className="w-4 h-4 text-slate-700" />;
      default:
        return <Tag id="cat-icon-tag" className="w-4 h-4 text-slate-700" />;
    }
  };

  const getTranslatedCategory = () => {
    if (listing.category === 'real-estate') return t('properties');
    if (listing.category === 'cars') return t('cars');
    if (listing.category === 'products') return t('products');
    if (listing.category === 'services') return t('services');
    return listing.category;
  };

  return (
    <motion.div
      id={`listing-card-${listing.id}`}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.06)] transition-all cursor-pointer flex flex-col h-full"
    >
      {/* Listing Image & Price Banner */}
      <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
        <img
          src={listing.image}
          alt={listing.title}
          referrerPolicy="no-referrer"
          className="object-cover w-full h-full transition-transform duration-500 hover:scale-105"
        />
        <div className={`absolute top-3 ${language === 'ar' ? 'right-3' : 'left-3'} flex flex-wrap gap-1.5 pointer-events-none`}>
          <span className="px-2.5 py-1 text-[11px] font-medium tracking-wide uppercase bg-slate-900/90 backdrop-blur-md text-white rounded-full flex items-center gap-1.5 shadow-sm">
            {getCategoryIcon()}
            {getTranslatedCategory()}
          </span>
          <span className="px-2.5 py-1 text-[11px] font-medium tracking-wide uppercase bg-white/95 backdrop-blur-md text-slate-800 rounded-full shadow-sm">
            {t(listing.actionType)}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex flex-col flex-1 justify-between">
        <div className="space-y-2">
          {/* Rating and Meta info */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-slate-800">{listing.rating.toFixed(1)}</span>
              <span>({listing.reviewsCount})</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate max-w-[150px]">{listing.location}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-sans font-semibold text-base text-slate-900 line-clamp-1 group-hover:text-amber-600 transition-colors">
            {listing.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-slate-500 line-clamp-2 h-8 leading-snug">
            {listing.description}
          </p>
        </div>

        {/* Dynamic Multi-Attributes Row based on Category type */}
        <div className="my-4 pt-3.5 border-t border-slate-100 flex flex-wrap gap-2 text-[10px] font-medium text-slate-600">
          {listing.category === 'cars' && (
            <>
              <span className="px-2 py-0.5 bg-slate-50 rounded text-slate-700">{listing.attributes.make} {listing.attributes.model}</span>
              <span className="px-2 py-0.5 bg-slate-50 rounded text-slate-700">{listing.attributes.year}</span>
              <span className="px-2 py-0.5 bg-slate-50 rounded text-slate-700">{listing.attributes.fuelType}</span>
            </>
          )}
          {listing.category === 'real-estate' && (
            <>
              <span className="px-2 py-0.5 bg-slate-50 rounded text-slate-700">{listing.attributes.bedrooms} {language === 'ar' ? 'غرف نوم' : 'Beds'}</span>
              <span className="px-2 py-0.5 bg-slate-50 rounded text-slate-700">{listing.attributes.squareFeet} {language === 'ar' ? 'قدم مربع' : 'Sqft'}</span>
              <span className="px-2 py-0.5 bg-slate-50 rounded text-slate-700">{listing.attributes.propertyType}</span>
            </>
          )}
          {listing.category === 'products' && (
            <>
              <span className="px-2 py-0.5 bg-slate-50 rounded text-slate-700">{listing.attributes.condition}</span>
              <span className="px-2 py-0.5 bg-slate-50 rounded text-slate-700">{language === 'ar' ? 'ماركة:' : 'Brand:'} {listing.attributes.brand}</span>
            </>
          )}
          {listing.category === 'services' && (
            <>
              <span className="px-2 py-0.5 bg-slate-50 rounded text-slate-700">{listing.attributes.durationMinutes} {language === 'ar' ? 'دقيقة' : 'Mins'}</span>
              <span className="px-2 py-0.5 bg-slate-50 rounded text-slate-700">{language === 'ar' ? 'خبرة:' : 'Exp:'} {listing.attributes.experienceYears} {language === 'ar' ? 'سنوات' : 'yrs'}</span>
            </>
          )}
        </div>

        {/* Price Tag & Action Trigger */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{t('price')}</span>
            <span className="text-lg font-bold text-slate-900">
              {formatPrice(listing.price, listing.actionType)}
            </span>
          </div>
          <span className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors">
            {t('viewDetails')}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
