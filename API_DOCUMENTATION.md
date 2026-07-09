# API Documentation

## Base URL

Local backend base URL:

`http://localhost:5000/api`

## Authentication

Protected routes use:

`Authorization: Bearer <token>`

Tokens are issued by the login endpoint and signed with `JWT_SECRET`.

## Current Endpoints

### Users

#### `POST /api/users/register`

Creates a customer user account.

Request body:

```json
{
  "name": "Customer Name",
  "email": "customer@example.com",
  "password": "Password123"
}
```

#### `POST /api/users/login`

Authenticates a user and returns JWT plus profile data.

Request body:

```json
{
  "email": "dealer@example.com",
  "password": "Password123"
}
```

### Products

#### `GET /api/products`

Returns all products.

#### `GET /api/products/:id`

Returns one product by id.

#### `POST /api/products`

Creates a product.

Access:

- dealer
- admin

Request body:

```json
{
  "name": "Industrial Valve",
  "description": "High pressure product",
  "price": 5000,
  "stock": 20
}
```

### Quotations

#### `POST /api/quotations`

Creates a quotation for the authenticated customer.

#### `GET /api/quotations/my`

Returns quotations belonging to the authenticated customer.

Sample request body:

```json
{
  "items": [
    {
      "product": "product-uuid",
      "quantity": 2
    }
  ]
}
```

### Dealer

#### `GET /api/dealer/quotations`

Returns pending quotations for dealer review.

#### `PATCH /api/dealer/quotations/:id/approve`

Approves a pending quotation.

#### `PATCH /api/dealer/quotations/:id/reject`

Rejects a pending quotation.

### Orders

#### `POST /api/orders`

Creates a direct order for the authenticated customer.

#### `POST /api/orders/from-quotation/:id`

Converts an approved quotation into an order.

#### `GET /api/orders`

Returns orders.

Behavior:

- customers receive only their own orders
- non-customer roles currently receive all orders

## Recommended API Roadmap

To reach the enterprise target, the API should be expanded with:

- auth refresh token endpoints
- forgot/reset password endpoints
- user management endpoints
- role and permission endpoints
- dealer management endpoints
- category, brand, and unit endpoints
- quotation draft/send/accept lifecycle endpoints
- order dispatch and delivery endpoints
- notification endpoints
- audit log endpoints
- reporting endpoints
- file upload endpoints

## Recommended Refactor Path

Current routes still contain business logic. The next step is to move them into:

- route layer for request wiring
- controller layer for orchestration
- service layer for business rules
- repository layer for database access
