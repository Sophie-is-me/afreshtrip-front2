// src/hooks/useCurrency.ts
import { useTranslation } from 'react-i18next';
import { PLAN_PRICES } from '../utils/contact';

export const useCurrency = () => {
  const { i18n } = useTranslation();
  
  // Match 'zh', 'zh-CN', 'zh-TW', etc.
  const isChinese = i18n.language?.toLowerCase().startsWith('zh');

  const symbol = isChinese ? '¥' : '$';
  const code = isChinese ? 'CNY' : 'USD';

  const getPrice = (planId: string): number => {
    const prices = PLAN_PRICES[planId];
    if (!prices) return 0;
    return isChinese ? prices.cny : prices.usd;
  };

  const format = (planId: string): string => `${symbol}${getPrice(planId)}`;

  return { symbol, code, isChinese, getPrice, format };
};