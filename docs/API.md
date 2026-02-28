# API Documentation

**Version:** 1.0.0-beta  
**Last Updated:** 2026-02-28

---

## 📡 Overview

Elite Dangerous NEXT provides a RESTful API for accessing journal events, statistics, and real-time updates.

### Base URL

```
Development: http://localhost:3000
Production: http://your-domain.com
```

### Authentication

Currently, the API is open for local use. OAuth2 authentication is planned for v1.0.0.

---

## 📋 Endpoints

### Health & Status

#### GET /health

Check if the server is running.

**Request:**
```http
GET /health HTTP/1.1
Host: localhost:3000
```

**Response (200 OK):**
```json
{
  "status": "healthy",
  "version": "1.0.0-beta"
}
```

---

#### GET /api/v1/status

Get server status and database information.

**Request:**
```http
GET /api/v1/status HTTP/1.1
Host: localhost:3000
```

**Response (200 OK):**
```json
{
  "name": "Elite Dangerous NEXT",
  "version": "1.0.0-beta",
  "status": "running",
  "database": {
    "connected": true,
    "eventCount": 58276,
    "isDirty": false
  },
  "uptime": 12345.67
}
```

---

#### GET /api/v1/journal/status

Get journal monitoring status.

**Request:**
```http
GET /api/v1/journal/status HTTP/1.1
Host: localhost:3000
```

**Response (200 OK):**
```json
{
  "watching": true,
  "path": "C:\\Users\\CMDR\\Saved Games\\Frontier Developments\\Elite Dangerous",
  "filesLoaded": 184,
  "lastEventTime": "2026-02-28T14:30:00.000Z"
}
```

---

### Events

#### GET /api/v1/events

Get paginated list of events.

**Query Parameters:**

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `limit` | number | 50 | 500 | Number of events to return |
| `offset` | number | 0 | - | Offset for pagination |

**Request:**
```http
GET /api/v1/events?limit=50&offset=0 HTTP/1.1
Host: localhost:3000
```

**Response (200 OK):**
```json
{
  "events": [
    {
      "event_id": "2026-02-28T14:30:00.000Z_FSDJump_Alpha Centauri",
      "timestamp": "2026-02-28T14:30:00.000Z",
      "event_type": "FSDJump",
      "commander": "CMDR Example",
      "system_name": "Alpha Centauri",
      "station_name": null,
      "body": null,
      "raw_json": "{\"timestamp\":\"2026-02-28T14:30:00.000Z\",\"event\":\"FSDJump\"...}",
      "created_at": "2026-02-28T14:30:01.000Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 58276,
    "hasMore": true
  }
}
```

---

#### GET /api/v1/events/all

Get all events (optional limit).

**Query Parameters:**

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `limit` | number | none | 100000 | Maximum events to return |

**Request:**
```http
GET /api/v1/events/all?limit=1000 HTTP/1.1
Host: localhost:3000
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [...],
  "total": 58276
}
```

---

#### GET /api/v1/events/count

Get total event count.

**Request:**
```http
GET /api/v1/events/count HTTP/1.1
Host: localhost:3000
```

**Response (200 OK):**
```json
{
  "count": 58276,
  "lastUpdated": "2026-02-28T15:00:00.000Z"
}
```

---

### Statistics

#### GET /api/v1/stats

Get comprehensive statistics.

**Request:**
```http
GET /api/v1/stats HTTP/1.1
Host: localhost:3000
```

**Response (200 OK):**
```json
{
  "totalEvents": 58276,
  "eventsByType": {
    "FSDJump": 12345,
    "Docked": 5678,
    "Scan": 23456,
    "SupercruiseEntry": 3456,
    "SupercruiseExit": 3456
  },
  "uniqueSystems": 1058,
  "firstEvent": "2025-07-27T10:00:00.000Z",
  "lastEvent": "2026-02-28T14:30:00.000Z"
}
```

---

### Filtering (Planned for v1.0.0)

#### GET /api/v1/events/filter

Filter events by criteria.

**Query Parameters (Planned):**

