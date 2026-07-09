# Database Schema

## Database Platform

The project uses `Supabase PostgreSQL`.

Current schema files:

- `backend/supabase/schema.sql`
- `backend/supabase/seed_admin.sql`

## Current Implemented Tables

### `users`

Stores application users and login identity.

Key columns:

- `id`
- `name`
- `email`
- `password`
- `role`
- `created_at`
- `updated_at`

### `products`

Stores products visible for quotation and ordering.

Key columns:

- `id`
- `name`
- `description`
- `price`
- `stock`
- `dealer_id`
- `created_at`
- `updated_at`

### `quotations`

Stores quotation headers.

Key columns:

- `id`
- `customer_id`
- `total_price`
- `status`
- `created_at`
- `updated_at`

### `quotation_items`

Stores quotation line items.

Key columns:

- `id`
- `quotation_id`
- `product_id`
- `quantity`
- `price`
- `created_at`

### `orders`

Stores order headers.

Key columns:

- `id`
- `customer_id`
- `source_quotation_id`
- `total_price`
- `status`
- `created_at`
- `updated_at`

### `order_items`

Stores order line items.

Key columns:

- `id`
- `order_id`
- `product_id`
- `quantity`
- `price`
- `created_at`

## Planned Enterprise Schema Expansion

To meet the commercial system target, the schema should evolve to include:

- `roles`
- `permissions`
- `role_permissions`
- `user_permissions`
- `dealers`
- `dealer_contacts`
- `categories`
- `brands`
- `units`
- `product_images`
- `price_lists`
- `quotation_status_history`
- `order_status_history`
- `notifications`
- `attachments`
- `company_settings`
- `tax_settings`
- `discount_rules`
- `audit_logs`
- `sessions`
- `password_resets`
- `email_verifications`

## Recommended Modeling Rules

- use UUID primary keys
- use foreign keys with explicit cascade rules
- add created and updated timestamps
- add soft delete fields where required
- add status history tables instead of overwriting critical state without trace
- add indexes for high-traffic filters such as status, dealer, user, created_at, quotation number, and order number

## Recommended Commercial Additions

### Dealers

Should become a first-class business entity with:

- dealer code
- company name
- business registration number
- tax number
- contact person
- phones
- address fields
- credit limit
- payment terms
- attachments
- notes
- status

### Quotations

Should be extended with:

- quotation number
- valid until
- approval fields
- shipping
- discount
- tax
- terms and conditions
- internal notes
- customer notes
- attachment support

### Orders

Should be extended with:

- order number
- invoice references
- dispatch status
- delivery tracking
- fulfillment timeline

## Row Level Security

The current backend primarily uses the Supabase service role from Express. For future direct client access and stronger multi-tenant security, Row Level Security policies should be introduced for selected tables with clear role-aware access rules.
