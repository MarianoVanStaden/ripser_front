# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a React TypeScript frontend application for the Ripser service management system. The project uses:

- **Frontend Framework**: React 18 with TypeScript
- **UI Library**: Material-UI (MUI) v6
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Date Handling**: Day.js
- **Build Tool**: Vite

## Backend Integration
The frontend connects to a Spring Boot backend with the following entities:
- Clients (customers)
- Employees 
- Products
- Orders
- Sales
- Services
- Categories
- Suppliers

## Code Style Guidelines
- Use functional components with hooks
- Follow Material-UI theming and design patterns
- Implement proper TypeScript interfaces for all data models
- Use React Query or similar for state management and API caching
- Follow responsive design principles
- Implement proper error handling and loading states

## API Integration
- Base API URL should be configurable via environment variables
- All API calls should include proper error handling
- Use TypeScript interfaces that match the backend DTOs
- Implement proper authentication/authorization if required

When generating code, prioritize:
1. Type safety with proper TypeScript interfaces
2. Responsive design using MUI Grid and breakpoints
3. Accessibility features
4. Clean component architecture
5. Proper state management
