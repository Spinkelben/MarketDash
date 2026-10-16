---
description: "Use when: working on the Rust backend server with Rocket framework"
applyTo: "backend-server/**"
---

# Backend Server Instructions (Rust/Rocket)

## Coding Standards
- Use `rustfmt` for code formatting (run `cargo fmt`)
- Follow Rust naming conventions: snake_case for variables/functions, PascalCase for types
- Use meaningful variable and function names
- Add documentation comments (`///`) for public APIs
- Handle errors properly using `Result<T, E>` and `?` operator
- Prefer async/await for asynchronous operations

## Tools and Libraries
- **Rocket**: Web framework for building the API
  - Use JSON responses with `Json<T>` and `RawJson<String>`
  - Enable CORS with `rocket_cors`
  - Serve static files with `FileServer`
- **Tokio**: Async runtime
  - Use `tokio::time` for timeouts and delays
  - WebSocket support via `tokio-tungstenite`
- **Serde**: Serialization/deserialization
  - Use `#[derive(Serialize, Deserialize)]` for data structures
  - JSON handling with `serde_json`
- **Reqwest**: HTTP client for external requests
- **Tracing/OpenTelemetry**: Logging and observability
  - Use `#[instrument]` for function tracing
  - Log levels: `info!`, `error!`, `debug!`
  - Structured logging with attributes

## Project Structure
- `src/main.rs`: Main application entry point with Rocket routes
- `src/pubq_client.rs`: Client for interacting with PubQ API
- Use modules for organization (`mod pubq_client;`)

## Best Practices
- Implement caching where appropriate (e.g., vendor data)
- Use retry logic for unreliable operations
- Validate inputs and return appropriate HTTP status codes
- Keep dependencies minimal and up-to-date