import { useState, useCallback, useEffect } from 'react';
import { HotelChain, Tile, Player, GameState, HOTEL_CHAINS } from '../types';
import { 
  BOARD_ROWS, BOARD_COLS, INITIAL_MONEY, INITIAL_TILES_COUNT, 
  SAFE_SIZE, MAX_CHAIN_SIZE, TOTAL_STOCKS_PER_CHAIN,
  CHAIN_CATEGORIES, getStockPrice
} from '../constants';

const createInitialTiles = (): Tile[] => {
  const tiles: Tile[] = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      tiles.push({
        id: `${String.fromCharCode(65 + r)}${c + 1}`,
        row: r,
        col: c
      });
    }
  }
  return tiles.sort(() => Math.random() - 0.5);
};

const createInitialPlayers = (tilesPool: Tile[]): Player[] => {
  const names = ['你', 'AI 1', 'AI 2', 'AI 3'];
  return names.map((name, i) => ({
    id: `p${i}`,
    name,
    money: INITIAL_MONEY,
    tiles: tilesPool.splice(0, INITIAL_TILES_COUNT),
    stocks: HOTEL_CHAINS.reduce((acc, chain) => ({ ...acc, [chain]: 0 }), {} as Record<HotelChain, number>),
    isAI: i !== 0
  }));
};

