# API Tester Guide

This guide explains what the subscriber API tester does, what it is testing, and how each feature works. It covers both tester screens:
- API Details page tester (per API)
- API Tester page (standalone)

## What the tester is actually testing

The tester is an integration check of the gateway and the upstream provider. It verifies:
- The request reaches the gateway endpoint you provide.
- The gateway applies subscriber rules (API key, subscription, rate limit).
- The gateway forwards the request to the provider upstream.
- The upstream response comes back through the gateway without being altered.

It does NOT test the provider internal business logic beyond what the upstream returns. It is a real request to the upstream, not a mock.

## Typical request flow

1) You build a request in the tester.
2) The request hits the gateway endpoint (for example: /gateway/{slug}/path).
3) The gateway validates subscriber access:
   - API key check
   - subscription check
   - rate limit
4) The gateway forwards to the upstream URL.
5) The upstream returns a response.
6) The gateway passes that response back to you.

If you see upstream JSON (like JSONPlaceholder), that means the flow worked.

## Features and why they exist

### Method
- What it is: The HTTP method (GET, POST, PUT, DELETE).
- Why it is used: Different upstream endpoints require different methods.
- What it affects: Whether a body is allowed (GET/DELETE do not send a body).

### Endpoint
- What it is: The full gateway path you are testing.
- Why it is used: This is the real subscriber-facing URL.
- What it affects: Which upstream route the gateway chooses.

### Query Params
- What it is: Key/value pairs added to the URL query string.
- Why it is used: Most APIs accept filters, pagination, or search in the query string.
- What it affects: The final URL and the upstream response.

### Headers
- What it is: Key/value pairs added to the request headers.
- Why it is used:
  - Provide auth or custom metadata
  - Satisfy upstream required headers
- What it affects: Gateway auth, upstream behavior, content negotiation.

### Body
- What it is: The request payload sent for POST/PUT (JSON or text).
- Why it is used: Most create/update endpoints need a payload.
- What it affects: The request content and the upstream response.

### Auth (API Tester page only)
- What it is: Optional extra auth on top of the gateway.
- Why it is used: Some upstreams need their own auth header.
- What it affects: Adds a header like X-API-KEY or Authorization.

### Environment Variables
- What it is: Named variables like BASE_URL or API_TOKEN.
- Why it is used:
  - Avoid repeating long values
  - Switch between different upstreams easily
- How it is used:
  - Put {{VAR}} inside endpoint, headers, params, or body
  - The tester replaces it with the value before sending

### Pre-request Script
- What it is: A small script that runs just before sending the request.
- Why it is used:
  - Dynamically add headers or params
  - Set variables at runtime
  - Override the endpoint or body
- What it can return:
  - env: an object of variables to merge into environment
  - headers: an object of headers to add
  - params: an object of query params to add
  - body: a replacement body
  - endpoint: a replacement endpoint

Example:

return {
  env: { BASE_URL: 'https://api.example.com' },
  headers: { 'X-Trace': 'true' },
  params: { q: 'search' }
}

### Response Preview
- What it is: Different ways to view the response.
- Why it is used: Make JSON readable, show HTML, or render images.
- Modes:
  - JSON: Pretty-printed JSON
  - RAW: Raw response text
  - HEADERS: Response headers
  - HTML: Renders text/html in a sandboxed iframe
  - IMAGE: Renders image/* responses

### History
- What it is: A list of recent requests you sent.
- Why it is used: Quickly repeat or compare requests.
- What it affects: Only saves locally in the browser.

### Collections
- What it is: Named, saved requests.
- Why it is used: Store reusable requests for later learning or demos.
- What it affects: Only saves locally in the browser.

## Common errors and what they mean

- Unauthorized (401): API key missing or invalid for the gateway.
- Forbidden (403): You are not subscribed to this API.
- Rate limit (429): Too many requests; wait and retry.
- Upstream error (4xx/5xx): The provider returned an error; the gateway passed it through.

## How to test a provider quickly

1) Subscribe to an API.
2) Open the API Details page.
3) Use the Test API section:
   - Method: GET
   - Endpoint: /gateway/{slug}/posts (or the suggested endpoint)
   - Press Send
4) If you see JSON response data, the upstream worked.

## What to remember

- The tester is a real request through the gateway.
- It validates your gateway rules and the provider connection.
- It is not a mock and does not change the upstream response.
