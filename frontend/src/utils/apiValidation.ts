import { z } from 'zod';
import type { User, Product, Notification, Ticket, Employee, Department } from '@/types';

// User schema
export const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  company_id: z.number().nullable().optional(),
  is_owner: z.boolean().optional(),
  company: z.any().optional(),
  roles: z.array(z.object({ id: z.number(), name: z.string() })).optional(),
  permissions: z.array(z.object({ id: z.number(), name: z.string() })).optional(),
});

// Product schema
export const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  category_id: z.number(),
  brand: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  serial_number: z.string().nullable().optional(),
  status: z.enum(['new', 'used', 'damaged', 'repair', 'reserved']),
  quantity: z.number().min(0),
  value: z.number().nullable().optional(),
  purchase_date: z.string().nullable().optional(),
  warranty_expires_at: z.string().nullable().optional(),
  is_warranty_valid: z.boolean().optional(),
  specs: z.record(z.any()).nullable().optional(),
  description: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  qr_code_url: z.string().nullable().optional(),
  invoice_url: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Notification schema
export const NotificationSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  data: z.record(z.any()).optional().nullable(),
  read_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Ticket schema
export const TicketSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
  priority: z.enum(['low', 'medium', 'high', 'critical']).nullable().optional(),
  type: z.enum(['damage', 'maintenance', 'update', 'audit', 'other']).nullable().optional(),
  product_id: z.number().nullable().optional(),
  employee_id: z.number().nullable().optional(),
  opened_by: z.number(),
  assigned_to: z.number().nullable().optional(),
  resolution: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Employee schema
export const EmployeeSchema = z.object({
  id: z.number(),
  employee_code: z.string().nullable().optional(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  department_id: z.number().nullable().optional(),
  position: z.string(),
  status: z.enum(['active', 'inactive']),
  notes: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Department schema
export const DepartmentSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  manager_id: z.number().nullable().optional(),
  company_id: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Paginated response schema
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    current_page: z.number(),
    last_page: z.number(),
    per_page: z.number(),
    total: z.number(),
    from: z.number().nullable(),
    to: z.number().nullable(),
  });

/**
 * Validates API response data against a schema
 * Returns validated data or throws an error with details
 */
export function validateApiResponse<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  context = 'API response'
): T {
  if (!schema) {
    throw new Error(`Schema is undefined for ${context}`);
  }
  
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`Validation error in ${context}:`, {
        errors: error.errors,
        data,
      });
      // In development, throw detailed errors
      if (import.meta.env.DEV) {
        throw new Error(
          `${context} validation failed: ${error.errors.map((e) => e.message).join(', ')}`
        );
      }
      // In production, return a safe fallback or re-throw
      throw error;
    }
    throw error;
  }
}

/**
 * Safely validates API response, returning data as-is if validation fails
 * Useful for non-critical data where we want to continue even if validation fails
 */
export function safeValidateApiResponse<T>(
  data: unknown,
  schema: z.ZodSchema<T> | undefined | null,
  context = 'API response'
): T {
  if (!schema) {
    console.warn(`Schema is undefined for ${context}, returning data as-is`);
    return data as T;
  }
  
  try {
    return validateApiResponse(data, schema, context);
  } catch (error) {
    console.warn(`Safe validation failed for ${context}, returning data as-is:`, error);
    return data as T;
  }
}

