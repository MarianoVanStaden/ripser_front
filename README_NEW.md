# Ripser Frontend

A modern React TypeScript frontend application for the Ripser service management system, built with Material-UI and Vite.

## Features

- **Modern UI**: Built with Material-UI v6 for a clean, responsive design
- **TypeScript**: Full type safety throughout the application
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **API Integration**: Complete REST API integration with the Spring Boot backend
- **Entity Management**: Full CRUD operations for all business entities:
  - Clients
  - Employees
  - Products
  - Orders
  - Sales
  - Services
  - Categories
  - Suppliers

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **UI Library**: Material-UI (MUI) v6
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Date Handling**: Day.js
- **Build Tool**: Vite
- **Styling**: Emotion (CSS-in-JS)

## Prerequisites

- Node.js 20.19.0 or higher
- npm or yarn package manager
- Spring Boot backend running on http://localhost:8080

## Getting Started

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd ripser_frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Update the `.env` file with your backend API URL:
   ```
   VITE_API_BASE_URL=http://localhost:8080/api
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser** and navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the project for production
- `npm run lint` - Run ESLint for code quality checks
- `npm run preview` - Preview the production build locally

## Project Structure

```
src/
├── api/                    # API configuration and services
│   ├── config.ts          # Axios configuration
│   └── services/          # API service functions
├── components/            # React components
│   ├── Dashboard/         # Dashboard page
│   ├── Layout/           # App layout and navigation
│   └── Clients/          # Client management pages
├── theme/                # Material-UI theme configuration
├── types/                # TypeScript type definitions
├── App.tsx              # Main app component
└── main.tsx             # App entry point
```

## Backend Integration

This frontend is designed to work with a Spring Boot backend that provides REST APIs for:

- Client management
- Employee management  
- Product catalog
- Order processing
- Sales tracking
- Service appointments
- Category management
- Supplier management

Make sure your backend is running and accessible at the configured API URL.

## Key Features

### Dashboard
- Overview statistics for all entities
- Quick access to key metrics
- Responsive card layout

### Client Management
- View all clients in a responsive grid
- Add new clients with a modal form
- Edit existing client information
- Delete clients with confirmation
- Real-time data updates

### Navigation
- Responsive sidebar navigation
- Mobile-friendly drawer menu
- Active route highlighting
- Clean Material Design layout

## Environment Configuration

The application uses environment variables for configuration:

- `VITE_API_BASE_URL`: Base URL for the backend API (default: http://localhost:8080/api)

## Contributing

1. Follow the existing code style and patterns
2. Use TypeScript for all new components
3. Follow Material-UI design principles
4. Ensure responsive design for all components
5. Add proper error handling and loading states

## Development Guidelines

- Use functional components with hooks
- Implement proper TypeScript interfaces
- Follow Material-UI theming patterns
- Use responsive design principles
- Include proper error handling and loading states
- Write clean, maintainable code with proper documentation
