import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BuildingType, Entity, EntityType, Grid, TileData } from '../types';
import { GRID_SIZE } from '../constants';

const WORLD_OFFSET = GRID_SIZE / 2 - 0.5;
const gridToWorld = (x: number, y: number) => [x - WORLD_OFFSET, 0.1, y - WORLD_OFFSET] as [number, number, number];

const ENTITY_CONFIGS: Record<EntityType, { color: string, speed: number, size: number }> = {
  [EntityType.Peasant]: { color: '#fbbf24', speed: 0.5, size: 0.1 },
  [EntityType.Knight]: { color: '#94a3b8', speed: 0.7, size: 0.12 },
  [EntityType.Wizard]: { color: '#8b5cf6', speed: 0.4, size: 0.1 },
  [EntityType.Fairy]: { color: '#f472b6', speed: 1.2, size: 0.08 },
  [EntityType.Merchant]: { color: '#d97706', speed: 0.6, size: 0.11 },
  [EntityType.Dragon]: { color: '#ef4444', speed: 2.5, size: 0.4 }
};

interface EntitySystemProps {
  grid: Grid;
  population: number;
}

export const EntitySystem: React.FC<EntitySystemProps> = ({ grid, population }) => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const entitiesRef = useRef<Entity[]>([]);
  const lastSpawnTime = useRef(0);

  // Initialize entities or spawn more as population grows
  useEffect(() => {
    const targetCount = Math.min(30, Math.floor(population / 10) + 3);
    if (entities.length < targetCount) {
      const spawnPoints: TileData[] = [];
      grid.forEach(row => row.forEach(tile => {
        if (tile.buildingType !== BuildingType.None && tile.buildingType !== BuildingType.Road) {
          spawnPoints.push(tile);
        }
      }));

      if (spawnPoints.length > 0) {
        const newEntities: Entity[] = [...entities];
        while (newEntities.length < targetCount) {
          const spawnTile = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
          const type = getEntityTypeForBuilding(spawnTile.buildingType);
          const pos = gridToWorld(spawnTile.x, spawnTile.y);
          
          newEntities.push({
            id: Math.random().toString(36).substring(7),
            type,
            position: [...pos],
            targetPosition: [...pos],
            speed: ENTITY_CONFIGS[type].speed * (0.8 + Math.random() * 0.4),
            rotation: Math.random() * Math.PI * 2,
            state: type === EntityType.Fairy ? 'flying' : 'wandering'
          });
        }
        setEntities(newEntities);
        entitiesRef.current = newEntities;
      }
    }
  }, [population, grid, entities.length]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const currentEntities = [...entitiesRef.current];
    let changed = false;

    currentEntities.forEach(entity => {
      const config = ENTITY_CONFIGS[entity.type];
      
      // Update position towards target
      const dx = entity.targetPosition[0] - entity.position[0];
      const dz = entity.targetPosition[2] - entity.position[2];
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 0.1) {
        // Pick a new target (preferably a road or a building)
        const newTarget = pickRandomTarget(grid);
        if (newTarget) {
          entity.targetPosition = gridToWorld(newTarget.x, newTarget.y);
          if (entity.type === EntityType.Fairy || entity.type === EntityType.Dragon) {
             entity.targetPosition[1] = 1.0 + Math.random() * 2.0;
          }
          changed = true;
        }
      } else {
        // Move
        const moveStep = entity.speed * delta;
        entity.position[0] += (dx / dist) * moveStep;
        entity.position[2] += (dz / dist) * moveStep;
        
        // Bobbing for flying entities
        if (entity.type === EntityType.Fairy || entity.type === EntityType.Dragon) {
           entity.position[1] = entity.targetPosition[1] + Math.sin(time * 3 + parseFloat(entity.id)) * 0.2;
        } else {
           entity.position[1] = 0.1 + Math.abs(Math.sin(time * 10)) * 0.05; // Walking bob
        }

        // Rotation
        entity.rotation = Math.atan2(dx, dz);
        changed = true;
      }
    });

    if (changed) {
      entitiesRef.current = currentEntities;
      setEntities([...currentEntities]);
    }
  });

  return (
    <group>
      {entities.map(entity => (
        <EntityMesh key={entity.id} entity={entity} />
      ))}
    </group>
  );
};

const EntityMesh: React.FC<{ entity: Entity }> = ({ entity }) => {
  const config = ENTITY_CONFIGS[entity.type];
  
  return (
    <mesh 
      position={entity.position} 
      rotation={[0, entity.rotation, 0]}
      scale={config.size}
    >
      {entity.type === EntityType.Dragon ? (
        <octahedronGeometry args={[1]} />
      ) : entity.type === EntityType.Fairy ? (
        <sphereGeometry args={[0.5]} />
      ) : (
        <boxGeometry args={[1, 1.5, 0.6]} />
      )}
      <meshStandardMaterial 
        color={config.color} 
        emissive={entity.type === EntityType.Fairy ? config.color : undefined}
        emissiveIntensity={entity.type === EntityType.Fairy ? 2 : 0}
      />
    </mesh>
  );
};

function getEntityTypeForBuilding(type: BuildingType): EntityType {
  switch (type) {
    case BuildingType.MagicAcademy:
    case BuildingType.Library:
      return EntityType.Wizard;
    case BuildingType.PoliceStation:
      return EntityType.Knight;
    case BuildingType.Park:
    case BuildingType.LuminaBloom:
    case BuildingType.DruidCircle:
      return EntityType.Fairy;
    case BuildingType.MarketSquare:
    case BuildingType.Commercial:
      return EntityType.Merchant;
    case BuildingType.Landmark:
      return Math.random() > 0.8 ? EntityType.Dragon : EntityType.Knight;
    default:
      return EntityType.Peasant;
  }
}

function pickRandomTarget(grid: Grid): { x: number, y: number } | null {
  const targets: { x: number, y: number }[] = [];
  grid.forEach(row => row.forEach(tile => {
    if (tile.buildingType !== BuildingType.None) {
      targets.push({ x: tile.x, y: tile.y });
    }
  }));
  
  if (targets.length === 0) return null;
  return targets[Math.floor(Math.random() * targets.length)];
}
