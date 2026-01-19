/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { CityStats, Grid } from '../types';

interface WizardConsoleProps {
  stats: CityStats;
  grid: Grid;
  onCommand: (cmd: string, args: string[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

const WizardConsole: React.FC<WizardConsoleProps> = ({ stats, grid, onCommand, isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>(['FableRealm OS v2.4.0', 'Type "help" for a list of magic incantations.']);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history]);

  const scry = async (query: string) => {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });
    setHistory(prev => [...prev, `> Scrying the ethereal planes for: "${query}"...`]);
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are the Wizard's Grimoire Terminal. Answer the user's scrying query about the game world or their current kingdom state. 
        Current Gold: ${stats.money}g, Pop: ${stats.population}.
        Query: ${query}`,
      });
      setHistory(prev => [...prev, `[Grimoire]: ${response.text}`]);
    } catch (e) {
      setHistory(prev => [...prev, `[Error]: The connection to the ethereal plane was severed.`]);
    }
  };

  const handleInput = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const parts = input.trim().split(' ');
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1);

      setHistory(prev => [...prev, `> ${input}`]);

      if (cmd === 'help') {
        setHistory(prev => [...prev, 'Available: scry [query], gift [gold], rain [type], stats, clear, exit']);
      } else if (cmd === 'scry') {
        scry(args.join(' '));
      } else if (cmd === 'clear') {
        setHistory([]);
      } else if (cmd === 'exit') {
        onClose();
      } else if (cmd === 'stats') {
        setHistory(prev => [...prev, JSON.stringify({ gold: stats.money, pop: stats.population, day: stats.day }, null, 2)]);
      } else {
        onCommand(cmd, args);
      }
      setInput('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-xl transition-all duration-500 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="w-full max-w-2xl glass-panel magical-glow rounded-3xl overflow-hidden flex flex-col h-[600px] font-mono">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-primary/5">
          <div className="flex items-center gap-2">
            <span className="text-primary animate-pulse">✨</span>
            <h3 className="text-xs font-black text-primary uppercase tracking-widest">Royal Wizard Console</h3>
          </div>
          <button onClick={onClose} className="text-foreground/50 hover:text-foreground">✕</button>
        </div>

        <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto no-scrollbar space-y-2 text-[11px]">
          {history.map((line, i) => (
            <div key={i} className={line.startsWith('>') ? 'text-primary' : 'text-foreground/80'}>
              {line}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="flex gap-2 items-center">
            <span className="text-primary font-black animate-pulse">{'>'}</span>
            <input 
              autoFocus
              className="flex-1 bg-transparent border-none outline-none text-primary placeholder:text-primary/30 text-xs"
              placeholder="Speak thy command (e.g. gift 5000, weather storm, scry 'when will the dragons return?')..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = e.currentTarget.value;
                  setHistory(prev => [...prev, `> ${val}`]);
                  const [cmd, ...args] = val.split(' ');
                  if (cmd === 'scry') {
                    scry(args.join(' '));
                  } else {
                    onCommand(cmd, args);
                  }
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WizardConsole;
