
import { BuildingType } from '../types';

export const GRID_SIZE = 15;
export const TICK_RATE_MS = 1000;
export const INITIAL_MONEY = 15000;

export interface BuildingConfig {
  name: string;
  description: string;
  cost: number;
  maintenance: number;
  incomeGen: number;
  popGen: number;
  manaReq: number;
  essenceReq: number;
  serviceRadius?: number;
  magicValue?: number;
}

export const BUILDINGS: Record<BuildingType, BuildingConfig | null> = {
  [BuildingType.None]: null,
  [BuildingType.Road]: {
    name: "Golden Path",
    description: "Connects your kingdom. People need roads to travel.",
    cost: 50, maintenance: 2, incomeGen: 0, popGen: 0, manaReq: 0, essenceReq: 0
  },
  [BuildingType.Residential]: {
    name: "Thatch Cottage",
    description: "Provides housing for fairytale folk.",
    cost: 500, maintenance: 5, incomeGen: 10, popGen: 15, manaReq: 5, essenceReq: 5
  },
  [BuildingType.Commercial]: {
    name: "The Gilded Tankard",
    description: "An inn for travelers and thirsty dwarves.",
    cost: 1200, maintenance: 20, incomeGen: 80, popGen: 0, manaReq: 10, essenceReq: 10
  },
  [BuildingType.Industrial]: {
    name: "Crystal Mine",
    description: "Extracts magical gems from the earth.",
    cost: 2500, maintenance: 50, incomeGen: 200, popGen: 0, manaReq: 20, essenceReq: 20
  },
  [BuildingType.Park]: {
    name: "Enchanted Grove",
    description: "A peaceful place where wisps dance.",
    cost: 800, maintenance: 30, incomeGen: 0, popGen: 0, manaReq: 5, essenceReq: 15, serviceRadius: 4
  },
  [BuildingType.PowerPlant]: {
    name: "Mana Nexus",
    description: "Harnesses the ambient mana of the realm.",
    cost: 5000, maintenance: 150, incomeGen: 0, popGen: 0, manaReq: 0, essenceReq: 0
  },
  [BuildingType.WaterTower]: {
    name: "Essence Fountain",
    description: "Calls forth life-essence from the deep springs.",
    cost: 3000, maintenance: 80, incomeGen: 0, popGen: 0, manaReq: 0, essenceReq: 0
  },
  [BuildingType.PoliceStation]: {
    name: "Royal Guard Post",
    description: "Keeps the roads safe from goblins and brigands.",
    cost: 2000, maintenance: 100, incomeGen: 0, popGen: 0, manaReq: 5, essenceReq: 5, serviceRadius: 6
  },
  [BuildingType.FireStation]: {
    name: "Order of Mages",
    description: "Mages who quell rogue magic and fire.",
    cost: 2500, maintenance: 120, incomeGen: 0, popGen: 0, manaReq: 20, essenceReq: 5, serviceRadius: 6
  },
  [BuildingType.School]: {
    name: "Village Library",
    description: "Teaches the basic arts of lore and magic.",
    cost: 1500, maintenance: 60, incomeGen: 0, popGen: 0, manaReq: 10, essenceReq: 5, serviceRadius: 5
  },
  [BuildingType.Upgrade]: {
    name: "Royal Decree",
    description: "Enhance a building to the next level.",
    cost: 0, maintenance: 0, incomeGen: 0, popGen: 0, manaReq: 0, essenceReq: 0
  },
  [BuildingType.Windmill]: {
    name: "Fairytale Windmill",
    description: "Produces flour and a bit of rustic charm.",
    cost: 1000, maintenance: 25, incomeGen: 40, popGen: 0, manaReq: 0, essenceReq: 0
  },
  [BuildingType.MarketSquare]: {
    name: "Market Square",
    description: "A bustling hub of trade and merriment.",
    cost: 4000, maintenance: 100, incomeGen: 300, popGen: 0, manaReq: 10, essenceReq: 10, serviceRadius: 5
  },
  [BuildingType.MagicAcademy]: {
    name: "Magic Academy",
    description: "Prestigious institution for high sorcery.",
    cost: 10000, maintenance: 400, incomeGen: 0, popGen: 0, manaReq: 50, essenceReq: 20, serviceRadius: 8
  },
  [BuildingType.Library]: {
    name: "Grand Library",
    description: "Repository of all known magical scrolls.",
    cost: 3500, maintenance: 150, incomeGen: 0, popGen: 0, manaReq: 15, essenceReq: 10, serviceRadius: 7
  },
  [BuildingType.Bakery]: {
    name: "Gingerbread Bakery",
    description: "Smells like heaven, tastes like magic.",
    cost: 800, maintenance: 30, incomeGen: 50, popGen: 0, manaReq: 5, essenceReq: 10, serviceRadius: 4
  },
  [BuildingType.Landmark]: {
    name: "Wizard's Keep",
    description: "A grand landmark that draws pilgrims.",
    cost: 20000, maintenance: 500, incomeGen: 1000, popGen: 0, manaReq: 100, essenceReq: 50
  },
  [BuildingType.DruidCircle]: {
    name: "Druid Circle",
    description: "Taps into natural essence without tools.",
    cost: 5000, maintenance: 50, incomeGen: 0, popGen: 0, manaReq: 0, essenceReq: 0
  },
  [BuildingType.LumberMill]: {
    name: "Lumber Mill",
    description: "Processes enchanted wood for the realm.",
    cost: 1500, maintenance: 40, incomeGen: 120, popGen: 0, manaReq: 5, essenceReq: 15
  },
  [BuildingType.LuminaBloom]: {
    name: "Lumina Bloom",
    description: "Glowing flowers that brighten the mood.",
    cost: 600, maintenance: 10, incomeGen: 0, popGen: 0, manaReq: 2, essenceReq: 8, serviceRadius: 3
  },
  [BuildingType.GrandObservatory]: {
    name: "Observatory",
    description: "Studies the celestial mana currents.",
    cost: 8000, maintenance: 300, incomeGen: 0, popGen: 0, manaReq: 30, essenceReq: 10, serviceRadius: 6
  },
  [BuildingType.Clocktower]: {
    name: "Clocktower",
    description: "Keeps the kingdom running efficiently.",
    cost: 7000, maintenance: 250, incomeGen: 0, popGen: 0, manaReq: 20, essenceReq: 5, serviceRadius: 7
  },
  [BuildingType.GreatPortal]: {
    name: "The Great Portal",
    description: "A cosmic gateway that binds the realms together.",
    cost: 50000, maintenance: 1000, incomeGen: 5000, popGen: 0, manaReq: 200, essenceReq: 100, serviceRadius: 15
  }
};
