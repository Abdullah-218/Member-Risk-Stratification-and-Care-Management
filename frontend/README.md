# Healthcare Risk Platform - Merged UI

## Overview
This is the merged UI application that combines both the Individual Assessment UI and Organization UI into a single, cohesive application with a unified login system.

## Structure

```
src/
├── login/                          # Single unified login page
│   └── EntryLoginPage/             # Routes users based on role selection
├── individual_assessment_ui/       # Individual assessment components
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── hooks/
├── organization_ui/                # Organization management components
│   ├── organizational_login/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── components/
│   │   └── services/
│   └── assets/
├── common/                         # Shared components and utilities
│   ├── components/
│   ├── services/
│   └── hooks/
├── App.jsx                         # Main application with routing
└── main.jsx                        # Application entry point
```

## Features

### Single Login System
- **Entry Point**: One login page at `/login`
- **Role-Based Routing**: 
  - Organization users → `/org/*` (Organization UI)
  - Individual users → `/assessment` (Individual Assessment)

### Organization UI (`/org/*`)
- Complete care management dashboard
- Member risk stratification
- Department management
- Upload and analytics
- All existing organization features preserved

### Individual Assessment UI (`/assessment`)
- Patient self-assessment
- Risk evaluation
- Assessment reports
- All existing individual features preserved

## Key Integration Points

### Routing
- `/` → redirects to `/login`
- `/login` → unified entry page
- `/org/*` → Organization UI with full context providers
- `/assessment` → Individual assessment
- `/report` → Assessment reports

### Context Providers
Organization UI maintains all its existing context providers:
- AuthProvider
- MemberProvider
- NavigationHistoryProvider
- CarePlanProvider
- PredictionWindowProvider

### Shared Components
- Common UI components are shared across both UIs
- Services and hooks are available to both UIs
- No duplication of core logic

## Installation & Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Dependencies
Combined dependencies from both UIs including:
- React 18
- React Router v6
- Lucide Icons
- Recharts (for organization charts)
- Axios (for API calls)
- PDF generation libraries
- Date utilities
- CSV parsing

## Architecture Notes

### Preserved Functionality
- ✅ All Organization UI features intact
- ✅ All Individual Assessment features intact
- ✅ Existing AI logic and services unchanged
- ✅ Context providers maintained
- ✅ Component structure preserved

### Changes Made
- ✅ Single unified login page
- ✅ Clean folder separation
- ✅ Centralized routing
- ✅ Shared component library
- ✅ No business logic changes

### Backend Integration
- All components remain backend-ready
- API calls abstracted through services
- Mock data preserved for development
- Easy to switch to real APIs

## Development Guidelines

1. **Login Changes**: Only modify `/login/EntryLoginPage` for login flow changes
2. **Organization Features**: Work in `/organization_ui/` folder
3. **Individual Features**: Work in `/individual_assessment_ui/` folder
4. **Shared Components**: Add to `/common/` folder
5. **Routing**: Update main `App.jsx` for route changes

This merged structure maintains complete functionality while providing a clean, scalable architecture for future development.
