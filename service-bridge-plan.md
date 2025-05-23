# Service Bridge Layer Implementation Plan

## Overview
We need to build the service bridge layer that sits between your existing orchestrator and a simple frontend. This will handle event streaming, session management, and API endpoints.

## Phase 1: Core Infrastructure (Start Here)

### 1.1 Next.js API Routes Setup
**Files to create:**
- `src/app/api/story/generate/route.ts` - Story generation endpoint
- `src/app/api/story/[sessionId]/status/route.ts` - Status endpoint
- `src/app/api/story/[sessionId]/cancel/route.ts` - Cancel endpoint
- `src/app/api/health/route.ts` - Health check

**Key features:**
- Next.js App Router API routes
- Built-in request/response handling
- Automatic TypeScript support
- Hot reload during development

### 1.2 API Route Handlers
**Endpoints:**
- `POST /api/story/generate` - Start story generation
- `GET /api/story/[sessionId]/status` - Get current status
- `DELETE /api/story/[sessionId]/cancel` - Cancel generation
- `GET /api/health` - Health check

## Phase 2: Event Streaming (Core Feature)

### 2.1 Server-Sent Events (SSE) with Next.js
**Files to create:**
- `src/app/api/events/[sessionId]/route.ts` - SSE endpoint using Next.js streaming
- `src/lib/server/eventStreamer.ts` - SSE management service
- `src/lib/server/streamHelpers.ts` - Next.js streaming utilities

**Features:**
- `GET /api/events/[sessionId]` - SSE endpoint using Next.js streaming response
- Connection management with Next.js request handling
- Automatic cleanup using AbortController
- Event formatting for frontend consumption

### 2.2 Session & Story Management
**Files to create:**
- `src/lib/server/sessionManager.ts` - Session state management
- `src/lib/server/models/session.ts` - Session data structures
- `src/lib/server/models/story.ts` - Story database models
- `src/lib/server/stores/memoryStore.ts` - In-memory session storage
- `src/lib/server/stores/storyStore.ts` - Database story operations

**Features:**
- Generate unique session IDs and story UUIDs
- Track active story generation sessions (in-memory)
- Store completed stories in SQL database
- Handle session cleanup and cancellation
- Separate session state from persistent story data

## Phase 3: Integration Layer

### 3.1 Orchestrator Integration
**Files to modify/create:**
- `src/lib/server/storyService.ts` - Bridge to orchestrator
- `src/lib/server/factories/orchestratorFactory.ts` - Create configured orchestrator
- `src/lib/server/eventHandlers/storyEventHandler.ts` - Handle orchestrator events

**Features:**
- Initialize orchestrator with LLM config
- Listen to orchestrator events
- Transform events for frontend consumption
- Handle orchestrator errors gracefully

### 3.2 Configuration Management
**Files to create:**
- `src/lib/server/config/index.ts` - Server configuration
- `src/lib/server/config/llm.ts` - LLM configuration
- `src/lib/server/config/env.ts` - Environment validation

**Features:**
- Environment variable handling with validation
- LLM API configuration
- Next.js environment integration
- Development vs production configs

## Phase 4: Simple Frontend (Testing Interface)

### 4.1 Next.js React Components
**Files to create:**
- `src/components/StoryForm.tsx` - Input form
- `src/components/ProgressDisplay.tsx` - Generation progress
- `src/components/StoryReader.tsx` - Display completed pages
- `src/components/EventLogger.tsx` - Debug event stream
- `src/app/page.tsx` - Main story generation page (update existing)
- `src/app/story/[sessionId]/page.tsx` - Individual story view

### 4.2 Frontend Services & Hooks
**Files to create:**
- `src/lib/client/api.ts` - API client for Next.js
- `src/lib/client/eventStream.ts` - SSE client
- `src/hooks/useStoryGeneration.ts` - React hook for story state
- `src/hooks/useEventStream.ts` - React hook for SSE connection

## Phase 6: Database Integration (Future Enhancement)

### 6.1 Database Schema Design
**Files to create:**
- `src/lib/server/db/schema.sql` - Database schema
- `src/lib/server/db/migrations/` - Migration files
- `src/lib/server/db/connection.ts` - Database connection setup

