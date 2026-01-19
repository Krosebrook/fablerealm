/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { CityStats, Grid } from '../types';

interface AdvisorPanelProps {
  stats: CityStats;
  grid: Grid;
  onClose: () => void;
}

const AdvisorPanel: React.FC<AdvisorPanelProps> = ({ stats, grid, onClose }) => {
  const [response, setResponse] = useState<string>('Summoning the Royal Wizard...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const analyzeRealm = async () => {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });
      const buildings = grid.flat().filter(t => t.buildingType !== 'None');
      const buildingCounts = buildings.reduce((acc, b) => {
        acc[b.buildingType] = (acc[b.buildingType] || 0) + 1;
        return acc;
      }, {} as any);

      const prompt = `
        You are the Ancient Royal Wizard and Grand Advisor to the Crown. 
        Analyze the state of FableRealm and provide 3-4 magical prophecies or strategic decrees.
        
        Kingdom State:
        - Gold in Treasury: ${stats.money}g (Gain: ${stats.incomeTotal}/tick, Upkeep: ${stats.maintenanceTotal}/tick)
        - Loyal Subjects: ${stats.population}
        - Public Mood: ${stats.happiness}%
        - Mana Reserves: ${stats.manaUsage}/${stats.manaSupply}
        - Essence Reserves: ${stats.essenceUsage}/${stats.essenceSupply}
        - Kingdom Structures: ${JSON.stringify(buildingCounts)}
        
        Address specific magical catastrophes such as Mana droughts, lack of Guard Posts or Mage Sanctums, or poor placement of Mines near Cottages.
        Keep your tone mystical, authoritative, and helpful. Use words like "Sire", "Kingdom", "Mana", and "Decree".
      `;

      try {
        const result = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
        });
        setResponse(result.text || "The crystal ball is clouded. Ensure your tribute (API Key) is valid.");
      } catch (e) {
        setResponse("A dark force blocks our magical communication. Check your connectivity spells.");
      } finally {
        setLoading(false);
      }
    };

    analyzeRealm();
  }, [stats, grid]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-background/80 backdrop-blur-xl pointer-events-auto">
      <div className="w-full max-w-xl glass-panel magical-glow rounded-[3rem] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-500 font-sans">
        <div className="p-8 border-b border-white/10 flex justify-between items-center bg-secondary/10">
          <div>
            <h3 className="text-2xl font-black text-primary italic tracking-tight font-serif">Royal Wizard Diagnostic</h3>
            <p className="text-[10px] text-secondary font-bold tracking-[0.3em] uppercase">Ethereal Connection Established</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 hover:bg-white/10 rounded-full transition-colors text-foreground/50 hover:text-foreground flex items-center justify-center text-xl">✕</button>
        </div>
        
        <div className="p-10 flex-1 overflow-y-auto no-scrollbar font-sans">
          {loading ? (
            <div className="space-y-6">
              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-4 bg-muted rounded animate-pulse w-full" />
              <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
            </div>
          ) : (
            <div className="text-foreground/90 leading-relaxed text-lg whitespace-pre-wrap italic font-serif">
              {response}
            </div>
          )}
        </div>

        <div className="p-8 border-t border-white/10 bg-background/50 flex justify-center">
          <button 
            onClick={onClose}
            className="px-12 py-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl text-sm font-black uppercase tracking-[0.2em] transition-all shadow-xl"
          >
            I Heed Thy Word
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvisorPanel;