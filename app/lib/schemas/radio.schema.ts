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
    .min(1, 'La programadora es requerida')
    .max(100, 'La programadora no puede exceder 100 caracteres')
    .trim()
    .optional()
    .default(''),
  
  frequency: z.string()
    .max(50, 'La frecuencia no puede exceder 50 caracteres')
    .trim()
    .optional()
    .default(''),
  
  streamUrl: z.string()
    .url('La URL del stream debe ser válida')
    .trim(),
  
  streamPlatform: z.string()
    .min(1, 'La plataforma es requerida')
    .trim(),
  
  region: z.string()
    .min(1, 'La región es requerida')
    .max(100, 'La región no puede exceder 100 caracteres')
    .trim(),
  
  city: z.string()
    .max(100, 'La ciudad no puede exceder 100 caracteres')
    .trim()
    .optional()
    .default(''),
  
  website: z.string()
    .url('El sitio web debe ser una URL válida')
    .trim()
    .optional()
    .or(z.literal('')),
  
  isActive: z.boolean()
    .default(true),
  
  genre: z.string()
    .max(50, 'El género no puede exceder 50 caracteres')
    .trim()
    .optional()
    .default('Música'),
  
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
    .optional(),
  
  frequency: z.string()
    .max(50, 'La frecuencia no puede exceder 50 caracteres')
    .trim()
    .optional(),
  
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
    .or(z.literal('')),
  
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
