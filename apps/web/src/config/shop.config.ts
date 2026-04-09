export type ShopPhone = {
  label: string; // e.g. "Виктория"
  value: string; // tel: link value, no spaces/dashes, e.g. "+79159312888"
  display: string; // UI display, e.g. "+7 (915) 931-28-88"
};

export const shopConfig = {
  name: 'Торты на заказ Виктория',
  shortName: 'Виктория',
  tagline: 'Самая настоящая мастерская счастья',
  description:
    'Домашняя кондитерская мастерская в Арзамасе. Авторские торты на заказ — свадебные, детские, бенто, капкейки, трайфлы. Готовим с любовью в собственном цехе.',
  city: 'Арзамас',
  hasPhysicalAddress: false as const,
  phones: [
    { label: 'Виктория', value: '+79159312888', display: '+7 (915) 931-28-88' },
    { label: 'Елена', value: '+79036078050', display: '+7 (903) 607-80-50' },
  ] as const satisfies readonly ShopPhone[],
  adminName: 'Елена Канаева',
  socials: {
    vk: 'https://vk.com/victoria.tort',
  },
  workingHours: null,
} as const;

export type ShopConfig = typeof shopConfig;
