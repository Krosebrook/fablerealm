
import { Grid, BuildingType, CityStats } from '../types';
import { BUILDINGS } from '../constants';

const MAX_LEVEL = 5;

export interface ActionResponse {
  newGrid: Grid;
  newStats: CityStats;
  success: boolean;
  message: string;
  type: 'positive' | 'negative' | 'neutral';
}

export class ActionService {
  static execute(tool: BuildingType, grid: Grid, stats: CityStats, x: number, y: number, variantIndex: number = 0): ActionResponse {
    switch (tool) {
      case BuildingType.Upgrade:
        return this.upgradeTile(grid, stats, x, y);
      case BuildingType.None:
        return this.bulldozeTile(grid, stats, x, y);
      default:
        return this.buildTile(grid, stats, x, y, tool, variantIndex);
    }
  }

  private static getUpgradeCost(bType: BuildingType, currentLevel: number): number {
    const config = BUILDINGS[bType];
    const baseCost = config ? config.cost : 0;
    return Math.floor(baseCost * (currentLevel + 1) * 1.8);
  }

  static upgradeTile(grid: Grid, stats: CityStats, x: number, y: number): ActionResponse {
    const tile = grid[y][x];
    const bType = tile.buildingType;

    if (bType === BuildingType.None || bType === BuildingType.Road) {
      return { newGrid: grid, newStats: stats, success: false, message: "Only structures can be enhanced.", type: 'neutral' };
    }

    if (tile.level >= MAX_LEVEL) {
      return { newGrid: grid, newStats: stats, success: false, message: "Structure is already at max magical resonance.", type: 'neutral' };
    }

    const cost = this.getUpgradeCost(bType, tile.level);

    if (stats.money < cost) {
      return { newGrid: grid, newStats: stats, success: false, message: `The treasury lacks the ${cost}g required for this rite.`, type: 'negative' };
    }

    const newGrid = grid.map((row, ridx) => ridx === y ? row.map((t, cidx) => cidx === x ? { 
      ...t, 
      level: t.level + 1
    } : t) : row);
    const newStats = { ...stats, money: stats.money - cost };

    const config = BUILDINGS[bType];
    return {
      newGrid, newStats, success: true,
      message: `${config ? config.name : bType} enhanced to Tier ${tile.level + 1}.`,
      type: 'positive'
    };
  }

  static buildTile(grid: Grid, stats: CityStats, x: number, y: number, tool: BuildingType, variantIndex: number): ActionResponse {
    const tile = grid[y][x];
    const config = BUILDINGS[tool];

    if (!config) {
        return { newGrid: grid, newStats: stats, success: false, message: "Unknown building type.", type: 'neutral' };
    }

    if (tile.buildingType !== BuildingType.None) {
      return { newGrid: grid, newStats: stats, success: false, message: "That land is already occupied.", type: 'neutral' };
    }

    if (stats.money < config.cost) {
      return { newGrid: grid, newStats: stats, success: false, message: `Thy treasury needs ${config.cost}g to establish this ${config.name}.`, type: 'negative' };
    }

    const newGrid = grid.map((row, ridx) => ridx === y ? row.map((t, cidx) => cidx === x ? { 
      ...t, 
      buildingType: tool, 
      level: 1,
      variant: variantIndex
    } : t) : row);
    const newStats = { ...stats, money: stats.money - config.cost };
    
    let message = `Established ${config.name}.`;
    if (tool === BuildingType.GreatPortal) {
      message = "The Great Portal has been opened! A new age of cosmic prosperity begins!";
    }

    return {
      newGrid, newStats, success: true,
      message,
      type: 'positive'
    };
  }

  static bulldozeTile(grid: Grid, stats: CityStats, x: number, y: number): ActionResponse {
    const tile = grid[y][x];
    if (tile.buildingType === BuildingType.None) return { newGrid: grid, newStats: stats, success: false, message: "The land is already clear.", type: 'neutral' };

    const newGrid = grid.map((row, ridx) => ridx === y ? row.map((t, cidx) => cidx === x ? { ...t, buildingType: BuildingType.None, level: 1, variant: undefined } : t) : row);
    const newStats = { ...stats, money: Math.max(0, stats.money - 20) };

    return {
      newGrid, newStats, success: true,
      message: "Tile cleared by Royal decree.",
      type: 'neutral'
    };
  }
}
