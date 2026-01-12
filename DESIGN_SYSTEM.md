# Sistema de Diseño - Gaming Platform

## 📋 Visión General

Sistema de diseño estandarizado para plataforma de gaming competitivo por membresía. Estilo **futurista/minimalista** con enfoque en **interacciones eficientes** (mínimos clicks).

## 🛠️ Stack Tecnológico

- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (basado en Radix UI)
- **Animaciones**: [Framer Motion](https://www.framer.com/motion/)
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS con variables CSS personalizadas
- **Estilo**: Dark mode por defecto (tema gaming/futurista)

## 🎨 Paleta de Colores

### Colores Primarios
- **Primary**: `hsl(238, 84%, 67%)` - Indigo (#6366f1)
  - Uso: Acciones principales, botones primarios, enlaces
- **Accent**: `hsl(292, 84%, 61%)` - Fuchsia (#d946ef)
  - Uso: Elementos destacados, efectos especiales

### Colores Semánticos
- **Success**: Verde - Confirmaciones, estados positivos
- **Warning**: Ámbar - Advertencias, estados intermedios
- **Destructive**: Rojo - Errores, acciones destructivas

### Colores Base
- **Background**: `hsl(220, 27%, 10%)` - Fondo oscuro principal
- **Card**: `hsl(220, 27%, 15%)` - Fondo de tarjetas
- **Foreground**: `hsl(210, 40%, 98%)` - Texto principal
- **Muted**: `hsl(215, 20.2%, 65.1%)` - Texto secundario

### Efectos Glow (Gaming)
- **Glow Primary**: Efecto de resplandor para elementos interactivos principales
- **Glow Accent**: Efecto de resplandor para elementos destacados

## 🧩 Componentes Base

Todos los componentes están en `components/ui/` y siguen el patrón de shadcn/ui.

### Button

Botón versátil con múltiples variantes y tamaños.

```tsx
import { Button } from '@/components/ui/button';

// Variantes disponibles
<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="accent">Accent (con glow)</Button>
<Button variant="destructive">Destructive</Button>

// Tamaños
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon only</Button>
```

### Card

Contenedor de contenido con variantes.

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descripción</CardDescription>
  </CardHeader>
  <CardContent>Contenido</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

### Input

Campo de entrada de texto.

```tsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

<div>
  <Label htmlFor="name">Nombre</Label>
  <Input id="name" placeholder="Ingresa tu nombre" />
</div>
```

### Badge

Etiqueta para estados, categorías, etc.

```tsx
import { Badge } from '@/components/ui/badge';

<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="accent">Accent</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>
```

### AnimatedContainer

Wrapper para animaciones con Framer Motion.

```tsx
import { AnimatedContainer } from '@/components/ui/animated-container';

<AnimatedContainer direction="up" delay={0.1}>
  <Card>Contenido animado</Card>
</AnimatedContainer>
```

**Props:**
- `direction`: `'up' | 'down' | 'left' | 'right' | 'fade'`
- `delay`: número (segundos)
- `duration`: número (segundos, default: 0.4)
- `className`: string

## 📐 Principios de Diseño

### 1. Mínimos Clicks
- Acciones directas y evidentes
- Navegación clara y accesible
- Formularios optimizados

### 2. Feedback Visual
- Estados claros (hover, active, disabled)
- Animaciones sutiles
- Indicadores de carga
- Efectos glow para elementos importantes

### 3. Consistencia
- Uso estandarizado de componentes shadcn/ui
- Espaciado consistente
- Tipografía uniforme
- Colores del sistema

### 4. Accesibilidad
- Radix UI asegura accesibilidad por defecto
- Navegación por teclado
- Contraste adecuado
- Labels descriptivos

## 🎭 Efectos y Animaciones

### Glow Effects
Utilidades CSS para efectos de resplandor gaming:

```tsx
// En clases Tailwind
<div className="glow-primary">Elemento con glow</div>
<div className="glow-accent">Elemento con glow accent</div>
<div className="glow-primary-lg">Glow más intenso</div>
```

### Animaciones Tailwind
- `animate-pulse-glow`: Pulso de resplandor
- `animate-slide-up`: Deslizamiento desde abajo
- `animate-fade-in`: Fade in

### Framer Motion
Usar `AnimatedContainer` para animaciones más complejas o personalizadas.

## 📁 Estructura de Archivos

```
components/
  ui/                    # Componentes base (shadcn/ui)
    button.tsx
    card.tsx
    input.tsx
    badge.tsx
    label.tsx
    animated-container.tsx
    ...
  # Componentes específicos de la aplicación
  Navigation.tsx
  UserForm.tsx
  ...

lib/
  utils.ts               # Utilidades (cn function)
  
app/
  globals.css            # Variables CSS del tema
```

## 🔄 Migración de Componentes Existentes

Para migrar componentes antiguos a shadcn/ui:

1. **Reemplazar clases personalizadas** por componentes de shadcn/ui
2. **Usar variantes estándar** (default, secondary, accent, etc.)
3. **Mantener funcionalidad** mientras mejoramos el estilo
4. **Actualizar imports** a `@/components/ui/*`

### Ejemplo de Migración

**Antes:**
```tsx
<button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
  Guardar
</button>
```

**Después:**
```tsx
import { Button } from '@/components/ui/button';

<Button variant="default">Guardar</Button>
```

## 📚 Recursos

- [Documentación shadcn/ui](https://ui.shadcn.com/)
- [Documentación Radix UI](https://www.radix-ui.com/)
- [Documentación Framer Motion](https://www.framer.com/motion/)
- [Documentación Tailwind CSS](https://tailwindcss.com/)

## 🚀 Próximos Pasos

- [ ] Instalar componentes adicionales según necesidad (Select, Dialog, Toast, etc.)
- [ ] Crear componentes compuestos específicos de la aplicación
- [ ] Documentar patrones de uso comunes
- [ ] Establecer guías de spacing y tipografía
- [ ] Crear Storybook (opcional)

---

**Nota**: Este sistema de diseño es evolutivo. Los componentes pueden extenderse y personalizarse según las necesidades del proyecto.

