import React, { useState } from 'react';
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
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const { state, playTile, foundChain, buyStocks, mergerOption, declareGameEnd } = useGame();
  const [selectedStocks, setSelectedStocks] = useState<Partial<Record<HotelChain, number>>>({});

  const currentPlayer = state.players[state.currentPlayerIndex];
  const isUserTurn = !currentPlayer.isAI;

  const handleStockClick = (chain: HotelChain) => {
    if (state.phase !== 'buy-stocks' || !isUserTurn) return;
    const currentCount = selectedStocks[chain] || 0;
    const totalSelected = (Object.values(selectedStocks) as number[]).reduce((a, b) => a + b, 0);
    
    if (totalSelected < 3 && state.stockMarket[chain].available > currentCount) {
      const price = state.stockMarket[chain].price;
      const totalCost = (Object.entries(selectedStocks) as [HotelChain, number][]).reduce((acc, [c, count]) => acc + (state.stockMarket[c].price * count), 0);
      if (totalCost + price <= currentPlayer.money) {
        setSelectedStocks({ ...selectedStocks, [chain]: currentCount + 1 });
      }
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
          <p className="text-neutral-500 text-sm">经典商业模拟桌游</p>
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
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-500" />
                你的板块架
              </h2>
              <span className="text-xs text-neutral-500 uppercase tracking-widest">
                {state.players[0].tiles.length} / 6 TILES
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {state.players[0].tiles.map((tile) => (
                <button
                  key={tile.id}
                  onClick={() => playTile(tile)}
                  disabled={!isUserTurn || state.phase !== 'play-tile'}
                  className={cn(
                    "w-16 h-20 rounded-xl flex flex-col items-center justify-center gap-1 transition-all group relative overflow-hidden border-2",
                    isUserTurn && state.phase === 'play-tile' 
                      ? "bg-neutral-800 border-neutral-700 hover:border-amber-500 hover:scale-105 cursor-pointer shadow-xl" 
                      : "bg-neutral-900 border-neutral-800 opacity-50 cursor-not-allowed"
                  )}
                >
                  <span className="text-lg font-bold font-mono group-hover:text-amber-400">{tile.id}</span>
                  <div className="w-8 h-1 bg-neutral-700 rounded-full group-hover:bg-amber-500/50" />
                </button>
              ))}
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

        {state.phase === 'merger-options' && isUserTurn && state.pendingMerger && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-neutral-900 border border-neutral-800 p-8 rounded-[2.5rem] max-w-2xl w-full shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                  <ArrowRightLeft className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">并购决策</h2>
                  <p className="text-neutral-500 text-sm">
                    {state.pendingMerger.survivor} 正在并购 {state.pendingMerger.defunct[state.pendingMerger.defunctIndex]}
                  </p>
                </div>
              </div>

              <div className="bg-neutral-950/50 rounded-3xl p-6 border border-neutral-800 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-neutral-400">你持有的 {state.pendingMerger.defunct[state.pendingMerger.defunctIndex]} 股票:</span>
                  <span className="text-xl font-bold font-mono">{state.players[0].stocks[state.pendingMerger.defunct[state.pendingMerger.defunctIndex]]} 股</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button 
                    onClick={() => mergerOption('sell', state.players[0].stocks[state.pendingMerger.defunct[state.pendingMerger.defunctIndex]])}
                    className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all"
                  >
                    <DollarSign className="w-6 h-6 text-red-500" />
                    <span className="font-bold text-sm">全部售出</span>
                  </button>
                  <button 
                    onClick={() => mergerOption('trade', state.players[0].stocks[state.pendingMerger.defunct[state.pendingMerger.defunctIndex]])}
                    className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all"
                  >
                    <ArrowRightLeft className="w-6 h-6 text-blue-500" />
                    <span className="font-bold text-sm">2:1 换股</span>
                  </button>
                  <button 
                    onClick={() => mergerOption('hold', 0)}
                    className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 transition-all"
                  >
                    <CheckCircle2 className="w-6 h-6 text-neutral-400" />
                    <span className="font-bold text-sm">继续持有</span>
                  </button>
                </div>
              </div>
              
              <p className="text-xs text-neutral-600 text-center">
                注：换股将按 2 股停业公司股票换取 1 股存续公司股票。
              </p>
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
