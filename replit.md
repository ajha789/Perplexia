# Perplexia - AI Django Development Assistant

## Overview

Perplexia is an AI-powered chat application designed to assist with Django full-stack development using PostgreSQL. The application provides an intelligent conversational interface that leverages Perplexity AI models to generate Django code, answer development questions, and provide guidance on full-stack development best practices.

The application features a modern, developer-focused UI with chat history management, multiple AI model options, code syntax highlighting, and project export capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18 with TypeScript for type safety and modern component development
- Vite as the build tool and development server for fast HMR (Hot Module Replacement)
- Wouter for lightweight client-side routing

**UI Component System:**
- shadcn/ui component library (New York style variant) with Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Custom theme system supporting light/dark modes with localStorage persistence

**Design Philosophy:**
- Developer-first interface inspired by Linear, VS Code, and Notion
- Functional minimalism with clear visual hierarchy
- Inter font family for UI text, JetBrains Mono for code blocks
- Custom color system using HSL values with CSS variables for theming

**State Management:**
- TanStack Query (React Query) for server state management and caching
- React Context API for theme management
- Local component state with React hooks

**Key Frontend Features:**
- Persistent chat history with sidebar navigation
- Multi-model selector (Sonar Pro, Sonar, Sonar Reasoning, Deep Research)
- Code block rendering with syntax highlighting using react-syntax-highlighter
- Project export functionality using JSZip for bundling generated code
- Real-time API key status monitoring
- Responsive layout with collapsible sidebar

### Backend Architecture

**Server Framework:**
- Express.js as the web server framework
- TypeScript for type-safe backend development
- HTTP server creation with Node.js built-in `http` module

**API Design:**
- RESTful API endpoints for CRUD operations on chats and messages
- Streaming responses for real-time AI model interaction
- Session-based request logging with timing metrics

**Build Process:**
- esbuild for server-side bundling to reduce syscalls and improve cold start
- Separate client and server build pipelines
- Dependency allowlist system for selective bundling vs external dependencies

### Data Storage & Database

**Database:**
- PostgreSQL as the primary database (configured for Neon serverless)
- Drizzle ORM for type-safe database queries and schema management
- WebSocket-based connection pooling via @neondatabase/serverless

**Schema Design:**
- `chats` table: Stores conversation sessions with title, model selection, and timestamps
- `messages` table: Stores individual messages with role (user/assistant), content, and optional citations
- `apiKeys` table: Tracks API key rotation status, usage, and error counts
- Foreign key relationships with cascade deletion for data integrity

**Data Layer Pattern:**
- Storage abstraction interface (`IStorage`) for decoupled data access
- `DatabaseStorage` implementation using Drizzle ORM
- Centralized database connection management in `db.ts`

### External Dependencies

**AI Service Integration:**
- **Perplexity AI API**: Primary AI service for code generation and responses
  - Multiple API key rotation system (up to 3 keys) for rate limit management
  - Model mapping system translating UI model names to Perplexity API model identifiers
  - Specialized Django system prompt for domain-specific expertise
  - Automatic key exhaustion detection and rotation
  - Status tracking and error counting per API key

**Third-Party Services:**
- Google Fonts: Inter and JetBrains Mono font families
- Neon Database: Serverless PostgreSQL hosting with WebSocket support

**Key NPM Dependencies:**
- `@neondatabase/serverless`: PostgreSQL client with WebSocket support
- `drizzle-orm` & `drizzle-kit`: ORM and migration tooling
- `express`: Web server framework
- `@tanstack/react-query`: Data fetching and caching
- `wouter`: Client-side routing
- `jszip`: Project file bundling and export
- `react-syntax-highlighter`: Code syntax highlighting
- `zod`: Runtime type validation and schema definition

**Development Tools:**
- Replit-specific plugins for dev banner, error overlay, and cartographer
- PostCSS with Tailwind CSS and Autoprefixer
- TypeScript compiler with strict mode enabled

### Authentication & Security

**Current State:**
- No authentication system implemented (sessions and passport dependencies present but unused)
- API endpoints are publicly accessible
- Rate limiting capability exists via express-rate-limit dependency

**Design Considerations:**
- Session infrastructure available through express-session and connect-pg-simple
- Passport.js and passport-local dependencies suggest planned local authentication
- Security headers and CORS configuration not currently implemented

### Configuration Management

**Environment Variables:**
- `DATABASE_URL`: PostgreSQL connection string (required)
- `PERPLEXITY_API_KEY_1`, `PERPLEXITY_API_KEY_2`, `PERPLEXITY_API_KEY_3`: Perplexity API keys for rotation
- `NODE_ENV`: Environment mode (development/production)

**TypeScript Configuration:**
- Path aliases configured for clean imports (`@/`, `@shared/`, `@assets/`)
- Strict mode enabled for type safety
- ESNext module system with bundler resolution
- Build info caching for incremental compilation