export function useGame() {
  const [state, setState] = useState<GameState>(() => {
    const tilesPool = createInitialTiles();
    const players = createInitialPlayers(tilesPool);
    const board: (HotelChain | 'tile' | null)[][] = Array(BOARD_ROWS).fill(null).map(() => Array(BOARD_COLS).fill(null));
    
    return {
      board,
      tilesPool,
      players,
      currentPlayerIndex: 0,
      activeChains: [],
      availableChains: [...HOTEL_CHAINS],
      stockMarket: HOTEL_CHAINS.reduce((acc, chain) => ({
        ...acc,
        [chain]: { price: 0, available: TOTAL_STOCKS_PER_CHAIN, size: 0, isSafe: false }
      }), {} as GameState['stockMarket']),
      gameLog: ['游戏开始！'],
      phase: 'play-tile',
      selectedTile: null,
      pendingChainFormation: null,
      pendingMerger: null
    };
  });

  const addLog = (msg: string) => {
    setState(prev => ({ ...prev, gameLog: [msg, ...prev.gameLog].slice(0, 50) }));
  };

  const getNeighbors = (row: number, col: number) => {
    const neighbors: { row: number, col: number }[] = [];
    if (row > 0) neighbors.push({ row: row - 1, col });
    if (row < BOARD_ROWS - 1) neighbors.push({ row: row + 1, col });
    if (col > 0) neighbors.push({ row, col: col - 1 });
    if (col < BOARD_COLS - 1) neighbors.push({ row, col: col + 1 });
    return neighbors;
  };

  const checkTileLegality = (tile: Tile, board: GameState['board'], stockMarket: GameState['stockMarket'], availableChains: HotelChain[]) => {
    const neighbors = getNeighbors(tile.row, tile.col);
    const neighborTypes = neighbors.map(n => board[n.row][n.col]).filter(t => t !== null);
    const neighborChains = Array.from(new Set(neighborTypes.filter(t => t !== 'tile'))) as HotelChain[];
    const hasUnassignedNeighbor = neighborTypes.includes('tile');

    // 1. Cannot merge two safe chains
    const safeChains = neighborChains.filter(c => stockMarket[c].isSafe);
    if (safeChains.length > 1) return false;

    // 2. Cannot form a new chain if none are available
    if (neighborChains.length === 0 && hasUnassignedNeighbor && availableChains.length === 0) return false;

    return true;
  };

  const updateStockPrices = (newState: GameState) => {
    HOTEL_CHAINS.forEach(chain => {
      const size = newState.board.flat().filter(cell => cell === chain).length;
      const category = CHAIN_CATEGORIES[chain];
      newState.stockMarket[chain].size = size;
      newState.stockMarket[chain].price = getStockPrice(category, size);
      newState.stockMarket[chain].isSafe = size >= SAFE_SIZE;
    });
  };

  const playTile = (tile: Tile) => {
    if (state.phase !== 'play-tile') return;
    
    if (!checkTileLegality(tile, state.board, state.stockMarket, state.availableChains)) {
        addLog(`不能放置 ${tile.id}，该操作不合法。`);
        return;
    }

    const neighbors = getNeighbors(tile.row, tile.col);
    const neighborTypes = neighbors.map(n => state.board[n.row][n.col]).filter(t => t !== null);
    const neighborChains = Array.from(new Set(neighborTypes.filter(t => t !== 'tile'))) as HotelChain[];
    const hasUnassignedNeighbor = neighborTypes.includes('tile');

    // 1. Check for Merger
    if (neighborChains.length > 1) {
      handleMergerStart(tile, neighborChains);
      return;
    }

    // 2. Check for New Chain
    if (neighborChains.length === 0 && hasUnassignedNeighbor) {
      const connectedTiles = findConnectedUnassigned(tile, state.board);
      handleChainFormationStart(connectedTiles);
      return;
    }

    // 3. Simple placement or joining existing chain
    const newBoard = [...state.board.map(r => [...r])];
    let chainToJoin: HotelChain | 'tile' = 'tile';
    if (neighborChains.length === 1) {
      chainToJoin = neighborChains[0];
    }
    
    newBoard[tile.row][tile.col] = chainToJoin;
    
    // If joining a chain, also convert any adjacent 'tile' to that chain
    if (chainToJoin !== 'tile') {
      const queue = [tile];
      while(queue.length > 0) {
        const current = queue.shift()!;
        getNeighbors(current.row, current.col).forEach(n => {
          if (newBoard[n.row][n.col] === 'tile') {
            newBoard[n.row][n.col] = chainToJoin;
            queue.push({ row: n.row, col: n.col, id: '' });
          }
        });
      }
    }

    const nextState = {
      ...state,
      board: newBoard,
      phase: 'buy-stocks' as const,
      selectedTile: tile
    };
    updateStockPrices(nextState);
    
    // Remove tile from player hand
    const currentPlayer = nextState.players[state.currentPlayerIndex];
    currentPlayer.tiles = currentPlayer.tiles.filter(t => t.id !== tile.id);
    
    setState(nextState);
    addLog(`${state.players[state.currentPlayerIndex].name} 放置了 ${tile.id}`);
  };

  const findConnectedUnassigned = (startTile: Tile, board: GameState['board']) => {
    const connected: Tile[] = [startTile];
    const visited = new Set([`${startTile.row},${startTile.col}`]);
    const queue = [startTile];
    
    while(queue.length > 0) {
      const curr = queue.shift()!;
      getNeighbors(curr.row, curr.col).forEach(n => {
        if (board[n.row][n.col] === 'tile' && !visited.has(`${n.row},${n.col}`)) {
          const tileObj = { row: n.row, col: n.col, id: `${String.fromCharCode(65 + n.row)}${n.col + 1}` };
          connected.push(tileObj);
          visited.add(`${n.row},${n.col}`);
          queue.push(tileObj);
        }
      });
    }
    return connected;
  };

  const handleChainFormationStart = (tiles: Tile[]) => {
    setState(prev => ({
      ...prev,
      phase: 'found-chain',
      pendingChainFormation: {
        tiles,
        availableChains: prev.availableChains
      }
    }));
  };

  const foundChain = (chain: HotelChain) => {
    if (!state.pendingChainFormation) return;
    
    const { tiles } = state.pendingChainFormation;
    const newBoard = [...state.board.map(r => [...r])];
    tiles.forEach(t => {
      newBoard[t.row][t.col] = chain;
    });
    
    const newAvailable = state.availableChains.filter(c => c !== chain);
    const newActive = [...state.activeChains, chain];
    
    const newPlayers = [...state.players];
    const currentPlayer = newPlayers[state.currentPlayerIndex];
    
    // Free stock
    let bonusLog = '';
    if (state.stockMarket[chain].available > 0) {
      currentPlayer.stocks[chain]++;
      state.stockMarket[chain].available--;
      bonusLog = `并获得 1 股免费股票。`;
    }

    // Remove played tile from hand
    const playedTile = state.pendingChainFormation.tiles[0]; // The one just played
    currentPlayer.tiles = currentPlayer.tiles.filter(t => t.id !== playedTile.id);

    const nextState = {
      ...state,
      board: newBoard,
      availableChains: newAvailable,
      activeChains: newActive,
      players: newPlayers,
      phase: 'buy-stocks' as const,
      pendingChainFormation: null
    };
    updateStockPrices(nextState);
    setState(nextState);
    addLog(`${currentPlayer.name} 成立了 ${chain} 连锁酒店${bonusLog}`);
  };

  const handleMergerStart = (tile: Tile, neighborChains: HotelChain[]) => {
    // Determine largest chain
    const chainSizes = neighborChains.map(c => ({
      chain: c,
      size: state.stockMarket[c].size
    })).sort((a, b) => b.size - a.size);
    
    const maxSize = chainSizes[0].size;
    const potentialSurvivors = chainSizes.filter(c => c.size === maxSize).map(c => c.chain);
    
    // If tie, player chooses survivor. For now, just pick first one or let player choose if human.
    // To keep it simple, if human, we might need a phase for choosing survivor.
    // But usually, the player who placed the tile chooses.
    
    const survivor = potentialSurvivors[0]; // Simplified: pick first
    const defunct = neighborChains.filter(c => c !== survivor);
    
    setState(prev => ({
      ...prev,
      phase: 'merger-bonus',
      pendingMerger: {
        survivor,
        defunct,
        mergerTile: tile,
        mergerPlayerIndex: prev.currentPlayerIndex,
        defunctIndex: 0,
        playerOptionIndex: prev.currentPlayerIndex
      }
    }));
    
    addLog(`${survivor} 正在并购 ${defunct.join(', ')}`);
    // Next step: Pay bonuses for the first defunct chain
    payMergerBonuses(defunct[0], survivor);
  };

  const payMergerBonuses = (defunct: HotelChain, survivor: HotelChain) => {
    // Calculate bonuses
    const stockPrice = state.stockMarket[defunct].price;
    const holders = state.players.map(p => ({
      id: p.id,
      count: p.stocks[defunct]
    })).filter(h => h.count > 0).sort((a, b) => b.count - a.count);

    if (holders.length === 0) {
        // No bonuses
    } else if (holders.length === 1) {
        const bonus = stockPrice * 15; // 10x + 5x
        const newPlayers = [...state.players];
        const pIndex = newPlayers.findIndex(p => p.id === holders[0].id);
        newPlayers[pIndex].money += bonus;
        addLog(`${newPlayers[pIndex].name} 获得独家大股东红利 ${bonus}`);
    } else {
        const maxCount = holders[0].count;
        const majorHolders = holders.filter(h => h.count === maxCount);
        
        if (majorHolders.length > 1) {
            // Split 15x
            const totalBonus = stockPrice * 15;
            const splitBonus = Math.round((totalBonus / majorHolders.length) / 100) * 100;
            const newPlayers = [...state.players];
            majorHolders.forEach(h => {
                const pIndex = newPlayers.findIndex(p => p.id === h.id);
                newPlayers[pIndex].money += splitBonus;
                addLog(`${newPlayers[pIndex].name} 平分红利 ${splitBonus}`);
            });
        } else {
            // One major holder
            const majorBonus = stockPrice * 10;
            const newPlayers = [...state.players];
            const majorIndex = newPlayers.findIndex(p => p.id === holders[0].id);
            newPlayers[majorIndex].money += majorBonus;
            addLog(`${newPlayers[majorIndex].name} 获得大股东红利 ${majorBonus}`);
            
            const remainingHolders = holders.slice(1);
            const nextMaxCount = remainingHolders[0].count;
            const minorHolders = remainingHolders.filter(h => h.count === nextMaxCount);
            
            const minorBonus = stockPrice * 5;
            const splitMinorBonus = Math.round((minorBonus / minorHolders.length) / 100) * 100;
            minorHolders.forEach(h => {
                const pIndex = newPlayers.findIndex(p => p.id === h.id);
                newPlayers[pIndex].money += splitMinorBonus;
                addLog(`${newPlayers[pIndex].name} 获得小股东红利 ${splitMinorBonus}`);
            });
        }
    }
    
    setState(prev => ({
        ...prev,
        phase: 'merger-options'
    }));
  };

  const mergerOption = (action: 'sell' | 'trade' | 'hold', amount: number) => {
    if (!state.pendingMerger) return;
    const { defunct, defunctIndex, survivor, playerOptionIndex } = state.pendingMerger;
    const currentDefunct = defunct[defunctIndex];
    const newPlayers = [...state.players];
    const player = newPlayers[playerOptionIndex];
    
    if (action === 'sell') {
        const price = state.stockMarket[currentDefunct].price;
        player.money += amount * price;
        player.stocks[currentDefunct] -= amount;
        state.stockMarket[currentDefunct].available += amount;
        addLog(`${player.name} 以 ${amount * price} 出售了 ${amount} 股 ${currentDefunct}`);
    } else if (action === 'trade') {
        const tradeAmount = Math.floor(amount / 2);
        player.stocks[currentDefunct] -= tradeAmount * 2;
        player.stocks[survivor] += tradeAmount;
        state.stockMarket[currentDefunct].available += tradeAmount * 2;
        state.stockMarket[survivor].available -= tradeAmount;
        addLog(`${player.name} 将 ${tradeAmount * 2} 股 ${currentDefunct} 换成了 ${tradeAmount} 股 ${survivor}`);
    }
    
    // Move to next player or next defunct chain
    let nextPlayerIndex = (playerOptionIndex + 1) % 4;
    if (nextPlayerIndex === state.pendingMerger.mergerPlayerIndex) {
        // All players done for this defunct chain
        if (defunctIndex + 1 < defunct.length) {
            // Process next defunct chain
            setState(prev => ({
                ...prev,
                pendingMerger: {
                    ...prev.pendingMerger!,
                    defunctIndex: defunctIndex + 1,
                    playerOptionIndex: prev.pendingMerger!.mergerPlayerIndex
                },
                phase: 'merger-bonus'
            }));
            payMergerBonuses(defunct[defunctIndex + 1], survivor);
        } else {
            // Merger complete
            completeMerger();
        }
    } else {
        setState(prev => ({
            ...prev,
            pendingMerger: {
                ...prev.pendingMerger!,
                playerOptionIndex: nextPlayerIndex
            }
        }));
    }
  };

  const completeMerger = () => {
    if (!state.pendingMerger) return;
    const { survivor, defunct, mergerTile } = state.pendingMerger;
    
    const newBoard = [...state.board.map(r => [...r])];
    newBoard[mergerTile.row][mergerTile.col] = survivor;
    
    // Convert all defunct tiles to survivor
    for (let r = 0; r < BOARD_ROWS; r++) {
        for (let c = 0; c < BOARD_COLS; c++) {
            if (defunct.includes(newBoard[r][c] as any)) {
                newBoard[r][c] = survivor;
            }
        }
    }
    
    // Also check for any 'tile' neighbors that should now be part of the survivor
    const queue = [mergerTile];
    const visited = new Set([`${mergerTile.row},${mergerTile.col}`]);
    while(queue.length > 0) {
        const curr = queue.shift()!;
        getNeighbors(curr.row, curr.col).forEach(n => {
            if (!visited.has(`${n.row},${n.col}`) && (newBoard[n.row][n.col] === 'tile' || defunct.includes(newBoard[n.row][n.col] as any))) {
                newBoard[n.row][n.col] = survivor;
                visited.add(`${n.row},${n.col}`);
                queue.push({ row: n.row, col: n.col, id: '' });
            }
        });
    }

    const newActive = state.activeChains.filter(c => !defunct.includes(c));
    const newAvailable = [...state.availableChains, ...defunct];
    
    const nextState = {
        ...state,
        board: newBoard,
        activeChains: newActive,
        availableChains: newAvailable,
        phase: 'buy-stocks' as const,
        pendingMerger: null
    };
    updateStockPrices(nextState);
    
    // Remove tile from hand
    const currentPlayer = nextState.players[state.currentPlayerIndex];
    currentPlayer.tiles = currentPlayer.tiles.filter(t => t.id !== mergerTile.id);
    
    setState(nextState);
    addLog(`并购完成。${survivor} 壮大了。`);
  };

  const buyStocks = (purchases: Partial<Record<HotelChain, number>>) => {
    const newPlayers = [...state.players];
    const player = newPlayers[state.currentPlayerIndex];
    let totalCost = 0;
    let totalCount = 0;
    
    for (const [chain, count] of Object.entries(purchases)) {
        if (!count) continue;
        const price = state.stockMarket[chain as HotelChain].price;
        totalCost += price * count;
        totalCount += count;
        player.stocks[chain as HotelChain] += count;
        state.stockMarket[chain as HotelChain].available -= count;
    }
    
    player.money -= totalCost;
    addLog(`${player.name} 购买了 ${totalCount} 股股票，花费 ${totalCost}`);
    
    endTurn();
  };

  const checkGameEnd = (newState: GameState) => {
    const activeChains = newState.activeChains;
    if (activeChains.length === 0) return false;

    const allSafe = activeChains.every(c => newState.stockMarket[c].isSafe);
    const anyHuge = activeChains.some(c => newState.stockMarket[c].size >= MAX_CHAIN_SIZE);

    return allSafe || anyHuge;
  };

  const endGame = () => {
    const newPlayers = [...state.players];
    
    // 1. Pay bonuses for all active chains
    state.activeChains.forEach(chain => {
        const stockPrice = state.stockMarket[chain].price;
        const holders = newPlayers.map(p => ({
            id: p.id,
            count: p.stocks[chain]
        })).filter(h => h.count > 0).sort((a, b) => b.count - a.count);

        if (holders.length === 1) {
            const bonus = stockPrice * 15;
            const pIndex = newPlayers.findIndex(p => p.id === holders[0].id);
            newPlayers[pIndex].money += bonus;
        } else if (holders.length > 1) {
            const maxCount = holders[0].count;
            const majorHolders = holders.filter(h => h.count === maxCount);
            if (majorHolders.length > 1) {
                const splitBonus = Math.round((stockPrice * 15 / majorHolders.length) / 100) * 100;
                majorHolders.forEach(h => {
                    const pIndex = newPlayers.findIndex(p => p.id === h.id);
                    newPlayers[pIndex].money += splitBonus;
                });
            } else {
                newPlayers[newPlayers.findIndex(p => p.id === holders[0].id)].money += stockPrice * 10;
                const nextMaxCount = holders[1].count;
                const minorHolders = holders.slice(1).filter(h => h.count === nextMaxCount);
                const splitMinorBonus = Math.round((stockPrice * 5 / minorHolders.length) / 100) * 100;
                minorHolders.forEach(h => {
                    const pIndex = newPlayers.findIndex(p => p.id === h.id);
                    newPlayers[pIndex].money += splitMinorBonus;
                });
            }
        }
    });

    // 2. Sell all stocks at current market price
    newPlayers.forEach(player => {
        (Object.entries(player.stocks) as [HotelChain, number][]).forEach(([chain, count]) => {
            if (count > 0) {
                player.money += count * state.stockMarket[chain].price;
                player.stocks[chain] = 0;
            }
        });
    });

    setState(prev => ({
        ...prev,
        players: newPlayers,
        phase: 'game-over',
        gameLog: ['游戏结束！正在结算资产...', ...prev.gameLog]
    }));
  };

  const endTurn = () => {
    // Draw new tile
    const newPlayers = [...state.players];
    const player = newPlayers[state.currentPlayerIndex];
    if (state.tilesPool.length > 0) {
        player.tiles.push(state.tilesPool.pop()!);
    }
    
    // Check for illegal tiles in hand and replace them
    const legalTiles = player.tiles.filter(t => checkTileLegality(t, state.board, state.stockMarket, state.availableChains));
    if (legalTiles.length === 0 && player.tiles.length === INITIAL_TILES_COUNT) {
        addLog(`${player.name} 的所有板块都不合法，正在更换...`);
        player.tiles = state.tilesPool.splice(0, INITIAL_TILES_COUNT);
    }

    const nextIndex = (state.currentPlayerIndex + 1) % 4;
    setState(prev => ({
        ...prev,
        currentPlayerIndex: nextIndex,
        phase: 'play-tile'
    }));
  };

  // AI Logic
  useEffect(() => {
    const currentPlayer = state.players[state.currentPlayerIndex];
    if (currentPlayer.isAI && state.phase === 'play-tile') {
        const timer = setTimeout(() => {
            const legalTiles = currentPlayer.tiles.filter(t => checkTileLegality(t, state.board, state.stockMarket, state.availableChains));
            if (legalTiles.length > 0) {
                // AI Strategy: 
                // 1. Prefer mergers where AI is majority holder
                // 2. Prefer forming new chains
                // 3. Prefer joining chains
                // 4. Random
                playTile(legalTiles[Math.floor(Math.random() * legalTiles.length)]);
            } else {
                endTurn();
            }
        }, 1500);
        return () => clearTimeout(timer);
    }
    
    if (currentPlayer.isAI && state.phase === 'found-chain') {
        const timer = setTimeout(() => {
            // AI Strategy: pick most expensive available chain if affordable later
            foundChain(state.availableChains[0]);
        }, 1000);
        return () => clearTimeout(timer);
    }

    if (currentPlayer.isAI && state.phase === 'buy-stocks') {
        const timer = setTimeout(() => {
            const affordable = state.activeChains
                .filter(c => state.stockMarket[c].price <= currentPlayer.money && state.stockMarket[c].available > 0)
                .sort((a, b) => state.stockMarket[b].price - state.stockMarket[a].price);
            
            if (affordable.length > 0) {
                buyStocks({ [affordable[0]]: Math.min(3, state.stockMarket[affordable[0]].available) });
            } else {
                buyStocks({});
            }
        }, 1000);
        return () => clearTimeout(timer);
    }
    
    if (currentPlayer.isAI && state.phase === 'merger-options') {
        const timer = setTimeout(() => {
            mergerOption('hold', 0);
        }, 500);
        return () => clearTimeout(timer);
    }
  }, [state.currentPlayerIndex, state.phase]);

  const declareGameEnd = () => {
    if (checkGameEnd(state)) {
        endGame();
    } else {
        addLog("目前还不能结束游戏。");
    }
  };

  return {
    state,
    playTile,
    foundChain,
    buyStocks,
    mergerOption,
    endTurn,
    declareGameEnd
  };
}
