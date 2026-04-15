import type { Metadata } from 'next';
import ConstructorClient from '@/components/constructor/ConstructorClient';

export const metadata: Metadata = {
  title: '3D-Конструктор торта',
  description: 'Соберите свой торт: выберите форму, начинку, покрытие и украшения',
};

export default function ConstructorPage() {
  return <ConstructorClient />;
}
