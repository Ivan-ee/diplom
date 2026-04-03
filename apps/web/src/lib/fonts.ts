import { Montserrat, Open_Sans } from 'next/font/google';

export const montserrat = Montserrat({
  subsets: ['latin', 'cyrillic'],
  weight: ['500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const openSans = Open_Sans({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '600'],
  variable: '--font-open-sans',
  display: 'swap',
});