| Parameter | Type | Description |
|-----------|------|-------------|
| `event_type` | string | Filter by event type |
| `system` | string | Filter by system name |
| `start_date` | string | Start date (ISO 8601) |
| `end_date` | string | End date (ISO 8601) |
| `commander` | string | Filter by commander name |

**Example (Planned):**
```http
GET /api/v1/events/filter?event_type=FSDJump&system=Alpha%20Centauri HTTP/1.1
```

---

## 🔌 WebSocket API

### Connection

**URL:** `ws://localhost:3000`

### Events

#### journal:event

Emitted when a new journal event is detected.

**Payload:**
```json
{
  "timestamp": "2026-02-28T14:30:00.000Z",
  "event": "FSDJump",
  "data": {
    "StarSystem": "Alpha Centauri",
    "JumpDist": 4.5,
    ...
  }
}
```

---

#### stats:update

Emitted when statistics are updated.

**Payload:**
```json
{
  "stats": {
    "totalEvents": 58277,
    "eventsByType": {...},
    ...
  },
  "lastEventTime": "2026-02-28T14:30:00.000Z",
  "timestamp": "2026-02-28T15:00:00.000Z"
}
```

---

### Example Client

```javascript
const ws = new WebSocket('ws://localhost:3000');

ws.on('open', () => {
  console.log('Connected to WebSocket');
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  
  if (message.type === 'journal:event') {
    console.log('New event:', message.event);
  } else if (message.type === 'stats:update') {
    console.log('Stats updated:', message.stats);
  }
});
```

---

## 📊 Response Codes

| Code | Description |
|------|-------------|
| **200 OK** | Success |
| **400 Bad Request** | Invalid parameters |
| **404 Not Found** | Endpoint not found |
| **500 Internal Server Error** | Server error |

---

## 🔒 Rate Limiting

Currently, there are no rate limits for local use. Rate limiting will be implemented in v1.0.0 for production deployments.

---

## 🧪 Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:3000/health

# Get events
curl "http://localhost:3000/api/v1/events?limit=10"

# Get statistics
curl http://localhost:3000/api/v1/stats

# Get event count
curl http://localhost:3000/api/v1/events/count
```

### Using JavaScript (Fetch)

```javascript
// Get events
const response = await fetch('http://localhost:3000/api/v1/events?limit=10');
const data = await response.json();
console.log(data);

// Get statistics
const stats = await fetch('http://localhost:3000/api/v1/stats');
const statsData = await stats.json();
console.log(statsData);
```

### Using Postman

1. Create new request
2. Set method to GET
3. Enter URL: `http://localhost:3000/api/v1/events`
4. Add query parameters as needed
5. Click Send

---

## 📝 Examples

### Example 1: Get Latest 10 FSD Jumps

```bash
curl "http://localhost:3000/api/v1/events?limit=10" | \
  jq '.events[] | select(.event_type == "FSDJump")'
```

### Example 2: Count Events by Type

```javascript
const response = await fetch('http://localhost:3000/api/v1/stats');
const stats = await response.json();

for (const [type, count] of Object.entries(stats.eventsByType)) {
  console.log(`${type}: ${count}`);
}
```

### Example 3: Monitor Real-time Events

```javascript
const ws = new WebSocket('ws://localhost:3000');

ws.on('message', (data) => {
  const message = JSON.parse(data);
  if (message.type === 'journal:event') {
    console.log(`[${message.timestamp}] ${message.event}`);
  }
});
```

---

## 🐛 Error Handling

### Error Response Format

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message"
}
```

### Common Errors

#### 400 Bad Request

```json
{
  "error": "INVALID_PARAMETER",
  "message": "Parameter 'limit' must be between 1 and 500"
}
```

#### 404 Not Found

```json
{
  "error": "NOT_FOUND",
  "message": "Route not found"
}
```

#### 500 Internal Server Error

```json
{
  "error": "INTERNAL_ERROR",
  "message": "Database connection failed"
}
```

---

## 📚 Related Documentation

- [Installation Guide](INSTALLATION.md)
- [Configuration Guide](CONFIGURATION.md)
- [Testing Guide](TESTING.md)

---

**API Version:** 1.0.0-beta  
**Last Updated:** 2026-02-28
