import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { GoogleGenAI } from "@google/genai";
import { Listing, Review, Message, Booking, PaymentTransaction, ListingCategory, ListingActionType, ListingMedia } from "./src/types";

const app = express();
const PORT = 3000;

app.use(express.json());

// ------------------------------------------------------------------
// SQLITE DATABASE INIALIZATION
// ------------------------------------------------------------------

const db = new Database("listings.db");
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS listings (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    category TEXT,
    action_type TEXT,
    price REAL,
    image TEXT,
    owner_id TEXT,
    owner_name TEXT,
    location TEXT,
    rating REAL,
    reviews_count INTEGER,
    created_at TEXT,
    approval_status TEXT,
    attributes_json TEXT,
    availability_json TEXT,
    country_slug TEXT,
    state_slug TEXT,
    city_slug TEXT,
    country_name TEXT,
    state_name TEXT,
    city_name TEXT,
    lat REAL,
    lon REAL
  );

  CREATE TABLE IF NOT EXISTS medias (
    id TEXT PRIMARY KEY,
    item_id TEXT,
    url TEXT,
    type TEXT,
    field TEXT
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    listing_id TEXT,
    user_name TEXT,
    user_email TEXT,
    rating INTEGER,
    comment TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    listing_id TEXT,
    listing_title TEXT,
    listing_image TEXT,
    price_paid REAL,
    booking_date TEXT,
    booking_time_slot TEXT,
    action_type TEXT,
    payment_status TEXT,
    transaction_id TEXT,
    status TEXT,
    user_email TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    listing_id TEXT,
    listing_title TEXT,
    amount REAL,
    card_last4 TEXT,
    buyer_email TEXT,
    status TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT,
    role TEXT,
    created_at TEXT,
    is_blocked INTEGER
  );

  CREATE TABLE IF NOT EXISTS search_history (
    id TEXT PRIMARY KEY,
    user_email TEXT,
    query TEXT,
    category TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS sent_emails (
    id TEXT PRIMARY KEY,
    campaign_name TEXT,
    subject TEXT,
    body TEXT,
    recipient_email TEXT,
    trigger_type TEXT,
    created_at TEXT
  );
`);

// Helper to convert string to slug
function toSlug(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accent accents
    .replace(/[^\w\s-]/g, "") // remove special characters
    .replace(/[\s_]+/g, "-") // replace spaces and underscores with hyphens
    .replace(/-+/g, "-"); // merge multi-hyphens
}

// ------------------------------------------------------------------
// SEEDING THE SQLITE DATABASE ON STARTUP
// ------------------------------------------------------------------

const countListings = db.prepare("SELECT COUNT(*) as count FROM listings").get() as { count: number };
if (countListings.count === 0) {
  // Seed Users
  const insertUser = db.prepare("INSERT OR IGNORE INTO users (id, email, name, role, created_at, is_blocked) VALUES (?, ?, ?, ?, ?, ?)");
  insertUser.run("usr-1", "facegoogl@gmail.com", "FaceGoogl Admin", "admin", new Date(Date.now() - 60*24*60*60*1000).toISOString(), 0);
  insertUser.run("usr-2", "owner-anna@earth.com", "Anna Novak", "user", new Date(Date.now() - 30*24*60*60*1000).toISOString(), 0);
  insertUser.run("usr-3", "buyer-sarah@jenkins.com", "Sarah Jenkins", "user", new Date(Date.now() - 15*24*60*60*1000).toISOString(), 0);
  insertUser.run("usr-4", "johan@sterling.co", "Johan Sterling", "user", new Date(Date.now() - 5*24*60*60*1000).toISOString(), 0);

  // Seed Search History
  const insertSearch = db.prepare("INSERT INTO search_history (id, user_email, query, category, created_at) VALUES (?, ?, ?, ?, ?)");
  insertSearch.run("sh-seed-1", "owner-anna@earth.com", "Audi", "cars", new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString());
  insertSearch.run("sh-seed-2", "buyer-sarah@jenkins.com", "Tesla", "cars", new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString());
  insertSearch.run("sh-seed-3", "johan@sterling.co", "Penthouse", "real-estate", new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString());
  insertSearch.run("sh-seed-4", "buyer-sarah@jenkins.com", "Dental", "services", new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString());

  // Seed Sent Emails
  const insertSeedEmail = db.prepare("INSERT INTO sent_emails (id, campaign_name, subject, body, recipient_email, trigger_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
  insertSeedEmail.run("email-seed-1", "Spring Greetings", "New listings matches for you!", "Hi Sarah,\n\nWe saw you searched for Audi. Check out our new Audi e-tron GT! Only $79k in London.", "buyer-sarah@jenkins.com", "auto-update", new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString());
  insertSeedEmail.run("email-seed-2", "System Maintenance Update", "Scheduled Platform Upgrades", "Dear users,\n\nWe are upgrading the servers tonight at 12:00 AM UTC. No downtime is expected.", "owner-anna@earth.com", "marketing", new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString());


  // Seed Listings
  const seedListingsData = [
    {
      id: "list-1",
      title: "Audi e-tron GT Premium Electric",
      description: "Mint condition fully electric sports saloon with Quattro all-wheel drive, carbon ceramic brakes, premium Bang & Olufsen sound, and beautiful matte gray wraps. Safe, rapid, and majestic.",
      category: "cars",
      action_type: "buying",
      price: 79900,
      image: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=800",
      owner_id: "owner-johan",
      owner_name: "Johan Sterling",
      location: "South Kensington, London",
      rating: 4.8,
      reviews_count: 14,
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      approval_status: "approved",
      attributes_json: JSON.stringify({
        make: "Audi",
        model: "e-tron GT",
        year: 2022,
        mileage: 12500,
        transmission: "Automatic",
        fuelType: "Electric"
      }),
      availability_json: JSON.stringify({ datesBlocked: [] }),
      country_slug: "united-kingdom",
      state_slug: "england",
      city_slug: "london",
      country_name: "United Kingdom",
      state_name: "England",
      city_name: "London",
      lat: 51.4941,
      lon: -0.1759
    },
    {
      id: "list-2",
      title: "Tesla Model Y Performance (Rent)",
      description: "Rent the ultimate electric SUV daily. Perfect for weekend getaways or family road trips. Autopilot enabled, clean interior, supercharger-ready, with instant acceleration and vast boot capacity.",
      category: "cars",
      action_type: "renting",
      price: 85,
      image: "https://images.unsplash.com/photo-1619767886558-efdf259cde1a?auto=format&fit=crop&q=80&w=800",
      owner_id: "owner-anna",
      owner_name: "Anna Novak",
      location: "Greenwich, London",
      rating: 4.9,
      reviews_count: 38,
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      approval_status: "approved",
      attributes_json: JSON.stringify({
        make: "Tesla",
        model: "Model Y",
        year: 2023,
        mileage: 4500,
        transmission: "Automatic",
        fuelType: "Electric"
      }),
      availability_json: JSON.stringify({ datesBlocked: ["2026-05-27", "2026-05-28", "2026-06-02"] }),
      country_slug: "united-kingdom",
      state_slug: "england",
      city_slug: "london",
      country_name: "United Kingdom",
      state_name: "England",
      city_name: "London",
      lat: 51.4826,
      lon: 0.0077
    },
    {
      id: "list-3",
      title: "Mid-Century Architectural Modernist Villa",
      description: "Prestige modernist house designed by award-winning architects. Features sweeping floor-to-ceiling glass windows, custom oak carpentry, direct private woodland access, full solar integration, and 4 magnificent master bedrooms.",
      category: "real-estate",
      action_type: "buying",
      price: 820000,
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
      owner_id: "owner-arch",
      owner_name: "Elite Estates",
      location: "Richmond Hills, Surrey",
      rating: 5.0,
      reviews_count: 6,
      created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      approval_status: "approved",
      attributes_json: JSON.stringify({
        propertyType: "House",
        bedrooms: 4,
        bathrooms: 3,
        squareFeet: 3200,
        furnished: true
      }),
      availability_json: JSON.stringify({ datesBlocked: [] }),
      country_slug: "united-kingdom",
      state_slug: "england",
      city_slug: "surrey",
      country_name: "United Kingdom",
      state_name: "England",
      city_name: "Surrey",
      lat: 51.2464,
      lon: -0.4735
    },
    {
      id: "list-4",
      title: "Downtown Luxury Sky Penthouse",
      description: "Breathtaking premium executive apartment in the heart of London. Sky-high floor offering panoramic London Eye and Thames views, wrap-around private terrace, dynamic visual kitchen, and full automated HVAC controls.",
      category: "real-estate",
      action_type: "renting",
      price: 250,
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=800",
      owner_id: "owner-johan",
      owner_name: "Johan Sterling",
      location: "Canary Wharf, London",
      rating: 4.7,
      reviews_count: 22,
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      approval_status: "approved",
      attributes_json: JSON.stringify({
        propertyType: "Apartment",
        bedrooms: 2,
        bathrooms: 2,
        squareFeet: 1100,
        furnished: true
      }),
      availability_json: JSON.stringify({ datesBlocked: ["2026-05-30", "2026-05-31", "2026-06-03"] }),
      country_slug: "united-kingdom",
      state_slug: "england",
      city_slug: "london",
      country_name: "United Kingdom",
      state_name: "England",
      city_name: "London",
      lat: 51.5054,
      lon: -0.0235
    },
    {
      id: "list-5",
      title: "iPhone 15 Pro Max 1TB - Titanium Grey",
      description: "Grade-A certified refurbished Apple iPhone. Completely clean, pristine casing, 100% battery capacity. Includes box, unopened USB-C nylon cable, and 12-month direct merchant warranty.",
      category: "products",
      action_type: "buying",
      price: 950,
      image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80&w=800",
      owner_id: "owner-brent",
      owner_name: "Brent Electronics",
      location: "Soho, London",
      rating: 4.6,
      reviews_count: 19,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      approval_status: "approved",
      attributes_json: JSON.stringify({
        condition: "Like New",
        brand: "Apple",
        warranty: true,
        shippingAvailable: true
      }),
      availability_json: JSON.stringify({ datesBlocked: [] }),
      country_slug: "united-kingdom",
      state_slug: "england",
      city_slug: "london",
      country_name: "United Kingdom",
      state_name: "England",
      city_name: "London",
      lat: 51.5136,
      lon: -0.1365
    },
    {
      id: "list-6",
      title: "Executive Therapeutic Wellness & Spa Session",
      description: "Rejuvenate your physique with an tailored intensive clinical wellness session. Includes hot deep tissue therapy, holistic posture assessment, aromatic essential oils, and specialized spinal alignment steps.",
      category: "services",
      action_type: "booking",
      price: 120,
      image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800",
      owner_id: "owner-olivia",
      owner_name: "Olivia Wellness",
      location: "Mayfair, London",
      rating: 4.9,
      reviews_count: 47,
      created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      approval_status: "approved",
      attributes_json: JSON.stringify({
        durationMinutes: 60,
        experienceYears: 8,
        serviceProvider: "Olivia Thorne",
        language: "English"
      }),
      availability_json: JSON.stringify({
        datesBlocked: [],
        hourlySlots: ["09:00", "11:00", "13:00", "15:00", "17:00"]
      }),
      country_slug: "united-kingdom",
      state_slug: "england",
      city_slug: "london",
      country_name: "United Kingdom",
      state_name: "England",
      city_name: "London",
      lat: 51.5115,
      lon: -0.1475
    },
    {
      id: "list-7",
      title: "Premium Dental Scaling & Oral Health Diagnostic",
      description: "Get pristine oral health with custom ultrasonic dental hygiene scaling, stain whitening blast, panoramic digital oral X-ray, and a complete comprehensive diagnostic report from a clinical professional.",
      category: "services",
      action_type: "booking",
      price: 150,
      image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800",
      owner_id: "owner-sterling-dental",
      owner_name: "Sterling Dental",
      location: "Harley Street, London",
      rating: 4.9,
      reviews_count: 61,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      approval_status: "approved",
      attributes_json: JSON.stringify({
        durationMinutes: 45,
        experienceYears: 12,
        serviceProvider: "Dr. Arthur Sterling",
        language: "English, Spanish"
      }),
      availability_json: JSON.stringify({
        datesBlocked: [],
        hourlySlots: ["10:00", "11:00", "14:00", "15:00", "16:00"]
      }),
      country_slug: "united-kingdom",
      state_slug: "england",
      city_slug: "london",
      country_name: "United Kingdom",
      state_name: "England",
      city_name: "London",
      lat: 51.5204,
      lon: -0.1488
    }
  ];

  const insertListing = db.prepare(`
    INSERT INTO listings (
      id, title, description, category, action_type, price, image, owner_id, owner_name, location, rating, reviews_count, created_at, approval_status, attributes_json, availability_json, country_slug, state_slug, city_slug, country_name, state_name, city_name, lat, lon
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  for (const l of seedListingsData) {
    insertListing.run(
      l.id, l.title, l.description, l.category, l.action_type, l.price, l.image, l.owner_id, l.owner_name, l.location, l.rating, l.reviews_count, l.created_at, l.approval_status, l.attributes_json, l.availability_json, l.country_slug, l.state_slug, l.city_slug, l.country_name, l.state_name, l.city_name, l.lat, l.lon
    );
  }

  // Seed Medias
  const insertMedia = db.prepare("INSERT INTO medias (id, item_id, url, type, field) VALUES (?, ?, ?, ?, ?)");
  insertMedia.run("med-1", "list-1", "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=800", "image", "main_image");
  insertMedia.run("med-2", "list-1", "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=800", "image", "gallery");
  insertMedia.run("med-3", "list-1", "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", "video", "video_showcase");
  
  insertMedia.run("med-4", "list-2", "https://images.unsplash.com/photo-1619767886558-efdf259cde1a?auto=format&fit=crop&q=80&w=800", "image", "main_image");
  insertMedia.run("med-5", "list-2", "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=800", "image", "gallery");
  insertMedia.run("med-6", "list-2", "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", "video", "video_showcase");

  insertMedia.run("med-7", "list-3", "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800", "image", "main_image");
  insertMedia.run("med-8", "list-3", "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800", "image", "gallery");
  insertMedia.run("med-9", "list-3", "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=800", "image", "gallery");
  insertMedia.run("med-10", "list-3", "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4", "video", "video_showcase");

  insertMedia.run("med-11", "list-4", "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=800", "image", "main_image");
  insertMedia.run("med-12", "list-4", "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800", "image", "gallery");
  insertMedia.run("med-13", "list-4", "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", "video", "video_showcase");

  insertMedia.run("med-14", "list-5", "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80&w=800", "image", "main_image");
  insertMedia.run("med-15", "list-5", "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800", "image", "gallery");

  insertMedia.run("med-16", "list-6", "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800", "image", "main_image");
  insertMedia.run("med-17", "list-6", "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&q=80&w=800", "image", "gallery");
  insertMedia.run("med-18", "list-6", "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", "video", "video_showcase");

  insertMedia.run("med-19", "list-7", "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800", "image", "main_image");
  insertMedia.run("med-20", "list-7", "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80&w=800", "image", "gallery");

  // Seed Reviews
  const insertReview = db.prepare("INSERT INTO reviews (id, listing_id, user_name, user_email, rating, comment, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
  insertReview.run("rev-1", "list-1", "Michael Drake", "michael@drake.com", 5, "Absolutely outstanding vehicle. Smooth handover, and the battery range is incredible. Premium seller!", new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString());
  insertReview.run("rev-2", "list-2", "Sarah Jenkins", "sarah@jenkins.com", 5, "Anna was extremely helpful with explaining supercharger setup. Highly responsive and car was impeccably clean.", new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString());
  insertReview.run("rev-3", "list-6", "Marcus Vane", "marcus@vane.net", 5, "Olivia has amazing healing magic. This posture correction session removed weeks of back tightness from office sitting.", new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString());

  // Seed Bookings
  const insertBooking = db.prepare(`
    INSERT INTO bookings (
      id, listing_id, listing_title, listing_image, price_paid, booking_date, booking_time_slot, action_type, payment_status, transaction_id, status, user_email, created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);
  insertBooking.run(
    "book-sample-1", "list-2", "Tesla Model Y Performance (Rent)", "https://images.unsplash.com/photo-1619767886558-efdf259cde1a?auto=format&fit=crop&q=80&w=800", 170, "2026-05-27", "", "renting", "completed", "tx_9988224411", "confirmed", "facegoogl@gmail.com", new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  );

  // Seed Transactions
  const insertTx = db.prepare("INSERT INTO transactions (id, listing_id, listing_title, amount, card_last4, buyer_email, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  insertTx.run("tx_9988224411", "list-2", "Tesla Model Y Performance (Rent)", 170, "4242", "facegoogl@gmail.com", "success", new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString());
}

// ------------------------------------------------------------------
// OTHER CONFIGURATION & LOGIC DATA
// ------------------------------------------------------------------

let collectionsList = [
  { 
    id: "col-1", 
    key: "cars", 
    title: "Cars & Vehicles", 
    description: "Automobiles, electric SUVs and sports cars",
    attributes: [
      { key: "make", label: "Make", type: "text", required: true },
      { key: "model", label: "Model", type: "text", required: true },
      { key: "year", label: "Year", type: "number", required: true },
      { key: "fuelType", label: "Fuel Type", type: "select", options: ["Electric", "Gas", "Hybrid", "Petrol", "Diesel"], required: true },
      { key: "mileage", label: "Mileage", type: "number", required: false }
    ]
  },
  { 
    id: "col-2", 
    key: "real-estate", 
    title: "Real Estate Properties", 
    description: "Modern penthouses, villas, and apartments",
    attributes: [
      { key: "propertyType", label: "Property Type", type: "select", options: ["Apartment", "House", "Office", "Studio"], required: true },
      { key: "bedrooms", label: "Bedrooms", type: "number", required: true },
      { key: "bathrooms", label: "Bathrooms", type: "number", required: true },
      { key: "squareFeet", label: "Square Footage", type: "number", required: true },
      { key: "furnished", label: "Furnished", type: "boolean", required: false }
    ]
  },
  { 
    id: "col-3", 
    key: "products", 
    title: "Digital Goods", 
    description: "Top brand electronics, phones, and items",
    attributes: [
      { key: "condition", label: "Condition", type: "select", options: ["New", "Like New", "Very Good", "Good", "Fair"], required: true },
      { key: "brand", label: "Brand", type: "text", required: true },
      { key: "warranty", label: "Warranty Included", type: "boolean", required: false },
      { key: "shippingAvailable", label: "Shipping Available", type: "boolean", required: false }
    ]
  },
  { 
    id: "col-4", 
    key: "services", 
    title: "Appointments & Services", 
    description: "Therapeutic massage and professional diagnostics",
    attributes: [
      { key: "durationMinutes", label: "Duration in Minutes", type: "number", required: true },
      { key: "experienceYears", label: "Experience in Years", type: "number", required: true },
      { key: "serviceProvider", label: "Service Provider Name", type: "text", required: false },
      { key: "language", label: "Service Language", type: "text", required: false }
    ]
  }
];

let marketplaceSettings = {
  platformFeePercentage: 12,
  escrowProtection: true,
  maintenanceMode: false,
  systemCurrency: "USD",
  allowGuestBookings: false
};

// Keep chat simulator in-memory for live response loops
let messages: Message[] = [
  {
    id: "msg-1",
    listingId: "list-2",
    senderId: "customer",
    senderName: "facegoogl@gmail.com",
    text: "Hi, does the Tesla Model Y include the mobile charging pack?",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "msg-2",
    listingId: "list-2",
    senderId: "owner-anna",
    senderName: "Anna Novak",
    text: "Yes, it does! There is a 3-pin residential charger and a Type 2 public charging cable in the sub-trunk.",
    createdAt: new Date(Date.now() - 1.9 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "msg-3",
    listingId: "list-6",
    senderId: "customer",
    senderName: "facegoogl@gmail.com",
    text: "Hi Olivia, are there any slots on Thursdays for wellness treatments?",
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "msg-4",
    listingId: "list-6",
    senderId: "owner-olivia",
    senderName: "Olivia Thorne",
    text: "Hi there! Yes, my calendar is up to date, you can click on the list item and select the Thurs slot that is free.",
    createdAt: new Date(Date.now() - 2.8 * 60 * 60 * 1000).toISOString()
  }
];

const merchantSmartReplies: Record<string, string[]> = {
  "list-1": [
    "Thank you for your interest in the e-tron GT. Yes, the battery degradation is only 2%, and it has always been garaged. Let me know if you would like to arrange a finance check or private viewing!",
    "Hi there, the Audi still has 3 years of manufacture warranty left. Happy to answer any questions about charging speed or provide video walkthroughs.",
    "Sure! Let me know if you'd like to proceed. All secure payments done through the marketplace handle escrow properly."
  ],
  "list-2": [
    "Hi! Yes, the car is pristine and fully valeted. I hope you enjoy your rental trip. If you select dates on the calendar and complete checking out, your dates will be blocked instantly.",
    "Supercharging fees are automatically calculated and billed directly to the app dashboard at the end of your rental. Super convenient!",
    "No problem, let me know if you have any questions regarding Tesla key-card access or navigation!"
  ],
  "list-3": [
    "Excellent selection! This Modernist Villa is incredibly beautiful in spring. Viewings are strictly by appointment. Would you like me to connect you with our lead broker?",
    "We can handle secure property transactions and escrow documentation right away. Let me know if you are cash buying or mortgage-approved!"
  ],
  "list-4": [
    "The Canary Wharf flat has high speed 1Gbps fiber broadband included in the rent price, perfectly suited for remote financial operations.",
    "Yes, the concierge service is 24/7. We support short-to-medium leases. Is your target move-in date flexible?"
  ],
  "list-5": [
    "Certified pristine 12-month Apple warranty is included. We pack with premium safety foam and ship out via DHL next-day express.",
    "Yes, the Apple ID lock has been removed and reset. Fully ready for clean setup!"
  ],
  "list-6": [
    "Hello! I customize every therapy to your physical history. Your requested automated booking is secure and slots are updated dynamically.",
    "I'll prepare specific aromatic organic scrubs and therapy tables for your upcoming chosen time. Looking forward to hosting you!"
  ],
  "list-7": [
    "We use extremely safe non-invasive high efficiency ultrasonic scaling. Perfect if you have tooth sensitivities!",
    "Thank you for choosing Sterling Dental. Your appointment will be logged in your local services dashboard history instantly."
  ]
};

// ------------------------------------------------------------------
// NOMINATIM HELPER FUNCTIONS
// ------------------------------------------------------------------

async function fetchOSMDetails(query: string): Promise<any | null> {
  let cleaned = query.trim();
  // Strip title prefix logic, e.g. "BMW in السيب" -> "السيب"
  const matchIn = cleaned.match(/(.+?)\s+(in|في)\s+(.+)/i);
  if (matchIn) {
    cleaned = matchIn[3].trim();
  }

  if (!cleaned) return null;

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleaned)}&format=jsonv2&addressdetails=1&accept-language=en&limit=1`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "GlobalListingsLocationSystem/1.0 (facegoogl@gmail.com)"
      }
    });

    if (response.ok) {
      const data = await response.json() as any[];
      if (data && data.length > 0) {
        return data[0];
      }
    }
  } catch (err) {
    console.error("OSM nominatim retrieval failed for query:", cleaned, err);
  }
  return null;
}

