# System Architecture and Service Integrations

This document provides a visual representation of the microservices architecture and the integrations between different APIs in our e-commerce platform.

## System Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT APPLICATION                             │
│                                                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       ┌─────────┐  │
│  │Dashboard│  │Products │  │  Cart   │  │ Orders  │  ...  │Settings │  │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘       └────┬────┘  │
└───────┼─────────────┼─────────────┼─────────────┼────────────────┼─────┘
        │             │             │             │                │
        ▼             ▼             ▼             ▼                ▼
┌───────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY                               │
│                                                                       │
│   ┌───────────────┐  ┌───────────────┐  ┌───────────────────────┐    │
│   │Request Routing│  │Load Balancing │  │Authentication/Security│    │
│   └───────────────┘  └───────────────┘  └───────────────────────┘    │
└───────┬─────────────────┬─────────────────┬─────────────────┬─────────┘
        │                 │                 │                 │
        ▼                 ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ PRODUCT      │  │ USER         │  │ CART         │  │ ORDER        │
│ SERVICE      │  │ SERVICE      │  │ SERVICE      │  │ SERVICE      │
│              │  │              │  │              │  │              │
│ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │
│ │Products  │ │  │ │Users     │ │  │ │Carts     │ │  │ │Orders    │ │
│ │API       │ │  │ │API       │ │  │ │API       │ │  │ │API       │ │
│ └──────────┘ │  │ └──────────┘ │  │ └──────────┘ │  │ └──────────┘ │
│ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │
│ │Data Store│ │  │ │Data Store│ │  │ │Data Store│ │  │ │Data Store│ │
│ └──────────┘ │  │ └──────────┘ │  │ └──────────┘ │  │ └──────────┘ │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │                 │
       │                 │                 │                 │
       ▼                 ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ PAYMENT      │  │ NOTIFICATION │  │ SERVICE      │  │ MONITORING   │
│ SERVICE      │  │ SERVICE      │  │ DISCOVERY    │  │ SERVICE      │
│              │  │              │  │              │  │              │
│ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │
│ │Payment   │ │  │ │Email     │ │  │ │Service   │ │  │ │Metrics   │ │
│ │API       │ │  │ │API       │ │  │ │Registry  │ │  │ │Dashboard │ │
│ └──────────┘ │  │ └──────────┘ │  │ └──────────┘ │  │ └──────────┘ │
│ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │
│ │Data Store│ │  │ │Email     │ │  │ │Health    │ │  │ │Logging   │ │
│ └──────────┘ │  │ │Templates │ │  │ │Checks    │ │  │ │Aggregator│ │
└──────┬───────┘  └──────┬───────┘  └──────────────┘  └──────────────┘
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│  STRIPE      │  │  EMAIL       │
│  PAYMENT     │  │  PROVIDER    │
│  GATEWAY     │  │  (SMTP)      │
└──────────────┘  └──────────────┘
```

## Service Interactions and Data Flow

### User Purchase Flow

1. **User browses products**
   - Client app requests products from API Gateway
   - API Gateway routes to Product Service
   - Product Service returns product catalog

2. **User adds items to cart**
   - Client app sends cart updates to API Gateway
   - API Gateway routes to Cart Service
   - Cart Service updates cart and returns updated cart data

3. **User checks out**
   - Client app sends checkout request to API Gateway
   - API Gateway routes to Order Service
   - Order Service:
     - Creates a new order
     - Contacts Cart Service to get cart items
     - Contacts Product Service to verify inventory
     - Contacts Payment Service to process payment
   - Payment Service integrates with Stripe API
   - Upon successful payment:
     - Order Service updates order status
     - Notification Service sends order confirmation email
     - Cart Service clears the user's cart

## API Integration Details

### Product Service API

```
GET    /api/products         - List all products
GET    /api/products/:id     - Get product details
POST   /api/products         - Create new product (admin)
PUT    /api/products/:id     - Update product (admin)
DELETE /api/products/:id     - Delete product (admin)
```

### User Service API

```
POST   /api/auth/register    - Register new user
POST   /api/auth/login       - User login
GET    /api/auth/me          - Get current user
GET    /api/users            - List all users (admin)
GET    /api/users/:id        - Get user details (admin/self)
```

### Cart Service API

```
GET    /api/cart             - Get current user's cart
POST   /api/cart/items       - Add item to cart
PUT    /api/cart/items/:id   - Update cart item quantity
DELETE /api/cart/items/:id   - Remove item from cart
```

### Order Service API

```
POST   /api/orders           - Create new order
GET    /api/orders           - List user's orders
GET    /api/orders/:id       - Get order details
PUT    /api/orders/:id       - Update order status (admin)
```

### Payment Service API

```
POST   /api/payments                   - Create payment intent
POST   /api/payments/:id/confirm       - Confirm payment
POST   /api/payments/:id/refund        - Process refund (admin)
```

### Notification Service API

```
POST   /api/notifications/email        - Send email notification
GET    /api/notifications/settings     - Get notification settings
PUT    /api/notifications/settings     - Update notification settings
```

## Inter-Service Communication

Services communicate with each other using service clients. Each service exposes an API that other services can consume. For example:

- **Order Service → Product Service**: Check product availability
- **Order Service → Payment Service**: Process payment for an order
- **Order Service → Notification Service**: Send order confirmation

This approach provides a clean separation of concerns while still allowing services to work together to complete business processes.

## Infrastructure Services

### Service Discovery

The Service Discovery component allows services to find and communicate with each other without hardcoded locations. When a service starts up, it registers with the Service Discovery service, providing its name and location. Other services can then query the Service Discovery service to find the location of a required service.

### Monitoring and Logging

The Monitoring service collects metrics from all services to provide a real-time view of system health. The central logging aggregator collects logs from all services for debugging and auditing purposes.

### Docker Containerization

Each microservice is packaged as a Docker container, which provides a consistent environment across development, testing, and production. Containers are orchestrated to ensure high availability and efficient resource utilization.

## External Integrations

### Stripe Payment Gateway

The Payment Service integrates with Stripe for secure payment processing. It creates payment intents on Stripe and redirects the user to Stripe's checkout page for secure payment entry.

### Email Provider (SMTP)

The Notification Service integrates with an SMTP email provider to send transactional emails like order confirmations and shipping updates.