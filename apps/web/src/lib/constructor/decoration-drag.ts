export const DECORATION_POINTER_DROP_EVENT = 'bakery-decoration-pointer-drop';

export interface DecorationPointerDropDetail {
  visualKey: string;
  decorationId?: string;
  clientX: number;
  clientY: number;
}
