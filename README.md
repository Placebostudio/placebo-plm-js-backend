# PLACEBO PLM Backend

Backend API for the **PLACEBO PLM (Product Lifecycle Management)** system, built for PLACEBO Design Lab.

The backend provides a REST API for managing products, materials, suppliers, BOM lines, production orders, users, currencies, audit logs, and file attachments. It uses **Node.js, Express, PostgreSQL, Supabase Storage, and Argon2**.

## Tech Stack

* **Node.js**
* **Express.js**
* **PostgreSQL**
* **Supabase**

  * PostgreSQL database
  * Storage for product/material attachments
* **Argon2** — password hashing
* **Multer** — multipart/form-data file uploads
* **CORS**
* **dotenv**

## Project Structure

```text
placebo-plm-js-backend/
│
├── data management/
│   ├── controller/
│   │   ├── product-controller.js
│   │   ├── user-controller.js
│   │   ├── supplier-controller.js
│   │   ├── material-controller.js
│   │   ├── bom_line-controller.js
│   │   ├── order-controller.js
│   │   ├── order_additional_cost-controller.js
│   │   ├── order_line-controller.js
│   │   ├── audit_log-controller.js
│   │   ├── currency-controller.js
│   │   └── attachment-controller.js
│   │
│   └── router/
│       ├── product-router.js
│       ├── user-router.js
│       ├── supplier-router.js
│       ├── material-router.js
│       ├── bom_line-router.js
│       ├── order-router.js
│       ├── order_additional_cost-router.js
│       ├── order_line-router.js
│       ├── audit_log-router.js
│       ├── currency-router.js
│       └── attachment-router.js
│
├── db_connection.js
├── index.js
├── package.json
└── .env
```

## API

The server exposes the following main endpoints:

| Resource         | Endpoint                      |
| ---------------- | ----------------------------- |
| Products         | `/api/products`               |
| Users            | `/api/users`                  |
| Suppliers        | `/api/suppliers`              |
| Materials        | `/api/materials`              |
| BOM Lines        | `/api/bom_lines`              |
| Orders           | `/api/orders`                 |
| Order Lines      | `/api/order_lines`            |
| Additional Costs | `/api/order_additional_costs` |
| Audit Logs       | `/api/audit_logs`             |
| Currencies       | `/api/currencies`             |
| Attachments      | `/api/attachments`            |

Most resources support:

```text
GET     /api/resource
GET     /api/resource/:id
POST    /api/resource
PUT     /api/resource/:id
DELETE  /api/resource/:id
```

Some resources have additional logic for filtering and related records.

## Products

Products contain information such as:

* Name
* Style code
* SKU
* Category
* Season
* Colors
* Sizes
* Pricing multiplier
* Selling price
* Currency
* Notes
* Status
* Image URL
* Attachment ID

Products can also be connected to BOM lines and production order lines.

Product filtering supports fields such as:

```text
name
style_code
sku
category
status
```

## Materials

Materials contain the information required for production and can be associated with:

* Suppliers
* BOM lines
* Attachments

Material retrieval can also return its related BOM lines.

## Suppliers

Suppliers are stored separately and can be associated with materials and supplier users.

## BOM

BOM lines connect products with materials.

A BOM line can contain information such as:

* Product
* Material
* Quantity per unit
* Notes

When a material or product is permanently deleted, related BOM lines are removed by the application's deletion logic.

## Production Orders

Orders support:

* Order number
* Name
* Status
* Factory
* Shipping destination
* Order date
* Target date
* Currency
* Shipping cost
* Notes
* Season
* Production country
* Destination address

Orders can contain:

* Order lines
* Additional costs

Order retrieval combines the main order with its related order lines and additional costs.

## Order Lines

Order lines connect products to production orders and contain information such as:

* Product
* Color
* Size
* Quantity
* Destination

When a product is hard-deleted, its related order lines are removed first.

## Additional Order Costs

Orders can have zero, one, or multiple additional costs.

Each additional cost can contain:

* Cost type
* Amount
* Currency
* Description
* Order ID

## Users

User accounts support:

* Username
* Email
* Password
* Name
* Role
* Supplier ID
* Last login
* Created date
* Approval status

Passwords are never stored directly. They are hashed using **Argon2id**.

### User Approval

New accounts are created with:

```text
approved = false
```

A user cannot log in until the account has been approved by the owner.

The login flow is:

```text
Username/password
       ↓
Find user
       ↓
Verify password
       ↓
Check approved
       ↓
Update last_login_at
       ↓
Return user
```

Unapproved accounts receive:

```text
Please get account approved by the owner
```

## Roles

The application uses role-based permissions.

The current role hierarchy is:

| Role       | Permission Level |
| ---------- | ---------------: |
| Guest      |                0 |
| Employee   |                1 |
| Manager    |                2 |
| Admin      |                3 |
| Superadmin |                4 |
| Owner      |                5 |

The frontend uses these permission levels to control access to actions and UI elements.

## Authentication

Passwords are verified using Argon2:

