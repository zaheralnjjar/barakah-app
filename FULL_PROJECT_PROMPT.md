
# Barakah Life - Master Project Prompt (وكيل إنشاء المشروع الشامل)

**Instruction to AI Agent:**
You are an expert Full-Stack Developer and UI/UX Designer specializing in building high-performance, aesthetically pleasing "Super Apps" for Islamic Productivity. Your task is to build (or rebuild) "Barakah Life", a comprehensive Personal Resource Planning (PRP) application.

## 1. Project Philosophy (الرؤية)
"Barakah Life" is not just a to-do list; it is a holistic system that integrates spiritual duties (Prayer, Quran) with worldly responsibilities (Work, Finance, Health) to maximize "Barakah" (Divine Blessing) in the user's time.
*   **Core Principle**: Everything revolves around the 5 daily prayers.
*   **Aesthetics**: "Cosmic Glass" - Modern, airy, with Emerald/Teal gradients, Glassmorphism, and Golden accents. Premium feel.
*   **Language**: **Arabic (RTL)** is the primary first-class language.

## 2. Technical Stack (التقنيات)
Use the following modern stack ensuring strict type safety and performance:
*   **Framework**: React 18+ (Vite)
*   **Language**: TypeScript (Strict mode)
*   **Styling**: Tailwind CSS + `shadcn/ui` (Radix UI) + `lucide-react` icons.
*   **State Management**: `zustand` (for global stores like `useAppStore`, `useTasks`).
*   **Data Persistence**: Hybrid approach:
    *   **Local**: `localStorage` (for offline-first capability and speed).
    *   **Cloud**: `Supabase` (PostgreSQL) for syncing tasks, finances, and settings.
*   **Mobile**: `Capacitor` (for iOS/Android native wrapper).
*   **Maps**: `leaflet` & `react-leaflet`.
*   **Reporting**: `jspdf`, `jspdf-autotable`, `html2canvas`.
*   **Date/Time**: Native `Date` object extended with Hijri support (`Intl.DateTimeFormat`).

## 3. Design System (نظام التصميم)
Must apply these variables in `globals.css` / `tailwind.config.js`:
*   **Fonts**:
    *   Primary: `Tajawal` (Weights: 300, 400, 500, 700, 800) - For UI.
    *   Secondary: `Amiri` - For Quran/Hadith.
    *   Numbers: `Roboto Mono` - For financial data.
*   **Colors**:
    *   **Primary**: Emerald Green (`#10b981` / `hsl(142 76% 36%)`).
    *   **Secondary**: Teal (`#14b8a6`).
    *   **Accent**: Gold (`#fbbf24` / `hsl(45 100% 51%)`).
    *   **Background**: White to Off-white gradients (`bg-gradient-to-br from-emerald-50 to-white`).
*   **Effects**:
    *   `glass`: `bg-white/80 backdrop-blur-md border border-white/20`.
    *   `shadow-elegant`: Soft, diffused shadows for cards.
    *   `rtl`: Force `dir="rtl"` on `body`.

## 4. Application Architecture (هيكلية التطبيق)

