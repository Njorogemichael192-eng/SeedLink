🌿 SeedLink – Kenya's Living Chain of Green  

Digital platform connecting communities with environmental action through technology.

SeedLink connects everyday Kenyans, institutions, and organizations with real conservation opportunities:  
- Book verified seedlings  
- Join and host tree-planting events  
- Track growth using satellite data  
- Access the platform via Web + USSD, so feature-phone users are fully included.  



📖 Table of Contents  

1. 🎯 Hero & Competition Context  
2. 🌱 Executive Summary  
3. 🌍 Project Overview  
4. 🚀 Key Features  
5. 🛠 Technology Stack  
6. 📦 Installation & Setup  
7. ⚙️ Configuration  
8. 🎮 Usage Guide  
9. 📊 Environmental Impact Metrics  
10. 🔌 API Documentation (High-Level)  
11. 🗃 Database & Migrations  
12. 🧪 Testing  
13. 🚀 Deployment  
14. 🤝 Contributing  
15. 📞 Support & Contact  
16. 📄 License  
17. 🙏 Acknowledgments  
18. 🗺 Roadmap  



1. 🎯 Hero & Competition Context  

Competition Positioning  

- Hackathon / Challenge: Wangari Maathai Foundation Environmental Challenge  
- Problem Statement:  
  - Deforestation and land degradation  
  - Low, fragmented community engagement  
  - Limited digital access for rural communities  
  - Lack of verifiable impact tracking  

- Solution Alignment:  
  - Digital conservation infrastructure  
  - Multi-channel access (web + USSD + SMS)  
  - Satellite-verified impact tracking  
  - County-ready architecture for all 47 counties  



2. 🌱 Executive Summary  

Mission  

Empower Kenyan communities to restore forests and protect the environment through accessible, verifiable, and engaging digital tools.  

Vision  

A Kenya where every tree planted is tracked, verified, and celebrated – from city estates to rural villages.  

Core Value Proposition  

- For individuals: Easy discovery of events, simple bookings, and visible impact.  
- For institutions & organizations: Structured tools to manage events, seedlings, and impact reporting.  
- For foundations & partners: Trusted, verifiable data on environmental outcomes.  

Key Differentiators  

- Web + USSD access (no smartphone required).  
- Integration with Antugrow for satellite health verification.  
- Real seedlings, real stations, real events – not just pledges.  
- Gamified experience (leaderboards, achievements, growth tracking).  

Example Impact Metrics (designed)  

- Number of trees planted and tracked.  
- Estimated CO₂ sequestered.  
- Community participation rates (users, events joined).  
- Species diversity and survival analytics (via Antugrow and future data).  



3. 🌍 Project Overview  

The Problem  

- High deforestation and land degradation in Kenya.  
- Conservation efforts often siloed, manual, and hard to verify.  
- Digital divide leaves many rural and low-income users behind.  
- Donors and partners lack transparent, verifiable impact data.  

The Solution – SeedLink  

- Multi-access platform:  
  - Web app for rich experience (events, leaderboards, growth tracker, learn hub).  
  - USSD flows for booking seedlings and joining events from feature phones.  
- Real resource distribution:  
  - Seedling stations with inventory-aware booking.  
  - Bookings and USSD bookings recorded in the database.  
- Verifiable growth tracking:  
  - Users upload photos and geo-coordinates.  
  - Antugrow API used for satellite data (NDVI, local conditions, AI image analysis).  
- Inclusive design:  
  - Built for all Kenyans: smartphones, feature phones, urban and rural.  



4. 🚀 Key Features  

4.1 Core Modules  

- 🤝 Multi-type Registration & Profiles  
  - Support for Individual, Institution, and Organization accounts.  
  - Profiles with roles, club memberships, verification state, and contact info.  

- 🌱 Seedling Booking System  
  - Book seedlings from registered Seedling Stations.  
  - Real-time inventory via the SeedlingInventory model.  
  - Statuses: PENDING, CONFIRMED, READY_FOR_PICKUP, COMPLETED, CANCELLED, EXPIRED.  

- 📅 Event Management & Volunteer Coordination  
  - Create and manage Events with location, time, and volunteer slots.  
  - Users can join events via web or USSD.  
  - Attendance and RSVP tracking via EventAttendance and PostAttendance.  

- 📊 Growth Tracker  
  - GrowthTrackerEntry model for user-submitted tree growth logs.  
  - Records coordinates, planting date, photo URL, and AI health diagnosis result from Antugrow.  
  - Growth entries surfaced through /growth pages and APIs.  

- 🏆 Leaderboards & Gamification  
  - Leaderboard model for tracking posts, seedlings planted, and events hosted per scope.  
  - Scopes: GLOBAL, COUNTY, INSTITUTION.  
  - Basis for county and community competitions.  

- 📱 USSD Integration  
  - USSD flows implemented under app/api/ussd:  
    - Registration flow  
    - Seedling booking flow  
    - Event registration flow  
  - All flows are stateful via UssdSession + UssdUser.  

