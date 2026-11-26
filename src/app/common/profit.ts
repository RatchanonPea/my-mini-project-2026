import type { ReportPeriod } from '../services/api';

/** A report period with the chickens it sold priced in. */
export type NetPeriod = ReportPeriod & { chicken_cost: number; net_profit: number };

const satang = (n: number) => Math.round(n * 100) / 100;

/** What is left once the chickens sold and the running expenses are both paid for. */
export const netOf = (profitBeforeChicken: number, chickenCost: number): number => satang(profitBeforeChicken - chickenCost);

/** The API sends how many chickens each period sold; unitCost is the same average cost the period totals use. */
export function withChickenCost(periods: ReportPeriod[], unitCost: number): NetPeriod[] {
  return periods.map((p) => {
    const chicken_cost = satang(p.chicken_sold * unitCost);
    return { ...p, chicken_cost, net_profit: netOf(p.profit, chicken_cost) };
  });
}
