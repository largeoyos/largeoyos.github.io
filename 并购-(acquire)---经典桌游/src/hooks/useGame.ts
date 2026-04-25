import { useState, useCallback, useEffect } from 'react';
import { HotelChain, Tile, Player, GameState, HOTEL_CHAINS } from '../types';
import { 
  BOARD_ROWS, BOARD_COLS, INITIAL_MONEY, INITIAL_TILES_COUNT, 
  SAFE_SIZE, MAX_CHAIN_SIZE, TOTAL_STOCKS_PER_CHAIN,
  CHAIN_CATEGORIES, getStockPrice
} from '../constants';

import { formatMoney } from '../lib/utils';

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

  const getTileStatus = (tile: Tile, board: GameState['board'], stockMarket: GameState['stockMarket'], availableChains: HotelChain[]) => {
    const neighbors = getNeighbors(tile.row, tile.col);
    const neighborTypes = neighbors.map(n => board[n.row][n.col]).filter(t => t !== null);
    const neighborChains = Array.from(new Set(neighborTypes.filter(t => t !== 'tile'))) as HotelChain[];
    const hasUnassignedNeighbor = neighborTypes.includes('tile');

    // 1. Permanently Unplayable: Merging two or more safe chains
    const safeChains = neighborChains.filter(c => stockMarket[c].isSafe);
    if (safeChains.length > 1) return 'permanently-unplayable';

    // 2. Temporarily Unplayable: Forming an 8th chain when 7 already exist
    if (neighborChains.length === 0 && hasUnassignedNeighbor && availableChains.length === 0) {
      return 'temporarily-unplayable';
    }

    return 'legal';
  };

  const checkTileLegality = (tile: Tile, board: GameState['board'], stockMarket: GameState['stockMarket'], availableChains: HotelChain[]) => {
    return getTileStatus(tile, board, stockMarket, availableChains) === 'legal';
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

  const calculateBonuses = (defunct: HotelChain, players: Player[], stockMarket: GameState['stockMarket']) => {
    const stockPrice = stockMarket[defunct].price;
    const holders = players.map(p => ({
      id: p.id,
      count: p.stocks[defunct]
    })).filter(h => h.count > 0).sort((a, b) => b.count - a.count);

    const newPlayers = [...players.map(p => ({ ...p, stocks: { ...p.stocks } }))];
    const logs: string[] = [];

    if (holders.length === 1) {
        const bonus = stockPrice * 15;
        const pIndex = newPlayers.findIndex(p => p.id === holders[0].id);
        newPlayers[pIndex].money += bonus;
        logs.push(`${newPlayers[pIndex].name} 获得独家大股东红利 ${formatMoney(bonus)}`);
    } else if (holders.length > 1) {
        const maxCount = holders[0].count;
        const majorHolders = holders.filter(h => h.count === maxCount);
        
        if (majorHolders.length > 1) {
            const totalBonus = stockPrice * 15;
            const splitBonus = Math.round((totalBonus / majorHolders.length) / 100) * 100;
            majorHolders.forEach(h => {
                const pIndex = newPlayers.findIndex(p => p.id === h.id);
                newPlayers[pIndex].money += splitBonus;
                logs.push(`${newPlayers[pIndex].name} 平分大股东红利 ${formatMoney(splitBonus)}`);
            });
        } else {
            const majorBonus = stockPrice * 10;
            const majorIndex = newPlayers.findIndex(p => p.id === holders[0].id);
            newPlayers[majorIndex].money += majorBonus;
            logs.push(`${newPlayers[majorIndex].name} 获得大股东红利 ${formatMoney(majorBonus)}`);
            
            const remainingHolders = holders.slice(1);
            const nextMaxCount = remainingHolders[0].count;
            const minorHolders = remainingHolders.filter(h => h.count === nextMaxCount);
            
            const minorBonus = stockPrice * 5;
            const splitMinorBonus = Math.round((minorBonus / minorHolders.length) / 100) * 100;
            minorHolders.forEach(h => {
                const pIndex = newPlayers.findIndex(p => p.id === h.id);
                newPlayers[pIndex].money += splitMinorBonus;
                logs.push(`${newPlayers[pIndex].name} 获得小股东红利 ${formatMoney(splitMinorBonus)}`);
            });
        }
    }
    return { players: newPlayers, logs };
  };

  const handleMergerStart = (tile: Tile, neighborChains: HotelChain[]) => {
    const chainSizes = neighborChains.map(c => ({
      chain: c,
      size: state.stockMarket[c].size
    })).sort((a, b) => b.size - a.size);
    
    const maxSize = chainSizes[0].size;
    const potentialSurvivors = chainSizes.filter(c => c.size === maxSize).map(c => c.chain);
    
    if (potentialSurvivors.length > 1) {
      setState(prev => ({
        ...prev,
        phase: 'choose-survivor',
        pendingMerger: {
          survivor: potentialSurvivors[0],
          defunct: [],
          mergerTile: tile,
          mergerPlayerIndex: prev.currentPlayerIndex,
          defunctIndex: 0,
          playerOptionIndex: prev.currentPlayerIndex,
          potentialSurvivors,
          allNeighborChains: neighborChains
        },
        gameLog: [`${prev.players[prev.currentPlayerIndex].name} 需要选择存续的公司。`, ...prev.gameLog]
      }));
    } else {
      const survivor = potentialSurvivors[0];
      const defunct = neighborChains.filter(c => c !== survivor);
      
      setState(prev => {
        const { players: newPlayers, logs } = calculateBonuses(defunct[0], prev.players, prev.stockMarket);
        return {
          ...prev,
          players: newPlayers,
          phase: 'merger-options',
          gameLog: [...logs, `${survivor} 正在并购 ${defunct.join(', ')}`, ...prev.gameLog],
          pendingMerger: {
            survivor,
            defunct,
            mergerTile: tile,
            mergerPlayerIndex: prev.currentPlayerIndex,
            defunctIndex: 0,
            playerOptionIndex: prev.currentPlayerIndex
          }
        };
      });
    }
  };

  const selectSurvivor = (survivor: HotelChain) => {
    if (!state.pendingMerger || !state.pendingMerger.allNeighborChains) return;
    const defunct = state.pendingMerger.allNeighborChains.filter(c => c !== survivor);
    
    setState(prev => {
      const { players: newPlayers, logs } = calculateBonuses(defunct[0], prev.players, prev.stockMarket);
      return {
        ...prev,
        players: newPlayers,
        phase: 'merger-options',
        gameLog: [...logs, `${survivor} 正在并购 ${defunct.join(', ')}`, ...prev.gameLog],
        pendingMerger: {
          ...prev.pendingMerger!,
          survivor,
          defunct,
          defunctIndex: 0,
          playerOptionIndex: prev.pendingMerger!.mergerPlayerIndex
        }
      };
    });
  };

  const mergerOption = (sell: number, trade: number, hold: number) => {
    if (!state.pendingMerger) return;
    const { defunct, defunctIndex, survivor, playerOptionIndex } = state.pendingMerger;
    const currentDefunct = defunct[defunctIndex];
    
    setState(prev => {
        const newPlayers = [...prev.players.map(p => ({ ...p, stocks: { ...p.stocks } }))];
        const player = newPlayers[playerOptionIndex];
        const newStockMarket = { ...prev.stockMarket };
        newStockMarket[currentDefunct] = { ...newStockMarket[currentDefunct] };
        newStockMarket[survivor] = { ...newStockMarket[survivor] };

        // 1. Handle Sell
        if (sell > 0) {
            const price = newStockMarket[currentDefunct].price;
            player.money += sell * price;
            player.stocks[currentDefunct] -= sell;
            newStockMarket[currentDefunct].available += sell;
            addLog(`${player.name} 出售了 ${sell} 股 ${currentDefunct}，获利 ${formatMoney(sell * price)}`);
        }
        
        // 2. Handle Trade
        if (trade > 0) {
            const tradePairs = Math.floor(trade / 2);
            const actualTrade = tradePairs * 2;
            player.stocks[currentDefunct] -= actualTrade;
            player.stocks[survivor] += tradePairs;
            newStockMarket[currentDefunct].available += actualTrade;
            newStockMarket[survivor].available -= tradePairs;
            addLog(`${player.name} 以 2:1 比例将 ${actualTrade} 股 ${currentDefunct} 兑换为 ${tradePairs} 股 ${survivor}`);
        }
        
        // 3. Handle Hold
        const remaining = player.stocks[currentDefunct];
        if (remaining > 0 && hold > 0) {
            addLog(`${player.name} 保留了 ${remaining} 股 ${currentDefunct}`);
        }

        // Move to next player or next defunct chain
        let nextPlayerIndex = (playerOptionIndex + 1) % 4;
        if (nextPlayerIndex === prev.pendingMerger!.mergerPlayerIndex) {
            if (defunctIndex + 1 < defunct.length) {
                const nextDefunct = defunct[defunctIndex + 1];
                const { players: bonusPlayers, logs } = calculateBonuses(nextDefunct, newPlayers, newStockMarket);
                return {
                    ...prev,
                    players: bonusPlayers,
                    stockMarket: newStockMarket,
                    gameLog: [...logs, ...prev.gameLog],
                    pendingMerger: {
                        ...prev.pendingMerger!,
                        defunctIndex: defunctIndex + 1,
                        playerOptionIndex: prev.pendingMerger!.mergerPlayerIndex
                    },
                    phase: 'merger-options'
                };
            } else {
                // Merger complete
                return getCompleteMergerState(prev, newPlayers, newStockMarket);
            }
        } else {
            return {
                ...prev,
                players: newPlayers,
                stockMarket: newStockMarket,
                pendingMerger: {
                    ...prev.pendingMerger!,
                    playerOptionIndex: nextPlayerIndex
                }
            };
        }
    });
  };

  const getCompleteMergerState = (prev: GameState, players: Player[], stockMarket: GameState['stockMarket']): GameState => {
    if (!prev.pendingMerger) return prev;
    const { survivor, defunct, mergerTile } = prev.pendingMerger;
    
    const newBoard = [...prev.board.map(r => [...r])];
    newBoard[mergerTile.row][mergerTile.col] = survivor;
    
    for (let r = 0; r < BOARD_ROWS; r++) {
        for (let c = 0; c < BOARD_COLS; c++) {
            if (defunct.includes(newBoard[r][c] as any)) {
                newBoard[r][c] = survivor;
            }
        }
    }
    
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
    
    const newActive = prev.activeChains.filter(c => !defunct.includes(c));
    const newAvailable = [...prev.availableChains, ...defunct];
    
    const nextState = {
        ...prev,
        board: newBoard,
        activeChains: newActive,
        availableChains: newAvailable,
        players,
        stockMarket,
        phase: 'buy-stocks' as const,
        pendingMerger: null
    };
    
    // Update stock prices for the new board
    const updatedStockMarket = { ...nextState.stockMarket };
    HOTEL_CHAINS.forEach(chain => {
        let size = 0;
        for (let r = 0; r < BOARD_ROWS; r++) {
            for (let c = 0; c < BOARD_COLS; c++) {
                if (newBoard[r][c] === chain) size++;
            }
        }
        const category = CHAIN_CATEGORIES[chain];
        updatedStockMarket[chain] = {
            ...updatedStockMarket[chain],
            size,
            price: getStockPrice(category, size),
            isSafe: size >= SAFE_SIZE
        };
    });
    nextState.stockMarket = updatedStockMarket;
    
    // Remove tile from hand
    const newPlayers = [...nextState.players.map(p => ({ ...p, tiles: [...p.tiles] }))];
    const currentPlayer = newPlayers[prev.currentPlayerIndex];
    currentPlayer.tiles = currentPlayer.tiles.filter(t => t.id !== mergerTile.id);
    nextState.players = newPlayers;

    nextState.gameLog = [`并购完成。${survivor} 壮大了。`, ...nextState.gameLog];
    return nextState;
  };

  const buyStocks = (purchases: Partial<Record<HotelChain, number>>) => {
    setState(prev => {
        const newPlayers = [...prev.players.map(p => ({ ...p, stocks: { ...p.stocks } }))];
        const player = newPlayers[prev.currentPlayerIndex];
        const newStockMarket = { ...prev.stockMarket };
        
        let totalCost = 0;
        let totalCount = 0;
        
        for (const [chain, count] of Object.entries(purchases)) {
            if (!count) continue;
            const c = chain as HotelChain;
            newStockMarket[c] = { ...newStockMarket[c] };
            const price = newStockMarket[c].price;
            totalCost += price * count;
            totalCount += count;
            player.stocks[c] += count;
            newStockMarket[c].available -= count;
        }
        
        if (player.money < totalCost) {
            addLog(`${player.name} 资金不足，无法购买这些股票。`);
            return prev;
        }
        
        player.money -= totalCost;
        addLog(`${player.name} 购买了 ${totalCount} 股股票，花费 ${formatMoney(totalCost)}`);
        
        // Return updated state
        return {
            ...prev,
            players: newPlayers,
            stockMarket: newStockMarket
        };
    });
    
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
    setState(prev => {
        const newPlayers = [...prev.players.map(p => ({ ...p, tiles: [...p.tiles], stocks: { ...p.stocks } }))];
        const player = newPlayers[prev.currentPlayerIndex];
        const newTilesPool = [...prev.tilesPool];

        // 1. Replace permanently unplayable tiles
        const tilesToReplace = player.tiles.filter(t => 
            getTileStatus(t, prev.board, prev.stockMarket, prev.availableChains) === 'permanently-unplayable'
        );

        if (tilesToReplace.length > 0) {
            addLog(`${player.name} 弃置了 ${tilesToReplace.length} 个永久不可用的板块。`);
            player.tiles = player.tiles.filter(t => !tilesToReplace.includes(t));
            while (player.tiles.length < INITIAL_TILES_COUNT && newTilesPool.length > 0) {
                player.tiles.push(newTilesPool.pop()!);
            }
        }

        // 2. Draw new tile if needed (normal end of turn draw)
        if (player.tiles.length < INITIAL_TILES_COUNT && newTilesPool.length > 0) {
            player.tiles.push(newTilesPool.pop()!);
        }

        const nextIndex = (prev.currentPlayerIndex + 1) % 4;
        return {
            ...prev,
            players: newPlayers,
            tilesPool: newTilesPool,
            currentPlayerIndex: nextIndex,
            phase: 'play-tile'
        };
    });
  };

  const skipPlayTile = () => {
    const currentPlayer = state.players[state.currentPlayerIndex];
    const statuses = currentPlayer.tiles.map(t => getTileStatus(t, state.board, state.stockMarket, state.availableChains));
    const allUnplayable = statuses.every(s => s !== 'legal');

    if (allUnplayable) {
        addLog(`${currentPlayer.name} 的所有板块目前都无法打出，跳过放置阶段。`);
        setState(prev => ({ ...prev, phase: 'buy-stocks' }));
    } else {
        addLog("你还有可以打出的板块，不能跳过放置阶段。");
    }
  };

  // AI Logic
  useEffect(() => {
    const currentPlayer = state.players[state.currentPlayerIndex];
    const activeMergerPlayer = (state.phase === 'merger-options' && state.pendingMerger) 
        ? state.players[state.pendingMerger.playerOptionIndex] 
        : null;

    if (currentPlayer.isAI && state.phase === 'play-tile') {
        const timer = setTimeout(() => {
            // AI Strategy: Check if game can end and if it's beneficial
            const activeChains = state.activeChains;
            const allSafe = activeChains.length > 0 && activeChains.every(c => state.stockMarket[c].isSafe);
            const anyHuge = activeChains.some(c => state.stockMarket[c].size >= MAX_CHAIN_SIZE);

            if (allSafe || anyHuge) {
                // Calculate simple assets to see if winning
                const assets = state.players.map(p => {
                    let val = p.money;
                    (Object.entries(p.stocks) as [HotelChain, number][]).forEach(([c, count]) => {
                        val += count * state.stockMarket[c].price;
                    });
                    return { id: p.id, val };
                });
                const sortedAssets = [...assets].sort((a, b) => b.val - a.val);
                const isWinning = sortedAssets[0].id === currentPlayer.id;

                // If winning or game is very advanced, declare end
                if (isWinning || anyHuge) {
                    declareGameEnd();
                    return;
                }
            }

            const legalTiles = currentPlayer.tiles.filter(t => checkTileLegality(t, state.board, state.stockMarket, state.availableChains));
            if (legalTiles.length > 0) {
                playTile(legalTiles[Math.floor(Math.random() * legalTiles.length)]);
            } else {
                // Check if all are unplayable to skip
                const statuses = currentPlayer.tiles.map(t => getTileStatus(t, state.board, state.stockMarket, state.availableChains));
                if (statuses.every(s => s !== 'legal')) {
                    skipPlayTile();
                } else {
                    // This shouldn't happen if logic is correct, but as fallback
                    endTurn();
                }
            }
        }, 1500);
        return () => clearTimeout(timer);
    }
    
    if (currentPlayer.isAI && state.phase === 'found-chain') {
        const timer = setTimeout(() => {
            foundChain(state.availableChains[0]);
        }, 1000);
        return () => clearTimeout(timer);
    }

    if (currentPlayer.isAI && state.phase === 'buy-stocks') {
        const timer = setTimeout(() => {
            const affordable = state.activeChains
                .filter(c => state.stockMarket[c].price <= currentPlayer.money && state.stockMarket[c].available > 0);
            
            if (affordable.length > 0) {
                // AI Strategy: Score chains based on growth potential and price
                const scoredChains = affordable.map(chain => {
                    const market = state.stockMarket[chain];
                    let score = 0;
                    
                    // 1. Growth potential: smaller chains have more upside until they become safe (size 11)
                    if (market.size < 11) {
                        score += (11 - market.size) * 20;
                    } else {
                        score += 10; // Stable but low growth
                    }
                    
                    // 2. Price efficiency: lower price is better for accumulation
                    score += (1200 - market.price) / 10;
                    
                    // 3. Strategic reinforcement: protect majority or catch up
                    score += (currentPlayer.stocks[chain] || 0) * 5;
                    
                    // 4. Category bonus: low category chains are easier to grow
                    if (CHAIN_CATEGORIES[chain] === 'low') score += 30;
                    if (CHAIN_CATEGORIES[chain] === 'mid') score += 15;

                    return { chain, score };
                }).sort((a, b) => b.score - a.score);

                const bestChain = scoredChains[0].chain;
                const price = state.stockMarket[bestChain].price;
                const maxAffordable = Math.floor(currentPlayer.money / price);
                const count = Math.min(3, state.stockMarket[bestChain].available, maxAffordable);
                
                if (count > 0) {
                    buyStocks({ [bestChain]: count });
                } else {
                    buyStocks({});
                }
            } else {
                buyStocks({});
            }
        }, 1000);
        return () => clearTimeout(timer);
    }
    
    if (activeMergerPlayer && activeMergerPlayer.isAI && state.phase === 'merger-options') {
        const timer = setTimeout(() => {
            const { defunct, defunctIndex, survivor } = state.pendingMerger!;
            const currentDefunct = defunct[defunctIndex];
            const stockCount = activeMergerPlayer.stocks[currentDefunct];
            
            if (stockCount === 0) {
                mergerOption(0, 0, 0);
                return;
            }

            let sell = 0;
            let trade = 0;
            let hold = 0;

            if (activeMergerPlayer.money < 1500) {
                sell = stockCount;
            } else if (state.stockMarket[survivor].isSafe || state.stockMarket[survivor].size > 15) {
                const maxTradePossible = Math.min(
                    Math.floor(stockCount / 2),
                    state.stockMarket[survivor].available
                ) * 2;
                trade = maxTradePossible;
                hold = stockCount - trade;
            } else {
                sell = Math.floor(stockCount / 2);
                hold = stockCount - sell;
            }
            
            mergerOption(sell, trade, hold);
        }, 800);
        return () => clearTimeout(timer);
    }
    if (currentPlayer.isAI && state.phase === 'choose-survivor') {
        const timer = setTimeout(() => {
            const potentialSurvivors = state.pendingMerger?.potentialSurvivors || [];
            if (potentialSurvivors.length > 0) {
                // AI Strategy: pick the one where it has more stocks or just the first one
                selectSurvivor(potentialSurvivors[0]);
            }
        }, 1000);
        return () => clearTimeout(timer);
    }
  }, [state.currentPlayerIndex, state.phase, state.pendingMerger?.playerOptionIndex, state.pendingMerger?.defunctIndex, state.pendingMerger?.potentialSurvivors]);

  const declareGameEnd = () => {
    const activeChains = state.activeChains;
    if (activeChains.length === 0) {
        addLog("目前还不能结束游戏：地图上没有任何已成立的连锁酒店。");
        return;
    }

    const allSafe = activeChains.every(c => state.stockMarket[c].isSafe);
    const anyHuge = activeChains.some(c => state.stockMarket[c].size >= MAX_CHAIN_SIZE);

    if (allSafe || anyHuge) {
        endGame();
    } else {
        addLog("目前还不能结束游戏：需要至少一家酒店规模达到 41，或者所有已成立酒店规模都达到 11。");
    }
  };

  return {
    state,
    playTile,
    foundChain,
    buyStocks,
    mergerOption,
    endTurn,
    declareGameEnd,
    addLog,
    selectSurvivor,
    getTileStatus,
    skipPlayTile
  };
}
