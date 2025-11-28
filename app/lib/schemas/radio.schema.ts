import { z } from 'zod';

/**
 * Schema para crear una radio
 */
export const RadioCreateSchema = z.object({
  name: z.string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  
  programadora: z.string()
    .max(100, 'La programadora no puede exceder 100 caracteres')
    .trim()
    .optional()
    .nullable(),
  
  frequency: z.string()
    .max(50, 'La frecuencia no puede exceder 50 caracteres')
    .trim()
    .optional()
    .nullable(),
  
  streamUrl: z.string()
    .url('La URL del stream debe ser válida')
    .trim(),
  
  streamPlatform: z.string()
    .trim()
    .optional()
    .default('direct'),
  
  region: z.string()
    .min(1, 'La región es requerida')
    .max(100, 'La región no puede exceder 100 caracteres')
    .trim(),
  
  city: z.string()
    .min(1, 'La ciudad es requerida')
    .max(100, 'La ciudad no puede exceder 100 caracteres')
    .trim(),
  
  website: z.string()
    .url('El sitio web debe ser una URL válida')
    .trim()
    .optional()
    .nullable(),
  
  isActive: z.boolean()
    .default(true),
  
  genre: z.string()
    .max(50, 'El género no puede exceder 50 caracteres')
    .trim()
    .optional()
    .default('Música'),
  
  priority: z.number()
    .int('La prioridad debe ser un número entero')
    .min(1, 'La prioridad mínima es 1')
    .max(10, 'La prioridad máxima es 10')
    .optional()
    .default(1),
  
  costPerHour: z.number()
    .min(0, 'El costo por hora no puede ser negativo')
    .optional()
    .default(0.0),
  
  platformData: z.record(z.any())
    .optional()
    .default({}),
});

/**
 * Schema para actualizar una radio (todos los campos opcionales)
 */
export const RadioUpdateSchema = z.object({
  name: z.string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim()
    .optional(),
  
  programadora: z.string()
    .max(100, 'La programadora no puede exceder 100 caracteres')
    .trim()
    .optional()
    .nullable(),
  
  frequency: z.string()
    .max(50, 'La frecuencia no puede exceder 50 caracteres')
    .trim()
    .optional()
    .nullable(),
  
  streamUrl: z.string()
    .url('La URL del stream debe ser válida')
    .trim()
    .optional(),
  
  streamPlatform: z.string()
    .min(1, 'La plataforma es requerida')
    .trim()
    .optional(),
  
  region: z.string()
    .min(1, 'La región es requerida')
    .max(100, 'La región no puede exceder 100 caracteres')
    .trim()
    .optional(),
  
  city: z.string()
    .max(100, 'La ciudad no puede exceder 100 caracteres')
    .trim()
    .optional(),
  
  website: z.string()
    .url('El sitio web debe ser una URL válida')
    .trim()
    .optional()
    .nullable(),
  
  isActive: z.boolean()
    .optional(),
  
  genre: z.string()
    .max(50, 'El género no puede exceder 50 caracteres')
    .trim()
    .optional(),
  
  platformData: z.record(z.any())
    .optional(),
  
  lastMonitored: z.string()
    .optional(),
});

/**
 * Schema para importación masiva
 */
export const RadioImportSchema = z.object({
  radios: z.array(
    z.object({
      name: z.string().min(1).trim(),
      region: z.string().min(1).trim(),
      city: z.string().optional(),
      streamUrl: z.string().optional(),
      URL: z.string().optional(), // Campo alternativo
      frequency: z.string().optional(),
      description: z.string().optional(),
      website: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      address: z.string().optional(),
      logo: z.string().optional(),
      programadora: z.string().optional(),
      genre: z.string().optional(),
    })
  ).max(500, 'Máximo 500 radios por importación')
});

/**
 * Tipos inferidos de los schemas
 */
export type RadioCreateInput = z.infer<typeof RadioCreateSchema>;
export type RadioUpdateInput = z.infer<typeof RadioUpdateSchema>;
export type RadioImportInput = z.infer<typeof RadioImportSchema>;