### A. Dashboard (`src/components/SmartDashboard.tsx`) - *Refactored*
The hub of the application. It acts as a layout manager for:
1.  **DashboardHeader**: Shows Hijri/Gregorian date, Greeting, and Notification Bell.
2.  **DashboardStats**: Financial fast-view (Balance, Daily Limit, Today's Expense).
3.  **QuickActionsGrid**: Grid of colorful buttons (Add Note, Shopping, Location, Event).
4.  **DailyReportCard**: Integrated list of today's Tasks, Appointments, Medications, and Habits.
    *   *Feature*: Checkbox to complete items immediately.
5.  **DashboardCalendar**: A horizontal weekly calendar strip.
    *   *Feature*: Shows dots for events (Red=Med, Orange=Appt).
    *   *Feature*: Click day to expand.

### B. Prayer & Time (`src/components/PrayerManager.tsx`)
*   **Engine**: Calculate times using Muslim World League method.
*   **Countdown**: Massive "Next Prayer" countdown card with green gradient.
*   **Adhan**: Capability to play audio notification.
*   **Hijri Sync**: Accurate conversion.

### C. Logistics & Tasks (`src/components/logistics/`)
*   **TaskSection**: Kanban-style or List view of tasks.
    *   *Fields*: Title, Description, Priority (High/Med/Low), Deadline.
*   **AppointmentManager**: Calendar events handling.
*   **ShoppingList**: Smart list with categories (Food, Home, Health).

### D. Financial System (`src/components/dashboard/DashboardStats.tsx` & `Finance` Tab)
*   **Store**: `useAppStore` holds `financeData`.
*   **Features**:
    *   Multi-currency display (ARS local / USD reference).
    *   Daily Limit vs Actual Spending gauge.
    *   Debt tracking.
*   **Transactions**: Add income/expense with categories.

### E. Locations (`src/components/InteractiveMap.tsx`)
*   **Hook**: `useLocations` (Unified logic).
*   **Features**:
    *   Map view with user pinning.
    *   Save locations as Home/Work/Mosque.
    *   "Save Parking Spot" feature.

### F. Reports & Printing (`src/components/PrintOptionsDialog.tsx`)
*   **Centralized Hub**: Accessible from Calendar.
*   **Capabilities**:
    *   Select Time Range (Today, Week, Month, Custom).
    *   Select Data Types (Tasks, Finance, Shopping, etc.).
    *   **PDF Generation**: Generate an HTML template in `src/utils/financialReport.ts` or `src/utils/pdfGenerator.ts` and convert to PDF/Print.

## 5. Directory Structure (ترتيب الملفات)
Strictly organize files as follows:

```
src/
  ├── components/
  │   ├── dashboard/           # SmartDashboard sub-components
  │   │   ├── DashboardHeader.tsx
  │   │   ├── DashboardStats.tsx
  │   │   ├── QuickActionsGrid.tsx
  │   │   ├── DailyReportCard.tsx
  │   │   └── DashboardCalendar.tsx
  │   ├── logistics/           # Task & Planner components
  │   ├── ui/                  # Shadcn UI generic components (Button, Card, etc.)
  │   ├── InteractiveMap.tsx
  │   ├── NavigationMenu.tsx
  │   ├── PrintOptionsDialog.tsx
  │   └── SmartDashboard.tsx   # Main container
  ├── hooks/                   # Custom Hooks
  │   ├── useAppStore.ts       # Finance & Global state
  │   ├── useLocations.ts      # Location Logic
  │   ├── useTasks.ts
  │   ├── usePrayerTimes.ts
  │   └── useDashboardData.ts
  ├── utils/
  │   ├── financialReport.ts   # HTML Generation for reports
  │   └── pdfGenerator.ts      # PDF Engine
  ├── pages/
  │   └── Index.tsx            # App Entry Point
  ├── App.tsx
  └── main.tsx
```

## 6. Detailed Features (تفاصيل دقيقة)
1.  **Sync**: `useCloudSync.ts` pushes data to Supabase when "Settings" is long-pressed.
2.  **Widgets**: `useWidgetSync.ts` prepares data for Android Widget consumption.
3.  **Localization**: All static text MUST be in Arabic. Dates formatted with `ar-EG` or `ar-SA`.
4.  **Icons**: Use `lucide-react` consistently (e.g., `CalendarPlus` for appointments, `CheckSquare` for tasks).

## 7. Execution Instructions (تعليمات التنفيذ)
If asked to build this:
1.  Setup Vite + React + TS.
2.  Install Tailwind & Shadcn.
3.  Create the `hooks` first to establish business logic.
4.  Build the `SmartDashboard` sub-components.
5.  Assemble the Main Page.
6.  Ensure no broken imports or `any` types (unless necessary for external libs).
```
