
export enum BuildingType {
  None = 'none',
  Road = 'road',
  Residential = 'residential',
  Commercial = 'commercial',
  Industrial = 'industrial',
  Park = 'park',
  PowerPlant = 'power_plant',
  WaterTower = 'water_tower',
  PoliceStation = 'police_station',
  FireStation = 'fire_station',
  School = 'school',
  Upgrade = 'upgrade',
  // Special buildings
  Windmill = 'windmill',
  MarketSquare = 'market_square',
  MagicAcademy = 'magic_academy',
  Library = 'library',
  Bakery = 'bakery',
  Landmark = 'landmark',
  DruidCircle = 'druid_circle',
  LumberMill = 'lumber_mill',
  LuminaBloom = 'lumina_bloom',
  GrandObservatory = 'grand_observatory',
  Clocktower = 'clocktower',
  GreatPortal = 'great_portal'
}

export interface TileData {
  x: number;
  y: number;
  buildingType: BuildingType;
  level: number;
  hasMana: boolean;
  hasEssence: boolean;
  hasGuards: boolean;
  hasMagicSafety: boolean;
  hasWisdom: boolean;
  happiness: number;
  variant?: number;
}

export type Grid = TileData[][];

export interface CityStats {
  money: number;
  population: number;
  day: number;
  happiness: number;
  manaSupply: number;
  essenceSupply: number;
  manaUsage: number;
  essenceUsage: number;
  maintenanceTotal: number;
  incomeTotal: number;
  weather: 'clear' | 'rain' | 'storm' | 'snow' | 'fog';
  time: number;
  taxRate: number;
}

export interface NewsItem {
  id: string;
  text: string;
  type: 'neutral' | 'positive' | 'negative' | 'urgent';
  timestamp: number;
}

export interface AIGoal {
  id: string;
  title: string;
  description: string;
  targetType: 'population' | 'money' | 'happiness' | 'building_count' | 'mana_surplus' | 'essence_surplus' | 'diversity';
  targetValue: number;
  buildingType?: BuildingType;
  reward: number;
  completed: boolean;
}

export interface SaveProfile {
  grid: Grid;
  stats: CityStats;
  lastPlayed: number;
}

export enum EntityType {
  Peasant = 'peasant',
  Knight = 'knight',
  Wizard = 'wizard',
  Fairy = 'fairy',
  Merchant = 'merchant',
  Dragon = 'dragon'
}

export interface Entity {
  id: string;
  type: EntityType;
  position: [number, number, number];
  targetPosition: [number, number, number];
  speed: number;
  rotation: number;
  state: 'wandering' | 'working' | 'resting' | 'flying';
  metadata?: any;
}
