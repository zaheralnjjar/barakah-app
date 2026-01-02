# Changelog

## [Unreleased] - 2026-01-01

### Added
- **Collapsible Financial Sections**: Converted "Add Transaction", "Savings Goals", and "Recent Transactions" in `FinancialController.tsx` from dialogs to inline expandable sections for better UX.
- **Collapsible Prayer Times**: Updated `DashboardHeaderStrip.tsx` to feature a collapsible prayer times section, reducing clutter.
- **Note Pinning**: Implemented pinning functionality in `QuickNotes.tsx` and updated `SmartDashboard.tsx` to display pinned notes with a pin icon and priority sorting.
- **Dollar Rates Display**: Enhanced `DashboardHeaderStrip.tsx` to fetch and display both Official and Blue dollar rates alongside the daily financial limit.

### Changed
- **Dashboard Header Redesign**: Refactored `DashboardHeaderStrip.tsx` into a compact, single-row design focusing on financial clarity (Remaining Daily, Expenses, Rates) and minimized prayer info.
- **Financial Controller Layout**: Replaced the card-grid layout with a vertical stack of expandable sections.
- **SmartDashboard Integration**: Updated `SmartDashboard.tsx` to use the self-contained `DashboardHeaderStrip` (removed props passing) and improved the Notes section UI.

### Fixed
- **Linting Errors**: Resolved various TypeScript linting errors related to imports, hooks usage, and JSX structure in the refactored components.
- **Data Fetching**: Corrected data fetching logic in `DashboardHeaderStrip` to use `useFinance` hook and separate API calls for dollar rates where needed.
