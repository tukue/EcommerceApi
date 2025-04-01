#!/bin/bash

# Base command
BASE_CMD="node --experimental-vm-modules node_modules/jest/bin/jest.js"

# Parse the service name
if [ $# -eq 0 ]; then
    # Run all tests if no service name provided
    $BASE_CMD
else
    # Run tests for a specific service
    SERVICE=$1
    case $SERVICE in
        "product")
            $BASE_CMD --testPathPattern=tests/services/product-service
            ;;
        "user")
            $BASE_CMD --testPathPattern=tests/services/user-service
            ;;
        "cart")
            $BASE_CMD --testPathPattern=tests/services/cart-service
            ;;
        "order")
            $BASE_CMD --testPathPattern=tests/services/order-service
            ;;
        "payment")
            $BASE_CMD --testPathPattern=tests/services/payment-service
            ;;
        "notification")
            $BASE_CMD --testPathPattern=tests/services/notification-service
            ;;
        *)
            echo "Unknown service: $SERVICE"
            echo "Available services: product, user, cart, order, payment, notification"
            exit 1
            ;;
    esac
fi