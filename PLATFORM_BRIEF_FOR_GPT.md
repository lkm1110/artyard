# ArtYard Platform - Technical Documentation Brief

## 🎯 Platform Overview

### What is ArtYard?
ArtYard is a **mobile-first art marketplace** connecting emerging artists (primarily college students) with art collectors. Think "Instagram meets Etsy for original artworks."

### Core Value Proposition
- **For Artists**: 
  - Zero upfront costs
  - Fair 10% commission (90% to artist)
  - Direct buyer communication via chat
  - **USD settlement** (global standard)
  
- **For Buyers**: 
  - Discover affordable original art ($10-$100k range)
  - Support emerging college artists
  - Direct artist interaction
  - **Transparent USD pricing** (no currency conversion confusion)
  - Simple one-click purchase
  
- **Business Model**: 
  - 10% platform fee on completed sales
  - 90% goes to artist
  - **USD transactions** (pricing, payment, settlement)
  - Payment provider: 2Checkout (Demo → Active transition planned)

### Target Audience
- **Primary**: College art students (18-25) looking to monetize their work
- **Secondary**: Art enthusiasts seeking affordable original pieces ($10-$100k range)

---

## 🏗️ Technical Architecture

### Tech Stack

**Frontend (Mobile App):**
- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **Navigation**: React Navigation 6
- **State Management**: 
  - React Query (data fetching, caching, infinite scroll)
  - Zustand (auth state)
- **UI/UX**: 
  - Custom components with dark mode support
  - Native iOS/Android feel
  - Optimistic updates for instant feedback

**Backend (BaaS):**
- **Platform**: Supabase
  - PostgreSQL database
  - Real-time subscriptions (chat)
  - Row Level Security (RLS)
  - Edge Functions (webhooks, notifications)
  - Storage (artwork images)

**Payment Processing:**
- **Current**: 2Checkout (ConvertPlus) - Demo/Sandbox mode
  - Full development and testing capabilities
  - USD pricing and settlement (core requirement)
  - Will transition to Active/Production mode before launch
  - Requires business registration for Active account
- **Future**: Upgrade to 2Checkout Active (Production)
  - Timeline: Before service launch (6-8 weeks)
  - Requires: Business registration certificate
  - Enables: Real card payments, actual settlements

**Authentication:**
- Social Sign-On (SSO) only:
  - Google OAuth
  - Apple Sign-In
  - Facebook Login
  - Naver OAuth (Korea)
  - Kakao OAuth (Korea)

**Push Notifications:**
- **Service**: Expo Push Notifications
- **Triggers**: 
  - Comments on artworks
  - Purchase notifications
  - Review submissions
  - Chat messages

**Analytics:**
- Custom analytics service
- Artist dashboard with metrics
- Admin dashboard for platform monitoring

---

## 🎨 Core Features

### 1. Artwork Feed (Main Screen)
- Infinite scroll with React Query
- Multi-image swipe gallery per artwork
- Like/Bookmark with optimistic updates
- Location display (translated to English)
- Filter by price, size, material, medium
- Search by title, artist, material

### 2. Artist Profiles
- Bio, portfolio, follower count
- Upload artworks with:
  - Title (min 2 chars)
  - Description
  - Material, medium, size
  - Year, edition (Original/Limited/Copy)
  - Price ($1 - $100M range)
  - Optional location (approximate city/state)
  - Multiple images (swipeable)

### 3. Purchase Flow
1. Buyer clicks "Purchase Artwork"
2. Enters contact info (for seller communication)
3. Redirected to 2Checkout payment page
4. On success → Transaction created (status: 'paid')
5. Artwork marked as 'sold' (with blur + "SOLD" badge)
6. Seller receives 90%, platform keeps 10%
7. Buyer and seller chat directly for shipping

### 4. Real-time Chat
- 1-on-1 messaging between buyers and sellers
- Message edit/delete
- Typing indicators (2sec)
- Read receipts
- Report user functionality
- Delete chat option

### 5. Artist Dashboard
- Metrics: Likes, Sales, Revenue, Followers
- Top 5 artworks by engagement
- Daily stats trends
- View breakdowns

### 6. Admin Features
- User reports review
- Content moderation
- Platform analytics

### 7. Social Features
- Follow/Unfollow artists
- Like artworks
- Bookmark artworks
- Comment on artworks
- Share artworks (deep linking)

---

## 📊 Database Schema (Key Tables)

### profiles
- id (UUID, primary key)
- email, handle (username)
- full_name, bio, profile_image_url
- location_*, is_verified, is_artist
- followers_count, following_count
- expo_push_token (for notifications)

