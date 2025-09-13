# BADGEBOX

## Overview

BADGEBOX is a comprehensive employee time tracking system designed for businesses to manage staff timekeeping through PIN-based authentication. The application features a complete ecosystem for recording clock-in/clock-out times, managing employee data, viewing historical records, and handling archived employees. Built as a modern web application with offline capabilities, it integrates with Supabase for real-time data synchronization and provides a responsive interface optimized for both desktop and mobile devices.

The system implements a logical day concept (8:00 AM to 5:00 AM next day) to handle night shift workers and provides comprehensive data retention policies, export capabilities, and automated backup systems.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology Stack**: Vanilla JavaScript ES6+ modules with Vite development server
- **UI Framework**: Custom CSS with responsive design patterns and CSS Grid/Flexbox
- **Module System**: ES6 imports/exports for clean separation of concerns
- **State Management**: Local state with Supabase real-time subscriptions
- **Responsive Design**: Mobile-first approach with adaptive layouts for 320px to 1200px+ screens

### Backend Architecture
- **Database**: PostgreSQL hosted on Supabase with Row Level Security (RLS)
- **API Layer**: Supabase auto-generated REST API with real-time subscriptions
- **Authentication**: PIN-based system (1-99) with admin PIN (1909) for management access
- **Data Validation**: Client-side validation with server-side constraints and triggers
- **Caching Strategy**: 30-second TTL cache for frequently accessed data

### Core Database Schema
```sql
-- Active employees
utenti (id, pin, nome, cognome, email, telefono, descrizione_contratto, ore_contrattuali)

-- Time tracking records  
timbrature (id, pin, data, ore, tipo, created_at)

-- Archived employees with retention data
dipendenti_archiviati (id, pin_originale, nome, cognome, data_archiviazione, file_excel_path)
```

### Application Structure
- **Homepage (index.html)**: PIN input interface with numeric keypad for time tracking
- **Employee Management (utenti.html)**: CRUD operations for active employees
- **Historical Data (storico.html)**: Time records viewing with filtering and export
- **Archive Management (ex-dipendenti.html)**: Archived employee data and restoration

### Data Processing Logic
- **Logical Day Handling**: Times between 00:00-04:59 are attributed to the previous logical day
- **Duplicate Prevention**: Maximum one entry and one exit per logical day per employee
- **Work Hours Calculation**: Automatic calculation of daily and monthly totals
- **Data Retention**: Automatic cleanup of records older than 6 months via PostgreSQL cron jobs

### Performance Optimizations
- **Lazy Loading**: Images and large datasets load on demand
- **Table Pagination**: Automatic pagination for tables exceeding 200 rows
- **WebSocket Management**: HMR blocking on HTTPS to prevent development noise in production
- **Passive Event Listeners**: Smooth touch/scroll interactions on mobile devices

## External Dependencies

### Database and Backend Services
- **Supabase**: Primary database hosting (PostgreSQL) with real-time API
  - URL: `https://txmjqrnitfsiytbytxlc.supabase.co`
  - Features: Row Level Security, automated backups, real-time subscriptions
  - Extensions: pg_cron for scheduled data retention tasks

### Development and Build Tools
- **Vite 5.4.2**: Development server and build tool
  - Hot Module Replacement (HMR) with WebSocket support
  - ES6 module bundling and optimization
  - Local development server on port 5173

- **Node.js Dependencies**:
  - React 19.1.0 and React DOM (for potential future migration)
  - @vitejs/plugin-react for React integration
  - Development tools for build and deployment automation

### CDN and External Libraries
- **Supabase JavaScript Client**: Loaded via CDN from jsDelivr
  - Real-time database operations
  - Authentication and session management
  - Automatic retry and connection handling

### Deployment Platforms
- **Replit**: Primary development environment with Git integration
- **Netlify**: Production deployment with custom redirects and headers
- **GitHub**: Source code repository with automated sync capabilities

### PWA and Mobile Support
- **Manifest.json**: Progressive Web App configuration
- **Service Worker Ready**: Offline capability infrastructure
- **Touch Optimization**: Mobile-first responsive design with touch-friendly interfaces

### Monitoring and Analytics
- **Built-in Logging**: Console-based logging with structured error handling
- **Performance Monitoring**: Client-side performance patches for smooth mobile experience
- **Database Monitoring**: Supabase dashboard integration for real-time metrics