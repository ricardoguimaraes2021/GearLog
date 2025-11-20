# GearLog Design System

Este diretório contém os tokens de design do sistema GearLog, que servem como base de UI para toda a plataforma.

## Estrutura

O design system está organizado em:

- **`index.ts`**: Arquivo principal com todos os tokens de design em TypeScript
- **Variáveis CSS**: Definidas em `src/index.css` e utilizadas pelo Tailwind CSS
- **Configuração Tailwind**: Tokens integrados em `tailwind.config.js`

## Uso

### 1. Usando Tokens TypeScript

```typescript
import { designTokens, getColor, getSpacing, getRadius } from '@/design-tokens';

// Acessar tokens diretamente
const primaryColor = designTokens.colors.light.accent.primary;

// Usar helper functions
const spacing = getSpacing('md'); // retorna "16px"
const radius = getRadius('lg'); // retorna "14px"
const color = getColor('light', 'accent.primary'); // retorna "#2563EB"
```

### 2. Usando Classes Tailwind

Os tokens estão disponíveis como classes Tailwind:

```tsx
// Cores
<div className="bg-background text-text-primary">
<div className="bg-accent-primary text-white">
<div className="border border-border">

// Espaçamento
<div className="p-md"> // padding: 16px
<div className="gap-sm"> // gap: 8px

// Border Radius
<div className="rounded-md"> // border-radius: 10px
<div className="rounded-lg"> // border-radius: 14px

// Fontes
<p className="text-sm font-medium"> // 14px, weight 500
```

### 3. Usando Variáveis CSS

```css
.custom-component {
  background-color: var(--gearlog-surface);
  color: var(--gearlog-text-primary);
  border-radius: var(--gearlog-radius-md);
  padding: var(--gearlog-spacing-md);
  box-shadow: var(--gearlog-shadow-card);
}
```

## Tokens Disponíveis

### Cores

- **Background**: `background`, `surface`, `surface-alt`
- **Texto**: `text-primary`, `text-secondary`, `text-muted`
- **Acentos**: `accent-primary`, `accent-secondary`
- **Estados**: `success`, `warning`, `danger`
- **Bordas**: `border`
- **Inputs**: `input-bg`
- **Sidebar**: `sidebar-bg`, `sidebar-icon`

### Espaçamento

- `xs`: 4px
- `sm`: 8px
- `md`: 16px
- `lg`: 24px
- `xl`: 32px

### Border Radius

- `xs`: 4px
- `sm`: 8px
- `md`: 10px
- `lg`: 14px
- `xl`: 20px
- `full`: 999px

### Fontes

- **Tamanhos**: `xs` (12px), `sm` (14px), `md` (15px), `lg` (18px), `xl` (22px), `xxl` (28px)
- **Pesos**: `regular` (400), `medium` (500), `semibold` (600), `bold` (700)
- **Família**: Inter, system-ui, sans-serif

### Componentes

Os tokens incluem valores específicos para:
- **Button**: altura, padding, radius, cores
- **Input**: altura, padding, radius, cores
- **Card**: radius, padding, shadow, background
- **Sidebar**: largura, cores, altura de itens
- **Badge**: radius, font-size, padding

## Modo Escuro

O design system suporta automaticamente modo claro e escuro. As variáveis CSS são atualizadas automaticamente quando a classe `dark` é aplicada ao elemento raiz.

```tsx
// O modo escuro é ativado automaticamente via classe 'dark'
<html className="dark">
  {/* Conteúdo */}
</html>
```

## Exemplos de Uso

### Botão Primário

```tsx
<button className="h-[42px] px-[18px] rounded-md bg-accent-primary text-white font-medium">
  Clique aqui
</button>
```

### Card

```tsx
<div className="rounded-lg p-5 bg-surface shadow-card">
  <h3 className="text-lg font-semibold text-text-primary">Título</h3>
  <p className="text-sm text-text-secondary">Conteúdo</p>
</div>
```

### Input

```tsx
<input 
  className="h-[42px] px-[14px] rounded-md bg-input-bg border border-border"
  type="text"
/>
```

## Manutenção

Para atualizar os tokens:

1. Edite `frontend/src/design-tokens/index.ts`
2. Atualize as variáveis CSS em `frontend/src/index.css`
3. Atualize `frontend/tailwind.config.js` se necessário
4. Teste em modo claro e escuro

## Referência

Este design system é baseado no arquivo oficial `GearlogPRD_Design.txt` e serve como fonte única de verdade para todos os valores de design da plataforma GearLog.

