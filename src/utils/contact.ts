// src/utils/contact.ts
export const CONTACT_EMAIL = 'contact@anstalle.com';

const isChineseVersion = import.meta.env.VITE_IS_CHINESE_VERSION === 'true';

export const CONTACT_PHONE = isChineseVersion
  ? '+86 15822674205'
  : '+33 0662926877';


export const PLAN_PRICES: Record<string, { usd: number; cny: number }> = {
  week:   { usd: 19,  cny: 138 },
  month:  { usd: 39,  cny: 288 },
  season: { usd: 89,  cny: 648 },
  year:   { usd: 199, cny: 1458 },
};