// ------------------------------------------------------------------
// API ENDPOINTS
// ------------------------------------------------------------------

// Location Dropdown Autocomplete Endpoint
app.get("/api/locations/autocomplete", async (req, res) => {
  const { q } = req.query;
  if (!q || typeof q !== "string" || q.trim().length === 0) {
    return res.json([]);
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=jsonv2&addressdetails=1&accept-language=en&limit=10`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "GlobalListingsLocationSystem/1.0 (facegoogl@gmail.com)"
      }
    });

    if (response.ok) {
      const candidates = await response.json() as any[];
      const results = candidates.map(c => {
        const addr = c.address || {};
        const cityName = addr.city || addr.town || addr.village || addr.suburb || addr.municipality || addr.city_district;
        const isValid = !!cityName;

        return {
          display_name: c.display_name,
          lat: parseFloat(c.lat),
          lon: parseFloat(c.lon),
          country_name: addr.country || "",
          state_name: addr.state || addr.region || "",
          city_name: cityName || "",
          country_slug: toSlug(addr.country || ""),
          state_slug: toSlug(addr.state || addr.region || ""),
          city_slug: toSlug(cityName || ""),
          isValid
        };
      });
      return res.json(results);
    } else {
      return res.json([]);
    }
  } catch (err) {
    console.error("Autocomplete error:", err);
    return res.json([]);
  }
});

// Explicit Location Validator
app.post("/api/locations/validate", async (req, res) => {
  const { location } = req.body;
  if (!location || typeof location !== "string" || location.trim().length === 0) {
    return res.status(400).json({ valid: false, error: "Location text query is required." });
  }

  // Support Remote bypassing
  if (location.toLowerCase().trim() === 'remote' || location.trim() === 'عن بعد') {
    return res.json({
      valid: true,
      geo: {
        country_name: "World",
        state_name: "Internet",
        city_name: "Remote",
        country_slug: "world",
        state_slug: "internet",
        city_slug: "remote",
        lat: 0,
        lon: 0
      }
    });
  }

  const match = await fetchOSMDetails(location);
  if (!match) {
    return res.status(400).json({ 
      valid: false, 
      error: "Location could not be verified on the map system. Please refine your street address or city name." 
    });
  }

  const addr = match.address || {};
  const cityName = addr.city || addr.town || addr.village || addr.suburb || addr.municipality || addr.city_district;
  
  if (!cityName) {
    return res.status(400).json({
      valid: false,
      error: "Rule violation: Prevalent location has country or state specificity only. Listing location registry must specify a city, town, village, or suburb."
    });
  }

  return res.json({
    valid: true,
    geo: {
      country_name: addr.country || "",
      state_name: addr.state || addr.region || "",
      city_name: cityName || "",
      country_slug: toSlug(addr.country || ""),
      state_slug: toSlug(addr.state || addr.region || ""),
      city_slug: toSlug(cityName || ""),
      lat: parseFloat(match.lat),
      lon: parseFloat(match.lon)
    }
  });
});

// Locale Detector
app.get("/api/detect-locale", async (req, res) => {
  try {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded
      ? (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0].trim())
      : req.socket.remoteAddress;

    const acceptLang = req.headers['accept-language'] || "en";
    let defaultLang: "en" | "ar" = "en";
    if (acceptLang.toLowerCase().includes("ar")) {
      defaultLang = "ar";
    }

    const detection = {
      country: "United Kingdom",
      city: "London",
      currency: "GBP",
      language: defaultLang,
      ip: ip,
      isLocal: false
    };

    const cleanIp = ip ? ip.replace(/^::ffff:/, '') : '';
    if (!cleanIp || cleanIp === '::1' || cleanIp === '127.0.0.1' || cleanIp.startsWith('10.') || cleanIp.startsWith('192.168.') || cleanIp.startsWith('172.16.')) {
      detection.isLocal = true;
      return res.json(detection);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const geoRes = await fetch(`https://ipapi.co/${cleanIp}/json/`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (geoRes.ok) {
      const geoData: any = await geoRes.json();
      if (!geoData.error) {
        detection.country = geoData.country_name || detection.country;
        detection.city = geoData.city || detection.city;
        detection.currency = geoData.currency || detection.currency;

        const countryCode = (geoData.country_code || "").toUpperCase();
        const arabCountries = ["AE", "SA", "EG", "QA", "KW", "OM", "BH", "JO", "LB", "SY", "IQ", "YE", "PS", "MA", "DZ", "TN", "LY", "SD"];
        if (arabCountries.includes(countryCode) || (geoData.languages && geoData.languages.includes("ar"))) {
          detection.language = "ar";
        } else {
          detection.language = "en";
        }
      }
    }
    return res.json(detection);
  } catch (err) {
    console.error("Internal detect-locale fail:", err);
    return res.json({
      country: "United Kingdom",
      city: "London",
      currency: "GBP",
      language: "en",
      isLocal: true
    });
  }
});

