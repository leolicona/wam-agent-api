```txt
npm install
npm run dev
```

```txt
npm run deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```

## API Endpoints

### Auth API

- **POST /auth/verify**
  - Verifies an authentication token.
  - **Request Body:** `tokenVerificationSchema`
  - **Response:** `TokenVerificationSuccessResponse`
  - **Example:**
    ```bash
    curl -X POST -H "Content-Type: application/json" -d '{"token": "your_token"}' https://your-worker-url/auth/verify
    ```

- **GET /auth/health**
  - Health check endpoint for the auth service.
  - **Example:**
    ```bash
    curl https://your-worker-url/auth/health
    ```

### Business API

- **GET /business/**
  - Returns a simple message for the business endpoint.
  - **Example:**
    ```bash
    curl https://your-worker-url/business
    ```

### Calendar API

- **GET /calendar/**
  - Retrieves a calendar.
  - **Query Parameters:** `GetCalendarSchema`
  - **Example:**
    ```bash
    curl https://your-worker-url/calendar?calendarId=your_calendar_id
    ```

- **POST /calendar/events**
  - Creates a new event in a calendar.
  - **Request Body:** `CreateEventSchema`
  - **Example:**
    ```bash
    curl -X POST -H "Content-Type: application/json" -d '{"summary": "New Event", "start": "2025-12-31T23:59:59Z", "end": "2026-01-01T00:59:59Z", "calendarId": "your_calendar_id"}' https://your-worker-url/calendar/events
    ```

- **POST /calendar/calendars**
  - Creates a new calendar.
  - **Request Body:** `CreateCalendarSchema`
  - **Example:**
    ```bash
    curl -X POST -H "Content-Type: application/json" -d '{"summary": "New Calendar", "businessId": "your_business_id"}' https://your-worker-url/calendar/calendars
    ```

- **GET /calendar/free-busy**
  - Retrieves free/busy information for a calendar.
  - **Query Parameters:** `GetFreeBusySchema`
  - **Example:**
    ```bash
    curl "https://your-worker-url/calendar/free-busy?timeMin=2025-12-31T23:59:59Z&timeMax=2026-01-01T00:59:59Z&calendarIds[]=your_calendar_id"
    ```

- **GET /calendar/events**
  - Lists events in a calendar.
  - **Query Parameters:** `ListEventsSchema`
  - **Example:**
    ```bash
    curl "https://your-worker-url/calendar/events?calendarId=your_calendar_id&timeMin=2025-12-31T23:59:59Z"
    ```

- **GET /calendar/events/:calendarId/:eventId**
  - Retrieves a specific event from a calendar.
  - **Path Parameters:** `GetEventSchema`
  - **Example:**
    ```bash
    curl https://your-worker-url/calendar/events/your_calendar_id/your_event_id
    ```

- **PUT /calendar/events/:calendarId/:eventId**
  - Updates an event in a calendar.
  - **Path Parameters:** `GetEventSchema`
  - **Request Body:** `UpdateEventSchema`
  - **Example:**
    ```bash
    curl -X PUT -H "Content-Type: application/json" -d '{"summary": "Updated Event"}' https://your-worker-url/calendar/events/your_calendar_id/your_event_id
    ```

- **DELETE /calendar/events/:calendarId/:eventId**
  - Deletes an event from a calendar.
  - **Path Parameters:** `DeleteEventSchema`
  - **Example:**
    ```bash
    curl -X DELETE https://your-worker-url/calendar/events/your_calendar_id/your_event_id
    ```

### Vectorize API

- **POST /vectorize/**
  - Vectorizes data.
  - **Request Body:** `vectorizeRequestSchema`
  - **Example:**
    ```bash
    curl -X POST -H "Content-Type: application/json" -d '{"text": "This is the text to vectorize."}' https://your-worker-url/vectorize
    ```
