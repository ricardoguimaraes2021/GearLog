# GearLog API Reference

Complete API documentation for developers. This document covers all endpoints, request/response structures, authentication, and examples.

## Table of Contents

1. [Authentication](#authentication)
2. [Products](#products)
3. [Categories](#categories)
4. [Movements](#movements)
5. [Tickets](#tickets)
6. [Ticket Comments](#ticket-comments)
7. [Employees](#employees)
8. [Departments](#departments)
9. [Asset Assignments](#asset-assignments)
10. [Dashboard](#dashboard)
11. [Notifications](#notifications)
12. [Users](#users)
13. [Exports](#exports)

---

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

All protected endpoints require authentication using Laravel Sanctum. Include the bearer token in the Authorization header:

```
Authorization: Bearer {token}
```

### AuthController

#### POST `/login`

Authenticate user and receive access token.

**Request:**
```json
{
  "email": "admin@gearlog.local",
  "password": "password"
}
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@gearlog.local",
    "roles": ["admin"]
  },
  "token": "1|xxxxxxxxxxxxx"
}
```

**Errors:**
- `422` - Validation error
- `401` - Invalid credentials

#### POST `/logout`

Logout current user (invalidates token).

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

#### GET `/user`

Get current authenticated user information.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": 1,
  "name": "Admin User",
  "email": "admin@gearlog.local",
  "roles": ["admin"],
  "permissions": [...]
}
```

---

## Products

### ProductController

#### GET `/products`

List all products with optional filters and pagination.

**Query Parameters:**
- `search` (string, optional) - Search by name, description, or serial number
- `category_id` (integer, optional) - Filter by category
- `status` (string, optional) - Filter by status: `new`, `used`, `damaged`, `repair`, `reserved`
- `page` (integer, optional) - Page number for pagination
- `per_page` (integer, optional) - Items per page (default: 15)

**Example:**
```
GET /api/v1/products?search=laptop&status=new&page=1
```

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Dell XPS 15",
      "category_id": 1,
      "category": {
        "id": 1,
        "name": "Laptops"
      },
      "brand": "Dell",
      "model": "XPS 15 9520",
      "serial_number": "SN-XPS15-001",
      "status": "new",
      "quantity": 5,
      "value": 1800.00,
      "purchase_date": "2023-01-15",
      "description": "High-performance laptop",
      "specs": {
        "CPU": "Intel i7",
        "RAM": "16GB",
        "Storage": "512GB SSD"
      },
      "image_url": "products/image.jpg",
      "qr_code_url": "qr-codes/qr.png",
      "created_at": "2023-01-15T10:00:00.000000Z",
      "updated_at": "2023-01-15T10:00:00.000000Z"
    }
  ],
  "current_page": 1,
  "last_page": 1,
  "per_page": 15,
  "total": 1
}
```

**Permissions:** `products.view`

#### GET `/products/{id}`

Get single product details.

**Response (200):**
```json
{
  "id": 1,
  "name": "Dell XPS 15",
  "category": {...},
  "movements": [...],
  ...
}
```

**Errors:**
- `404` - Product not found

**Permissions:** `products.view`

#### POST `/products`

Create a new product.

**Request (multipart/form-data):**
```
name: "Dell XPS 15"
category_id: 1
brand: "Dell"
model: "XPS 15 9520"
serial_number: "SN-XPS15-001"
status: "new"
quantity: 5
value: 1800.00
purchase_date: "2023-01-15"
description: "High-performance laptop"
specs: {"CPU": "Intel i7", "RAM": "16GB"}
image: (file, optional)
```

**Response (201):**
```json
{
  "id": 1,
  "name": "Dell XPS 15",
  ...
}
```

**Errors:**
- `422` - Validation error (e.g., duplicate serial number)
- `403` - Insufficient permissions

**Permissions:** `products.create`

#### PUT `/products/{id}`

Update an existing product.

**Request:** Same as POST (all fields optional)

**Response (200):**
```json
{
  "id": 1,
  "name": "Updated Name",
  ...
}
```

**Permissions:** `products.update`

#### DELETE `/products/{id}`

Delete a product.

**Response (200):**
```json
{
  "message": "Product deleted successfully"
}
```

**Errors:**
- `400` - Product has quantity > 0 (cannot delete)
- `404` - Product not found

**Permissions:** `products.delete`

#### GET `/products/{product}/public`

Get public product information (no authentication required).

**Response (200):**
```json
{
  "id": 1,
  "name": "Dell XPS 15",
  "category": {...},
  "brand": "Dell",
  "model": "XPS 15 9520",
  "status": "new",
  "quantity": 5,
  "description": "...",
  "specs": {...}
}
```

#### GET `/products/export/{format}`

Export products to file.

**Parameters:**
- `format` - `csv`, `excel`, or `pdf`

**Query Parameters:** Same filters as GET `/products`

**Response:** File download

**Permissions:** `products.export`

---

## Categories

### CategoryController

#### GET `/categories`

List all categories.

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Laptops",
    "products_count": 15,
    "created_at": "2023-01-01T00:00:00.000000Z",
    "updated_at": "2023-01-01T00:00:00.000000Z"
  }
]
```

**Permissions:** `categories.view`

#### POST `/categories`

Create a new category.

**Request:**
```json
{
  "name": "Laptops"
}
```

**Response (201):**
```json
{
  "id": 1,
  "name": "Laptops",
  ...
}
```

**Errors:**
- `422` - Validation error (duplicate name)

**Permissions:** `categories.create`

#### PUT `/categories/{id}`

Update a category.

**Request:**
```json
{
  "name": "Updated Name"
}
```

**Permissions:** `categories.update`

#### DELETE `/categories/{id}`

Delete a category.

**Errors:**
- `400` - Category has products (cannot delete)

**Permissions:** `categories.delete`

---

## Movements

### MovementController

#### GET `/products/{product}/movements`

Get all movements for a product.

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "product_id": 1,
      "type": "entry",
      "quantity": 5,
      "assigned_to": null,
      "notes": "Initial stock",
      "created_at": "2023-01-15T10:00:00.000000Z"
    }
  ],
  "current_page": 1,
  ...
}
```

**Permissions:** `movements.view`

#### POST `/products/{product}/movements`

Create a new movement.

**Request:**
```json
{
  "type": "entry",
  "quantity": 5,
  "assigned_to": "Department A",
  "notes": "Initial stock entry"
}
```

**Movement Types:**
- `entry` - Adds to stock
- `exit` - Removes from stock
- `allocation` - Allocates stock (removes from available)
- `return` - Returns stock (adds to available)

**Response (201):**
```json
{
  "id": 1,
  "product_id": 1,
  "type": "entry",
  "quantity": 5,
  ...
}
```

**Errors:**
- `400` - Business rule violation:
  - Insufficient stock for exit/allocation
  - Cannot allocate damaged products
  - Stock would go negative

**Permissions:** `movements.create`

---

## Tickets

### TicketController

#### GET `/tickets`

List all tickets with filters.

**Query Parameters:**
- `status` (string, optional) - `open`, `in_progress`, `waiting_parts`, `resolved`, `closed`
- `priority` (string, optional) - `low`, `medium`, `high`, `critical`
- `type` (string, optional) - `damage`, `maintenance`, `update`, `audit`, `other`
- `assigned_to` (integer, optional) - Filter by assigned user ID
- `product_id` (integer, optional) - Filter by product
- `page` (integer, optional)

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Laptop Screen Flickering",
      "product_id": 1,
      "product": {...},
      "employee_id": 1,
      "employee": {...},
      "opened_by": 1,
      "openedBy": {...},
      "assigned_to": 2,
      "assignedTo": {...},
      "priority": "high",
      "type": "maintenance",
      "status": "in_progress",
      "description": "Screen flickers intermittently",
      "first_response_deadline": "2023-01-16T10:00:00.000000Z",
      "resolution_deadline": "2023-01-18T10:00:00.000000Z",
      "first_response_at": "2023-01-15T11:00:00.000000Z",
      "sla_violated": false,
      "created_at": "2023-01-15T10:00:00.000000Z"
    }
  ],
  ...
}
```

**Permissions:** `tickets.view`

#### GET `/tickets/{id}`

Get single ticket details.

**Response (200):**
```json
{
  "id": 1,
  "title": "...",
  "product": {...},
  "employee": {...},
  "comments": [...],
  "logs": [...],
  ...
}
```

**Permissions:** `tickets.view`

#### POST `/tickets`

Create a new ticket.

**Request:**
```json
{
  "title": "Laptop Screen Flickering",
  "product_id": 1,
  "employee_id": 1,
  "priority": "high",
  "type": "maintenance",
  "description": "Screen flickers intermittently"
}
```

**Response (201):**
```json
{
  "id": 1,
  "title": "...",
  ...
}
```

**Permissions:** `tickets.create`

#### PUT `/tickets/{id}`

Update a ticket.

**Request:** Same as POST (all fields optional)

**Permissions:** `tickets.update`

#### DELETE `/tickets/{id}`

Delete a ticket.

**Permissions:** `tickets.delete`

#### POST `/tickets/{ticket}/assign`

Assign ticket to a user.

**Request:**
```json
{
  "user_id": 2
}
```

**Response (200):**
```json
{
  "id": 1,
  "assigned_to": 2,
  ...
}
```

**Permissions:** `tickets.assign`

#### POST `/tickets/{ticket}/status`

Update ticket status.

**Request:**
```json
{
  "status": "in_progress"
}
```

**Valid Statuses:** `open`, `in_progress`, `waiting_parts`, `resolved`, `closed`

**Permissions:** `tickets.update`

#### POST `/tickets/{ticket}/resolve`

Resolve a ticket.

**Request:**
```json
{
  "resolution": "Fixed by replacing screen"
}
```

**Response (200):**
```json
{
  "id": 1,
  "status": "resolved",
  "resolution": "...",
  ...
}
```

**Permissions:** `tickets.resolve`

#### POST `/tickets/{ticket}/close`

Close a ticket.

**Response (200):**
```json
{
  "id": 1,
  "status": "closed",
  ...
}
```

**Permissions:** `tickets.close`

#### GET `/tickets/{ticket}/logs`

Get ticket activity logs.

**Response (200):**
```json
[
  {
    "id": 1,
    "ticket_id": 1,
    "user_id": 1,
    "user": {...},
    "action": "created",
    "old_value": null,
    "new_value": "open",
    "created_at": "2023-01-15T10:00:00.000000Z"
  }
]
```

**Permissions:** `tickets.view`

### TicketDashboardController

#### GET `/tickets/dashboard`

Get ticket dashboard metrics.

**Response (200):**
```json
{
  "kpis": {
    "total_tickets": 50,
    "open_tickets": 10,
    "in_progress_tickets": 5,
    "critical_tickets": 2,
    "unassigned_tickets": 3
  },
  "tickets_by_status": [...],
  "tickets_by_priority": [...],
  "tickets_by_type": [...],
  "tickets_by_technician": [...],
  "most_reported_products": [...],
  "most_reported_categories": [...],
  "recent_tickets": [...],
  "urgent_tickets": [...],
  "sla_metrics": {
    "compliance_rate": 85.5,
    "violated_count": 5,
    "at_risk_count": 3
  },
  "sla_trends": [...]
}
```

**Permissions:** `tickets.view`

---

## Ticket Comments

### TicketCommentController

#### GET `/tickets/{ticket}/comments`

Get all comments for a ticket.

**Response (200):**
```json
[
  {
    "id": 1,
    "ticket_id": 1,
    "user_id": 2,
    "user": {
      "id": 2,
      "name": "John Doe"
    },
    "message": "I've checked the issue...",
    "attachments": ["file1.jpg", "file2.pdf"],
    "created_at": "2023-01-15T11:00:00.000000Z"
  }
]
```

**Permissions:** `tickets.view`

#### POST `/tickets/{ticket}/comments`

Add a comment to a ticket.

**Request (multipart/form-data):**
```
message: "I've checked the issue..."
attachments[]: (file, optional, multiple)
```

**Response (201):**
```json
{
  "id": 1,
  "ticket_id": 1,
  "user_id": 2,
  "message": "...",
  "attachments": [...],
  ...
}
```

**Permissions:** `tickets.comment`

---

## Employees

### EmployeeController

#### GET `/employees`

List all employees.

**Query Parameters:**
- `search` (string, optional) - Search by name, email, or employee code
- `department_id` (integer, optional) - Filter by department
- `status` (string, optional) - `active`, `inactive`
- `page` (integer, optional)

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@company.com",
      "employee_code": "EMP001",
      "phone": "+1234567890",
      "department_id": 1,
      "department": {...},
      "status": "active",
      "created_at": "2023-01-01T00:00:00.000000Z"
    }
  ],
  ...
}
```

**Permissions:** `employees.view`

#### GET `/employees/{id}`

Get single employee details.

**Response (200):**
```json
{
  "id": 1,
  "name": "John Doe",
  "department": {...},
  "assigned_assets": [...],
  "tickets": [...],
  "logs": [...],
  ...
}
```

**Permissions:** `employees.view`

#### POST `/employees`

Create a new employee.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@company.com",
  "employee_code": "EMP001",
  "phone": "+1234567890",
  "department_id": 1,
  "position": "Developer",
  "hire_date": "2023-01-01"
}
```

**Response (201):**
```json
{
  "id": 1,
  ...
}
```

**Permissions:** `employees.create`

#### PUT `/employees/{id}`

Update an employee.

**Permissions:** `employees.update`

#### DELETE `/employees/{id}`

Delete an employee.

**Permissions:** `employees.delete`

#### POST `/employees/{employee}/deactivate`

Deactivate an employee.

**Response (200):**
```json
{
  "id": 1,
  "status": "inactive",
  ...
}
```

**Permissions:** `employees.update`

#### POST `/employees/{employee}/reactivate`

Reactivate an employee.

**Permissions:** `employees.update`

#### GET `/employees/export/{format}`

Export employees to file.

**Parameters:**
- `format` - `csv`, `excel`, or `pdf`

**Response:** File download

**Permissions:** `employees.export`

---

## Departments

### DepartmentController

#### GET `/departments`

List all departments.

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "IT",
    "manager_id": 1,
    "manager": {...},
    "cost_center": "CC001",
    "employees_count": 10,
    "created_at": "2023-01-01T00:00:00.000000Z"
  }
]
```

**Permissions:** `departments.view`

#### GET `/departments/{id}`

Get single department details.

**Response (200):**
```json
{
  "id": 1,
  "name": "IT",
  "manager": {...},
  "employees": [...],
  "assigned_assets": [...],
  "tickets": [...],
  ...
}
```

**Permissions:** `departments.view`

#### POST `/departments`

Create a new department.

**Request:**
```json
{
  "name": "IT",
  "manager_id": 1,
  "cost_center": "CC001"
}
```

**Response (201):**
```json
{
  "id": 1,
  ...
}
```

**Permissions:** `departments.create`

#### PUT `/departments/{id}`

Update a department.

**Permissions:** `departments.update`

#### DELETE `/departments/{id}`

Delete a department.

**Permissions:** `departments.delete`

#### GET `/departments/stats/usage`

Get department usage statistics.

**Response (200):**
```json
{
  "data": [
    {
      "department_id": 1,
      "department_name": "IT",
      "total_employees": 10,
      "assigned_assets": 25,
      "total_value": 50000.00,
      "active_tickets": 5
    }
  ]
}
```

**Permissions:** `departments.view`

---

## Asset Assignments

### AssignmentController

#### POST `/assignments/checkout`

Assign an asset to an employee.

**Request:**
```json
{
  "product_id": 1,
  "employee_id": 1,
  "notes": "Assigned for work use"
}
```

**Response (201):**
```json
{
  "id": 1,
  "product_id": 1,
  "product": {...},
  "employee_id": 1,
  "employee": {...},
  "assigned_by": 1,
  "assignedBy": {...},
  "assigned_at": "2023-01-15T10:00:00.000000Z",
  "returned_at": null,
  "notes": "..."
}
```

**Errors:**
- `400` - Business rule violation:
  - Product cannot be assigned (damaged, no stock, already assigned)
  - Employee is inactive

**Permissions:** `assignments.create`

#### POST `/assignments/{assignment}/checkin`

Return an asset from an employee.

**Request:**
```json
{
  "condition_on_return": "Good condition",
  "product_status": "used",
  "notes": "Returned in good condition"
}
```

**Response (200):**
```json
{
  "id": 1,
  "returned_at": "2023-01-20T10:00:00.000000Z",
  "returned_by": 1,
  "condition_on_return": "Good condition",
  ...
}
```

**Errors:**
- `400` - Assignment already returned

**Permissions:** `assignments.return`

#### GET `/assignments/history/employee/{employee}`

Get assignment history for an employee.

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "product": {...},
      "assigned_at": "2023-01-15T10:00:00.000000Z",
      "returned_at": "2023-01-20T10:00:00.000000Z",
      ...
    }
  ],
  ...
}
```

**Permissions:** `assignments.view`

#### GET `/assignments/history/asset/{product}`

Get assignment history for an asset.

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "employee": {...},
      "assigned_at": "2023-01-15T10:00:00.000000Z",
      "returned_at": "2023-01-20T10:00:00.000000Z",
      ...
    }
  ],
  ...
}
```

**Permissions:** `assignments.view`

---

## Dashboard

### DashboardController

#### GET `/dashboard`

Get dashboard KPIs and data.

**Response (200):**
```json
{
  "kpis": {
    "total_products": 100,
    "total_value": 150000.00,
    "damaged_products": 5,
    "low_stock_products": 3
  },
  "products_by_category": [
    {
      "name": "Laptops",
      "count": 25
    }
  ],
  "recent_movements": [...],
  "recent_activities": [...],
  "inactive_products": 2,
  "inactive_products_list": [...],
  "tickets": {
    "total_tickets": 50,
    "open_tickets": 10,
    "in_progress_tickets": 5,
    "critical_tickets": 2,
    "unassigned_tickets": 3
  },
  "alerts": {
    "low_stock": 3,
    "low_stock_products": [...],
    "damaged": 5,
    "damaged_products": [...],
    "inactive": 2,
    "inactive_products": [...],
    "sla_violated": 2,
    "sla_violated_tickets": [...],
    "sla_at_risk": 3,
    "sla_at_risk_tickets": [...],
    "critical_tickets": 2,
    "critical_tickets_list": [...],
    "unassigned_tickets": 3,
    "unassigned_tickets_list": [...]
  }
}
```

**Permissions:** `dashboard.view`

---

## Notifications

### NotificationController

#### GET `/notifications`

List notifications for current user.

**Query Parameters:**
- `read` (boolean, optional) - Filter by read status
- `type` (string, optional) - Filter by notification type
- `page` (integer, optional)
- `per_page` (integer, optional, default: 20)

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "type": "ticket_created",
      "title": "New Ticket Created",
      "message": "Ticket #123: Laptop Screen Flickering",
      "data": {
        "ticket_id": 123,
        "ticket_title": "Laptop Screen Flickering"
      },
      "read_at": null,
      "created_at": "2023-01-15T10:00:00.000000Z"
    }
  ],
  ...
}
```

**Permissions:** Authenticated user

#### GET `/notifications/unread-count`

Get unread notifications count.

**Response (200):**
```json
{
  "count": 5
}
```

**Permissions:** Authenticated user

#### POST `/notifications/{notification}/read`

Mark a notification as read.

**Response (200):**
```json
{
  "id": 1,
  "read_at": "2023-01-15T11:00:00.000000Z",
  ...
}
```

**Permissions:** Notification owner

#### POST `/notifications/read-all`

Mark all notifications as read.

**Response (200):**
```json
{
  "message": "All notifications marked as read"
}
```

**Permissions:** Authenticated user

#### DELETE `/notifications/{notification}`

Delete a notification.

**Response (200):**
```json
{
  "message": "Notification deleted"
}
```

**Permissions:** Notification owner

#### POST `/notifications/test`

Create a test notification (for testing purposes).

**Response (201):**
```json
{
  "message": "Test notification created successfully",
  "notification": {...}
}
```

**Permissions:** Authenticated user

---

## Users

### UserController

#### GET `/users`

List all users (for assignment purposes).

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Admin User",
    "email": "admin@gearlog.local",
    "roles": ["admin"]
  }
]
```