// GET Listings - Fully SQLized with Nominatim Search parsing
app.get("/api/listings", async (req, res) => {
  const { category, search, actionType, includePending } = req.query;

  let whereClauses: string[] = [];
  let params: any[] = [];

  if (includePending !== "true") {
    whereClauses.push("approval_status != 'pending'");
  }

  if (category && category !== "all") {
    whereClauses.push("category = ?");
    params.push(category);
  }

  if (actionType && actionType !== "all") {
    whereClauses.push("action_type = ?");
    params.push(actionType);
  }

  let textQuery = "";
  let locationSlugFilter: { type: 'country' | 'state' | 'city'; slug: string } | null = null;

  if (search && typeof search === 'string') {
    const s = search.trim();
    // 1. Detect structures like "BMW for sale in السيب" or "Cars in Oman"
    // matches [everything before in/في] [in/في] [everything after]
    const inMatch = s.match(/(.+?)\s+(in|في)\s+(.+)/i);
    if (inMatch) {
      textQuery = inMatch[1].trim();
      const locationPart = inMatch[3].trim();

      // Normalize locationPart against Nominatim
      const osmDetail = await fetchOSMDetails(locationPart);
      if (osmDetail) {
        const addr = osmDetail.address || {};
        const cityName = addr.city || addr.town || addr.village || addr.suburb || addr.municipality || addr.city_district;
        const addresstype = osmDetail.addresstype;

        if (addresstype === 'country' && addr.country) {
          locationSlugFilter = { type: 'country', slug: toSlug(addr.country) };
        } else if ((addresstype === 'state' || addresstype === 'region') && (addr.state || addr.region)) {
          locationSlugFilter = { type: 'state', slug: toSlug(addr.state || addr.region) };
        } else if (cityName) {
          locationSlugFilter = { type: 'city', slug: toSlug(cityName) };
        }
      } else {
        // Fallback to text match if mapping fails
        whereClauses.push("(location LIKE ? OR country_name LIKE ? OR state_name LIKE ? OR city_name LIKE ?)");
        const term = `%${locationPart}%`;
        params.push(term, term, term, term);
      }
    } else {
      // No "in" separator. Let's see if the term matches a country or city slug directly in DB
      const slugCandidate = toSlug(s);
      const dbMatch = db.prepare(`
        SELECT country_slug, state_slug, city_slug FROM listings 
        WHERE country_slug = ? OR state_slug = ? OR city_slug = ? 
        LIMIT 1
      `).get(slugCandidate, slugCandidate, slugCandidate) as { country_slug?: string, state_slug?: string, city_slug?: string } | undefined;

      if (dbMatch) {
        if (dbMatch.country_slug === slugCandidate) {
          locationSlugFilter = { type: 'country', slug: slugCandidate };
        } else if (dbMatch.state_slug === slugCandidate) {
          locationSlugFilter = { type: 'state', slug: slugCandidate };
        } else {
          locationSlugFilter = { type: 'city', slug: slugCandidate };
        }
      } else {
        // Try to query online NOMINATIM normalization
        const osmDetail = await fetchOSMDetails(s);
        if (osmDetail) {
          const addr = osmDetail.address || {};
          const cityName = addr.city || addr.town || addr.village || addr.suburb || addr.municipality || addr.city_district;
          const addresstype = osmDetail.addresstype;

          if (addresstype === 'country' && addr.country) {
            locationSlugFilter = { type: 'country', slug: toSlug(addr.country) };
          } else if ((addresstype === 'state' || addresstype === 'region') && (addr.state || addr.region)) {
            locationSlugFilter = { type: 'state', slug: toSlug(addr.state || addr.region) };
          } else if (cityName) {
            locationSlugFilter = { type: 'city', slug: toSlug(cityName) };
          } else {
            textQuery = s;
          }
        } else {
          textQuery = s;
        }
      }
    }
  }

  if (textQuery) {
    whereClauses.push("(title LIKE ? OR description LIKE ? OR location LIKE ?)");
    const term = `%${textQuery}%`;
    params.push(term, term, term);
  }

  if (locationSlugFilter) {
    if (locationSlugFilter.type === 'country') {
      whereClauses.push("country_slug = ?");
      params.push(locationSlugFilter.slug);
    } else if (locationSlugFilter.type === 'state') {
      whereClauses.push("state_slug = ?");
      params.push(locationSlugFilter.slug);
    } else if (locationSlugFilter.type === 'city') {
      whereClauses.push("city_slug = ?");
      params.push(locationSlugFilter.slug);
    }
  }

  const queryStr = `
    SELECT * FROM listings
    ${whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : ""}
    ORDER BY created_at DESC
  `;

  try {
    const rows = db.prepare(queryStr).all(...params) as any[];
    const result = rows.map(r => {
      const listingMedias = db.prepare("SELECT * FROM medias WHERE item_id = ?").all(r.id) as any[];
      return {
        id: r.id,
        title: r.title,
        description: r.description,
        category: r.category,
        actionType: r.action_type,
        price: r.price,
        image: r.image,
        ownerId: r.owner_id,
        ownerName: r.owner_name,
        location: r.location,
        rating: r.rating,
        reviewsCount: r.reviews_count,
        createdAt: r.created_at,
        approvalStatus: r.approval_status,
        attributes: JSON.parse(r.attributes_json || '{}'),
        availability: JSON.parse(r.availability_json || '{"datesBlocked":[]}'),
        country_slug: r.country_slug,
        state_slug: r.state_slug,
        city_slug: r.city_slug,
        country_name: r.country_name,
        state_name: r.state_name,
        city_name: r.city_name,
        lat: r.lat,
        lon: r.lon,
        medias: listingMedias.map(m => ({
          id: m.id,
          item_id: m.item_id,
          url: m.url,
          type: m.type,
          field: m.field
        }))
      };
    });
    res.json(result);
  } catch (err) {
    console.error("Failed listings query:", err);
    res.status(500).json({ error: "Db access failed." });
  }
});

