# 🎨 Guía para Verificar la Leyenda de Colores

## ¿Qué es la leyenda de colores?
La leyenda explica qué significan los 4 círculos de color que aparecen junto a cada radio en la lista.

## Paso a paso para verificar:

### 1. Abre la página de radios
Ve a: http://localhost:3000/radios

### 2. Busca la leyenda
**DEBAJO del buscador de radios** deberías ver una línea con 4 colores:
```
🟢 Online 🔴 Offline 🟡 Activo sin verificar ⚪ Inactivo
```

### 3. Verifica que estén los 4 colores:
- 🟢 **Verde** - Radio verificada y funcionando
- 🔴 **Rojo** - Radio verificada pero sin conexión  
- 🟡 **Amarillo** - Radio activa pero no verificada
- ⚪ **Blanco/Gris** - Radio desactivada

## ¿No ves la leyenda?
Si no aparece, prueba esto:

### Opción A: Recarga la página
1. Presiona `F5` o `Ctrl+R` (Windows/Linux) o `Cmd+R` (Mac)
2. Espera a que cargue completamente

### Opción B: Verifica con la consola del navegador
1. Abre la consola: Presiona `F12` → pestaña "Consola"
2. Copia y pega este código:

```javascript
// Buscar la leyenda
const legend = document.querySelector('.flex.flex-wrap.items-center.gap-4.text-xs.text-gray-400');
if (legend) {
  console.log('✅ Leyenda encontrada:', legend.textContent);
} else {
  console.log('❌ Leyenda no encontrada');
}
```

### Opción C: Verifica manualmente
Busca en el código fuente de la página (click derecho → "Ver código fuente") si aparece:
```html
<div class="flex flex-wrap items-center gap-4 text-xs text-gray-400">
```

## ¿Problemas comunes?
1. **La página no carga**: Verifica que el servidor esté ejecutándose con `npm run dev`
2. **No aparece la leyenda**: Recarga la página o limpia el caché del navegador
3. **Colores distintos**: Los colores pueden variar ligeramente según el tema del navegador

## Resultado esperado
Debes ver claramente los 4 colores con sus descripciones debajo del buscador, ayudándote a entender el estado de cada radio en la lista.