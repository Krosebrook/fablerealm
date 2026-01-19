
import { Grid, CityStats, BuildingType, TileData } from '../types';
import { BUILDINGS, GRID_SIZE } from '../constants';

export class SimulationService {
  private static coverageCache: any = null;
  private static lastGridHash: string = "";

  static calculateTick(grid: Grid, stats: CityStats): { newStats: CityStats, newGrid: Grid } {
    let incomeTotal = 0;
    let maintenanceTotal = 0;
    let popGrowth = 0;
    let manaSupply = 0;
    let essenceSupply = 0;
    let manaUsed = 0;
    let essenceUsed = 0;
    let totalHappiness = 0;
    let residentialCount = 0;

    // Check if grid has changed to decide whether to recompute coverage
    const currentGridHash = this.getGridHash(grid);
    if (currentGridHash !== this.lastGridHash || !this.coverageCache) {
      this.coverageCache = this.computeCoverage(grid);
      this.lastGridHash = currentGridHash;
    }

    const coverage = this.coverageCache;

    // Calculate total supply and maintenance (still need to do this every tick because of levels)
    grid.forEach(row => row.forEach(tile => {
      const config = BUILDINGS[tile.buildingType];
      if (!config) return;

      if (tile.buildingType === BuildingType.PowerPlant) manaSupply += 120 * tile.level;
      if (tile.buildingType === BuildingType.WaterTower) essenceSupply += 100 * tile.level;
      if (tile.buildingType === BuildingType.DruidCircle) essenceSupply += 40 * tile.level;
      
      maintenanceTotal += config.maintenance * tile.level;
    }));

    const newGrid = grid.map((row, y) => row.map((tile, x) => {
      if (tile.buildingType === BuildingType.None || tile.buildingType === BuildingType.Road) {
        return { ...tile, happiness: 100, hasMana: true, hasEssence: true };
      }

      const config = BUILDINGS[tile.buildingType];
      if (!config) return tile;

      const mReq = config.manaReq * tile.level;
      const eReq = config.essenceReq * tile.level;

      const hasMana = (manaUsed + mReq) <= manaSupply;
      const hasEssence = (essenceUsed + eReq) <= essenceSupply;

      if (hasMana) manaUsed += mReq;
      if (hasEssence) essenceUsed += eReq;

      let happiness = 75;
      if (!hasMana) happiness -= 40;
      if (!hasEssence) happiness -= 40;
      
      if (tile.buildingType === BuildingType.Residential) {
        residentialCount++;
        happiness += coverage.guards[y][x] ? 15 : -20;
        happiness += coverage.mages[y][x] ? 15 : -15;
        
        if (coverage.wisdom[y][x]) {
          const isGrandAcademy = this.checkNearbyBuilding(grid, x, y, 8, BuildingType.MagicAcademy);
          happiness += isGrandAcademy ? 25 : 20;
        }

        happiness += coverage.nature[y][x] ? 20 : 0;
        happiness += coverage.sweets[y][x] ? 12 : 0; 
        happiness += coverage.prosperity[y][x] ? 15 : 0;
        happiness += coverage.cosmic[y][x] ? 10 : 0;
        happiness += coverage.celestial[y][x] ? 50 : 0;
        
        if (this.checkIndustrialProximity(grid, x, y, 3)) happiness -= 30;
      }

      happiness = Math.max(0, Math.min(100, happiness));
      totalHappiness += happiness;

      const efficiencyMultiplier = coverage.efficiency[y][x] ? 1.2 : 1.0;
      const effectiveness = ((hasMana && hasEssence) ? (0.2 + (happiness / 100) * 0.8) : 0.1) * efficiencyMultiplier;
      
      incomeTotal += config.incomeGen * tile.level * effectiveness;
      popGrowth += config.popGen * tile.level * effectiveness;

      return { 
        ...tile, 
        hasMana, 
        hasEssence, 
        hasGuards: coverage.guards[y][x],
        hasMagicSafety: coverage.mages[y][x],
        hasWisdom: coverage.wisdom[y][x],
        happiness 
      };
    }));

    const avgHappiness = residentialCount > 0 ? totalHappiness / residentialCount : 100;

    return {
      newGrid,
      newStats: {
        ...stats,
        money: stats.money + Math.floor(incomeTotal - maintenanceTotal),
        population: Math.max(0, stats.population + Math.floor(popGrowth)),
        happiness: Math.floor(avgHappiness),
        manaSupply,
        essenceSupply,
        manaUsage: manaUsed,
        essenceUsage: essenceUsed,
        incomeTotal: Math.floor(incomeTotal),
        maintenanceTotal: Math.floor(maintenanceTotal),
        day: stats.day + 1,
        time: (stats.time + 0.1) % 24 // Slower time passage for better atmosphere
      }
    };
  }

  private static getGridHash(grid: Grid): string {
    // Simple hash: count buildings and their positions
    return grid.map(row => row.map(t => `${t.buildingType}-${t.level}`).join('|')).join(':');
  }

  private static computeCoverage(grid: Grid) {
    const coverage = {
      guards: Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(false)),
      mages: Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(false)),
      wisdom: Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(false)),
      nature: Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(false)),
      sweets: Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(false)),
      prosperity: Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(false)),
      cosmic: Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(false)),
      celestial: Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(false)),
      efficiency: Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(false)),
    };

    grid.forEach(row => row.forEach(tile => {
      const config = BUILDINGS[tile.buildingType];
      if (!config || !config.serviceRadius) return;

      const r = config.serviceRadius + (tile.level - 1);
      const cx = tile.x;
      const cy = tile.y;
      const type = tile.buildingType;

      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
            if (Math.sqrt(dx * dx + dy * dy) <= r) {
              if (type === BuildingType.PoliceStation) coverage.guards[ny][nx] = true;
              if (type === BuildingType.FireStation) coverage.mages[ny][nx] = true;
              if (type === BuildingType.School || type === BuildingType.Library || type === BuildingType.MagicAcademy) coverage.wisdom[ny][nx] = true;
              if (type === BuildingType.Park || type === BuildingType.LuminaBloom || type === BuildingType.DruidCircle) coverage.nature[ny][nx] = true;
              if (type === BuildingType.Bakery) coverage.sweets[ny][nx] = true;
              if (type === BuildingType.MarketSquare) coverage.prosperity[ny][nx] = true;
              if (type === BuildingType.GrandObservatory) coverage.cosmic[ny][nx] = true;
              if (type === BuildingType.GreatPortal) coverage.celestial[ny][nx] = true;
              if (type === BuildingType.Clocktower) coverage.efficiency[ny][nx] = true;
            }
          }
        }
      }
    }));

    return coverage;
  }

  private static checkNearbyBuilding(grid: Grid, x: number, y: number, radius: number, type: BuildingType): boolean {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
          if (grid[ny][nx].buildingType === type) return true;
        }
      }
    }
    return false;
  }

  private static checkIndustrialProximity(grid: Grid, x: number, y: number, radius: number): boolean {
    const industrialTypes = [BuildingType.Industrial, BuildingType.LumberMill];
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
          if (industrialTypes.includes(grid[ny][nx].buildingType)) return true;
        }
      }
    }
    return false;
  }
}
