# Overview

This is a full-stack quiz application built specifically for Christian mothers, designed as an emergency diagnostic tool about relationship trauma and its impact on children. The application guides users through a multi-step quiz flow, collecting personal data and quiz responses, then presents VSL (Video Sales Letter) content and sales pages. The system is architected as a modern web application with React frontend, Express backend, and PostgreSQL database integration.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built with React 18 using TypeScript and follows a component-based architecture with:

- **UI Framework**: Shadcn/ui components with Radix UI primitives for consistent, accessible design
- **Styling**: Tailwind CSS with custom CSS variables for theming, including emergency/urgent color schemes
- **Animations**: Framer Motion for smooth page transitions and interactive elements
- **State Management**: React hooks with TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form processing

The application implements a step-by-step quiz flow with pages for landing, questions, data collection, VSL presentation, and sales conversion.

## Backend Architecture
The backend uses Express.js with TypeScript following a RESTful API design:

- **Framework**: Express.js with middleware for JSON parsing, logging, and error handling
- **Storage Layer**: Abstracted storage interface supporting both in-memory (development) and database implementations
- **API Endpoints**: RESTful routes for quiz response submission and retrieval
- **Development Server**: Vite integration for hot module replacement in development
- **Build Process**: ESBuild for production bundling with Node.js target

## Database Design
PostgreSQL database with Drizzle ORM providing type-safe database operations:

- **Users Table**: Basic user authentication structure (username, password)
- **Quiz Responses Table**: Comprehensive quiz data storage including personal information (nome, email, whatsapp), quiz answers in JSONB format, emotional scoring, and timestamps
- **Schema Validation**: Zod schemas ensure data integrity between client and server
- **Migrations**: Drizzle Kit handles database schema migrations

## Development Tooling
The project uses modern development tools for type safety and developer experience:

- **TypeScript**: Strict type checking across frontend, backend, and shared code
- **Path Aliases**: Configured for clean imports (@/ for client, @shared for shared code)
- **Linting/Formatting**: ESM modules with strict TypeScript configuration
- **Build System**: Vite for frontend bundling, ESBuild for backend compilation

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting via @neondatabase/serverless driver
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL dialect support

## UI Component Libraries
- **Radix UI**: Comprehensive set of accessible, unstyled UI primitives for building the component system
- **Shadcn/ui**: Pre-built component library built on Radix UI with consistent styling

## Styling and Animation
- **Tailwind CSS**: Utility-first CSS framework with custom design system configuration
- **Framer Motion**: Production-ready motion library for React animations and transitions

## State Management and Data Fetching
- **TanStack React Query**: Powerful data synchronization for React with caching and background updates
- **React Hook Form**: Performant, flexible forms with easy validation

## Validation and Type Safety
- **Zod**: TypeScript-first schema validation with static type inference
- **Drizzle Zod**: Integration layer between Drizzle ORM and Zod for schema consistency

## Development and Build Tools
- **Vite**: Fast build tool and development server with React plugin support
- **Replit Integration**: Custom plugins for development environment integration and error handling
- **ESBuild**: Extremely fast JavaScript bundler for production builds

## Session Management
- **connect-pg-simple**: PostgreSQL session store for Express sessions (configured but not actively used in current implementation)

## Fonts and Typography
- **Google Fonts**: Multiple font families including Roboto, DM Sans, Geist Mono, and Architects Daughter for varied typography needs