import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  category_id: z.string().min(1, 'Category is required'),
  brand: z.string().max(255, 'Brand is too long').optional().or(z.literal('')),
  model: z.string().max(255, 'Model is too long').optional().or(z.literal('')),
  serial_number: z.string().max(255, 'Serial number is too long').optional().or(z.literal('')),
  status: z.enum(['novo', 'usado', 'avariado', 'reparação', 'reservado']),
  quantity: z.number().int().min(0, 'Quantity must be 0 or greater'),
  value: z.string().optional().refine(
    (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
    'Value must be a positive number'
  ),
  purchase_date: z.string().optional().refine(
    (val) => {
      if (!val) return true; // Optional field
      const date = new Date(val);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      return date <= today;
    },
    'Purchase date cannot be in the future'
  ),
  description: z.string().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
});

export const movementSchema = z.object({
  type: z.enum(['entrada', 'saida', 'alocacao', 'devolucao']),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  assigned_to: z.string().max(255, 'Assigned to is too long').optional().or(z.literal('')),
  notes: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type ProductFormData = z.infer<typeof productSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
export type MovementFormData = z.infer<typeof movementSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;