// POST Create Listing - Strictly Validated & Normalized using Nominatim OSM
app.post("/api/listings", async (req, res) => {
  const { title, description, category, actionType, price, image, location, attributes, ownerEmail, additionalMedias } = req.body;

  if (!title || !description || !category || !actionType || !price) {
    return res.status(400).json({ error: "Missing required listing fields." });
  }

  const rawLoc = location || "London, United Kingdom";
  let geoDetails = {
    country_name: "World",
    state_name: "Internet",
    city_name: "Remote",
    country_slug: "world",
    state_slug: "internet",
    city_slug: "remote",
    lat: 0.0,
    lon: 0.0
  };

  const isRemote = rawLoc.toLowerCase().trim() === 'remote' || rawLoc.trim() === 'عن بعد';
  if (!isRemote) {
    // Validate with OSM
    const match = await fetchOSMDetails(rawLoc);
    if (!match) {
      return res.status(400).json({ 
        error: "Location verification failed: Either the address does not exist or openstreetmap services are busy." 
      });
    }

    const addr = match.address || {};
    const cityName = addr.city || addr.town || addr.village || addr.suburb || addr.municipality || addr.city_district;

    if (!cityName) {
      return res.status(400).json({
        error: "Rule violation: Prevalent location has country or state specificity only. Listing location registry must specify a city, town, village, or suburb."
      });
    }

    geoDetails = {
      country_name: addr.country || "",
      state_name: addr.state || addr.region || "",
      city_name: cityName || "",
      country_slug: toSlug(addr.country || ""),
      state_slug: toSlug(addr.state || addr.region || ""),
      city_slug: toSlug(cityName),
      lat: parseFloat(match.lat),
      lon: parseFloat(match.lon)
    };
  }

  const newId = `list-${Date.now()}`;
  const mockImage = image || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800";
  const ownerId = ownerEmail ? `owner-${ownerEmail.split("@")[0]}` : "owner-custom";
  const ownerName = ownerEmail ? ownerEmail.split("@")[0].toUpperCase() : "Primary Merchant";
  const createdAt = new Date().toISOString();
  
  const availability = {
    datesBlocked: [],
    hourlySlots: category === "services" ? ["09:00", "11:00", "13:00", "15:00", "17:00"] : undefined
  };

  try {
    const insertListing = db.prepare(`
      INSERT INTO listings (
        id, title, description, category, action_type, price, image, owner_id, owner_name, location, rating, reviews_count, created_at, approval_status, attributes_json, availability_json, country_slug, state_slug, city_slug, country_name, state_name, city_name, lat, lon
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    insertListing.run(
      newId, title, description, category, actionType, Number(price), mockImage, ownerId, ownerName, rawLoc, 5.0, 0, createdAt, 'pending', JSON.stringify(attributes || {}), JSON.stringify(availability),
      geoDetails.country_slug, geoDetails.state_slug, geoDetails.city_slug, geoDetails.country_name, geoDetails.state_name, geoDetails.city_name, geoDetails.lat, geoDetails.lon
    );

    // Main image insertion to media
    db.prepare("INSERT INTO medias (id, item_id, url, type, field) VALUES (?, ?, ?, ?, ?)").run(
      `med-p-${Date.now()}`, newId, mockImage, "image", "main_image"
    );

    // Primary media listing media format
    const listMedias = [{ id: `med-p-${Date.now()}`, item_id: newId, url: mockImage, type: 'image' as const, field: "main_image" }];

    // Optional gallery uploads insertion
    if (Array.isArray(additionalMedias)) {
      additionalMedias.forEach((m, idx) => {
        if (m && m.url) {
          const mId = `med-${Date.now()}-${idx}`;
          const mType = m.type === "video" ? "video" : "image";
          const mField = m.field || "gallery";
          db.prepare("INSERT INTO medias (id, item_id, url, type, field) VALUES (?, ?, ?, ?, ?)").run(
            mId, newId, m.url, mType, mField
          );
          listMedias.push({ id: mId, item_id: newId, url: m.url, type: mType as any, field: mField });
        }
      });
    }

    const createdListing = {
      id: newId,
      title,
      description,
      category: category as ListingCategory,
      actionType: actionType as ListingActionType,
      price: Number(price),
      image: mockImage,
      ownerId,
      ownerName,
      location: rawLoc,
      rating: 5.0,
      reviewsCount: 0,
      createdAt,
      approvalStatus: 'pending' as const,
      attributes: attributes || {},
      availability,
      country_slug: geoDetails.country_slug,
      state_slug: geoDetails.state_slug,
      city_slug: geoDetails.city_slug,
      country_name: geoDetails.country_name,
      state_name: geoDetails.state_name,
      city_name: geoDetails.city_name,
      lat: geoDetails.lat,
      lon: geoDetails.lon,
      medias: listMedias
    };

    res.status(201).json(createdListing);
  } catch (err) {
    console.error("Listing insertions crashed sqlite:", err);
    res.status(500).json({ error: "Db access failed." });
  }
});

// POST Review - SQLized
app.post("/api/listings/:id/reviews", (req, res) => {
  const listingId = req.params.id;
  const { userName, userEmail, rating, comment } = req.body;

  if (!userName || !rating || !comment) {
    return res.status(400).json({ error: "Missing review content or rating score." });
  }

  const match = db.prepare("SELECT * FROM listings WHERE id = ?").get(listingId);
  if (!match) {
    return res.status(404).json({ error: "Listing not found." });
  }

  const cleanReviewId = `rev-${Date.now()}`;
  const createdAt = new Date().toISOString();

  try {
    db.prepare("INSERT INTO reviews (id, listing_id, user_name, user_email, rating, comment, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(cleanReviewId, listingId, userName, userEmail || "anonymous@example.com", Number(rating), comment, createdAt);

    // Recalculate listing rating details
    const revs = db.prepare("SELECT rating FROM reviews WHERE listing_id = ?").all(listingId) as { rating: number }[];
    const totalScore = revs.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = Number((totalScore / revs.length).toFixed(1));

    db.prepare("UPDATE listings SET rating = ?, reviews_count = ? WHERE id = ?").run(avgRating, revs.length, listingId);

    res.status(201).json({
      review: { id: cleanReviewId, listingId, userName, userEmail, rating: Number(rating), comment, createdAt },
      updatedRating: avgRating,
      reviewsCount: revs.length
    });
  } catch (err) {
    console.error("Reviews failure:", err);
    res.status(500).json({ error: "Db reviews write crash." });
  }
});

// GET Reviews - SQLized
app.get("/api/listings/:id/reviews", (req, res) => {
  const listingId = req.params.id;
  try {
    const revs = db.prepare("SELECT * FROM reviews WHERE listing_id = ? ORDER BY created_at DESC").all(listingId) as any[];
    const formatted = revs.map(r => ({
      id: r.id,
      listingId: r.listing_id,
      userName: r.user_name,
      userEmail: r.user_email,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.created_at
    }));
    res.json(formatted);
  } catch (err) {
    res.json([]);
  }
});

// POST Checkout - SQLized
app.post("/api/payments/checkout", (req, res) => {
  const { listingId, creditCard, cardExpiry, cardCvc, amount, bookingDate, bookingTimeSlot, buyerEmail } = req.body;

  if (!listingId || !creditCard || !cardExpiry || !cardCvc || !amount || !buyerEmail) {
    return res.status(400).json({ error: "Missing active payment verification details." });
  }

  if (creditCard.replace(/\s/g, '').length < 13 || isNaN(Number(creditCard.replace(/\s/g, '')))) {
    return res.status(400).json({ error: "Payment Failed: Invalid credit card pattern format." });
  }
  if (!cardExpiry || !cardExpiry.includes("/")) {
    return res.status(400).json({ error: "Payment Failed: Invalid card expiration." });
  }
  if (cardCvc.length < 3 || isNaN(Number(cardCvc))) {
    return res.status(400).json({ error: "Payment Failed: Invalid security code (CVC)." });
  }

  const listingMatch = db.prepare("SELECT * FROM listings WHERE id = ?").get(listingId) as any;
  if (!listingMatch) {
    return res.status(404).json({ error: "Listing product could not be resolved." });
  }

  const availability = JSON.parse(listingMatch.availability_json || '{"datesBlocked":[]}');
  const actionType = listingMatch.action_type;

  if (bookingDate) {
    if (actionType === "renting") {
      if (availability.datesBlocked.includes(bookingDate)) {
        return res.status(400).json({ error: `Automated Scheduling Conflict: The date ${bookingDate} is already booked.` });
      }
      availability.datesBlocked.push(bookingDate);
    } else if (actionType === "booking") {
      const slotAndDate = `${bookingDate}T${bookingTimeSlot || '00:00'}`;
      if (availability.datesBlocked.includes(slotAndDate)) {
        return res.status(400).json({ error: `Automated Scheduling Conflict: This specific appointment time slot is already secured.` });
      }
      availability.datesBlocked.push(slotAndDate);
    }
  }

  const txId = `tx_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
  const last4 = creditCard.slice(-4);
  const createdDate = new Date().toISOString();

  try {
    // Update listing availability
    db.prepare("UPDATE listings SET availability_json = ? WHERE id = ?").run(JSON.stringify(availability), listingId);

    // Save transaction
    db.prepare("INSERT INTO transactions (id, listing_id, listing_title, amount, card_last4, buyer_email, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(txId, listingId, listingMatch.title, Number(amount), last4, buyerEmail, "success", createdDate);

    // Save Booking
    const bookId = `book-${Date.now()}`;
    const cleanBookingDate = bookingDate || createdDate.split("T")[0];
    db.prepare("INSERT INTO bookings (id, listing_id, listing_title, listing_image, price_paid, booking_date, booking_time_slot, action_type, payment_status, transaction_id, status, user_email, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(bookId, listingId, listingMatch.title, listingMatch.image, Number(amount), cleanBookingDate, bookingTimeSlot || "", actionType, "completed", txId, "confirmed", buyerEmail, createdDate);

    res.status(200).json({
      message: "Secure checkout executed successfully.",
      transaction: { id: txId, listingId, listingTitle: listingMatch.title, amount: Number(amount), cardLast4: last4, buyerEmail, status: "success", createdAt: createdDate },
      booking: { id: bookId, listingId, listingTitle: listingMatch.title, listingImage: listingMatch.image, pricePaid: Number(amount), bookingDate: cleanBookingDate, bookingTimeSlot, actionType, paymentStatus: "completed", transactionId: txId, status: "confirmed", userEmail: buyerEmail, createdAt: createdDate }
    });
  } catch (err) {
    console.error("Checkout crash in SQL:", err);
    res.status(500).json({ error: "Checkout database transaction failed." });
  }
});

// GET Messages - unaltered
app.get("/api/messages/:listingId", (req, res) => {
  const { listingId } = req.params;
  const filtered = messages.filter(m => m.listingId === listingId);
  res.json(filtered);
});

// POST Message - unaltered except retrieving title for host replies
app.post("/api/messages/:listingId", (req, res) => {
  const { listingId } = req.params;
  const { senderId, senderName, text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Cannot dispatch empty messages." });
  }

  const listingMatch = db.prepare("SELECT * FROM listings WHERE id = ?").get(listingId) as any;

  const userMessage: Message = {
    id: `msg-${Date.now()}`,
    listingId,
    senderId: senderId || "customer",
    senderName: senderName || "facegoogl@gmail.com",
    text,
    createdAt: new Date().toISOString()
  };

  messages.push(userMessage);

  if (senderId === "customer" && listingMatch) {
    setTimeout(() => {
      const responsePool = merchantSmartReplies[listingMatch.id] || [
        `Thanks for contacting us regarding "${listingMatch.title}". We have logged your request. I'll get back to you with terms and scheduled booking details as soon as possible!`
      ];
      const randomReply = responsePool[Math.floor(Math.random() * responsePool.length)];
      
      const hostReply: Message = {
        id: `msg-${Date.now() + 50}`,
        listingId,
        senderId: listingMatch.owner_id,
        senderName: listingMatch.owner_name,
        text: randomReply,
        createdAt: new Date().toISOString()
      };
      
      messages.push(hostReply);
    }, 1500);
  }

  res.status(201).json(userMessage);
});

// GET User Dashboard details - SQLized
app.get("/api/dashboard", (req, res) => {
  const userEmail = (req.query.email as string) || "facegoogl@gmail.com";
  
  try {
    const rawBookings = db.prepare("SELECT * FROM bookings WHERE user_email = ? ORDER BY created_at DESC").all(userEmail) as any[];
    const userBookings = rawBookings.map(b => ({
      id: b.id,
      listingId: b.listing_id,
      listingTitle: b.listing_title,
      listingImage: b.listing_image,
      pricePaid: b.price_paid,
      bookingDate: b.booking_date,
      bookingTimeSlot: b.booking_time_slot,
      actionType: b.action_type,
      paymentStatus: b.payment_status,
      transactionId: b.transaction_id,
      status: b.status,
      userEmail: b.user_email,
      createdAt: b.created_at
    }));

    const rawTxs = db.prepare("SELECT * FROM transactions WHERE buyer_email = ? ORDER BY created_at DESC").all(userEmail) as any[];
    const userTransactions = rawTxs.map(t => ({
      id: t.id,
      listingId: t.listing_id,
      listingTitle: t.listing_title,
      amount: t.amount,
      cardLast4: t.card_last4,
      buyerEmail: t.buyer_email,
      status: t.status,
      createdAt: t.created_at
    }));

    // My owned listings
    const ownerId = `owner-${userEmail.split("@")[0]}`;
    const rawMyListings = db.prepare("SELECT * FROM listings WHERE owner_id = ?").all(ownerId) as any[];
    const myListings = rawMyListings.map(r => {
      const listingMedias = db.prepare("SELECT * FROM medias WHERE item_id = ?").all(r.id) as any[];
      return {
        id: r.id,
        title: r.title,
        description: r.description,
        category: r.category,
        actionType: r.action_type,
        price: r.price,
        image: r.image,
        ownerId: r.owner_id,
        ownerName: r.owner_name,
        location: r.location,
        rating: r.rating,
        reviewsCount: r.reviews_count,
        createdAt: r.created_at,
        approvalStatus: r.approval_status,
        attributes: JSON.parse(r.attributes_json || '{}'),
        availability: JSON.parse(r.availability_json || '{"datesBlocked":[]}'),
        medias: listingMedias.map(m => ({
          id: m.id,
          item_id: m.item_id,
          url: m.url,
          type: m.type,
          field: m.field
        }))
      };
    });

    const myListingsIds = myListings.map(l => l.id);
    let myListingsBookings: any[] = [];
    if (myListingsIds.length > 0) {
      const placeholders = myListingsIds.map(() => '?').join(',');
      const rawOwnedBookings = db.prepare(`SELECT * FROM bookings WHERE listing_id IN (${placeholders}) ORDER BY created_at DESC`).all(...myListingsIds) as any[];
      myListingsBookings = rawOwnedBookings.map(b => ({
        id: b.id,
        listingId: b.listing_id,
        listingTitle: b.listing_title,
        listingImage: b.listing_image,
        pricePaid: b.price_paid,
        bookingDate: b.booking_date,
        bookingTimeSlot: b.booking_time_slot,
        actionType: b.action_type,
        paymentStatus: b.payment_status,
        transactionId: b.transaction_id,
        status: b.status,
        userEmail: b.user_email,
        createdAt: b.created_at
      }));
    }

    res.json({
      bookings: userBookings,
      transactions: userTransactions,
      myListings,
      myListingsBookings
    });
  } catch (err) {
    console.error("Dashboard DB fetch error:", err);
    res.status(500).json({ error: "Dashboard retrieval failed." });
  }
});

// Cancel Booking - SQLized
app.post("/api/bookings/:id/cancel", (req, res) => {
  const { id } = req.params;
  
  const b = db.prepare("SELECT * FROM bookings WHERE id = ?").get(id) as any;
  if (!b) {
    return res.status(404).json({ error: "Booking session not found." });
  }

  try {
    db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").run(id);

    // Remove blocked dates
    const listingMatch = db.prepare("SELECT * FROM listings WHERE id = ?").get(b.listing_id) as any;
    if (listingMatch) {
      const availability = JSON.parse(listingMatch.availability_json || '{"datesBlocked":[]}');
      const blockVal = b.action_type === "booking" 
        ? `${b.booking_date}T${b.booking_time_slot}` 
        : b.booking_date;

      availability.datesBlocked = availability.datesBlocked.filter((date: string) => date !== blockVal);
      db.prepare("UPDATE listings SET availability_json = ? WHERE id = ?").run(JSON.stringify(availability), b.listing_id);
    }

    res.json({ success: true, booking: { ...b, status: 'cancelled' } });
  } catch (err) {
    console.error("Cancellation error:", err);
    res.status(500).json({ error: "Cancellation failed." });
  }
});

// ------------------------------------------------------------------
// ADMIN API ENDPOINTS (SQLIZED)
// ------------------------------------------------------------------

// 1. Get users
app.get("/api/admin/users", (req, res) => {
  try {
    const raw = db.prepare("SELECT * FROM users ORDER BY created_at DESC").all() as any[];
    const formatted = raw.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      createdAt: u.created_at,
      isBlocked: !!u.is_blocked
    }));
    res.json(formatted);
  } catch (err) {
    res.json([]);
  }
});

// 2. Create user
app.post("/api/admin/users", (req, res) => {
  const { email, name, role } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: "Email and Name are required." });
  }
  const emailLower = email.trim().toLowerCase();

  const exists = db.prepare("SELECT COUNT(*) as count FROM users WHERE email = ?").get(emailLower) as any;
  if (exists.count > 0) {
    return res.status(400).json({ error: "User with this email already exists." });
  }

  const uId = `usr-${Date.now()}`;
  const cAt = new Date().toISOString();
  const cRole = role === 'admin' ? 'admin' : 'user';

  try {
    db.prepare("INSERT INTO users (id, email, name, role, created_at, is_blocked) VALUES (?, ?, ?, ?, ?, ?)")
      .run(uId, emailLower, name.trim(), cRole, cAt, 0);

    res.status(201).json({ id: uId, email: emailLower, name, role: cRole, createdAt: cAt, isBlocked: false });
  } catch (err) {
    res.status(500).json({ error: "User insert failed." });
  }
});

