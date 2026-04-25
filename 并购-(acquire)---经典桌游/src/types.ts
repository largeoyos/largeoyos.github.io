
export type HotelChain = '黄山纸业' | '朝阳五金' | '蓝天纺织' | '红旗造船' | '橡树日化' | '核能重工' | '紫金仪表';

export interface Tile {
  id: string; // e.g., "A1", "B12"
  row: number; // 0-8 (A-I)
  col: number; // 0-11 (1-12)
}

export interface Player {
  id: string;
  name: string;
  money: number;
  tiles: Tile[];
  stocks: Record<HotelChain, number>;
  isAI: boolean;
}

export interface GameState {
  board: (HotelChain | 'tile' | null)[][]; // null = empty, 'tile' = unassigned tile, HotelChain = part of a chain
  tilesPool: Tile[];
  players: Player[];
  currentPlayerIndex: number;
  activeChains: HotelChain[];
  availableChains: HotelChain[];
  stockMarket: Record<HotelChain, {
    price: number;
    available: number;
    size: number;
    isSafe: boolean;
  }>;
  gameLog: string[];
  phase: 'play-tile' | 'found-chain' | 'buy-stocks' | 'merger-bonus' | 'merger-options' | 'game-over' | 'choose-survivor';
  selectedTile: Tile | null;
  pendingChainFormation: {
    tiles: Tile[];
    availableChains: HotelChain[];
  } | null;
  pendingMerger: {
    survivor: HotelChain;
    defunct: HotelChain[];
    mergerTile: Tile;
    mergerPlayerIndex: number;
    defunctIndex: number; // which defunct chain we are currently processing
    playerOptionIndex: number; // which player is making options
    potentialSurvivors?: HotelChain[];
    allNeighborChains?: HotelChain[];
  } | null;
}

export const HOTEL_CHAINS: HotelChain[] = [
  '黄山纸业', '朝阳五金', '蓝天纺织', '红旗造船', '橡树日化', '核能重工', '紫金仪表'
];

export const CHAIN_CATEGORIES: Record<HotelChain, 'low' | 'mid' | 'high'> = {
  '黄山纸业': 'low',
  '朝阳五金': 'low',
  '蓝天纺织': 'mid',
  '红旗造船': 'mid',
  '橡树日化': 'mid',
  '核能重工': 'high',
  '紫金仪表': 'high',
};