- 🎓 Learn Platform  
  - Learn hub with ContentItem and UserContentInteraction.  
  - Curated educational content, categories, difficulty levels, and interaction tracking.  

- 👨‍💼 Admin & Moderation Tools  
  - Admin endpoints for content items and growth entries.  
  - Routes for post moderation, event management, and analytics inputs.  

4.2 Antugrow Integration (Innovation)  

- Satellite Health Verification  
  - /api/antugrow/ndvi-history – NDVI-based vegetation index history.  
  - /api/antugrow/local-conditions – local environmental conditions.  
  - /api/antugrow/analyze-growth-image – AI-based growth image analysis.  

- Climate-smart Guidance  
  - Antugrow data used to improve species choice, survival likelihood, and health diagnostics.  

- AI Health Diagnosis  
  - Results stored in GrowthTrackerEntry.aiHealthDiagnosis for future insights.  

4.3 Accessibility & Communication  

- Web App (Next.js)  
  - Responsive dashboard, feed, growth page, learn hub.  

- USSD (/api/ussd)  
  - Supports registration, bookings, and event sign-ups for feature phones.  

- SMS Integration  
  - lib/sms/antugrow.ts integrates with Antugrow’s SMS API.  
  - Sends confirmations (bookings, events) to users’ phones.  



5. 🛠 Technology Stack  

5.1 Frontend  

- Next.js (App Router)  
- React + TypeScript  
- Tailwind CSS with glassmorphism-inspired UI  
- Framer Motion for smooth animations  
- TanStack Query / React Query for data fetching (where used)  

5.2 Backend  

