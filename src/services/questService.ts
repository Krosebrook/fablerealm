
import { Grid, CityStats, BuildingType, AIGoal } from '../types';

export class QuestService {
  /**
   * Checks if the given goal is fulfilled based on current kingdom state
   */
  static checkGoal(goal: AIGoal, stats: CityStats, grid: Grid): boolean {
    if (goal.completed) return false;

    switch (goal.targetType) {
      case 'population':
        return stats.population >= goal.targetValue;
      case 'money':
        return stats.money >= goal.targetValue;
      case 'happiness':
        return stats.happiness >= goal.targetValue;
      case 'building_count':
        if (!goal.buildingType) return false;
        const count = grid.flat().filter(t => t.buildingType === goal.buildingType).length;
        return count >= goal.targetValue;
      case 'mana_surplus':
        return (stats.manaSupply - stats.manaUsage) >= goal.targetValue;
      case 'essence_surplus':
        return (stats.essenceSupply - stats.essenceUsage) >= goal.targetValue;
      case 'diversity':
        const uniqueBuildings = new Set(grid.flat()
          .filter(t => t.buildingType !== BuildingType.None && t.buildingType !== BuildingType.Road)
          .map(t => t.buildingType)
        );
        return uniqueBuildings.size >= goal.targetValue;
      default:
        return false;
    }
  }

  /**
   * Fallback quest generator when AI is unavailable
   */
  static generateFallbackQuest(stats: CityStats): AIGoal {
    const types: AIGoal['targetType'][] = ['population', 'money', 'diversity'];
    if (stats.money > 25000) types.push('building_count');
    
    const type = types[Math.floor(Math.random() * types.length)];
    
    let targetValue = 0;
    let title = "";
    let description = "";
    let reward = 1000;
    let bType: BuildingType | undefined = undefined;

    if (type === 'population') {
      targetValue = stats.population + 50;
      title = "Village Growth";
      description = "The realm needs more subjects to thrive. Attract more fairytale folk to your village.";
    } else if (type === 'money') {
      targetValue = stats.money + 5000;
      title = "Royal Treasury";
      description = "A wealthy kingdom is a strong kingdom. Fill the royal coffers.";
    } else if (type === 'building_count') {
      targetValue = 1;
      bType = BuildingType.GreatPortal;
      title = "The Cosmic Gateway";
      description = "The Council of Archmages foresees a grand convergence. Establish 'The Great Portal' to secure our future.";
      reward = 25000;
    } else {
      targetValue = 5;
      title = "Architectural Bloom";
      description = "The Wizard Council requests a more diverse array of structures in the village.";
    }

    return {
      id: Math.random().toString(36).substring(7),
      title,
      description,
      targetType: type,
      targetValue,
      buildingType: bType,
      reward,
      completed: false
    };
  }
}
