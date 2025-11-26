# 📋 Guía para Obtener API Key de PocketBase

## Paso 1: Acceder a PocketBase

1. Abre tu navegador y ve a: **https://pocket.brifyai.com/_/**

2. Inicia sesión con tus credenciales de administrador:
   - **Email**: `camiloalegriabarra@gmail.com`
   - **Password**: `Aintelligence2025$`

## Paso 2: Navegar a Settings (Configuración)

Una vez dentro del panel de administración:

1. En el menú lateral izquierdo, busca y haz clic en **"Settings"** (icono de engranaje ⚙️)

2. En el menú de Settings, busca la sección **"API Keys"** o **"Application Keys"**

## Paso 3: Generar una Nueva API Key

1. Haz clic en el botón **"Add API Key"** o **"Generate New Key"**

2. Completa la información:
   - **Name**: Ponle un nombre descriptivo, por ejemplo: `Verificador App Production`
   - **Permissions**: Selecciona **"All collections"** y marca tanto **"Read"** como **"Write"**

3. Haz clic en **"Create"** o **"Generate"**

4. **¡IMPORTANTE!**: **Copia inmediatamente la API Key** que se muestra. Es una cadena larga de caracterres que empieza con algo como `pb_` o es un token largo.

   ⚠️ **Guarda esta API Key en un lugar seguro porque no podrás verla de nuevo**

## Paso 4: Configurar la API Key en la Aplicación

1. Abre el archivo `.env` en el directorio `app/`:

```bash
cd app
nano .env
```

2. Añade estas líneas al final del archivo:

```env
# PocketBase Configuration
POCKETBASE_URL=https://pocket.brifyai.com
POCKETBASE_API_KEY=pega_aqui_tu_api_key
```

3. Guarda el archivo

## Paso 5: Actualizar la Configuración de la App

1. Abre `app/lib/db.ts` y actualízalo:

```typescript
import PocketBase from 'pocketbase';

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'https://pocket.brifyai.com';
const POCKETBASE_API_KEY = process.env.POCKETBASE_API_KEY;

const globalForPocketBase = globalThis as unknown as {
  pocketbase: PocketBase | undefined;
};

export const pb = globalForPocketBase.pocketbase ?? new PocketBase(POCKETBASE_URL);

// Autenticar con API Key
if (POCKETBASE_API_KEY) {
  pb.authStore.save(POCKETBASE_API_KEY, null);
}

if (process.env.NODE_ENV !== 'production') globalForPocketBase.pocketbase = pb;

// Helper para formatear fechas
export function formatDateForPocketBase(date: Date | string | null): string | null {
  if (!date) return null;
  return new Date(date).toISOString();
}

// Helper para manejar relaciones
export function getRelationId(record: any): string | null {
  if (!record) return null;
  if (typeof record === 'string') return record;
  return record.id || null;
}
```

2. Guarda los cambios

## Paso 6: Reiniciar la Aplicación

```bash
# En la terminal, presiona Ctrl+C para detener el servidor
# Luego vuelve a iniciarlo:

npm run dev
```

## 🔄 Alternativa Temporal (Mientras obtienes la API Key)

Si necesitas que la aplicación funcione mientras configuras la API Key, puedes autenticar directamente en cada API route:

```typescript
// En app/api/dashboard/stats/route.ts (y otros routes)

export async function GET(request: NextRequest) {
  try {
    // Autenticar temporalmente
    await pb.admins.authWithPassword(
      'camiloalegriabarra@gmail.com',
      'Aintelligence2025$'
    );
    
    // ... resto del código
  } catch (error) {
    // ... manejo de errores
  }
}
```

## 📍 Ubicación Exacta en la UI

Si no encuentras la sección de API Keys:

1. **Dashboard** → **Settings** (en el menú lateral)
2. Dentro de Settings, busca: **"API Keys"** o **"Application Keys"**
3. Si no lo ves, puede estar en una sub-sección llamada **"Security"** o **"Access"**

## 🔐 Seguridad

- **NUNCA** compartas tu API Key
- **NUNCA** subas el archivo `.env` con la API Key a Git
- Asegúrate de que `.env` está en tu `.gitignore`
- En producción, usa variables de entorno del servidor

---

¿Necesitas ayuda con algún paso específico o prefieres que cree un script temporal para autenticación mientras configuras la API Key?