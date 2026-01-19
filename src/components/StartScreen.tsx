/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';

interface StartScreenProps {
  onStart: (aiEnabled: boolean) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const [aiEnabled, setAiEnabled] = useState(true);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-50 text-foreground font-sans p-6 bg-background/60 backdrop-blur-md transition-all duration-1000">
      <div className="max-w-md w-full glass-panel p-10 rounded-[2.5rem] magical-glow relative overflow-hidden animate-fade-in">
        {/* Magic aura glows */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none animate-pulse"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-accent/20 rounded-full blur-[80px] pointer-events-none animate-pulse"></div>
        
        <div className="relative z-10 text-center">
            <h1 className="text-6xl font-black mb-1 bg-gradient-to-b from-primary via-primary/80 to-primary/40 bg-clip-text text-transparent tracking-tighter italic font-serif">
            FableRealm
            </h1>
            <p className="text-primary mb-10 text-[10px] font-black uppercase tracking-[0.4em]">
            Kingdom of Castle & Sorcery
            </p>

            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-10 shadow-inner group transition-all hover:bg-white/10">
            <label className="flex items-center justify-between cursor-pointer">
                <div className="flex flex-col gap-1 text-left">
                <span className="font-bold text-lg text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                    Royal Wizard Advisor
                    {aiEnabled && <span className="flex h-2 w-2 rounded-full bg-accent animate-ping"></span>}
                </span>
                <span className="text-xs text-muted-foreground leading-tight">
                    Receive magical scrolls and quests from the Wizard Council (Gemini)
                </span>
                </div>
                
                <div className="relative flex-shrink-0 ml-4 scale-110">
                <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={aiEnabled}
                    onChange={(e) => setAiEnabled(e.target.checked)}
                />
                <div className="w-12 h-6 bg-muted rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/40 peer-checked:after:translate-x-full peer-checked:after:border-primary-foreground after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-muted-foreground after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:after:bg-primary-foreground"></div>
                </div>
            </label>
            </div>

            <button 
            onClick={() => onStart(aiEnabled)}
            className="w-full py-5 bg-gradient-to-b from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-black rounded-2xl shadow-xl transform transition-all hover:scale-[1.03] active:scale-[0.98] text-xl tracking-widest uppercase border border-white/20"
            >
            Establish Realm
            </button>

            <div className="mt-10">
                <a 
                    href="#" 
                    className="inline-flex items-center gap-2 text-[10px] text-stone-600 hover:text-amber-500 transition-colors font-serif uppercase tracking-widest"
                >
                    Designed for the Crown
                </a>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;