### artworks
- id, author_id, title, description
- material, medium, size, year, edition
- price, sale_status (available/sold/reserved)
- images (array), likes_count, comments_count
- location_* (optional, approximate)
- sold_at, buyer_id

### transactions
- id, artwork_id, buyer_id, seller_id
- amount, platform_fee, seller_amount
- status (pending/paid/delivered/confirmed)
- stripe_payment_intent_id (2Checkout order number)
- buyer_name, buyer_phone, buyer_address
- paid_at, created_at

### seller_payouts
- id, seller_id, transaction_id, artwork_id
- total_amount, platform_fee (10%), seller_amount (90%)
- status (pending/paid)
- shipping_address, bank_info

### chat_rooms
- id, participant1_id, participant2_id
- last_message, last_message_at, unread_count

### chat_messages
- id, room_id, sender_id, content
- is_edited, edited_at, created_at

### comments, likes, bookmarks, follows, notifications, reports
- Standard social platform tables

---

## 🔐 Security & Privacy

### Authentication
- **No passwords**: SSO only (Google, Apple, Facebook, Naver, Kakao)
- **Session management**: Supabase Auth with JWT
- **Secrets**: Stored in Supabase Secrets (NOT in client code)

### Data Privacy
- **Location**: Optional, rounded to approximate city/state
- **Display Name**: Collected, disclosed in privacy policy
- **Camera/Photos**: iOS-compliant permission requests
- **No tracking**: No third-party tracking

### Payment Security
- **PCI Compliance**: 2Checkout handles all card data
- **No storage**: We never store card numbers
- **Webhook verification**: 2Checkout IPN with HMAC

---

## 🎭 User Experience Highlights

### UI/UX Features
- **Dark mode**: Full support with themed components
- **Optimistic updates**: Instant feedback for likes/bookmarks
- **Infinite scroll**: Smooth loading with React Query
- **Custom alerts**: Modern popup designs (rounded, shadowed)
- **Keyboard handling**: Auto-scroll for comment inputs
- **Network status**: Real-time connectivity indicator
- **Loading states**: Spinners for all async operations

### Localization
- **UI Text**: All English (per memory requirement)
- **Location Names**: Korean → English translation
- **Target Market**: Global (starting with Korea)

---

## 🚀 Current Status

