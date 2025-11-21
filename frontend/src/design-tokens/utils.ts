/**
 * Utilitários para trabalhar com os tokens de design do GearLog
 */

import { designTokens, type ColorMode } from './index';

/**
 * Obtém uma cor do design system
 * @param mode - Modo de cor ('light' ou 'dark')
 * @param path - Caminho da cor (ex: 'accent.primary', 'text.secondary')
 * @returns Valor da cor em hexadecimal
 */
export function getColor(mode: ColorMode, path: string): string {
  const parts = path.split('.');
  let value: any = designTokens.colors[mode];
  
  for (const part of parts) {
    value = value?.[part];
  }
  
  return value || '';
}

/**
 * Obtém um valor de espaçamento
 * @param size - Tamanho do espaçamento
 * @returns Valor do espaçamento em pixels
 */
export function getSpacing(size: keyof typeof designTokens.global.spacing): string {
  return designTokens.global.spacing[size];
}

/**
 * Obtém um valor de border radius
 * @param size - Tamanho do radius
 * @returns Valor do radius em pixels
 */
export function getRadius(size: keyof typeof designTokens.global.radius): string {
  return designTokens.global.radius[size];
}

/**
 * Obtém um tamanho de fonte
 * @param size - Tamanho da fonte
 * @returns Valor do tamanho em pixels
 */
export function getFontSize(size: keyof typeof designTokens.global.font.size): string {
  return designTokens.global.font.size[size];
}

/**
 * Obtém um peso de fonte
 * @param weight - Peso da fonte
 * @returns Valor numérico do peso
 */
export function getFontWeight(weight: keyof typeof designTokens.global.font.weight): number {
  return designTokens.global.font.weight[weight];
}

/**
 * Obtém a sombra de um card
 * @param mode - Modo de cor ('light' ou 'dark')
 * @returns Valor da sombra
 */
export function getCardShadow(mode: ColorMode): string {
  return designTokens.global.shadow[mode].card;
}

/**
 * Obtém valores de um componente específico
 * @param component - Nome do componente
 * @param variant - Variante do componente
 * @returns Objeto com os valores do componente
 */
export function getComponentTokens(component: keyof typeof designTokens.components, variant?: string) {
  const componentTokens = designTokens.components[component];
  
  if (variant && componentTokens && ('primary' in componentTokens || 'secondary' in componentTokens)) {
    return (componentTokens as any)[variant] || componentTokens;
  }
  
  return componentTokens;
}

/**
 * Helper para obter tokens baseado no tema atual
 * @param mode - Modo de cor ('light' ou 'dark')
 * @returns Objeto com tokens do tema especificado
 */
export function getDesignTokens(mode: ColorMode = 'light') {
  return {
    colors: designTokens.colors[mode],
    spacing: designTokens.global.spacing,
    radius: designTokens.global.radius,
    font: designTokens.global.font,
    shadow: designTokens.global.shadow[mode],
    getColor: (path: string) => getColor(mode, path),
    getCardShadow: () => getCardShadow(mode),
  };
}

/**
 * Converte um valor de token para uma classe Tailwind quando aplicável
 * Útil para valores que não têm classes Tailwind diretas
 */
export function tokenToTailwindClass(token: string, type: 'spacing' | 'radius' | 'fontSize'): string {
  const mapping: Record<string, string> = {
    // Spacing
    '4px': 'xs',
    '8px': 'sm',
    '16px': 'md',
    '24px': 'lg',
    '32px': 'xl',
    // Radius
    '10px': 'md',
    '14px': 'lg',
    '20px': 'xl',
    '999px': 'full',
    // Font Size
    '12px': 'xs',
    '14px-font': 'sm',
    '15px': 'md',
    '18px': 'lg',
    '22px': 'xl',
    '28px': 'xxl',
  };

  const key = Object.keys(mapping).find(k => token.includes(k));
  if (key) {
    return mapping[key];
  }

  return '';
}