**Permissions:** `users.view`

---

## Exports

### Product Exports

#### GET `/products/export/{format}`

Export products to file.

**Parameters:**
- `format` - `csv`, `excel`, or `pdf`

**Query Parameters:** Same filters as GET `/products`

**Response:** File download

**Example:**
```
GET /api/v1/products/export/excel?status=new&category_id=1
```

**Permissions:** `products.export`

### Employee Exports

#### GET `/employees/export/{format}`

Export employees to file.

**Parameters:**
- `format` - `csv`, `excel`, or `pdf`

**Query Parameters:** Same filters as GET `/employees`

**Response:** File download

**Permissions:** `employees.export`

---

## Error Responses

### Standard Error Format

```json
{
  "error": "Error message",
  "message": "Detailed error message (in debug mode)"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (business rule violation)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `422` - Validation Error
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

### Validation Errors (422)

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password must be at least 8 characters."]
  }
}
```

### Business Rule Errors (400)

```json
{
  "error": "Cannot allocate product 'Laptop' because it is marked as damaged.",
  "context": {
    "product_id": 1,
    "product_name": "Laptop",
    "status": "damaged"
  }
}
```

---

## Rate Limiting

- **General API**: 60 requests per minute
- **Login endpoint**: 30 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
```

---

## Permissions

The system uses Spatie Permissions for role-based access control.

### Roles

- **admin** - Full system access
- **gestor** (Manager) - Manage products, categories, movements, tickets
- **tecnico** (Technician) - View and create movements, manage assigned tickets
- **consulta** (Read-only) - View-only access

### Common Permissions

- `products.view`, `products.create`, `products.update`, `products.delete`, `products.export`
- `categories.view`, `categories.create`, `categories.update`, `categories.delete`
- `movements.view`, `movements.create`
- `tickets.view`, `tickets.create`, `tickets.update`, `tickets.delete`, `tickets.assign`, `tickets.resolve`, `tickets.close`, `tickets.comment`
- `employees.view`, `employees.create`, `employees.update`, `employees.delete`, `employees.export`
- `departments.view`, `departments.create`, `departments.update`, `departments.delete`
- `assignments.view`, `assignments.create`, `assignments.return`
- `dashboard.view`
- `users.view`

---

## Examples

### Complete Flow: Create Product and Movement

```bash
# 1. Login
curl -X POST http://localhost:8000/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gearlog.local","password":"password"}'

