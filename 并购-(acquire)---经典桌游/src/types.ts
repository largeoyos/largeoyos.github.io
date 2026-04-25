
export type HotelChain = 'Luxor' | 'Tower' | 'American' | 'Festival' | 'Worldwide' | 'Continental' | 'Imperial';

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
  phase: 'play-tile' | 'found-chain' | 'buy-stocks' | 'merger-bonus' | 'merger-options' | 'game-over';
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
  } | null;
}

export const HOTEL_CHAINS: HotelChain[] = [
  'Worldwide', 'Luxor', 'Festival', 'American', 'Tower', 'Continental', 'Imperial'
];

export const CHAIN_CATEGORIES: Record<HotelChain, 'low' | 'mid' | 'high'> = {
  Worldwide: 'low',
  Luxor: 'low',
  Festival: 'mid',
  American: 'mid',
  Tower: 'mid',
  Continental: 'high',
  Imperial: 'high',
};