// 3. Block/Unblock user
app.put("/api/admin/users/:email/status", (req, res) => {
  const { email } = req.params;
  const { role, isBlockedChange } = req.body;

  const match = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
  if (!match) {
    return res.status(404).json({ error: "User profile not found." });
  }

  let finalBlocked = match.is_blocked;
  if (isBlockedChange !== undefined) {
    finalBlocked = isBlockedChange ? 1 : 0;
  }

  let finalRole = match.role;
  if (role !== undefined) {
    finalRole = role === 'admin' ? 'admin' : 'user';
  }

  try {
    db.prepare("UPDATE users SET role = ?, is_blocked = ? WHERE email = ?").run(finalRole, finalBlocked, email);
    res.json({ id: match.id, email, name: match.name, role: finalRole, createdAt: match.created_at, isBlocked: !!finalBlocked });
  } catch (err) {
    res.status(500).json({ error: "User edit updates failed." });
  }
});

// 4. Delete User
app.delete("/api/admin/users/:email", (req, res) => {
  const { email } = req.params;
  try {
    const info = db.prepare("DELETE FROM users WHERE email = ?").run(email);
    if (info.changes === 0) {
      return res.status(404).json({ error: "User is not registered." });
    }
    res.json({ success: true, message: "User deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed deletion." });
  }
});