# Response: {"user":{...},"token":"1|xxxxx"}

# 2. Create Product
curl -X POST http://localhost:8000/api/v1/products \
  -H "Authorization: Bearer 1|xxxxx" \
  -F "name=Dell XPS 15" \
  -F "category_id=1" \
  -F "brand=Dell" \
  -F "status=new" \
  -F "quantity=5" \
  -F "value=1800.00"

# 3. Create Movement
curl -X POST http://localhost:8000/api/v1/products/1/movements \
  -H "Authorization: Bearer 1|xxxxx" \
  -H "Content-Type: application/json" \
  -d '{"type":"entry","quantity":5,"notes":"Initial stock"}'
```

### Create Ticket and Assign

```bash
# 1. Create Ticket
curl -X POST http://localhost:8000/api/v1/tickets \
  -H "Authorization: Bearer 1|xxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Laptop Screen Flickering",
    "product_id": 1,
    "priority": "high",
    "type": "maintenance",
    "description": "Screen flickers intermittently"
  }'

# 2. Assign Ticket
curl -X POST http://localhost:8000/api/v1/tickets/1/assign \
  -H "Authorization: Bearer 1|xxxxx" \
  -H "Content-Type: application/json" \
  -d '{"user_id": 2}'
```

---

## Additional Resources

- **Swagger UI**: http://localhost:8000/api/documentation
- **API Base URL**: http://localhost:8000/api/v1
- **Frontend URL**: http://localhost:5173

---

## Support

For questions or issues, please refer to:
- Main README: `/README.md`
- Project Plan: `/PROJECT_PLAN.md`
- Notifications Guide: `/docs/NOTIFICATIONS.md`

