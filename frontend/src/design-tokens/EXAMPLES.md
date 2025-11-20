# Exemplos de Uso do Design System GearLog

Este documento contém exemplos práticos de como usar o design system em componentes React.

## Exemplo 1: Botão usando Tokens TypeScript

```tsx
import { designTokens } from '@/design-tokens';
import { cn } from '@/utils/cn';

export function CustomButton({ children, variant = 'primary' }: { children: React.ReactNode; variant?: 'primary' | 'secondary' }) {
  const buttonTokens = designTokens.components.button.primary;
  
  return (
    <button
      className={cn(
        "font-medium transition-colors",
        variant === 'primary' && "bg-accent-primary text-white hover:bg-accent-primary/90",
        variant === 'secondary' && "border border-border bg-transparent hover:bg-surface-alt"
      )}
      style={{
        height: buttonTokens.height,
        borderRadius: buttonTokens.radius,
        padding: buttonTokens.padding,
        fontWeight: buttonTokens.font_weight,
      }}
    >
      {children}
    </button>
  );
}
```

## Exemplo 2: Card usando Classes Tailwind

```tsx
import { cn } from '@/utils/cn';

export function ProductCard({ title, description }: { title: string; description: string }) {
  return (
    <div className={cn(
      "rounded-lg p-5", // radius-lg e padding do card
      "bg-surface shadow-card", // background e shadow
      "transition-transform hover:scale-hover" // motion
    )}>
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      <p className="text-sm text-text-secondary mt-2">{description}</p>
    </div>
  );
}
```

## Exemplo 3: Input usando Variáveis CSS

```tsx
import { designTokens } from '@/design-tokens';

export function CustomInput({ placeholder }: { placeholder?: string }) {
  const inputTokens = designTokens.components.input;
  
  return (
    <input
      type="text"
      placeholder={placeholder}
      className="w-full border border-border rounded-md bg-input-bg"
      style={{
        height: inputTokens.height,
        padding: inputTokens.padding,
        borderRadius: inputTokens.radius,
      }}
    />
  );
}
```

## Exemplo 4: Usando Helper Functions

```tsx
import { getColor, getSpacing, getRadius } from '@/design-tokens/utils';
import { useTheme } from '@/hooks/useTheme'; // exemplo de hook de tema

export function ThemedComponent() {
  const { mode } = useTheme(); // 'light' ou 'dark'
  
  return (
    <div
      style={{
        backgroundColor: getColor(mode, 'surface'),
        color: getColor(mode, 'text.primary'),
        padding: getSpacing('md'),
        borderRadius: getRadius('lg'),
      }}
    >
      Conteúdo com tema dinâmico
    </div>
  );
}
```

## Exemplo 5: Badge Component

```tsx
import { designTokens } from '@/design-tokens';
import { cn } from '@/utils/cn';

export function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'danger' }) {
  const badgeTokens = designTokens.components.badge;
  
  const variantColors = {
    default: 'bg-surface-alt text-text-secondary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
  };
  
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium",
        variantColors[variant]
      )}
      style={{
        borderRadius: badgeTokens.radius,
        fontSize: badgeTokens.font_size,
        padding: badgeTokens.padding,
      }}
    >
      {children}
    </span>
  );
}
```

## Exemplo 6: Sidebar usando Design Tokens

```tsx
import { designTokens } from '@/design-tokens';
import { cn } from '@/utils/cn';

export function Sidebar({ collapsed }: { collapsed?: boolean }) {
  const sidebarTokens = designTokens.components.sidebar;
  
  return (
    <aside
      className="bg-sidebar-bg transition-all duration-150"
      style={{
        width: collapsed ? sidebarTokens.collapsed : sidebarTokens.width,
      }}
    >
      <nav className="p-md space-y-2">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center text-sidebar-icon hover:text-text-primary",
              "transition-colors duration-150"
            )}
            style={{
              height: sidebarTokens.item.height,
              borderRadius: sidebarTokens.item.radius,
              padding: `0 ${designTokens.global.spacing.md}`,
            }}
          >
            {item.icon && <item.icon className="w-5 h-5 mr-2" />}
            {!collapsed && <span>{item.label}</span>}
          </a>
        ))}
      </nav>
    </aside>
  );
}
```

## Exemplo 7: Tipografia Consistente

```tsx
import { designTokens } from '@/design-tokens';

export function TypographyExample() {
  return (
    <div className="space-y-4">
      <h1 className="text-xxl font-bold text-text-primary">
        Título Principal
      </h1>
      <h2 className="text-xl font-semibold text-text-primary">
        Subtítulo
      </h2>
      <p className="text-md font-regular text-text-secondary">
        Texto do corpo com tamanho médio
      </p>
      <p className="text-sm font-regular text-text-muted">
        Texto secundário menor
      </p>
    </div>
  );
}
```

## Exemplo 8: Grid com Espaçamento Consistente

```tsx
export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

## Exemplo 9: Estados de Botão

```tsx
import { Button } from '@/components/ui/button';

export function ButtonExamples() {
  return (
    <div className="flex gap-md">
      <Button variant="default" size="default">
        Primário
      </Button>
      <Button variant="secondary" size="default">
        Secundário
      </Button>
      <Button variant="outline" size="default">
        Outline
      </Button>
      <Button variant="ghost" size="default">
        Ghost
      </Button>
      <Button variant="destructive" size="default">
        Destrutivo
      </Button>
    </div>
  );
}
```

## Exemplo 10: Cards com Diferentes Variantes

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export function CardExamples() {
  return (
    <div className="grid gap-lg">
      <Card>
        <CardHeader>
          <CardTitle>Card Padrão</CardTitle>
          <CardDescription>Descrição do card</CardDescription>
        </CardHeader>
        <CardContent>
          Conteúdo do card
        </CardContent>
      </Card>
      
      <Card className="bg-surface-alt">
        <CardHeader>
          <CardTitle>Card com Background Alternativo</CardTitle>
        </CardHeader>
        <CardContent>
          Usando surface-alt para variação visual
        </CardContent>
      </Card>
    </div>
  );
}
```

## Dicas de Uso

1. **Prefira Classes Tailwind**: Use classes Tailwind quando possível para melhor performance e manutenibilidade
2. **Use Variáveis CSS**: Para valores dinâmicos ou que mudam com o tema
3. **Use Tokens TypeScript**: Para lógica complexa ou cálculos baseados em tokens
4. **Mantenha Consistência**: Sempre use os tokens do design system em vez de valores hardcoded
5. **Teste em Ambos os Modos**: Certifique-se de que os componentes funcionam bem em modo claro e escuro