// 5. Delete Listing
app.delete("/api/admin/listings/:id", (req, res) => {
  const { id } = req.params;
  try {
    const info = db.prepare("DELETE FROM listings WHERE id = ?").run(id);
    if (info.changes === 0) {
      return res.status(404).json({ error: "Listing item was not found." });
    }
    db.prepare("DELETE FROM medias WHERE item_id = ?").run(id);
    res.json({ success: true, message: "Listing deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Delete listing failed." });
  }
});

// 6. Approve Listing
app.put("/api/admin/listings/:id/approve", (req, res) => {
  const { id } = req.params;
  try {
    const info = db.prepare("UPDATE listings SET approval_status = 'approved' WHERE id = ?").run(id);
    if (info.changes === 0) {
      return res.status(404).json({ error: "Listing item was not found." });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Approval failed." });
  }
});

// Collections (remain in-memory as templates)
app.get("/api/admin/collections", (req, res) => {
  res.json(collectionsList);
});

app.post("/api/admin/collections", (req, res) => {
  const { key, title, description, attributes } = req.body;
  if (!key || !title) {
    return res.status(400).json({ error: "Collection unique key and name are required." });
  }
  const cleanKey = key.trim().toLowerCase();
  if (collectionsList.some(c => c.key === cleanKey)) {
    return res.status(400).json({ error: "Collection with this key already exists." });
  }

  const newCol = {
    id: `col-${Date.now()}`,
    key: cleanKey,
    title: title.trim(),
    description: (description || "").trim(),
    attributes: attributes || []
  };

  collectionsList.push(newCol);
  res.status(201).json(newCol);
});

app.put("/api/admin/collections/:key", (req, res) => {
  const { key } = req.params;
  const { title, description, attributes } = req.body;
  const cleanKey = key.trim().toLowerCase();
  
  const match = collectionsList.find(c => c.key === cleanKey);
  if (!match) {
    return res.status(404).json({ error: "Collection was not found." });
  }

  if (title !== undefined) match.title = title.trim();
  if (description !== undefined) match.description = description.trim();
  if (attributes !== undefined) {
    match.attributes = Array.isArray(attributes) ? attributes : [];
  }

  res.json({ success: true, collection: match });
});

// Settings (remain in-memory as presets)
app.get("/api/admin/settings", (req, res) => {
  res.json(marketplaceSettings);
});

app.put("/api/admin/settings", (req, res) => {
  const { platformFeePercentage, escrowProtection, maintenanceMode, systemCurrency, allowGuestBookings } = req.body;

  if (platformFeePercentage !== undefined) {
    marketplaceSettings.platformFeePercentage = Number(platformFeePercentage) || 0;
  }
  if (escrowProtection !== undefined) {
    marketplaceSettings.escrowProtection = !!escrowProtection;
  }
  if (maintenanceMode !== undefined) {
    marketplaceSettings.maintenanceMode = !!maintenanceMode;
  }
  if (systemCurrency !== undefined) {
    marketplaceSettings.systemCurrency = systemCurrency || "USD";
  }
  if (allowGuestBookings !== undefined) {
    marketplaceSettings.allowGuestBookings = !!allowGuestBookings;
  }

  res.json(marketplaceSettings);
});

// Earnings - SQLized
app.get("/api/admin/earnings", (req, res) => {
  try {
    const rawBookings = db.prepare("SELECT * FROM bookings").all() as any[];
    const activeBookings = rawBookings.filter(b => b.status === "confirmed");
    const canceledBookings = rawBookings.filter(b => b.status !== "confirmed");

    const rawTxs = db.prepare("SELECT * FROM transactions ORDER BY created_at DESC").all() as any[];
    const transactionsList = rawTxs.map(t => ({
      id: t.id,
      listingId: t.listing_id,
      listingTitle: t.listing_title,
      amount: t.amount,
      cardLast4: t.card_last4,
      buyerEmail: t.buyer_email,
      status: t.status,
      createdAt: t.created_at
    }));

    const formattedBookings = rawBookings.map(b => ({
      id: b.id,
      listingId: b.listing_id,
      listingTitle: b.listing_title,
      listingImage: b.listing_image,
      pricePaid: b.price_paid,
      bookingDate: b.booking_date,
      bookingTimeSlot: b.booking_time_slot,
      actionType: b.action_type,
      paymentStatus: b.payment_status,
      transactionId: b.transaction_id,
      status: b.status,
      userEmail: b.user_email,
      createdAt: b.created_at
    }));

    const gmv = activeBookings.reduce((sum, b) => sum + b.price_paid, 0);
    const revenue = Number((gmv * (marketplaceSettings.platformFeePercentage / 100)).toFixed(2));
    
    const timelineData = [
      { name: "Jan", sales: 12000, profit: Number((12000 * (marketplaceSettings.platformFeePercentage / 100)).toFixed(1)) },
      { name: "Feb", sales: 18500, profit: Number((18500 * (marketplaceSettings.platformFeePercentage / 100)).toFixed(1)) },
      { name: "Mar", sales: 15100, profit: Number((15100 * (marketplaceSettings.platformFeePercentage / 100)).toFixed(1)) },
      { name: "Apr", sales: 24000, profit: Number((24000 * (marketplaceSettings.platformFeePercentage / 100)).toFixed(1)) },
      { name: "May", sales: gmv || 8500, profit: Number(((gmv || 8500) * (marketplaceSettings.platformFeePercentage / 100)).toFixed(1)) }
    ];

    res.json({
      totalGmv: gmv,
      totalRevenue: revenue,
      platformFeePercentage: marketplaceSettings.platformFeePercentage,
      activeBookingsCount: activeBookings.length,
      cancelledBookingsCount: canceledBookings.length,
      transactionsList,
      bookingsList: formattedBookings,
      timelineData
    });
  } catch (err) {
    res.status(500).json({ error: "Earnings error." });
  }
});

// Helper to initialize Gemini SDK safely on demand (lazy loading)
function initGeminiAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// 1. Save user search history
app.post("/api/track-search", (req, res) => {
  const { email, query, category } = req.body;
  if (!email || !query) {
    return res.status(400).json({ error: "Email and query are required." });
  }
  try {
    const id = `sh-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    db.prepare("INSERT INTO search_history (id, user_email, query, category, created_at) VALUES (?, ?, ?, ?, ?)")
      .run(id, email.toLowerCase().trim(), query.trim(), category || "all", new Date().toISOString());
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: "Failed to persist search history." });
  }
});

// 2. Fetch mailing history (admin view logs)
app.get("/api/admin/emails", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM sent_emails ORDER BY created_at DESC").all() as any[];
    const formatted = rows.map(r => ({
      id: r.id,
      campaignName: r.campaign_name,
      subject: r.subject,
      body: r.body,
      recipientEmail: r.recipient_email,
      triggerType: r.trigger_type,
      createdAt: r.created_at
    }));
    res.json(formatted);
  } catch (err) {
    res.json([]);
  }
});

// 3. Fetch search analytics/log records (admin view logs)
app.get("/api/admin/search-history", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM search_history ORDER BY created_at DESC").all() as any[];
    const formatted = rows.map(r => ({
      id: r.id,
      userEmail: r.user_email,
      query: r.query,
      category: r.category,
      createdAt: r.created_at
    }));
    res.json(formatted);
  } catch (err) {
    res.json([]);
  }
});

// 4. Send manual/marketing newsletter campaign to list
app.post("/api/admin/send-campaign", async (req, res) => {
  const { campaignName, subject, bodyInput, targetRecipient, generateWithAI, aiPrompt } = req.body;
  
  if (!campaignName || !subject) {
    return res.status(400).json({ error: "Campaign name and subject are required." });
  }

  try {
    // Resolve Recipients
    let recipients: string[] = [];
    if (targetRecipient && targetRecipient !== "all") {
      recipients = [targetRecipient.trim().toLowerCase()];
    } else {
      const usersRaw = db.prepare("SELECT email FROM users").all() as { email: string }[];
      recipients = usersRaw.map(u => u.email.toLowerCase());
      if (recipients.length === 0) {
        recipients = ["demo-user-box@marketplace.com"];
      }
    }

    // Compose custom body using generative AI if active
    let finalBody = bodyInput || "Welcome updates from our platform team!";
    let isAiGenerated = false;

    if (generateWithAI) {
      const ai = initGeminiAI();
      if (ai) {
        try {
          const aiResponse = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: `Compose a premium, professional and appealing marketing update email newsletter about: "${aiPrompt || subject}". Highlight new catalog additions, exclusive secure booking service guarantees, and standard of quality. Keep the voice friendly, clear and inspiring. Return only the final text output of the newsletter body without technical tags.`,
          });
          if (aiResponse && aiResponse.text) {
            finalBody = aiResponse.text;
            isAiGenerated = true;
          }
        } catch (aiErr) {
          console.error("Gemini failed during manual campaign generation", aiErr);
        }
      } else {
        finalBody = `[Simulated Assistant] Topic: "${aiPrompt || subject}"\n\nDear member,\n\nWe have updated our catalog with exclusive, pristine properties, electric vehicles and services designed to simplify your journey.\n\nBrowse verified listings and book securely through our fully escrow-protected platform instantly.\n\nWarm regards,\nMarketplace Editorial Board`;
      }
    }

    const insertStmt = db.prepare("INSERT INTO sent_emails (id, campaign_name, subject, body, recipient_email, trigger_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
    for (const email of recipients) {
      const id = `email-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      insertStmt.run(id, campaignName, subject, finalBody, email, "marketing", new Date().toISOString());
    }

    res.json({ success: true, count: recipients.length, isAiGenerated, finalBody });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Newsletter engine failure." });
  }
});

