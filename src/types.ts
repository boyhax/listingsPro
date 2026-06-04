/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ListingCategory = 'cars' | 'real-estate' | 'products' | 'services';
export type ListingActionType = 'booking' | 'renting' | 'buying';

export interface ListingMedia {
  id: string;
  item_id: string; // foreign key referencing item / listing id
  url: string;     // media URL (image or video path)
  type: 'image' | 'video';
  field: string;   // e.g. 'gallery', 'video_showcase', 'main_image'
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  category: ListingCategory;
  actionType: ListingActionType;
  price: number; // For 'buying' = total price; for 'renting' = price per day; for 'booking' = price per slot/hour
  image: string;
  medias?: ListingMedia[]; // linked from medias database
  ownerId: string;
  ownerName: string;
  location: string;
  rating: number;
  reviewsCount: number;
  createdAt: string;
  approvalStatus?: 'approved' | 'pending';
  // Dynamic custom attributes based on category
  attributes: {
    // Cars
    make?: string;
    model?: string;
    year?: number;
    mileage?: number;
    transmission?: 'Automatic' | 'Manual';
    fuelType?: 'Electric' | 'Gas' | 'Hybrid';
    
    // Real Estate
    propertyType?: 'Apartment' | 'House' | 'Office' | 'Studio';
    bedrooms?: number;
    bathrooms?: number;
    squareFeet?: number;
    furnished?: boolean;
    
    // Products
    condition?: 'New' | 'Like New' | 'Very Good' | 'Good' | 'Fair';
    brand?: string;
    warranty?: boolean;
    shippingAvailable?: boolean;
    
    // Services / Bookings
    durationMinutes?: number;
    experienceYears?: number;
    serviceProvider?: string;
    language?: string;
  };
  // Automated scheduling availability
  availability: {
    datesBlocked: string[]; // for renting / booking (fully blocked dates)
    hourlySlots?: string[];  // e.g. ["09:00", "11:00", "13:00", "15:00", "17:00"] for appointment services
  };
}

export interface Review {
  id: string;
  listingId: string;
  userName: string;
  userEmail: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Message {
  id: string;
  listingId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  pricePaid: number;
  bookingDate: string; // YYYY-MM-DD
  bookingTimeSlot?: string; // e.g. "09:00" if hourly appointment
  actionType: ListingActionType;
  paymentStatus: 'pending' | 'completed' | 'failed';
  transactionId: string;
  status: 'confirmed' | 'cancelled';
  userEmail: string;
  createdAt: string;
}

export interface PaymentTransaction {
  id: string;
  listingId: string;
  listingTitle: string;
  amount: number;
  cardLast4: string;
  buyerEmail: string;
  status: 'success' | 'failed';
  createdAt: string;
}

export interface DashboardHistory {
  bookings: Booking[];
  transactions: PaymentTransaction[];
  myListings: Listing[];
  myListingsBookings: Booking[];
}
