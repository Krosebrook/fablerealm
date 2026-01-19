
import React, { useEffect } from 'react';
import { BuildingType } from './types';
import IsoMap from './components/IsoMap';
import UIOverlay from './components/UIOverlay';
import StartScreen from './components/StartScreen';
import WizardConsole from './components/WizardConsole';
import { useGameState } from './hooks/useGameState';

function App() {
  const {
    gameStarted, setGameStarted,
    aiEnabled, setAiEnabled,
    grid, setGrid,
    stats, setStats,
    selectedTool, setSelectedTool,
    newsFeed,
    currentGoal,
    isConsoleOpen, setIsConsoleOpen,
    isPanelOpen, setIsPanelOpen,
    deferredPrompt, handleInstallClick,
    handleTileClick
  } = useGameState();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`') { setIsConsoleOpen(prev => !prev); return; }
      if (!gameStarted || isConsoleOpen || isPanelOpen) return;
      const key = e.key.toLowerCase();
      const shortcutMap: Record<string, BuildingType> = {
        '1': BuildingType.Road, '2': BuildingType.Residential, '3': BuildingType.Commercial,
        '4': BuildingType.Industrial, '5': BuildingType.Park, '6': BuildingType.PowerPlant,
        '7': BuildingType.WaterTower, '8': BuildingType.PoliceStation, '9': BuildingType.FireStation,
        '0': BuildingType.School, 'b': BuildingType.None, 'e': BuildingType.Upgrade,
        'w': BuildingType.Windmill, 'm': BuildingType.MarketSquare, 'a': BuildingType.MagicAcademy,
        'l': BuildingType.Library, 'k': BuildingType.Bakery, 'f': BuildingType.Park,
        'g': BuildingType.PoliceStation, 'c': BuildingType.Landmark
      };
      if (shortcutMap[key]) setSelectedTool(shortcutMap[key]);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, isConsoleOpen, isPanelOpen, setIsConsoleOpen, setSelectedTool]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
      <IsoMap 
        grid={grid} 
        onTileClick={handleTileClick} 
        selectedTool={selectedTool} 
        onSelectTool={setSelectedTool} 
        time={stats.time} 
        weather={stats.weather} 
        population={stats.population}
        isLocked={isPanelOpen || isConsoleOpen} 
      />
      {!gameStarted && (
        <StartScreen 
          onStart={(ai) => { 
            setAiEnabled(ai); 
            setGameStarted(true); 
          }} 
        />
      )}
      {gameStarted && (
        <UIOverlay 
          stats={stats} 
          selectedTool={selectedTool} 
          onSelectTool={setSelectedTool} 
          currentGoal={currentGoal} 
          newsFeed={newsFeed} 
          grid={grid} 
          onPanelStateChange={setIsPanelOpen}
          onInstall={deferredPrompt ? handleInstallClick : undefined}
        />
      )}
      <WizardConsole 
        stats={stats} 
        grid={grid} 
        isOpen={isConsoleOpen} 
        onClose={() => setIsConsoleOpen(false)} 
        onCommand={(cmd, args) => {
          if (cmd === 'gift') setStats(p => ({ ...p, money: p.money + (parseInt(args[0]) || 1000) }));
          if (cmd === 'weather') setStats(p => ({ ...p, weather: args[0] as any || 'rain' }));
        }} 
      />
    </div>
  );
}

export default App;