### ✅ Completed Features
- User authentication (5 SSO providers)
- Artwork CRUD (upload, edit, delete, view)
- Infinite scroll feed with filters
- Like, bookmark, follow, comment
- Real-time chat with typing indicators
- Purchase flow with 2Checkout integration
- Webhook handling (IPN)
- Seller payout calculation (10% fee)
- Push notifications (comments, purchases, reviews, chat)
- Artist dashboard with metrics
- Admin dashboard
- Dark mode
- Deep linking (artyard://)
- Report system (users, artworks)

### 🚧 In Progress
- **2Checkout Demo → Active transition** (requires business registration)
- iOS App Store submission (in review)
- Google Play Console submission (in review)
- Beta testing with manual webhook simulation

### 📋 Planned (Launch Timeline)
- **Phase 1** (Now - 6 weeks): Complete development with Demo mode
  - Beta testing
  - User feedback collection
  - Bug fixes
  - Feature polishing
  
- **Phase 2** (6-8 weeks): Business registration & 2Checkout Active
  - Register business (individual or corporate)
  - Submit documents to 2Checkout
  - Upgrade to Active/Production account
  - Switch demo='Y' to demo='N' in code
  
- **Phase 3** (8+ weeks): Official launch with real payments
  - Marketing campaign
  - User acquisition
  - Real USD transactions
  
- **Future Enhancements**:
  - Advanced filtering (AI-based recommendations)
  - NFT integration (authenticity verification)
  - Video artwork support
  - Artist verification badges
  - International shipping integration

---

## 🛠️ Development Workflow

### Code Organization
```
src/
├── components/       # Reusable UI components
├── screens/         # Screen components
├── services/        # API services (artwork, payment, etc.)
├── hooks/           # Custom React hooks
├── types/           # TypeScript interfaces
├── constants/       # Theme, colors, spacing
├── navigation/      # Navigation configuration
└── utils/           # Utility functions

database/            # SQL migration scripts
supabase/functions/  # Edge Functions (webhooks)
docs/                # Documentation
```

### Key Services
- `artworkService.ts`: Artwork CRUD, filtering, search
- `paymentService.ts`: 2Checkout integration
- `transactionService.ts`: Orders, sales, payouts
- `chatService.ts`: Real-time messaging
- `analyticsService.ts`: Tracking, metrics
- `pushNotificationService.ts`: Expo Push integration

### Environment Variables
```bash
EXPO_PUBLIC_SUPABASE_URL=https://bkvycanciimgyftdtqpx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_2CHECKOUT_ACCOUNT=255774334748
# Secrets stored in Supabase Secrets:
# - 2CHECKOUT_SECRET_KEY
# - NAVER_CLIENT_SECRET
# - KAKAO_CLIENT_SECRET
# - GOOGLE_CLIENT_SECRET
```

---

## 📱 Platform Policies

### Content Policy
- Original artworks encouraged (AI-generated should be disclosed)
- No copyright violations (user responsibility)
- No offensive/illegal content
- User-based reporting system (no automated verification)
- Admin review for reported content

**Note**: No formal artwork authentication or forgery verification system implemented. Trust-based platform relying on:
- User reports
- Admin moderation
- Community feedback

### Transaction Policy
- 10% platform fee (seller pays)
- Direct buyer-seller communication for shipping
- No refunds after delivery confirmation
- Dispute resolution by admin

### Privacy Policy
- https://lkm1110.github.io/artyard/privacy-policy.html
- Collects: email, name, display name, location (optional)
- No tracking, no ads
- Right to data deletion

---

## 🎯 Documentation Needs

We need comprehensive documentation for:

### 1. Technical Documentation
- API documentation (Supabase functions)
- Database schema with relationships
- Component library (Storybook-style)
- Service layer documentation
- Webhook integration guide

### 2. User Documentation
- Artist onboarding guide
- Buyer guide
- Shipping best practices
- Safety tips

### 3. Business Documentation
- Revenue model breakdown
- Growth strategy
- Competitive analysis
- Market positioning

### 4. Developer Documentation
- Setup guide (local development)
- Deployment guide (EAS Build)
- Contribution guidelines
- Architecture decision records (ADRs)

---

## 🔑 Key Concepts to Understand

### React Query + Infinite Scroll
- `useInfiniteQuery` for paginated data
- Cache invalidation strategies
- Optimistic updates for instant UX

### Supabase Edge Functions
- Serverless functions for webhooks
- PostgreSQL triggers calling HTTP endpoints
- Environment variables management

### 2Checkout ConvertPlus
- Redirect-based checkout (not inline)
- IPN webhooks for payment confirmation
- Demo vs. Active account differences

### Expo Push Notifications
- Token-based system
- Channels for different notification types
- Deep linking integration

### Row Level Security (RLS)
- PostgreSQL policies for data access
- User-specific data isolation
- Admin overrides

---

## 📋 Sample GPT Prompts

### For Technical Documentation:
> "Based on the ArtYard platform architecture above, create comprehensive API documentation for the `artworkService.ts` module. Include:
> - Function signatures with TypeScript types
> - Parameter descriptions
> - Return types and possible error states
> - Usage examples
> - Related database tables
> - Performance considerations"

### For User Guides:
> "Create a beginner-friendly guide for college art students on how to:
> 1. Sign up and create a profile
> 2. Upload their first artwork
> 3. Set appropriate pricing
> 4. Handle their first sale
> 5. Ship the artwork to the buyer
> Use a friendly, encouraging tone with step-by-step screenshots (describe what they should look like)."

### For Architecture Decisions:
> "Document the decision to use React Query instead of Redux for state management in ArtYard. Structure this as an Architecture Decision Record (ADR) with:
> - Context and problem statement
> - Considered options
> - Decision and rationale
> - Consequences (positive and negative)
> - Implementation notes"

---

## 💡 Tips for Working with GPT on This Project

1. **Be Specific**: Reference exact file names, function names, line numbers
2. **Provide Context**: Share relevant code snippets, error messages, logs
3. **State Goals**: What problem are you solving? What's the end result?
4. **Mention Constraints**: Budget, timeline, technical limitations
5. **Iterate**: Start with overview docs, then drill down into specifics

---

## 📞 Contact & Resources

- **GitHub**: (private repository)
- **Supabase**: https://supabase.com/dashboard/project/bkvycanciimgyftdtqpx
- **Privacy Policy**: https://lkm1110.github.io/artyard/privacy-policy.html
- **Contact**: lavlna280@gmail.com

---

## 🎬 Quick Start Command

To fully understand the codebase, GPT should:

```bash
1. Read this document thoroughly
2. Review key files:
   - src/services/artworkService.ts
   - src/services/paymentService.ts
   - src/screens/HomeScreen.tsx
   - src/screens/ArtworkDetailScreen.tsx
   - database/FINAL-INSTALL.sql
3. Understand the data flow:
   User → App → Supabase → Database
   User → App → 2Checkout → Webhook → Database
4. Review the navigation structure:
   AuthNavigator → TabNavigator → StackNavigators
```

---

**Last Updated**: 2025-01-11  
**Platform Version**: 1.0.0 (Pre-launch)  
**Codebase**: React Native (Expo), TypeScript, Supabase