- Next.js API Routes (in app/api/*)  
- Prisma ORM with PostgreSQL  
- Clerk for authentication and user session management  

5.3 External Services  

- Antugrow API – satellite data, NDVI, AI image analysis, SMS  
- Telecom / USSD provider – for USSD access  
- ImageKit – image hosting and optimization  
- Neon – managed PostgreSQL database  



6. 📦 Installation & Setup  

6.1 Prerequisites  

- Node.js 18+  
- npm or pnpm  
- PostgreSQL instance (for example, Neon)  
- A .env file with required secrets (see below)  

6.2 Local Development  

bash
# Clone repository
git clone https://github.com/Njorogemichael192-eng/SeedLink.git
cd SeedLink/new-seedlink  # adjust if needed

# Install dependencies
npm install

# Environment
cp .env.example .env.local  # or .env
# Fill in environment variables

# Prisma client
npx prisma generate

# Run database migrations / sync
npx prisma db push   # or: npx prisma migrate dev

# Start dev server
npm run dev


By default, the app runs on http://localhost:3000.  


7. ⚙️ Configuration  

7.1 Environment Variables (Core)  

env
# Database
DATABASE_URL="postgresql://user:password@host:port/dbname"
DIRECT_DATABASE_URL="postgres://..."  # optional direct connection

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Antugrow
ANTUGROW_API_KEY="antu_..."
ANTUGROW_BASE_URL="https://api.antugrow.com/v1"

# ImageKit
IMAGEKIT_PUBLIC_KEY="public_..."
IMAGEKIT_PRIVATE_KEY="private_..."
IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/..."

# USSD (logical config – provider setup is external)
USSD_CODE="*384*92#"  # Example


Security Note: Never commit .env to version control. Treat all keys and URLs as secrets.  

7.2 Database Schema (High Level)  

Core tables and concepts:  

- User, Club, Post, Comment, Booking, Event, EventAttendance  
- SeedlingStation, SeedlingInventory, RestockSubscription  
- Notification, NotificationPreference  
- UssdUser, UssdSession, UssdBooking, UssdEventRegistration  
- ContentItem, UserContentInteraction  
- GrowthTrackerEntry – growth logs with Antugrow metadata  
- Leaderboard – multi-scope leaderboard for gamification  

All defined in prisma/schema.prisma.  



8. 🎮 Usage Guide  

8.1 For End Users (Web)  

- Sign up / login via Clerk  
- Access:  
  - Dashboard (feed, quick actions, account type info)  
  - Seedlings: view stations and make bookings  
  - Events: discover and join planting events  
  - Growth: log planted trees and track progress  
  - Learn: access curated climate and conservation content  

8.2 For USSD Users  

Typical flow (depending on integration):  

1. Dial the configured USSD code (for example, *384*92#).  
2. Use menus to:  
   - Register profile  
   - Book seedlings  
   - Join an event  
3. Behind the scenes:  
   - USSD entry hits POST /api/ussd  
   - State kept via UssdSession and UssdUser  
   - Confirmations can be sent over SMS via Antugrow  

8.3 For Institutions & Organizations  

- Register as Institution or Organization  
- Create and manage:  
  - Events (tree-planting drives)  
  - Bulk seedling bookings  
  - Club / team-based participation  
- Monitor organization impact through leaderboards and growth entries  

8.4 For Administrators  

- Moderate posts and content  
- Review and manage:  
  - Growth entries (including suspicious data)  
  - Stations and inventories  
  - USSD / web-reported activity  



9. 📊 Environmental Impact Metrics  

SeedLink is designed to expose and track:  

- Trees planted and booked through the system  
- CO₂ sequestration approximations (future extensions using standard formulas)  
- Community participation (users, bookings, events, attendances)  
- Species and health analytics using Antugrow NDVI and AI diagnosis  



10. 🔌 API Documentation (High-Level)  

SeedLink uses Next.js API routes under app/api.  

10.1 Core API Areas  

- Authentication & Registration  
  - POST /api/auth/register – enriched registration (roles, account types)  

- Posts & Social Feed  
  - GET /api/posts – fetch posts for dashboard feed  
  - GET /api/posts/[id] – single post details  
  - POST /api/posts/[id]/join – join an event-type post  
  - GET /api/posts/[id]/attendees – view attendees  

- Seedling Bookings  
  - Endpoints for creating and managing bookings (web + USSD)  

- Growth Tracker  
  - GET/POST /api/growth/entries – manage growth tracker entries  

- Learn Content  
  - Admin/content APIs for ContentItem management  

- USSD  
  - POST /api/ussd – main multiplexed handler for registration, booking, and events flows  

10.2 Antugrow Integration APIs  

http
GET  /api/antugrow/ndvi-history           # Historical NDVI vegetation index
GET  /api/antugrow/local-conditions       # Local environmental conditions
POST /api/antugrow/analyze-growth-image   # AI-based image health diagnosis


These routes call Antugrow’s upstream APIs using the configured ANTUGROW_API_KEY.  



11. 🗃 Database & Migrations  

11.1 Managing Schema Changes  

Typical workflow:  

bash
# After editing prisma/schema.prisma
npx prisma migrate dev --name some_migration_name

# Inspect data
npx prisma studio


For simple schema sync in development (no history):  

bash
npx prisma db push


Migrations are kept under prisma/migrations/.  



12. 🧪 Testing  

Note: if test suites are not yet fully implemented, this is the intended pattern.  

- Unit tests for core utilities and helpers  
- Integration tests for API routes (booking, events, growth, USSD flows)  
- E2E tests for critical user journeys (optional)  

Example commands (once tests are present):  

bash
npm test
npm run test:integration
npm run test:e2e
 



13. 🚀 Deployment  

13.1 Production Build  

bash
npm run build
npm start


13.2 Recommended Platforms  

- Vercel  
  - Native support for Next.js (App Router)  
  - Environment variables configured via dashboard  

- Other Options  
  - Railway / Render (for full-stack + database)  
  - Docker containerization plus any cloud provider  

13.3 Deployment Checklist  

- All environment variables set in production:  
  - DATABASE_URL, DIRECT_DATABASE_URL  
  - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY  
  - ANTUGROW_API_KEY, ANTUGROW_BASE_URL  
  - ImageKit keys and URL endpoint  
- Prisma generated on build or via CI (npx prisma generate)  
- Database migrations applied (npx prisma migrate deploy)  
- USSD and Antugrow endpoints allowed in network/firewall rules  



14. 🤝 Contributing  

14.1 Development Workflow  

1. Fork the repository  
2. Create a feature branch:  

   bash
   git checkout -b feature/my-feature
    

3. Commit with clear messages  
4. Run lint / tests (when present)  
5. Open a Pull Request with description and screenshots (if UI)  

14.2 Code Style & Conventions  

- Use TypeScript  
- Keep Prisma schema and models consistent with the business logic  
- Avoid committing generated Prisma client and .env changes  

14.3 Issue Reporting  

- Use GitHub Issues for:  
  - Bug reports (include steps to reproduce)  
  - Feature requests (include use case and expected behaviour)  
  - Documentation improvements  



15. 📞 Support & Contact  

- GitHub Issues: link to project issues  
- Email: support@seedlink.ke (example)  
- Website: https://seedlink.ke (not  available for now)  
- USSD: *384*92# (configurable via telecom provider)  



16. 📄 License  

SeedLink is released under the MIT License.  
See the LICENSE file for full text.  



17. 🙏 Acknowledgments  

- Wangari Maathai Foundation – inspiration and challenge context  
- Next.js / Vercel – web framework and hosting  
- Prisma ORM – type-safe database layer  
- Tailwind CSS – rapid UI styling  
- Antugrow – satellite and AI environmental intelligence  
- All contributors and early testers of SeedLink  



18. 🗺 Roadmap  

Phase 1 – Core Platform (Current)  

- Web app with bookings, events, growth tracking, learn hub  
- Basic USSD flows for registration and bookings  
- Antugrow integration endpoints and GrowthTrackerEntry model  

Phase 2 – Deeper Satellite Verification  

- Automated health checks on growth entries  
- Stronger integration of NDVI and local conditions into the UI and reporting  

Phase 3 – Mobile App  

- Dedicated Android/iOS clients using the same APIs  
- Offline-first features for low-connectivity areas  

Phase 4 – Regional Expansion  

- Scaling beyond pilot counties to all 47 counties  
- Extension to neighbouring countries in East Africa  



SeedLink aims to be a professional, competition-ready solution that combines technical excellence, social impact, and practical feasibility for environmental restoration in Kenya.

