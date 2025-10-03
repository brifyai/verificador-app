export type Expense = {
  id: string
  amount: number
  category: string
  description: string
  date: Date
}

export type ExpenseFormData = Omit<Expense, 'id' | 'date'> & {
  date: string
}

export const EXPENSE_CATEGORIES = [
  'Food',
  'Transportation',
  'Housing',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Education',
  'Other'
] as const

export type DateRange = {
  from: Date | undefined
  to: Date | undefined
}

// Mapeo de roles entre la base de datos y los títulos mostrados
export const ROLE_MAPPING = {
  USER: 'Analista',
  ADMIN: 'Administrador', 
  MODERATOR: 'Verificador'
} as const

export type DatabaseRole = keyof typeof ROLE_MAPPING
export type DisplayRole = typeof ROLE_MAPPING[DatabaseRole]

// Función para obtener el título mostrado desde el rol de la BD
export const getDisplayRole = (dbRole: DatabaseRole): DisplayRole => {
  return ROLE_MAPPING[dbRole]
}

// Función para obtener el rol de la BD desde el título mostrado
export const getDatabaseRole = (displayRole: DisplayRole): DatabaseRole => {
  const entry = Object.entries(ROLE_MAPPING).find(([_, value]) => value === displayRole)
  return entry ? entry[0] as DatabaseRole : 'USER'
}

// Tipo para miembros del equipo
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLogin: string;
  status: string;
}