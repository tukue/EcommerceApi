# Microservices E-Commerce Platform

A scalable e-commerce platform built with microservices architecture, designed for robust product catalog management, shopping cart functionality, order processing, and payment integration.

## Architecture Overview

This platform uses a microservices architecture to provide modular, independently deployable services that work together to create a complete e-commerce solution. Each microservice is responsible for a specific domain of functionality.

### Key Components

1. **API Gateway**: Routes client requests to appropriate microservices
2. **Product Catalog Service**: Manages product information and inventory
3. **User Service**: Handles user authentication and profile management
4. **Cart Service**: Manages shopping carts and items
5. **Order Service**: Processes and manages orders
6. **Payment Service**: Integrates with Stripe for payment processing
7. **Notification Service**: Sends email notifications for various events

## Technology Stack

- **Frontend**: React, TypeScript, TailwindCSS, Shadcn/UI
- **Backend**: Express.js, Node.js
- **API Communication**: REST, Service Clients pattern
- **Storage**: PostgreSQL with Drizzle ORM (with in-memory fallback)
- **Authentication**: Session-based with Passport.js
- **Payment Processing**: Stripe API
- **Notification**: Nodemailer
- **Containerization**: Docker

## Service Interaction

Services communicate through well-defined REST APIs and use a service client pattern to standardize interactions. Each service maintains its own data and exposes endpoints for other services to consume.

### Integration Examples:

- When a user places an order, the Cart Service communicates with the Product Service to verify inventory
- The Order Service integrates with the Payment Service to process payments
- The Payment Service integrates with Stripe for secure payment processing
- The Notification Service sends emails when orders are placed or payment status changes

## Infrastructure Components

Beyond core microservices, the platform includes advanced infrastructure components:

- **Service Discovery**: For automatic service registration and discovery
- **Centralized Logging**: For aggregating logs across services
- **Docker Containers**: For consistent deployment environments
- **Monitoring Dashboard**: For visualizing service health and metrics

## Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL (optional - in-memory storage available for development)
- Docker (for containerized deployments)
- Stripe API keys (for payment processing)

### Environment Variables

The following environment variables are required:

```
# Database (if using PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/microstore

# Stripe (for payment processing)
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLIC_KEY=pk_test_...

# Email Notifications
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
NOTIFICATION_EMAIL=notifications@example.com
```

### Installation and Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Access the application at: http://localhost:3000

## Project Structure

```
├── client/              # Frontend React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utility functions
│   │   ├── pages/       # Page components
│   │   └── services/    # Service clients for API communication
├── server/              # Backend Express application
│   ├── services/        # Microservice implementations
│   ├── integration/     # Integration between services
│   ├── routes.ts        # API routes
│   └── storage.ts       # Data storage abstraction
├── shared/              # Shared code between frontend and backend
│   └── schema.ts        # Database schema and types
└── tests/               # Test files
```

## Key Features

- **Product Management**: Add, update, and remove products
- **User Authentication**: Register, login, and manage user profiles
- **Shopping Cart**: Add products to cart and manage quantities
- **Order Processing**: Place orders and track status
- **Payment Integration**: Secure payment processing with Stripe
- **Service Discovery**: Automatic service registration and health checks
- **Monitoring Dashboard**: Real-time service metrics and status
- **Dark/Light Mode**: UI theme switching with smooth transitions
- **Responsive Design**: Works on mobile, tablet, and desktop devices

## Development Guidelines

- Each microservice should maintain its own data store
- Services should communicate via well-defined APIs
- Use the service client pattern for inter-service communication
- Validate requests using Zod schemas
- Write tests for critical functionality

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Diagram

See [ARCHITECTURE.md](./ARCHITECTURE.md) for a visual representation of the system architecture and service integrations.