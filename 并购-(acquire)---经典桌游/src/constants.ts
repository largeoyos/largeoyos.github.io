import { HotelChain } from './types';

export const BOARD_ROWS = 9; // A-I
export const BOARD_COLS = 12; // 1-12

export const INITIAL_MONEY = 6000;
export const INITIAL_TILES_COUNT = 6;
export const MAX_STOCKS_PER_TURN = 3;
export const SAFE_SIZE = 11;
export const MAX_CHAIN_SIZE = 41;
export const TOTAL_STOCKS_PER_CHAIN = 25;

export const PRICE_TABLE: Record<'low' | 'mid' | 'high', Record<number, number>> = {
  low: {
    2: 200, 3: 300, 4: 400, 5: 500, 6: 600, 11: 700, 21: 800, 31: 900, 41: 1000
  },
  mid: {
    2: 300, 3: 400, 4: 500, 5: 600, 6: 700, 11: 800, 21: 900, 31: 1000, 41: 1100
  },
  high: {
    2: 400, 3: 500, 4: 600, 5: 700, 6: 800, 11: 900, 21: 1000, 31: 1100, 41: 1200
  }
};

export function getStockPrice(category: 'low' | 'mid' | 'high', size: number): number {
  if (size < 2) return 0;
  const tiers = [2, 3, 4, 5, 6, 11, 21, 31, 41];
  let effectiveSize = 2;
  for (const tier of tiers) {
    if (size >= tier) {
      effectiveSize = tier;
    } else {
      break;
    }
  }
  return PRICE_TABLE[category][effectiveSize];
}

export const CHAIN_COLORS: Record<HotelChain, string> = {
  '黄山纸业': '#FFFF00', // Yellow
  '朝阳五金': '#FFA500', // Orange
  '蓝天纺织': '#0000FF', // Blue
  '红旗造船': '#FF0000', // Red
  '橡树日化': '#00FFFF', // Cyan
  '核能重工': '#008000', // Green
  '紫金仪表': '#800080', // Purple
};

export const CHAIN_CATEGORIES: Record<HotelChain, 'low' | 'mid' | 'high'> = {
  '黄山纸业': 'low',
  '朝阳五金': 'low',
  '蓝天纺织': 'mid',
  '红旗造船': 'mid',
  '橡树日化': 'mid',
  '核能重工': 'high',
  '紫金仪表': 'high',
};
