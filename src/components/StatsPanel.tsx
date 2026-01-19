import React from 'react';
import { CityStats, Grid, BuildingType } from '../types';
import { BUILDINGS } from '../constants';

interface StatsPanelProps {
  stats: CityStats;
  grid: Grid;
  onClose: () => void;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ stats, grid, onClose }) => {
  const buildingCounts = grid.flat().reduce((acc, tile) => {
    if (tile.buildingType !== BuildingType.None) {
      acc[tile.buildingType] = (acc[tile.buildingType] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-background/80 backdrop-blur-xl pointer-events-auto font-sans">
      <div className="w-full max-w-2xl glass-panel magical-glow rounded-[3rem] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-500">
        <div className="p-8 border-b border-white/10 flex justify-between items-center bg-primary/5">
          <div>
            <h3 className="text-2xl font-black text-primary italic tracking-tight font-serif">Kingdom Ledger</h3>
            <p className="text-[10px] text-muted-foreground font-bold tracking-[0.3em] uppercase">Economic & Magical Overview</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 hover:bg-white/10 rounded-full transition-colors text-foreground/50 hover:text-foreground flex items-center justify-center text-xl">✕</button>
        </div>

        <div className="p-10 flex-1 overflow-y-auto no-scrollbar grid grid-cols-2 gap-10">
          {/* Financials */}
          <div className="space-y-6">
            <h4 className="text-primary text-xs font-black uppercase tracking-widest border-b border-white/10 pb-2">Treasury</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-foreground/60 text-sm">Income</span>
                <span className="text-emerald-400 font-black">+{stats.incomeTotal}g</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-foreground/60 text-sm">Maintenance</span>
                <span className="text-rose-400 font-black">-{stats.maintenanceTotal}g</span>
              </div>
              <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                <span className="text-foreground text-sm font-bold">Net Profit</span>
                <span className={`font-black ${stats.incomeTotal >= stats.maintenanceTotal ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {stats.incomeTotal - stats.maintenanceTotal}g
                </span>
              </div>
            </div>

            <h4 className="text-secondary text-xs font-black uppercase tracking-widest border-b border-white/10 pb-2 pt-4">Magic Resources</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-secondary/80 text-sm">Mana Supply</span>
                <span className="text-foreground font-black">{stats.manaSupply}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-secondary/60 text-sm italic">Current Usage</span>
                <span className="text-foreground/60 font-black">{stats.manaUsage}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-blue-300 text-sm">Essence Supply</span>
                <span className="text-foreground font-black">{stats.essenceSupply}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-300/60 text-sm italic">Current Usage</span>
                <span className="text-foreground/60 font-black">{stats.essenceUsage}</span>
              </div>
            </div>
          </div>

          {/* Infrastructure */}
          <div className="space-y-6">
            <h4 className="text-primary text-xs font-black uppercase tracking-widest border-b border-white/10 pb-2">Infrastructure</h4>
            <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar pr-2">
              {Object.entries(buildingCounts).map(([type, count]) => {
                const config = BUILDINGS[type as BuildingType];
                if (!config) return null;
                return (
                  <div key={type} className="flex justify-between items-center py-1 border-b border-white/5 last:border-0">
                    <span className="text-foreground/80 text-sm">{config.name}</span>
                    <span className="bg-stone-800 text-amber-200 text-[10px] px-2 py-0.5 rounded-md font-black">{count}</span>
                  </div>
                );
              })}
              {Object.keys(buildingCounts).length === 0 && (
                <p className="text-foreground/30 text-xs italic">No structures established yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-white/10 bg-background/50 flex justify-center">
          <button 
            onClick={onClose}
            className="px-12 py-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl text-sm font-black uppercase tracking-[0.2em] transition-all shadow-xl"
          >
            Close Ledger
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
