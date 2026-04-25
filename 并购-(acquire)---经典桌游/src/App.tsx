import React, { useState, useEffect } from 'react';
import { useGame } from './hooks/useGame';
import { BOARD_ROWS, BOARD_COLS, CHAIN_COLORS } from './constants';
import { HotelChain, Tile } from './types';
import { cn, formatMoney } from './lib/utils';
import { 
  Building2, 
  TrendingUp, 
  User, 
  History, 
  Wallet,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
  DollarSign,
  Info,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const { 
    state, 
    playTile, 
    foundChain, 
    buyStocks, 
    mergerOption, 
    declareGameEnd, 
    addLog, 
    selectSurvivor,
    getTileStatus,
    skipPlayTile
  } = useGame();
  const [selectedStocks, setSelectedStocks] = useState<Partial<Record<HotelChain, number>>>({});
  const [showInfo, setShowInfo] = useState(false);
  const [mergerDecision, setMergerDecision] = useState({ sell: 0, trade: 0, hold: 0 });
  const [hideMergerOverlay, setHideMergerOverlay] = useState(false);

  const currentPlayer = state.players[state.currentPlayerIndex];
  const activeMergerPlayer = (state.phase === 'merger-options' && state.pendingMerger) 
    ? state.players[state.pendingMerger.playerOptionIndex] 
    : null;

  useEffect(() => {
    if (state.phase === 'merger-options' && state.pendingMerger) {
      const defunctChain = state.pendingMerger.defunct[state.pendingMerger.defunctIndex];
      const player = state.players[state.pendingMerger.playerOptionIndex];
      const stockCount = player.stocks[defunctChain];
      setMergerDecision({ sell: 0, trade: 0, hold: stockCount });
    }
  }, [state.phase, state.pendingMerger?.defunctIndex, state.pendingMerger?.playerOptionIndex]);

  const isUserTurn = activeMergerPlayer ? !activeMergerPlayer.isAI : !currentPlayer.isAI;

  const handleStockClick = (chain: HotelChain) => {
    if (state.phase !== 'buy-stocks' || !isUserTurn) return;
    
    // Bug fix: Only allow buying stocks of active companies (size > 0)
    if (state.stockMarket[chain].size === 0) return;

    if (state.stockMarket[chain].available === 0) {
      addLog(`无法购买 ${chain} 股票：库存已售罄。`);
      return;
    }

    const currentCount = selectedStocks[chain] || 0;
    const totalSelected = (Object.values(selectedStocks) as number[]).reduce((a, b) => a + b, 0);
    
    if (totalSelected < 3) {
      if (state.stockMarket[chain].available <= currentCount) {
        addLog(`无法选择更多 ${chain} 股票：库存不足。`);
        return;
      }

      const price = state.stockMarket[chain].price;
      const totalCost = (Object.entries(selectedStocks) as [HotelChain, number][]).reduce((acc, [c, count]) => acc + (state.stockMarket[c].price * count), 0);
      
      if (totalCost + price <= currentPlayer.money) {
        setSelectedStocks({ ...selectedStocks, [chain]: currentCount + 1 });
      } else {
        addLog(`资金不足，无法购买更多股票。`);
      }
    } else {
      addLog(`每回合最多只能购买 3 股股票。`);
    }
  };

  const clearStocks = () => setSelectedStocks({});

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans p-4 lg:p-8 flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">
            并购 ACQUIRE
          </h1>
          <div className="flex items-center gap-2">
            <p className="text-neutral-500 text-sm">经典商业模拟桌游</p>
            <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-[10px] text-neutral-400 font-mono border border-neutral-700">v1.2.4</span>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-neutral-900/50 p-3 rounded-2xl border border-neutral-800 backdrop-blur-sm">
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
            <div className={cn("w-2 h-2 rounded-full animate-pulse", isUserTurn ? "bg-green-500" : "bg-amber-500")} />
            <span className="text-sm font-medium text-amber-200">
              {isUserTurn ? "你的回合" : `${currentPlayer.name} 正在行动...`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-neutral-400">
            <History className="w-4 h-4" />
            <span className="text-xs font-mono uppercase tracking-widest">Phase: {state.phase}</span>
          </div>
          <button 
            onClick={() => setShowInfo(true)}
            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded-xl border border-neutral-700 transition-all"
            title="查看股价红利表"
          >
            <Info className="w-4 h-4" />
          </button>
          {isUserTurn && state.phase === 'play-tile' && (
            <button 
              onClick={declareGameEnd}
              className="px-4 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold rounded-xl border border-red-500/30 transition-all"
            >
              宣布结束
            </button>
          )}
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left Column: Board and Hand */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Board */}
          <div className="bg-neutral-900 rounded-3xl p-4 border border-neutral-800 shadow-2xl overflow-auto">
            <div className="grid grid-cols-12 gap-1 min-w-[600px]">
              {state.board.map((row, rIndex) => (
                row.map((cell, cIndex) => {
                  const id = `${String.fromCharCode(65 + rIndex)}${cIndex + 1}`;
                  const isOccupied = cell !== null;
                  const isChain = cell !== null && cell !== 'tile';
                  const color = isChain ? CHAIN_COLORS[cell as HotelChain] : '#404040';
                  
                  return (
                    <div
                      key={id}
                      className={cn(
                        "aspect-square rounded-md flex items-center justify-center text-[10px] font-mono transition-all duration-300 border",
                        isOccupied ? "border-transparent shadow-lg" : "border-neutral-800 bg-neutral-950/50 text-neutral-700",
                        !isOccupied && "hover:bg-neutral-800 hover:text-neutral-400 cursor-default"
                      )}
                      style={{ backgroundColor: isOccupied ? color : undefined }}
                    >
                      {isOccupied ? (
                        <span className="font-bold text-white drop-shadow-md">{id}</span>
                      ) : id}
                    </div>
                  );
                })
              ))}
            </div>
          </div>

          {/* Player Hand */}
          <div className="bg-neutral-900/50 rounded-3xl p-6 border border-neutral-800 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-500" />
                  你的板块架
                </h2>
                {isUserTurn && state.phase === 'play-tile' && state.players[0].tiles.every(t => getTileStatus(t, state.board, state.stockMarket, state.availableChains) !== 'legal') && (
                  <button
                    onClick={skipPlayTile}
                    className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-[10px] font-bold rounded-lg border border-amber-500/30 transition-all flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    跳过放置阶段
                  </button>
                )}
              </div>
              <span className="text-xs text-neutral-500 uppercase tracking-widest">
                {state.players[0].tiles.length} / 6 TILES
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {state.players[0].tiles.map((tile) => {
                const status = getTileStatus(tile, state.board, state.stockMarket, state.availableChains);
                const isLegal = status === 'legal';
                
                return (
                  <button
                    key={tile.id}
                    onClick={() => isLegal && playTile(tile)}
                    disabled={!isUserTurn || state.phase !== 'play-tile' || !isLegal}
                    className={cn(
                      "w-16 h-20 rounded-xl flex flex-col items-center justify-center gap-1 transition-all group relative overflow-hidden border-2",
                      isUserTurn && state.phase === 'play-tile' && isLegal
                        ? "bg-neutral-800 border-neutral-700 hover:border-amber-500 hover:scale-105 cursor-pointer shadow-xl" 
                        : "bg-neutral-900 border-neutral-800 opacity-50 cursor-not-allowed grayscale",
                      status === 'permanently-unplayable' && "border-red-500/50",
                      status === 'temporarily-unplayable' && "border-blue-500/50"
                    )}
                  >
                    <span className={cn(
                      "text-lg font-bold font-mono",
                      isLegal ? "group-hover:text-amber-400" : "text-neutral-600"
                    )}>{tile.id}</span>
                    <div className={cn(
                      "w-8 h-1 rounded-full",
                      isLegal ? "bg-neutral-700 group-hover:bg-amber-500/50" : "bg-neutral-800"
                    )} />
                    
                    {status === 'permanently-unplayable' && (
                      <div className="absolute top-1 right-1">
                        <AlertCircle className="w-3 h-3 text-red-500" />
                      </div>
                    )}
                    {status === 'temporarily-unplayable' && (
                      <div className="absolute top-1 right-1">
                        <AlertCircle className="w-3 h-3 text-blue-500" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Stats and Market */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Market */}
          <div className="bg-neutral-900 rounded-3xl p-6 border border-neutral-800 shadow-xl">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              股票市场
            </h2>
            <div className="space-y-3">
              {(Object.entries(state.stockMarket) as [HotelChain, typeof state.stockMarket[HotelChain]][]).map(([chain, data]) => (
                <div 
                  key={chain}
                  onClick={() => handleStockClick(chain)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-2xl border transition-all",
                    data.size > 0 ? "bg-neutral-800/50 border-neutral-700" : "bg-neutral-950/30 border-neutral-900 opacity-40 grayscale",
                    state.phase === 'buy-stocks' && isUserTurn && data.size > 0 && "hover:border-amber-500 cursor-pointer"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full shadow-sm" 
                      style={{ backgroundColor: CHAIN_COLORS[chain] }} 
                    />
                    <div>
                      <div className="text-sm font-bold">{chain}</div>
                      <div className="text-[10px] text-neutral-500 uppercase">Size: {data.size} {data.isSafe && "• SAFE"}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono font-bold text-green-400">{formatMoney(data.price)}</div>
                    <div className="text-[10px] text-neutral-500">Left: {data.available}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Players */}
          <div className="bg-neutral-900 rounded-3xl p-6 border border-neutral-800 shadow-xl">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              玩家状态
            </h2>
            <div className="space-y-4">
              {state.players.map((player, idx) => (
                <div 
                  key={player.id}
                  className={cn(
                    "p-4 rounded-2xl border transition-all",
                    state.currentPlayerIndex === idx ? "bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/20" : "bg-neutral-950/50 border-neutral-800"
                  )}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm flex items-center gap-2">
                      {player.name}
                      {player.isAI && <span className="text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400">AI</span>}
                    </span>
                    <span className="text-sm font-mono font-bold text-amber-400">{formatMoney(player.money)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(Object.entries(player.stocks) as [HotelChain, number][]).map(([chain, count]) => count > 0 && (
                      <div key={chain} className="px-2 py-0.5 rounded-full bg-neutral-800 text-[10px] flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CHAIN_COLORS[chain] }} />
                        {count}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Log */}
          <div className="bg-neutral-900 rounded-3xl p-6 border border-neutral-800 shadow-xl flex-1 max-h-[300px] flex flex-col">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-purple-500" />
              游戏日志
            </h2>
            <div className="overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {state.gameLog.map((log, i) => (
                <div key={i} className="text-xs text-neutral-400 leading-relaxed border-l border-neutral-800 pl-3 py-1">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Action Overlays */}
      <AnimatePresence>
        {state.phase === 'found-chain' && isUserTurn && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-neutral-900 border border-neutral-800 p-8 rounded-[2.5rem] max-w-2xl w-full shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-2 text-center">成立新连锁酒店</h2>
              <p className="text-neutral-500 text-center mb-8">选择一个可用的公司来成立新的连锁店。</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {state.availableChains.map(chain => (
                  <button
                    key={chain}
                    onClick={() => foundChain(chain)}
                    className="flex flex-col items-center gap-3 p-6 rounded-3xl border-2 border-neutral-800 hover:border-amber-500 hover:bg-neutral-800 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-2xl shadow-lg group-hover:scale-110 transition-transform" style={{ backgroundColor: CHAIN_COLORS[chain] }} />
                    <span className="font-bold text-sm">{chain}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {state.phase === 'buy-stocks' && isUserTurn && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-40"
          >
            <div className="bg-neutral-900/90 backdrop-blur-xl border border-neutral-700 p-6 rounded-[2rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest">购买股票 (最多3股)</h3>
                <div className="flex gap-2">
                  {(Object.entries(selectedStocks) as [HotelChain, number][]).map(([chain, count]) => count > 0 && (
                    <div key={chain} className="flex items-center gap-2 bg-neutral-800 px-3 py-1.5 rounded-xl border border-neutral-700">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHAIN_COLORS[chain] }} />
                      <span className="text-xs font-bold">{chain} x{count}</span>
                    </div>
                  ))}
                  {(Object.values(selectedStocks) as number[]).reduce((a, b) => a + b, 0) === 0 && (
                    <span className="text-xs text-neutral-600 italic">点击右侧市场列表选择股票</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={clearStocks}
                  className="p-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 transition-colors"
                >
                  重置
                </button>
                <button 
                  onClick={() => {
                    buyStocks(selectedStocks);
                    setSelectedStocks({});
                  }}
                  className="px-8 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
                >
                  确认购买
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {state.phase === 'choose-survivor' && isUserTurn && state.pendingMerger && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-neutral-900 border border-neutral-800 p-8 rounded-[2.5rem] max-w-2xl w-full shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-2 text-center">选择存续的公司</h2>
              <p className="text-neutral-500 text-center mb-8">多家公司规模相同，请选择哪家公司在并购后存续。</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {state.pendingMerger.potentialSurvivors?.map(chain => (
                  <button
                    key={chain}
                    onClick={() => selectSurvivor(chain)}
                    className="flex flex-col items-center gap-3 p-6 rounded-3xl border-2 border-neutral-800 hover:border-amber-500 hover:bg-neutral-800 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-2xl shadow-lg group-hover:scale-110 transition-transform" style={{ backgroundColor: CHAIN_COLORS[chain] }} />
                    <span className="font-bold text-sm">{chain}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {state.phase === 'merger-options' && isUserTurn && state.pendingMerger && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: hideMergerOverlay ? 0 : 1 }} exit={{ opacity: 0 }}
            className={cn(
              "fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6 transition-all duration-500",
              hideMergerOverlay && "pointer-events-none opacity-0"
            )}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-neutral-900 border border-neutral-800 p-8 rounded-[2.5rem] max-w-xl w-full shadow-2xl pointer-events-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                    <ArrowRightLeft className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">并购决策：{state.pendingMerger.defunct[state.pendingMerger.defunctIndex]}</h2>
                    <p className="text-neutral-500 text-sm">
                      {state.players[state.pendingMerger.playerOptionIndex].name} 拥有 {state.players[state.pendingMerger.playerOptionIndex].stocks[state.pendingMerger.defunct[state.pendingMerger.defunctIndex]]} 股
                    </p>
                  </div>
                </div>
                <button 
                  onMouseDown={() => setHideMergerOverlay(true)}
                  onMouseUp={() => setHideMergerOverlay(false)}
                  onMouseLeave={() => setHideMergerOverlay(false)}
                  className="p-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 transition-colors flex items-center gap-2 text-xs font-bold"
                  title="长按查看场上局势"
                >
                  <Info className="w-4 h-4" />
                  查看局势
                </button>
              </div>

              <div className="space-y-4 mb-8">
                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold">卖出 (Sell)</div>
                    <div className="text-xs text-neutral-500">单价: {formatMoney(state.stockMarket[state.pendingMerger.defunct[state.pendingMerger.defunctIndex]].price)}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => {
                        const canSell = Math.max(0, mergerDecision.sell - 1);
                        setMergerDecision({ ...mergerDecision, sell: canSell, hold: mergerDecision.hold + (mergerDecision.sell - canSell) });
                      }}
                      className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center hover:bg-neutral-700"
                    >-</button>
                    <span className="w-8 text-center font-mono">{mergerDecision.sell}</span>
                    <button 
                      onClick={() => {
                        const canSell = Math.min(mergerDecision.sell + mergerDecision.hold, mergerDecision.sell + 1);
                        setMergerDecision({ ...mergerDecision, sell: canSell, hold: mergerDecision.hold - (canSell - mergerDecision.sell) });
                      }}
                      className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center hover:bg-neutral-700"
                    >+</button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold">换股 (Trade 2:1)</div>
                    <div className="text-xs text-neutral-500">目标: {state.pendingMerger.survivor} (剩余 {state.stockMarket[state.pendingMerger.survivor].available} 股)</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => {
                        const canTrade = Math.max(0, mergerDecision.trade - 2);
                        setMergerDecision({ ...mergerDecision, trade: canTrade, hold: mergerDecision.hold + (mergerDecision.trade - canTrade) });
                      }}
                      className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center hover:bg-neutral-700"
                    >-</button>
                    <span className="w-8 text-center font-mono">{mergerDecision.trade}</span>
                    <button 
                      onClick={() => {
                        const maxTradePossible = Math.min(
                          mergerDecision.trade + mergerDecision.hold,
                          state.stockMarket[state.pendingMerger!.survivor].available * 2
                        );
                        const toTrade = Math.min(maxTradePossible, mergerDecision.trade + 2);
                        setMergerDecision({ ...mergerDecision, trade: toTrade, hold: mergerDecision.hold - (toTrade - mergerDecision.trade) });
                      }}
                      className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center hover:bg-neutral-700"
                    >+</button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                  <div className="font-bold text-amber-500">保留 (Hold)</div>
                  <span className="w-8 text-center font-mono text-amber-500">{mergerDecision.hold}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    const total = mergerDecision.sell + mergerDecision.trade + mergerDecision.hold;
                    mergerOption(total, 0, 0);
                  }}
                  className="flex-1 py-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 font-bold text-sm hover:bg-red-500/20 transition-all"
                >
                  全部卖出
                </button>
                <button 
                  onClick={() => mergerOption(mergerDecision.sell, mergerDecision.trade, mergerDecision.hold)}
                  className="flex-[2] py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-lg shadow-xl shadow-amber-500/20 transition-all"
                >
                  确认决策
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {state.phase === 'game-over' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-neutral-900 border border-neutral-800 p-10 rounded-[3rem] max-w-2xl w-full shadow-2xl text-center"
            >
              <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">游戏结束</h2>
              <p className="text-neutral-500 mb-8">最终资产结算完成</p>
              
              <div className="space-y-4 mb-10">
                {state.players.slice().sort((a, b) => b.money - a.money).map((player, idx) => (
                  <div 
                    key={player.id}
                    className={cn(
                      "flex items-center justify-between p-5 rounded-3xl border",
                      idx === 0 ? "bg-amber-500/10 border-amber-500/50" : "bg-neutral-950/50 border-neutral-800"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg",
                        idx === 0 ? "bg-amber-500 text-neutral-950" : "bg-neutral-800 text-neutral-400"
                      )}>
                        {idx + 1}
                      </div>
                      <span className="font-bold text-lg">{player.name}</span>
                    </div>
                    <span className="text-xl font-mono font-bold text-amber-400">{formatMoney(player.money)}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => window.location.reload()}
                className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-lg shadow-xl shadow-amber-500/20 transition-all"
              >
                重新开始
              </button>
            </motion.div>
          </motion.div>
        )}

        {showInfo && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-neutral-900 border border-neutral-800 p-6 rounded-[2.5rem] max-w-4xl w-full shadow-2xl relative overflow-hidden"
            >
              <button 
                onClick={() => setShowInfo(false)}
                className="absolute top-6 right-6 p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Info className="w-6 h-6 text-amber-500" />
                公司股价红利表
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800">
                      <th className="py-3 px-4 font-bold text-neutral-400">公司规模</th>
                      <th className="py-3 px-4 font-bold text-neutral-400">
                        <div className="flex flex-col gap-1">
                          <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-[#FFFF00]" />
                            <div className="w-3 h-3 rounded-full bg-[#FFA500]" />
                          </div>
                          <span>低价组</span>
                        </div>
                      </th>
                      <th className="py-3 px-4 font-bold text-neutral-400">
                        <div className="flex flex-col gap-1">
                          <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-[#0000FF]" />
                            <div className="w-3 h-3 rounded-full bg-[#FF0000]" />
                            <div className="w-3 h-3 rounded-full bg-[#00FFFF]" />
                          </div>
                          <span>中价组</span>
                        </div>
                      </th>
                      <th className="py-3 px-4 font-bold text-neutral-400">
                        <div className="flex flex-col gap-1">
                          <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-[#008000]" />
                            <div className="w-3 h-3 rounded-full bg-[#800080]" />
                          </div>
                          <span>高价组</span>
                        </div>
                      </th>
                      <th className="py-3 px-4 font-bold text-green-400">股价</th>
                      <th className="py-3 px-4 font-bold text-amber-400">大股东红利</th>
                      <th className="py-3 px-4 font-bold text-amber-600">小股东红利</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {[
                      { size: "2", low: "2", mid: "-", high: "-", price: 200, major: 2000, minor: 1000 },
                      { size: "3", low: "3", mid: "2", high: "-", price: 300, major: 3000, minor: 1500 },
                      { size: "4", low: "4", mid: "3", high: "2", price: 400, major: 4000, minor: 2000 },
                      { size: "5", low: "5", mid: "4", high: "3", price: 500, major: 5000, minor: 2500 },
                      { size: "6-10", low: "6-10", mid: "5", high: "4", price: 600, major: 6000, minor: 3000 },
                      { size: "11-20", low: "11-20", mid: "6-10", high: "5", price: 700, major: 7000, minor: 3500 },
                      { size: "21-30", low: "21-30", mid: "11-20", high: "6-10", price: 800, major: 8000, minor: 4000 },
                      { size: "31-40", low: "31-40", mid: "21-30", high: "11-20", price: 900, major: 9000, minor: 4500 },
                      { size: "41以上", low: "41以上", mid: "31-40", high: "21-30", price: 1000, major: 10000, minor: 5000 },
                      { size: "-", low: "-", mid: "41以上", high: "31-40", price: 1100, major: 11000, minor: 5500 },
                      { size: "-", low: "-", mid: "-", high: "41以上", price: 1200, major: 12000, minor: 6000 },
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors">
                        <td className="py-2 px-4 text-neutral-500 text-xs">{row.size}</td>
                        <td className="py-2 px-4 text-neutral-300">{row.low}</td>
                        <td className="py-2 px-4 text-neutral-300">{row.mid}</td>
                        <td className="py-2 px-4 text-neutral-300">{row.high}</td>
                        <td className="py-2 px-4 text-green-400 font-bold">{row.price}</td>
                        <td className="py-2 px-4 text-amber-400">{row.major}</td>
                        <td className="py-2 px-4 text-amber-600">{row.minor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-neutral-950/50 border border-neutral-800">
                  <h3 className="text-xs font-bold text-neutral-500 uppercase mb-2">低价组 (Low)</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 rounded-lg bg-[#FFFF00] text-neutral-950 text-[10px] font-bold">黄山纸业</span>
                    <span className="px-2 py-1 rounded-lg bg-[#FFA500] text-neutral-950 text-[10px] font-bold">朝阳五金</span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-neutral-950/50 border border-neutral-800">
                  <h3 className="text-xs font-bold text-neutral-500 uppercase mb-2">中价组 (Mid)</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 rounded-lg bg-[#0000FF] text-white text-[10px] font-bold">蓝天纺织</span>
                    <span className="px-2 py-1 rounded-lg bg-[#FF0000] text-white text-[10px] font-bold">红旗造船</span>
                    <span className="px-2 py-1 rounded-lg bg-[#00FFFF] text-neutral-950 text-[10px] font-bold">橡树日化</span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-neutral-950/50 border border-neutral-800">
                  <h3 className="text-xs font-bold text-neutral-500 uppercase mb-2">高价组 (High)</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 rounded-lg bg-[#008000] text-white text-[10px] font-bold">核能重工</span>
                    <span className="px-2 py-1 rounded-lg bg-[#800080] text-white text-[10px] font-bold">紫金仪表</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #262626;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #404040;
        }
      `}</style>
    </div>
  );
}
