---
description: "Use when: working on the vanilla JavaScript frontend"
applyTo: "front-end/**"
---

# Frontend Instructions (Vanilla JavaScript)

## Coding Standards
- Use modern JavaScript (ES6+)
- Follow camelCase for variables and functions
- Use PascalCase for constructor functions/classes
- Add JSDoc comments for functions
- Use meaningful variable and function names
- Handle errors with try/catch blocks
- Use const/let instead of var

## Tools and Libraries
- **Vanilla JavaScript**: No frameworks, pure JS
- **Fetch API**: For HTTP requests
- **DOM Manipulation**: Use modern APIs like `querySelector`, `addEventListener`
- **WebSockets**: For real-time communication (if needed)
- **Local Storage**: For client-side data persistence
- **CSS**: Custom styles in `styles.css`

## Project Structure
- `index.html`: Main HTML file
- `ApiClient.js`: API communication utilities
- `code.js`: Main application logic
- `styles.css`: Stylesheet

## Best Practices
- Separate concerns: HTML for structure, CSS for styling, JS for behavior
- Use event delegation for dynamic elements
- Cache DOM queries when used multiple times
- Use async/await for asynchronous operations
- Implement loading states and error handling
- Follow progressive enhancement principles
- Optimize for performance: minimize DOM manipulations
- Use semantic HTML elements
- Ensure accessibility (alt text, keyboard navigation)
- Test in multiple browsers