```js
const validPassword = await argon2.verify(
    user.password_hash,
    password
);
```

The password hash is removed from the response before the user object is returned.

```js
delete user.password_hash;
```

## Attachments

Attachments are handled separately from the main product/material records.

Files are uploaded using `multipart/form-data` and processed with **Multer**.

Supabase Storage is used for the actual file.

The database stores metadata such as:

```text
id
org_id
entity_type
entity_id
file_name
s3_key
content_type
size_bytes
uploaded_by
created_at
```

Supported entity types currently include:

```text
product
material
```

Supported image types:

```text
image/jpeg
image/png
image/webp
image/gif
```

Maximum file size:

```text
25 MB
```

### Image replacement logic

The attachment API supports the following cases:

```text
NO IMAGE → NEW IMAGE
    ↓
Upload new image
    ↓
Create attachment row
```

```text
IMAGE → NO IMAGE
    ↓
Delete file from Supabase Storage
    ↓
Delete attachment row
```

```text
IMAGE → NEW IMAGE
    ↓
Delete old file
    ↓
Upload new file
    ↓
Update attachment row
```

Products contain an `attachment_id` which can be `NULL`.

The product itself does not directly manage the Storage file. Attachment deletion is handled through the attachment system.

## Supabase Storage

Files are stored in the Supabase Storage bucket:

```text
attachments
```

The database stores the Storage path in:

```text
s3_key
```

The backend generates a public URL from the Storage path when returning attachments.

## Audit Logs

Important changes are recorded in the audit log.

Audit entries contain information such as:

```text
user_id
action
entity_type
entity_id
before
after
```

Examples:

```text
create product
update product
delete product
```

For complex operations, related information can also be included in the `after` object.

## Currency API

The backend contains a currency resource used by the PLM application.

Currency data can be stored in PostgreSQL with information such as:

```text
id
currency
compared_to_base_currency
last_updated
```

The intended behavior is to avoid repeatedly requesting external currency data unnecessarily by checking when the stored rate was last updated.

## Database

The backend uses PostgreSQL through the `pg` package.

The connection is configured through an environment variable.

Example:

```env
DATABASE_URL=your_postgresql_connection_string
```

The backend uses parameterized PostgreSQL queries:

```js
await db.query(
    `SELECT *
     FROM products
     WHERE id = $1`,
    [productid]
);
```

This avoids directly inserting user input into SQL statements.

## Environment Variables

Create a `.env` file in the backend root.

Example:

```env
DATABASE_URL=your_postgresql_database_url

SUPABASE_URL=your_supabase_project_url
SUPABASE_SECRET_KEY=your_supabase_secret_key

PORT=5173
```

**Never commit `.env` to GitHub.**

Add it to `.gitignore`:

```gitignore
.env
node_modules/
```

## Installation

Clone the repository and install dependencies:

```bash
npm install
```

Create the `.env` file and configure the required environment variables.

Then start the backend:

```bash
node index.js
```

For development, if a development script is configured:

```bash
npm run dev
```

The server will run on:

```text
http://localhost:5173
```

The API is available under:

```text
http://localhost:5173/api
```

## CORS

The backend is configured to allow requests from the frontend development environments.

Example:

```js
app.use(cors({
    origin: [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:5500"
    ],
    credentials: true
}));
```

## Request Flow

The general application architecture is:

```text
Frontend
   │
   │ HTTP request
   ▼
Express Router
   │
   ▼
Controller
   │
   ├──────────────► PostgreSQL
   │
   └──────────────► Supabase Storage
   │
   ▼
JSON Response
   │
   ▼
Frontend
```

For an attachment upload:

```text
Frontend
   │
   │ multipart/form-data
   ▼
Multer
   │
   ▼
Attachment Controller
   │
   ├──► Supabase Storage
   │
   └──► PostgreSQL attachment row
   │
   ▼
Attachment ID + URL
   │
   ▼
Frontend
```

## Hard Deletion

The frontend performs controlled hard deletion for related records.

For example, deleting a product can involve:

```text
Product
 ├── BOM lines
 ├── Order lines
 └── Attachment
       └── Supabase Storage file
```

Related records are deleted before the main product where necessary.

Attachment deletion is handled by the attachment system rather than directly modifying Storage from the product controller.

## Security Considerations

The backend currently includes:

* Parameterized SQL queries
* Argon2id password hashing
* Password verification on the server
* Password hashes removed from API responses
* File type validation
* File size validation
* Supabase server-side secret key usage
* CORS configuration
* User approval before login

The Supabase secret key must remain **server-side only** and must never be exposed to the frontend.

## Related Project

This backend is part of the larger **PLACEBO PLM** application.

The frontend provides the user interface for:

* Product management
* Material management
* Supplier management
* BOM management
* Production orders
* Required materials
* Landed costs
* User management
* Audit logs
* Product/material attachments

## Status

This project is being developed as the backend component of the PLACEBO PLM system.

The API and database structure are designed around the application's current PLM workflow and can be extended with additional resources and business logic as the system grows.
