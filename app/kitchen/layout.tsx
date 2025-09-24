import type { ReactNode } from 'react';
import { Providers } from '@/lib/providers';

export default function KitchenLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <Providers>{children}</Providers>;
}