// 5. Build match recommendations based on searches, dispatching automated updates
app.post("/api/admin/trigger-auto-emails", async (req, res) => {
  try {
    const searches = db.prepare("SELECT * FROM search_history").all() as any[];
    const listingsRaw = db.prepare("SELECT * FROM listings WHERE approval_status = 'approved'").all() as any[];

    if (searches.length === 0) {
      return res.json({ success: true, count: 0, message: "No search actions stored to trigger auto-updates." });
    }

    const ai = initGeminiAI();
    let autoSentCount = 0;
    const insertStmt = db.prepare("INSERT INTO sent_emails (id, campaign_name, subject, body, recipient_email, trigger_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");

    for (const s of searches) {
      const q = s.query.toLowerCase().trim();
      
      // Match with current catalog items
      const matches = listingsRaw.filter(l => 
        l.title.toLowerCase().includes(q) || 
        l.description.toLowerCase().includes(q) || 
        (l.category && l.category.toLowerCase().includes(q))
      );

      if (matches.length > 0) {
        const topMatch = matches[0];
        const subject = `Exclusive Match for your search "${s.query}"`;
        let body = "";

        if (ai) {
          try {
            const prompt = `Compose a quick personal notification email for a user whose query is matched to an active listing!
Matched item: "${topMatch.title}" (Price: $${topMatch.price})
Seller details: ${topMatch.owner_name} - ${topMatch.location}
Query keyword: "${s.query}"

Keep the email warm, friendly, concise, and professional under 130 words. Introduce yourself as the dynamic Matcher Agent, let them know this matching item has been cataloged, and invite them dryly but politely to view it.`;
            const response = await ai.models.generateContent({
              model: "gemini-3.5-flash",
              contents: prompt
            });
            if (response && response.text) {
              body = response.text;
            }
          } catch (err) {
            console.error(err);
          }
        }

        if (!body) {
          body = `Hi,\n\nOur system detected a brand-new verified option in the catalog matching your search query: "${s.query}"!\n\n★ ${topMatch.title} — $${topMatch.price}\nLocation: ${topMatch.location}\n\nOur escrow service is ready. Visit the platform now to check details and book securely.\n\nBest,\nMarketplace Auto-Matcher Engine`;
        }

        const id = `email-auto-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        insertStmt.run(id, `Auto Match: ${s.query}`, subject, body, s.user_email, "auto-update", new Date().toISOString());
        autoSentCount++;
      }
    }

    res.json({ success: true, count: autoSentCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed auto-updates processing." });
  }
});

// ------------------------------------------------------------------
// VITE DEV SERVER STARTUP
// ------------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Express] SQLite Services live on http://localhost:${PORT}`);
  });
}

startServer();
