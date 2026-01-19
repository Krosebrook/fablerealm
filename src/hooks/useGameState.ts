
import { useState, useEffect, useCallback, useRef } from 'react';
import { Grid, TileData, BuildingType, CityStats, AIGoal, NewsItem } from '../types';
import { GRID_SIZE, TICK_RATE_MS, INITIAL_MONEY } from '../constants';
import { generateNewsEvent, generateCityGoal } from '../services/geminiService';
import { soundService } from '../services/soundService';
import { SimulationService } from '../services/simulationService';
import { SaveService } from '../services/saveService';
import { ActionService } from '../services/actionService';
import { QuestService } from '../services/questService';

const createInitialGrid = (): Grid => {
  const grid: Grid = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    const row: TileData[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      row.push({ 
        x, y, 
        buildingType: BuildingType.None, 
        level: 1, 
        hasMana: true, hasEssence: true, 
        hasGuards: false, hasMagicSafety: false, hasWisdom: false, 
        happiness: 100 
      });
    }
    grid.push(row);
  }
  return grid;
};

const INITIAL_STATS: CityStats = {
  money: INITIAL_MONEY, population: 0, day: 1, happiness: 100, 
  manaSupply: 0, essenceSupply: 0, manaUsage: 0, essenceUsage: 0,
  maintenanceTotal: 0, incomeTotal: 0, weather: 'clear', time: 10,
  taxRate: 1.0
};

export function useGameState() {
  const [gameStarted, setGameStarted] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [grid, setGrid] = useState<Grid>(createInitialGrid);
  const [stats, setStats] = useState<CityStats>(INITIAL_STATS);
  const [selectedTool, setSelectedTool] = useState<BuildingType>(BuildingType.Road);
  const [newsFeed, setNewsFeed] = useState<NewsItem[]>([]);
  const [currentGoal, setCurrentGoal] = useState<AIGoal | null>(null);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const gridRef = useRef(grid);
  const statsRef = useRef(stats);
  const isFetchingGoal = useRef(false);
  
  useEffect(() => { 
    gridRef.current = grid; 
    statsRef.current = stats; 
  }, [grid, stats]);

  useEffect(() => {
    const initGame = async () => {
      const profile = await SaveService.load();
      if (profile) {
        setGrid(profile.grid);
        setStats(profile.stats);
      }
    };
    initGame();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
  };

  // Simulation tick
  useEffect(() => {
    if (!gameStarted || isConsoleOpen) return;
    const interval = setInterval(() => {
      if (document.hidden) return;
      const { newStats, newGrid } = SimulationService.calculateTick(gridRef.current, statsRef.current);
      setStats(newStats);
      setGrid(newGrid);
      
      if (Math.random() < 0.1 && aiEnabled) {
        generateNewsEvent(statsRef.current, "Prosperity").then(news => {
          if (news) setNewsFeed(p => [news, ...p].slice(0, 10));
        });
      }
      
      SaveService.save(newGrid, newStats).catch(err => console.error("Auto-save failed", err));
    }, TICK_RATE_MS);
    return () => clearInterval(interval);
  }, [gameStarted, aiEnabled, isConsoleOpen]);

  // Goal logic
  useEffect(() => {
    if (!gameStarted || !aiEnabled) return;

    if (currentGoal && !currentGoal.completed) {
      if (QuestService.checkGoal(currentGoal, stats, grid)) {
        soundService.playReward();
        setStats(prev => ({ ...prev, money: prev.money + currentGoal.reward }));
        setCurrentGoal(prev => prev ? { ...prev, completed: true } : null);
        const completionNews: NewsItem = {
          id: Math.random().toString(36).substring(7),
          text: `Huzzah! The Royal Wizard's decree has been fulfilled!`,
          type: 'positive',
          timestamp: Date.now()
        };
        setNewsFeed(p => [completionNews, ...p].slice(0, 10));
      }
      return;
    }

    if (!currentGoal || currentGoal.completed) {
      if (isFetchingGoal.current) return;
      isFetchingGoal.current = true;

      const timer = setTimeout(async () => {
        try {
          const goal = await generateCityGoal(statsRef.current, gridRef.current) || QuestService.generateFallbackQuest(statsRef.current);
          if (goal) {
            setCurrentGoal(goal);
            const arrivalNews: NewsItem = {
              id: Math.random().toString(36).substring(7),
              text: `A new magical prophecy has been delivered by the Royal Wizard.`,
              type: 'urgent',
              timestamp: Date.now()
            };
            setNewsFeed(p => [arrivalNews, ...p].slice(0, 10));
          }
        } finally {
          isFetchingGoal.current = false;
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [gameStarted, aiEnabled, stats, grid, currentGoal]);

  const handleTileClick = useCallback((x: number, y: number, variant: number = 0) => {
    if (!gameStarted || isConsoleOpen) return;
    const result = ActionService.execute(selectedTool, grid, stats, x, y, variant);
    if (result.success) {
      setGrid(result.newGrid);
      setStats(result.newStats);
      soundService.playForAction(selectedTool, grid[y][x].buildingType, grid[y][x].level + 1);
      
      if (result.message) {
        const newsItem: NewsItem = {
          id: Math.random().toString(36).substring(7),
          text: result.message,
          type: result.type || 'neutral',
          timestamp: Date.now()
        };
        setNewsFeed(p => [newsItem, ...p].slice(0, 10));
      }
    } else if (result.message) {
      const newsItem: NewsItem = {
        id: Math.random().toString(36).substring(7),
        text: result.message,
        type: 'negative',
        timestamp: Date.now()
      };
      setNewsFeed(p => [newsItem, ...p].slice(0, 10));
    }
  }, [grid, stats, selectedTool, gameStarted, isConsoleOpen]);

  return {
    gameStarted, setGameStarted,
    aiEnabled, setAiEnabled,
    grid, setGrid,
    stats, setStats,
    selectedTool, setSelectedTool,
    newsFeed, setNewsFeed,
    currentGoal, setCurrentGoal,
    isConsoleOpen, setIsConsoleOpen,
    isPanelOpen, setIsPanelOpen,
    deferredPrompt, handleInstallClick,
    handleTileClick
  };
}