**Schema:**
```sql
-- Stories table
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255),
  topic TEXT NOT NULL,
  author_style VARCHAR(255),
  total_pages INTEGER NOT NULL,
  quality_level INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'generating', 'completed', 'failed'
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  user_id UUID -- For future auth integration
);

-- Story pages table
CREATE TABLE story_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  plan TEXT,
  critique TEXT,
  iteration INTEGER DEFAULT 1,
  completed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(story_id, page_number)
);

-- Users table (for future auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  username VARCHAR(100) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 6.2 Database Operations
**Files to create:**
- `src/lib/server/db/storyQueries.ts` - Story CRUD operations
- `src/lib/server/db/pageQueries.ts` - Page operations
- `src/lib/server/repositories/storyRepository.ts` - Repository pattern

**Features:**
- Save story metadata on generation start
- Save pages as they complete
- Retrieve stories by ID or user
- Update story status throughout generation
- Soft delete and archiving capabilities

### 5.1 Connection Management
**Features:**
- Automatic reconnection with exponential backoff
- Heartbeat/ping mechanism
- Connection state recovery
- Graceful degradation

### 5.2 Generation Recovery
**Features:**
- Handle individual page failures
- Retry logic for API calls
- Partial story preservation
- User notification system

## Implementation Priority & Dependencies

### Sprint 1 (Core Foundation)
1. **Next.js API routes setup** (1.1)
2. **Basic API endpoints** (1.2)
3. **Session management** (2.2)
4. **Simple orchestrator integration** (3.1)

### Sprint 2 (Real-time Features)
1. **SSE implementation with Next.js streaming** (2.1)
2. **Event streaming service** (2.1)
3. **Configuration management** (3.2)
4. **Basic error handling**

### Sprint 3 (Frontend Integration)
1. **Next.js React components** (4.1)
2. **Frontend services & hooks** (4.2)
3. **End-to-end testing**
4. **Basic error recovery** (5.1)

### Sprint 4 (Polish & Robustness)
1. **Advanced error handling** (5.2)
2. **Connection recovery** (5.1)
3. **Performance optimization**
4. **Documentation**

### Future Sprints (Post-MVP)
**Sprint 5: Database Integration**
1. **Database schema setup** (6.1)
2. **Story persistence** (6.2)
3. **Migration from in-memory sessions**
4. **Story browsing interface**

**Sprint 6: Authentication & User Management**
1. **Auth system integration** (7.1)
2. **User story management** (7.2)
3. **Protected routes**
4. **User dashboard**

## Key Technical Decisions

### Data Architecture
- **Session vs Story separation:** Sessions track active generation, Stories persist completed work
- **Database:** SQL database (PostgreSQL recommended) for story persistence
- **Story UUIDs:** Each story gets a unique UUID for future sharing/auth
- **Dual storage:** In-memory for active sessions, database for completed stories

### Session Storage
- **Active sessions:** In-memory storage (Map/WeakMap) for real-time generation
- **Completed stories:** SQL database for persistence and user access
- **Future upgrade:** Redis for distributed session management if needed

### Database Design
- **Stories table:** Metadata, settings, status
- **Pages table:** Individual page content with foreign key to story
- **Users table:** Ready for future auth integration
- **Scalable:** Designed for multi-user, multi-story scenarios

### Event Streaming
- **Primary:** Server-Sent Events using Next.js streaming responses
- **Next.js advantage:** Built-in streaming support with `ReadableStream`
- **Fallback:** Polling for older browsers

### Frontend Framework
- **Framework:** Next.js with React Server Components where appropriate
- **State management:** Built-in useState/useEffect + custom hooks
- **Routing:** Next.js App Router for seamless navigation
- **Database integration:** Server actions for database operations

### Error Handling Strategy
- **Graceful degradation:** Partial stories still usable and saved
- **User feedback:** Clear progress and error messages
- **Recovery:** Automatic retries with manual fallback
- **Data preservation:** Stories saved incrementally to prevent data loss

## Environment Setup Requirements

### Development Dependencies
```json
{
  "uuid": "^9.0.0",
  "@types/uuid": "^9.0.0"
}
```
*Note: Next.js already includes TypeScript, React, and most other dependencies*

### Environment Variables (.env.local)
```env
NODE_ENV=development
OPENROUTER_API_KEY=your_key_here
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
EXTENDED_DEBUG=false

# Database (for future phases)
DATABASE_URL=postgresql://username:password@localhost:5432/writefully
# or for development
DATABASE_URL=postgresql://localhost:5432/writefully_dev
```

### Next.js Configuration
- **File:** `next.config.js` - Configure for API routes and streaming
- **TypeScript:** Already configured in your project
- **Tailwind CSS:** Already configured in your project

## Success Metrics

### Phase 1 Success
- [ ] Server starts without errors
- [ ] Can receive story generation requests
- [ ] Basic session tracking works
- [ ] Health check endpoint responds

### Phase 2 Success
- [ ] SSE connection established
- [ ] Events stream in real-time
- [ ] Multiple sessions can run simultaneously
- [ ] Connections clean up properly

### Phase 3 Success
- [ ] Orchestrator events reach frontend
- [ ] Story pages appear as completed
- [ ] Error events handled gracefully
- [ ] Cancellation works

### Phase 4 Success
- [ ] End-to-end story generation works
- [ ] Real-time progress visible
- [ ] Pages display as they complete
- [ ] User can start multiple stories

## Next Steps

1. **Confirm this plan** - Does this approach align with your goals?
2. **Start with Sprint 1** - Begin with the Express server and basic endpoints
3. **Iterate quickly** - Get something working end-to-end, then improve
4. **Test early** - Set up simple integration tests from the start

Would you like me to start implementing Sprint 1, or would you prefer to modify any part of this plan first?