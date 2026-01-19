/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MapControls, Float, Outlines, OrthographicCamera, Stars, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { BuildingType, TileData } from '../types';
import { BUILDINGS, GRID_SIZE } from '../constants';
import { EntitySystem } from './EntitySystem';

const WORLD_OFFSET = GRID_SIZE / 2 - 0.5;
const gridToWorld = (x: number, y: number) => [x - WORLD_OFFSET, 0, y - WORLD_OFFSET] as [number, number, number];

const GEOMETRY = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cone: new THREE.ConeGeometry(0.5, 1, 4),
  cylinder: new THREE.CylinderGeometry(0.4, 0.4, 1, 12),
  octa: new THREE.OctahedronGeometry(0.5),
  sphere: new THREE.SphereGeometry(0.5, 16, 16),
  torus: new THREE.TorusGeometry(0.3, 0.05, 12, 24)
};

/**
 * Magical wisps for the Enchanted Forest
 */
const ForestWisps = ({ children }: { children?: React.ReactNode }) => {
  const count = 6;
  const particles = useMemo(() => 
    Array.from({ length: count }).map((_, i) => ({
      orbitRadius: 0.2 + Math.random() * 0.4,
      orbitSpeed: 0.5 + Math.random() * 1.5,
      yOffset: Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      color: ['#4ade80', '#22d3ee', '#f472b6'][i % 3]
    })), [count]);

  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    groupRef.current.children.forEach((child, i) => {
      // Only process the wisps, not any injected children
      if (i >= count) return;
      const p = particles[i];
      const t = time * p.orbitSpeed + p.phase;
      
      child.position.x = Math.cos(t) * p.orbitRadius;
      child.position.z = Math.sin(t) * p.orbitRadius;
      child.position.y = p.yOffset + Math.sin(t * 0.5) * 0.2;
      
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        child.material.opacity = (Math.sin(t) * 0.5 + 0.5) * 0.8;
      }
    });
  });

  return (
    <group ref={groupRef} position={[0, 0.3, 0]}>
      {particles.map((p, i) => (
        <mesh key={i} geometry={GEOMETRY.sphere} scale={0.04}>
          <meshStandardMaterial color={p.color} emissive={p.color} emissiveIntensity={3} transparent />
        </mesh>
      ))}
      {children}
    </group>
  );
};

/**
 * Animated smoke particles that rise and fade
 */
const SmokeEmitter = ({ position, children }: { position?: [number, number, number], children?: React.ReactNode }) => {
  const count = 8;
  const particles = useMemo(() => 
    Array.from({ length: count }).map((_, i) => ({
      offset: Math.random() * Math.PI * 2,
      speed: 0.15 + Math.random() * 0.1,
      startTime: i * (1.0 / count)
    })), [count]);

  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    groupRef.current.children.forEach((child, i) => {
      if (i >= count) return;
      const p = particles[i];
      const cycle = (p.startTime + time * 0.4) % 1.0;
      child.position.y = cycle * 1.5;
      child.position.x = Math.sin(time + p.offset) * 0.15 * cycle;
      child.position.z = Math.cos(time + p.offset) * 0.15 * cycle;
      child.scale.setScalar(0.1 + cycle * 0.2);
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        child.material.opacity = (1.0 - cycle) * 0.6;
      }
    });
  });

  return (
    <group position={position} ref={groupRef}>
      {particles.map((_, i) => (
        <mesh key={i} geometry={GEOMETRY.sphere}>
          <meshStandardMaterial color="#cbd5e1" transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
      {children}
    </group>
  );
};

const MagicBurst = ({ type, level }: { type: BuildingType; level: number }) => {
  const count = 12 + level * 4;
  const particles = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      position: new THREE.Vector3(0, 0.5, 0),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.15,
        Math.random() * 0.2,
        (Math.random() - 0.5) * 0.15
      ),
      scale: Math.random() * 0.2 + 0.1,
      rotation: Math.random() * Math.PI
    }));
  }, [count]);

  const groupRef = useRef<THREE.Group>(null);
  const [life, setLife] = useState(1.0);

  const { geo, color, emissive } = useMemo(() => {
    switch (type) {
      case BuildingType.Residential: return { geo: GEOMETRY.sphere, color: '#fecaca', emissive: '#f87171' };
      case BuildingType.Industrial: return { geo: GEOMETRY.box, color: '#94a3b8', emissive: '#fbbf24' };
      case BuildingType.PowerPlant: return { geo: GEOMETRY.octa, color: '#d946ef', emissive: '#f472b6' };
      case BuildingType.WaterTower: return { geo: GEOMETRY.cone, color: '#60a5fa', emissive: '#3b82f6' };
      case BuildingType.Landmark: return { geo: GEOMETRY.octa, color: '#f59e0b', emissive: '#fcd34d' };
      default: return { geo: GEOMETRY.sphere, color: '#ffffff', emissive: '#ffffff' };
    }
  }, [type]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    setLife((prev) => Math.max(0, prev - delta * 1.5));
    groupRef.current.children.forEach((child, i) => {
      const p = particles[i];
      child.position.add(p.velocity);
      p.velocity.y -= 0.005;
      child.scale.setScalar(p.scale * life);
      child.rotation.x += 0.1;
      child.rotation.z += 0.1;
    });
  });

  if (life <= 0) return null;

  return (
    <group ref={groupRef}>
      {particles.map((_, i) => (
        <mesh key={i} geometry={geo}>
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={2} transparent opacity={life} />
        </mesh>
      ))}
    </group>
  );
};

/**
 * Weather effect particles (Rain, Snow)
 */
const WeatherSystem = ({ weather }: { weather: string }) => {
  const count = 500;
  const particles = useMemo(() => 
    Array.from({ length: count }).map(() => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * GRID_SIZE * 2,
        10 + Math.random() * 10,
        (Math.random() - 0.5) * GRID_SIZE * 2
      ),
      speed: 0.1 + Math.random() * 0.2
    })), [count]);

  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!groupRef.current || weather === 'clear' || weather === 'fog') return;
    groupRef.current.children.forEach((child, i) => {
      const p = particles[i];
      child.position.y -= (weather === 'snow' ? 2 : 10) * delta;
      if (child.position.y < -1) {
        child.position.y = 15;
      }
    });
  });

  if (weather === 'clear' || weather === 'fog') return null;

  return (
    <group ref={groupRef}>
      {particles.map((p, i) => (
        <mesh key={i} position={p.position} geometry={GEOMETRY.sphere} scale={weather === 'snow' ? 0.05 : 0.02}>
          <meshStandardMaterial color={weather === 'snow' ? '#ffffff' : '#60a5fa'} transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
};

const WindmillSails = () => {
  const sailsRef = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (sailsRef.current) sailsRef.current.rotation.z += delta * 2;
  });

  return (
    <group ref={sailsRef}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} rotation={[0, 0, (i * Math.PI) / 2]} position={[0, 0, 0.1]}>
          <boxGeometry args={[0.08, 0.8, 0.02]} />
          <meshStandardMaterial color="#fef3c7" />
          <mesh position={[0.1, 0, 0]}>
            <boxGeometry args={[0.2, 0.7, 0.01]} />
            <meshStandardMaterial color="#fffbeb" transparent opacity={0.8} />
          </mesh>
        </mesh>
      ))}
    </group>
  );
};

// Data-driven Model Schemas
interface BuildingPart {
  geometry?: keyof typeof GEOMETRY | [string, any[]];
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
  color?: string;
  useConfigColor?: boolean;
  emissive?: string;
  emissiveIntensity?: number;
  opacity?: number;
  metalness?: number;
  transparent?: boolean;
  component?: React.ComponentType<any>;
  componentProps?: any;
  children?: BuildingPart[];
}

const ROOF_COLOR = "#991b1b";

const BUILDING_SCHEMAS: Record<string, BuildingPart[] | BuildingPart[][]> = {
  [BuildingType.Residential]: [
    // Variant 0: Classic Square
    [
      { geometry: ['boxGeometry', [1, 1, 1]] as [string, any[]], scale: [0.85, 0.7, 0.85], position: [0, 0.15, 0], useConfigColor: true },
      { geometry: ['coneGeometry', [0.7, 0.6, 4]] as [string, any[]], position: [0, 0.6, 0], rotation: [0, Math.PI / 4, 0], color: ROOF_COLOR }
    ],
    // Variant 1: Twin Peaks
    [
      { geometry: 'box' as const, scale: [0.4, 0.6, 0.7], position: [-0.2, 0.1, 0], useConfigColor: true },
      { geometry: 'box' as const, scale: [0.4, 0.6, 0.7], position: [0.2, 0.1, 0], useConfigColor: true },
      { geometry: ['coneGeometry', [0.4, 0.4, 4]] as [string, any[]], position: [-0.2, 0.5, 0], rotation: [0, Math.PI / 4, 0], color: ROOF_COLOR },
      { geometry: ['coneGeometry', [0.4, 0.4, 4]] as [string, any[]], position: [0.2, 0.5, 0], rotation: [0, Math.PI / 4, 0], color: ROOF_COLOR }
    ],
    // Variant 2: Tall Cottage
    [
      { geometry: 'box' as const, scale: [0.6, 1.0, 0.6], position: [0, 0.3, 0], useConfigColor: true },
      { geometry: ['coneGeometry', [0.6, 0.8, 4]] as [string, any[]], position: [0, 1.0, 0], rotation: [0, Math.PI / 4, 0], color: ROOF_COLOR },
      { geometry: 'box' as const, scale: [0.15, 0.5, 0.15], position: [0.2, 0.8, 0.2], color: "#451a03" }
    ],
    // Variant 3: Round Hut
    [
      { geometry: ['cylinderGeometry', [0.4, 0.4, 1, 12]] as [string, any[]], scale: [0.8, 0.7, 0.8], position: [0, 0.15, 0], useConfigColor: true },
      { geometry: ['coneGeometry', [0.9, 0.7, 16]] as [string, any[]], position: [0, 0.6, 0], color: "#422006" }
    ],
    // Variant 4: L-Shaped Manor
    [
      { geometry: 'box' as const, scale: [0.8, 0.6, 0.4], position: [0, 0.1, -0.1], useConfigColor: true },
      { geometry: 'box' as const, scale: [0.4, 0.6, 0.6], position: [-0.2, 0.1, 0.2], useConfigColor: true },
      { geometry: ['coneGeometry', [0.6, 0.4, 4]] as [string, any[]], position: [0, 0.5, -0.1], rotation: [0, Math.PI / 4, 0], color: ROOF_COLOR },
      { geometry: ['coneGeometry', [0.4, 0.4, 4]] as [string, any[]], position: [-0.2, 0.5, 0.2], rotation: [0, Math.PI / 4, 0], color: ROOF_COLOR }
    ]
  ],
  [BuildingType.Commercial]: [
    // Variant 0: Standard Inn
    [
      { geometry: 'box' as const, scale: [1.2, 0.7, 0.9], position: [0, 0.15, 0], useConfigColor: true },
      { geometry: 'box' as const, scale: [1.3, 0.1, 1.0], position: [0, 0.5, 0], color: "#573010" },
      { geometry: 'box' as const, scale: [1.1, 0.6, 0.8], position: [0, 0.8, 0], useConfigColor: true },
      { geometry: ['coneGeometry', [0.9, 0.6, 4]] as [string, any[]], position: [0, 1.1, 0], rotation: [0, Math.PI/4, 0], color: "#451a03" },
      { geometry: 'box' as const, scale: [0.2, 0.6, 0.2], position: [0.4, 1.0, 0.2], color: "#78350f" }, // Chimney
    ],
    // Variant 1: Round Tavern "The Barrel"
    [
      { geometry: ['cylinderGeometry', [0.6, 0.6, 0.8, 8]] as [string, any[]], position: [0, 0.4, 0], useConfigColor: true },
      { geometry: ['coneGeometry', [0.7, 0.5, 8]] as [string, any[]], position: [0, 1.0, 0], color: "#573010" },
      { geometry: 'box' as const, scale: [0.4, 0.1, 0.3], position: [0, 0.2, 0.6], color: "#451a03" }, // Porch
    ],
    // Variant 2: Outdoor Beer Garden
    [
      { geometry: 'box' as const, scale: [0.6, 0.7, 0.6], position: [-0.2, 0.35, -0.2], useConfigColor: true },
      { geometry: ['coneGeometry', [0.5, 0.5, 4]] as [string, any[]], position: [-0.2, 0.8, -0.2], rotation: [0, Math.PI/4, 0], color: "#573010" },
      { geometry: 'box' as const, scale: [1.2, 0.05, 1.2], position: [0, 0.02, 0], color: "#78350f" }, // Deck
      // Tables
      ...[ [0.3, 0.3], [0.3, -0.3], [-0.3, 0.3] ].map(p => ({
        geometry: 'cylinder' as const, scale: [0.2, 0.05, 0.2] as [number, number, number], position: [p[0], 0.1, p[1]] as [number, number, number], color: "#92400e"
      } as BuildingPart))
    ],
    // Variant 3: Corner Pub
    [
      { geometry: 'box' as const, scale: [0.9, 0.8, 0.9], position: [0, 0.4, 0], useConfigColor: true },
      { geometry: ['coneGeometry', [0.8, 0.6, 4]] as [string, any[]], position: [0, 1.0, 0], rotation: [0, Math.PI/4, 0], color: "#3f1d06" },
      { geometry: 'box' as const, scale: [0.4, 0.4, 0.1], position: [0, 0.6, 0.46], color: "#fbbf24", emissive: "#fbbf24", emissiveIntensity: 0.5 } // Sign
    ]
  ],
  [BuildingType.Industrial]: [
    // Variant 0: Mine Shaft
    [
      { geometry: 'box' as const, scale: [1.2, 0.2, 1.2], position: [0, 0.1, 0], color: "#334155" },
      { geometry: 'box' as const, scale: [0.6, 0.6, 0.6], position: [-0.2, 0.4, -0.2], useConfigColor: true },
      { geometry: 'box' as const, scale: [0.1, 0.8, 0.1], position: [0.3, 0.5, 0.3], color: "#94a3b8" }, // Crane post
      { geometry: 'box' as const, scale: [0.6, 0.05, 0.05], position: [0.1, 0.9, 0.3], rotation: [0, 0, -0.2], color: "#94a3b8" }, // Crane arm
    ],
    // Variant 1: Crystal Quarry
    [
      { geometry: 'box' as const, scale: [1.1, 0.3, 1.1], position: [0, 0.15, 0], color: "#475569" },
      // Crystals
      ...[ [-0.2, 0.3, 0.2], [0.3, 0.2, -0.3], [0, 0.4, 0] ].map((p, i) => ({
        geometry: 'octa' as const, scale: 0.3 - (i*0.05), position: p as [number, number, number], color: "#38bdf8", emissive: "#0ea5e9", emissiveIntensity: 1.5
      } as BuildingPart)),
      { geometry: 'box' as const, scale: [0.4, 0.4, 0.4], position: [-0.3, 0.3, -0.3], useConfigColor: true }
    ],
    // Variant 2: Smelter
    [
      { geometry: 'box' as const, scale: [1, 0.6, 0.8], position: [0, 0.3, 0], useConfigColor: true },
      { geometry: ['cylinderGeometry', [0.2, 0.3, 1, 8]] as [string, any[]], position: [0.3, 0.6, 0.2], color: "#1e293b" }, // Chimney
      { component: SmokeEmitter, position: [0.3, 1.1, 0.2] },
      { geometry: 'sphere' as const, scale: 0.2, position: [-0.3, 0.2, 0.4], color: "#ea580c", emissive: "#c2410c", emissiveIntensity: 2 } // Molten pile
    ],
    // Variant 3: Excavation Pit
    [
      { geometry: 'torus' as const, scale: [1.2, 0.3, 0.5], position: [0, 0.1, 0], rotation: [Math.PI/2, 0, 0], color: "#334155" },
      { geometry: 'box' as const, scale: [0.1, 0.8, 0.1], position: [0, 0.4, 0], color: "#94a3b8" }, // Winch
      { geometry: 'box' as const, scale: [0.5, 0.1, 0.1], position: [0, 0.8, 0], color: "#94a3b8" },
      { geometry: 'box' as const, scale: [0.3, 0.3, 0.3], position: [0.4, 0.2, 0], useConfigColor: true }
    ]
  ],
  [BuildingType.Park]: [
    // Variant 0: Wisps Grove
    [
      { component: ForestWisps },
      ...[[-0.2, 0.2], [0.3, -0.1], [-0.2, -0.3]].map(p => ({
        position: [p[0], 0, p[1]] as [number, number, number],
        children: [
          { geometry: ['cylinderGeometry', [0.05, 0.08, 0.3, 6]] as [string, any[]], position: [0, 0.1, 0], color: "#3f2305" },
          { geometry: ['coneGeometry', [0.25, 0.5, 5]] as [string, any[]], position: [0, 0.4, 0], color: "#14532d" }
        ] as BuildingPart[]
      } as BuildingPart))
    ],
    // Variant 1: Ancient Pond
    [
      { geometry: ['cylinderGeometry', [0.5, 0.5, 0.1, 16]] as [string, any[]], position: [0, 0.05, 0], color: "#0ea5e9", emissive: "#0284c7", emissiveIntensity: 0.5 },
      ...[0, 1, 2, 3].map(i => ({
        geometry: 'sphere' as const, scale: 0.1, position: [Math.cos(i*1.5)*0.55, 0.1, Math.sin(i*1.5)*0.55] as [number, number, number], color: "#57534e"
      } as BuildingPart)),
      { geometry: ['coneGeometry', [0.2, 0.4, 4]] as [string, any[]], position: [-0.3, 0.2, -0.3], color: "#166534" }
    ],
    // Variant 2: Flower Garden
    [
      { geometry: 'box' as const, scale: [1, 0.05, 1], position: [0, 0.02, 0], color: "#14532d" },
      ...Array.from({length: 8}).map((_, i) => ({
        geometry: 'sphere' as const, scale: 0.08, position: [(Math.random()-0.5)*0.8, 0.1, (Math.random()-0.5)*0.8] as [number, number, number], 
        color: ['#f472b6', '#c084fc', '#facc15'][i%3], emissiveIntensity: 0.5
      } as BuildingPart))
    ]
  ],
  [BuildingType.Windmill]: [
    // Variant 0: Classic Dutch
    [
      { geometry: ['cylinderGeometry', [0.4, 0.5, 0.8, 8]] as [string, any[]], position: [0, 0.4, 0], color: "#78350f" },
      { geometry: ['coneGeometry', [0.55, 0.4, 8]] as [string, any[]], position: [0, 0.9, 0], color: "#b45309" },
      { component: WindmillSails, position: [0, 0.7, 0.4] }
    ],
    // Variant 1: Stone Tower Mill
    [
      { geometry: ['cylinderGeometry', [0.35, 0.45, 1.0, 8]] as [string, any[]], position: [0, 0.5, 0], color: "#57534e" },
      { geometry: ['coneGeometry', [0.5, 0.3, 8]] as [string, any[]], position: [0, 1.15, 0], color: "#451a03" },
      { component: WindmillSails, position: [0, 0.9, 0.4] }
    ],
    // Variant 2: Wooden Post Mill
    [
      { geometry: 'box' as const, scale: [0.2, 0.4, 0.2], position: [0, 0.2, 0], color: "#451a03" }, // Base
      { geometry: 'box' as const, scale: [0.5, 0.6, 0.5], position: [0, 0.6, 0], color: "#fef3c7" }, // Body
      { geometry: ['coneGeometry', [0.4, 0.4, 4]] as [string, any[]], position: [0, 1.0, 0], rotation: [0, Math.PI/4, 0], color: "#78350f" },
      { component: WindmillSails, position: [0, 0.7, 0.3] }
    ]
  ],
  [BuildingType.MagicAcademy]: [
    // Variant 0: Floating Crystal Spire
    [
      { geometry: 'cylinder' as const, scale: [0.7, 1.2, 0.7], position: [0, 0.2, 0], color: "#4c1d95" },
      { 
        component: Float, 
        componentProps: { speed: 3, floatIntensity: 1 }, 
        children: [
          { geometry: 'octa' as const, scale: 0.6, position: [0, 1.5, 0], color: "#818cf8", emissive: "#818cf8", emissiveIntensity: 3 }
        ]
      }
    ],
    // Variant 1: Twin Towers
    [
      { geometry: 'box' as const, scale: [0.8, 0.4, 0.6], position: [0, 0.2, 0], color: "#312e81" },
      { geometry: ['cylinderGeometry', [0.15, 0.2, 1.2, 6]] as [string, any[]], position: [-0.25, 0.6, 0], color: "#4c1d95" },
      { geometry: ['cylinderGeometry', [0.15, 0.2, 1.2, 6]] as [string, any[]], position: [0.25, 0.6, 0], color: "#4c1d95" },
      { geometry: ['coneGeometry', [0.25, 0.4, 6]] as [string, any[]], position: [-0.25, 1.3, 0], color: "#c084fc" },
      { geometry: ['coneGeometry', [0.25, 0.4, 6]] as [string, any[]], position: [0.25, 1.3, 0], color: "#c084fc" },
    ],
    // Variant 2: The Orrery
    [
      { geometry: 'cylinder' as const, scale: [0.6, 0.6, 0.6], position: [0, 0.3, 0], color: "#1e1b4b" },
      { 
        component: Float, 
        componentProps: { speed: 1, floatIntensity: 0.2 },
        children: [
          { geometry: 'torus' as const, scale: 0.5, position: [0, 0.8, 0], rotation: [Math.PI/3, 0, 0], color: "#fbbf24", metalness: 1 },
          { geometry: 'sphere' as const, scale: 0.15, position: [0, 0.8, 0], color: "#60a5fa", emissive: "#3b82f6", emissiveIntensity: 2 }
        ]
      }
    ]
  ],
  [BuildingType.PowerPlant]: [
    // Variant 0: Industrial Mage Tower
    [
      { geometry: 'cylinder' as const, scale: [0.5, 1.8, 0.5], position: [0, 0.4, 0], color: "#7c3aed" },
      { geometry: ['cylinderGeometry', [0.1, 0.1, 0.8, 8]] as [string, any[]], position: [0.2, 0.8, 0.2], color: "#1e1b4b" },
      { component: SmokeEmitter, position: [0.2, 1.3, 0.2] },
      { 
        component: Float, 
        componentProps: { speed: 5, floatIntensity: 1.5 },
        children: [
          { geometry: 'sphere' as const, scale: 0.15, position: [0, 2.2, 0], color: "#f472b6", emissive: "#f472b6", emissiveIntensity: 4 }
        ]
      }
    ],
    // Variant 1: Arcane Pylons
    [
      { geometry: 'box' as const, scale: [1, 0.2, 1], position: [0, 0.1, 0], color: "#2e1065" },
      { geometry: 'octa' as const, scale: [0.3, 1.2, 0.3], position: [-0.3, 0.7, -0.3], color: "#8b5cf6", emissive: "#7c3aed", emissiveIntensity: 1 },
      { geometry: 'octa' as const, scale: [0.3, 1.2, 0.3], position: [0.3, 0.7, 0.3], color: "#8b5cf6", emissive: "#7c3aed", emissiveIntensity: 1 },
      { component: ForestWisps } // Reused for magic particles
    ],
    // Variant 2: Void Crystal
    [
      { geometry: 'cone' as const, scale: [0.8, 0.5, 4], position: [0, 0.25, 0], rotation: [0, 0, Math.PI], color: "#1e1b4b" }, // Floating base
      { 
        component: Float, 
        componentProps: { speed: 2, floatIntensity: 0.5 }, 
        children: [
          { geometry: 'octa' as const, scale: 0.7, position: [0, 1.2, 0], color: "#d8b4fe", emissive: "#c084fc", emissiveIntensity: 2, transparent: true, opacity: 0.8 }
        ]
      }
    ]
  ],
  [BuildingType.Landmark]: [
    // Variant 0: The Grand Spire
    [
      { 
        position: [0, 0, 0], scale: 1.4, children: [
          { geometry: 'box' as const, scale: [1.4, 0.8, 1.4], position: [0, 0.2, 0], useConfigColor: true },
          { geometry: 'cone' as const, scale: [1, 0.8, 1], position: [0, 1, 0], rotation: [0, Math.PI/4, 0], color: "#991b1b" },
          { geometry: 'cylinder' as const, scale: [0.2, 1.2, 0.2], position: [0.5, 0.8, 0.5], color: "#b91c1c" },
          { geometry: 'cone' as const, scale: [0.3, 0.4, 8], position: [0.5, 1.5, 0.5], color: "#7f1d1d" }
        ] as BuildingPart[]
      } as BuildingPart
    ],
    // Variant 1: Royal Keep
    [
      { geometry: 'box' as const, scale: [1.2, 0.6, 1.2], position: [0, 0.3, 0], useConfigColor: true },
      // 4 Towers
      ...[[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].map(p => ({
        geometry: ['cylinderGeometry', [0.2, 0.25, 1.2, 8]] as [string, any[]], position: [p[0], 0.6, p[1]] as [number, number, number], color: "#78350f"
      } as BuildingPart)),
      { geometry: ['coneGeometry', [0.6, 0.8, 4]] as [string, any[]], position: [0, 0.8, 0], rotation: [0, Math.PI/4, 0], color: "#991b1b" }
    ],
    // Variant 2: Floating Citadel
    [
       { 
        component: Float, 
        componentProps: { speed: 1, floatIntensity: 0.2 }, 
        children: [
          { geometry: 'octa' as const, scale: 0.6, position: [0, 0.6, 0], color: "#f59e0b" },
          { geometry: 'box' as const, scale: [1.2, 0.2, 1.2], position: [0, 0.6, 0], color: "#b45309" },
          { geometry: 'cone' as const, scale: [0.5, 1, 8], position: [0, 1.2, 0], color: "#92400e" }
        ]
       }
    ]
  ],
  [BuildingType.WaterTower]: [
    // Variant 0: Ancient Well
    [
      { geometry: ['cylinderGeometry', [0.5, 0.5, 0.4, 8]] as [string, any[]], position: [0, 0.2, 0], color: "#64748b" },
      { geometry: ['cylinderGeometry', [0.4, 0.4, 0.1, 8]] as [string, any[]], position: [0, 0.3, 0], color: "#3b82f6", emissive: "#2563eb", emissiveIntensity: 0.5 },
      { geometry: 'box' as const, scale: [0.1, 0.8, 0.1], position: [-0.4, 0.6, 0], color: "#475569" },
      { geometry: 'box' as const, scale: [0.1, 0.8, 0.1], position: [0.4, 0.6, 0], color: "#475569" },
      { geometry: ['coneGeometry', [0.6, 0.3, 4]] as [string, any[]], position: [0, 1.0, 0], rotation: [0, Math.PI/4, 0], color: "#334155" }
    ],
    // Variant 1: Mystic Fountain
    [
      { geometry: ['cylinderGeometry', [0.6, 0.4, 0.2, 8]] as [string, any[]], position: [0, 0.1, 0], useConfigColor: true },
      { geometry: 'sphere' as const, scale: 0.3, position: [0, 0.5, 0], color: "#93c5fd", emissive: "#60a5fa", emissiveIntensity: 1 },
      { 
        component: Float, componentProps: { speed: 4, floatIntensity: 0.2 },
        children: [{ geometry: 'octa' as const, scale: 0.15, position: [0, 0.9, 0], color: "#bfdbfe" }]
      }
    ],
    // Variant 2: Aqueduct Pillar
    [
      { geometry: 'box' as const, scale: [0.4, 1.2, 0.4], position: [0, 0.6, 0], color: "#cbd5e1" },
      { geometry: 'box' as const, scale: [1.2, 0.3, 0.5], position: [0, 1.2, 0], color: "#94a3b8" },
      { geometry: 'box' as const, scale: [1.2, 0.1, 0.3], position: [0, 1.3, 0], color: "#3b82f6" } // Water channel
    ]
  ],
  [BuildingType.PoliceStation]: [
    // Variant 0: Watchtower
    [
      { geometry: 'box' as const, scale: [0.5, 1.2, 0.5], position: [0, 0.6, 0], color: "#94a3b8" },
      { geometry: 'box' as const, scale: [0.6, 0.3, 0.6], position: [0, 1.2, 0], color: "#475569" }, // Battlements
      { geometry: 'box' as const, scale: [0.05, 0.6, 0.05], position: [0.2, 1.4, 0.2], color: "#cbd5e1" }, // Flagpole
    ],
    // Variant 1: Barracks
    [
      { geometry: 'box' as const, scale: [1.0, 0.5, 0.8], position: [0, 0.25, 0], color: "#64748b" },
      { geometry: 'box' as const, scale: [0.4, 0.7, 0.4], position: [-0.3, 0.35, 0.2], color: "#475569" }, // Small tower
      { geometry: ['coneGeometry', [0.3, 0.4, 4]] as [string, any[]], position: [-0.3, 0.8, 0.2], rotation: [0, Math.PI/4, 0], color: "#1e293b" }
    ],
    // Variant 2: Gatehouse
    [
      { geometry: 'box' as const, scale: [0.3, 0.8, 0.4], position: [-0.3, 0.4, 0], color: "#475569" },
      { geometry: 'box' as const, scale: [0.3, 0.8, 0.4], position: [0.3, 0.4, 0], color: "#475569" },
      { geometry: 'box' as const, scale: [0.4, 0.2, 0.2], position: [0, 0.6, 0], color: "#64748b" }, // Bridge
    ]
  ],
  [BuildingType.FireStation]: [
    // Variant 0: Red Spire
    [
      { geometry: ['cylinderGeometry', [0.4, 0.5, 0.6, 6]] as [string, any[]], position: [0, 0.3, 0], color: "#be123c" },
      { geometry: ['coneGeometry', [0.5, 0.8, 6]] as [string, any[]], position: [0, 1.0, 0], color: "#881337" },
      { 
        component: Float, componentProps: { speed: 2, floatIntensity: 0.3 },
        children: [{ geometry: 'sphere' as const, scale: 0.15, position: [0, 1.5, 0], color: "#fb7185", emissive: "#f43f5e", emissiveIntensity: 2 }]
      }
    ],
    // Variant 1: Protection Dome
    [
      { geometry: 'box' as const, scale: [1, 0.2, 1], position: [0, 0.1, 0], color: "#881337" },
      { geometry: ['sphereGeometry', [0.5, 16, 16, 0, Math.PI*2, 0, Math.PI/2]] as [string, any[]], position: [0, 0.2, 0], color: "#e11d48", opacity: 0.7, transparent: true }
    ],
    // Variant 2: Runestone Circle
    [
       { geometry: 'cylinder' as const, scale: [0.8, 0.8, 0.05] as [number, number, number], position: [0, 0.025, 0], color: "#4c0519" },
       ...[0, 1, 2].map(i => ({
         geometry: 'box' as const, scale: [0.15, 0.6, 0.15] as [number, number, number], position: [Math.cos(i*2.1)*0.3, 0.3, Math.sin(i*2.1)*0.3] as [number, number, number], color: "#be123c", rotation: [0, i, 0] as [number, number, number]
       } as BuildingPart)),
       { component: ForestWisps }
    ]
  ],
  [BuildingType.School]: [
    // Variant 0: Library Wing
    [
      { geometry: 'box' as const, scale: [1.2, 0.6, 0.8], position: [0, 0.3, 0], useConfigColor: true },
      { geometry: ['coneGeometry', [0.8, 0.5, 4]] as [string, any[]], position: [0, 0.8, 0], rotation: [0, Math.PI/4, 0], color: "#064e3b" },
      { geometry: 'box' as const, scale: [0.3, 0.1, 0.1], position: [0, 0.7, 0.4], color: "#fbbf24" } // Clock
    ],
    // Variant 1: Lecture Hall (Round)
    [
      { geometry: ['cylinderGeometry', [0.6, 0.6, 0.5, 8]] as [string, any[]], position: [0, 0.25, 0], useConfigColor: true },
      { geometry: ['coneGeometry', [0.7, 0.4, 8]] as [string, any[]], position: [0, 0.7, 0], color: "#065f46" }
    ],
    // Variant 2: Campus Green
    [
      { geometry: 'box' as const, scale: [0.4, 0.8, 0.4], position: [-0.3, 0.4, -0.3], useConfigColor: true },
      { geometry: 'box' as const, scale: [0.4, 0.6, 0.4], position: [0.3, 0.3, 0.3], useConfigColor: true },
      { geometry: 'box' as const, scale: [1.2, 0.05, 1.2], position: [0, 0.02, 0], color: "#064e3b" } // Grass base
    ]
  ],
  [BuildingType.LumberMill]: [
    // Variant 0: Saw Shed
    [
      { geometry: 'box' as const, scale: [1, 0.1, 1], position: [0, 0.05, 0], color: "#78350f" },
      { geometry: 'box' as const, scale: [0.8, 0.5, 0.5], position: [-0.1, 0.3, -0.2], useConfigColor: true },
      { geometry: ['cylinderGeometry', [0.3, 0.3, 0.05, 16]] as [string, any[]], position: [0.2, 0.3, 0.3], rotation: [Math.PI/2, 0, 0], color: "#cbd5e1", metalness: 0.8 } // Saw blade
    ],
    // Variant 1: Log Piles
    [
      { geometry: 'box' as const, scale: [0.5, 0.6, 0.5], position: [-0.2, 0.3, -0.2], useConfigColor: true },
      ...[0, 1, 2].map(i => ({
        geometry: ['cylinderGeometry', [0.1, 0.1, 0.8, 8]] as [string, any[]], position: [0.2, 0.1 + i*0.1, 0.2] as [number, number, number], rotation: [0, 0, Math.PI/2] as [number, number, number], color: "#78350f"
      } as BuildingPart))
    ],
    // Variant 2: Tree Stump Workshop
    [
      { geometry: ['cylinderGeometry', [0.5, 0.6, 0.5, 8]] as [string, any[]], position: [0, 0.25, 0], color: "#3f2305" },
      { geometry: 'box' as const, scale: [0.4, 0.3, 0.4], position: [0, 0.6, 0], color: "#78350f" }
    ]
  ],
  [BuildingType.Bakery]: [
    // Variant 0: Giant Oven
    [
      { geometry: 'box' as const, scale: [0.8, 0.5, 0.8], position: [0, 0.25, 0], useConfigColor: true },
      { geometry: 'box' as const, scale: [0.3, 0.8, 0.3], position: [0.2, 0.5, -0.2], color: "#78350f" }, // Chimney
      { component: SmokeEmitter, position: [0.2, 1.0, -0.2] }
    ],
    // Variant 1: Pie Shop
    [
      { geometry: ['cylinderGeometry', [0.5, 0.5, 0.4, 8]] as [string, any[]], position: [0, 0.2, 0], color: "#fed7aa" },
      { geometry: ['coneGeometry', [0.6, 0.4, 8]] as [string, any[]], position: [0, 0.6, 0], color: "#c2410c" }
    ],
    // Variant 2: Millstone Attached
    [
      { geometry: 'box' as const, scale: [0.7, 0.5, 0.5], position: [-0.1, 0.25, 0], useConfigColor: true },
      { geometry: ['cylinderGeometry', [0.25, 0.25, 0.1, 12]] as [string, any[]], position: [0.3, 0.1, 0.3], color: "#a8a29e" }
    ]
  ],
  [BuildingType.Library]: [
    // Variant 0: Grand Archive
    [
      { geometry: 'box' as const, scale: [1.2, 0.4, 0.8], position: [0, 0.2, 0], useConfigColor: true },
      { geometry: 'box' as const, scale: [0.8, 0.6, 0.6], position: [0, 0.7, 0], useConfigColor: true },
      { geometry: ['coneGeometry', [0.5, 0.4, 4]] as [string, any[]], position: [0, 1.2, 0], rotation: [0, Math.PI/4, 0], color: "#1e3a8a" }
    ],
    // Variant 1: Scroll Tower
    [
      { geometry: ['cylinderGeometry', [0.4, 0.4, 1.2, 8]] as [string, any[]], position: [0, 0.6, 0], useConfigColor: true },
      { geometry: ['coneGeometry', [0.5, 0.4, 8]] as [string, any[]], position: [0, 1.4, 0], color: "#172554" }
    ],
    // Variant 2: Scriptorium
    [
      { geometry: 'box' as const, scale: [0.9, 0.5, 0.9], position: [0, 0.25, 0], useConfigColor: true },
      { geometry: 'box' as const, scale: [0.4, 0.1, 0.4], position: [0, 0.6, 0], color: "#bfdbfe" } // Skylight
    ]
  ],
  [BuildingType.LuminaBloom]: [
    // Variant 0: Giant Radiant Flower
    [
      { geometry: ['cylinderGeometry', [0.05, 0.08, 0.8, 6]] as [string, any[]], position: [0, 0.4, 0], color: "#14532d" },
      { 
        component: Float, componentProps: { speed: 2, floatIntensity: 0.3 },
        children: [{ geometry: 'sphere' as const, scale: 0.3, position: [0, 1.0, 0], color: "#d946ef", emissive: "#f0abfc", emissiveIntensity: 1.5 }]
      }
    ],
    // Variant 1: Mushroom Cluster
    [
      ...[0, 1, 2].map(i => ({
        position: [Math.cos(i*2.1)*0.3, 0, Math.sin(i*2.1)*0.3] as [number, number, number],
        children: [
          { geometry: ['cylinderGeometry', [0.04, 0.06, 0.4, 6]] as [string, any[]], position: [0, 0.2, 0], color: "#fdf4ff" },
          { geometry: ['coneGeometry', [0.2, 0.2, 6]] as [string, any[]], position: [0, 0.4, 0], color: "#c084fc", emissive: "#d8b4fe", emissiveIntensity: 1 }
        ] as BuildingPart[]
      } as BuildingPart))
    ],
    // Variant 2: Floating Orbs
    [
      { component: ForestWisps }
    ]
  ],
  [BuildingType.GrandObservatory]: [
    { geometry: ['cylinderGeometry', [0.9, 0.4, 0.9]] as [string, any[]], position: [0, 0, 0], color: "#1e1b4b" },
    { geometry: ['sphereGeometry', [0.6, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]] as [string, any[]], position: [0, 0.5, 0], color: "#312e81" },
    { geometry: ['cylinderGeometry', [0.1, 0.15, 1.2, 12]] as [string, any[]], position: [0, 0.7, 0.2], rotation: [-Math.PI / 4, 0, 0], color: "#4c1d95", metalness: 0.8 },
    { 
      component: Float, 
      componentProps: { speed: 2, floatIntensity: 0.5 },
      children: [
        { geometry: 'sphere' as const, scale: 0.05, position: [0.3, 1.2, 0.5], color: "#fbbf24", emissive: "#fbbf24", emissiveIntensity: 2 }
      ]
    }
  ],
  [BuildingType.MarketSquare]: [
    // Variant 0: Classic Fountain Square
    [
      { geometry: 'box' as const, scale: [1.2, 0.1, 1.2], position: [0, -0.05, 0], color: "#94a3b8" },
      ...[[-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]].map((p, i) => ({
        position: [p[0], 0.2, p[1]] as [number, number, number],
        children: [
          { geometry: 'box' as const, scale: [0.3, 0.3, 0.3], color: i % 2 === 0 ? "#ef4444" : "#3b82f6" },
          { geometry: ['coneGeometry', [0.25, 0.15, 4]] as [string, any[]], position: [0, 0.2, 0], rotation: [0, Math.PI / 4, 0], color: "#fffbeb" }
        ] as BuildingPart[]
      } as BuildingPart)),
      { geometry: 'cylinder' as const, scale: [0.2, 0.3, 0.2], position: [0, 0.15, 0], color: "#64748b" },
      { geometry: 'sphere' as const, scale: 0.08, position: [0, 0.35, 0], color: "#60a5fa", emissive: "#60a5fa", emissiveIntensity: 2 }
    ],
    // Variant 1: Festival Ground
    [
      { geometry: 'box' as const, scale: [1.2, 0.1, 1.2], position: [0, -0.05, 0], color: "#94a3b8" },
      { geometry: 'cylinder' as const, scale: [0.1, 0.8, 0.1], position: [0, 0.3, 0], color: "#78350f" },
      { geometry: 'sphere' as const, scale: 0.05, position: [0, 0.8, 0], color: "#fbbf24", emissive: "#fbbf24", emissiveIntensity: 2 },
      ...[0, 1, 2, 3].map(i => ({
        rotation: [0, (i * Math.PI) / 2, 0] as [number, number, number],
        children: [{ geometry: ['boxGeometry', [0.02, 0.6, 0.1]] as [string, any[]], position: [0.4, 0.3, 0], color: i % 2 === 0 ? "#8b5cf6" : "#f43f5e" }] as BuildingPart[]
      } as BuildingPart)),
      { geometry: 'box' as const, scale: 0.2, position: [0.3, 0.1, 0.3], color: "#d97706" }
    ],
    // Variant 2: Densely Packed
    [
      { geometry: 'box' as const, scale: [1.2, 0.1, 1.2], position: [0, -0.05, 0], color: "#94a3b8" },
      { geometry: ['boxGeometry', [0.4, 0.4, 0.3]] as [string, any[]], position: [-0.3, 0.15, 0.1], rotation: [0, 0.2, 0], color: "#ef4444" },
      { geometry: ['boxGeometry', [0.4, 0.4, 0.3]] as [string, any[]], position: [0.3, 0.15, -0.2], rotation: [0, -0.4, 0], color: "#3b82f6" },
      ...[[-0.2, -0.35], [0.1, 0.35], [0.35, 0.3]].map(p => ({
        geometry: 'box' as const, scale: 0.15, position: [p[0], 0.05, p[1]] as [number, number, number], color: "#451a03"
      } as BuildingPart)),
      { geometry: 'cylinder' as const, scale: [0.15, 0.2, 0.15], position: [0, 0.1, -0.1], color: "#1e3a8a" }
    ],
    // Variant 3: Mystic Bazaar
    [
      { geometry: 'box' as const, scale: [1.2, 0.1, 1.2], position: [0, -0.05, 0], color: "#94a3b8" },
      { geometry: 'box' as const, scale: [0.8, 0.05, 0.8], position: [0, 0, 0], color: "#4c1d95", emissive: "#4c1d95", emissiveIntensity: 0.5 },
      { 
        component: Float, 
        componentProps: { speed: 5, floatIntensity: 0.5 },
        children: [{ geometry: 'octa' as const, scale: 0.25, position: [0, 0.5, 0], color: "#d946ef", emissive: "#d946ef", emissiveIntensity: 2 }]
      },
      ...[[-0.4, 0], [0.4, 0], [0, -0.4], [0, 0.4]].map(p => ({
        geometry: 'cone' as const, scale: [0.15, 0.3, 4], position: [p[0], 0.15, p[1]] as [number, number, number], color: "#fbbf24", metalness: 0.8
      } as BuildingPart))
    ]
  ],
  [BuildingType.Clocktower]: [
    { geometry: 'box' as const, scale: [0.7, 1.5, 0.7], position: [0, 0.45, 0], color: "#451a03" },
    { geometry: ['cylinderGeometry', [0.3, 0.3, 0.1, 12]] as [string, any[]], position: [0, 1.2, 0.36], rotation: [Math.PI/2, 0, 0], color: "#fef3c7", emissive: "#fef3c7", emissiveIntensity: 1 }, // Clock face
    { geometry: ['coneGeometry', [0.6, 0.6, 4]] as [string, any[]], position: [0, 1.5, 0], rotation: [0, Math.PI/4, 0], color: "#991b1b" }
  ],
  [BuildingType.DruidCircle]: [
    { geometry: ['cylinderGeometry', [1.0, 1.0, 0.05, 16]] as [string, any[]], position: [0, 0.025, 0], color: "#065f46" }, // Grass base
    ...[0, 1, 2, 3, 4].map(i => ({
      geometry: 'box' as const, scale: [0.2, 0.8, 0.3] as [number, number, number], position: [Math.cos(i*1.2)*0.6, 0.4, Math.sin(i*1.2)*0.6] as [number, number, number], rotation: [0, i*1.2, 0] as [number, number, number], color: "#57534e"
    } as BuildingPart)),
    { component: ForestWisps, position: [0, 0.2, 0] }
  ],
  [BuildingType.GreatPortal]: [
    { geometry: 'box' as const, scale: [1.8, 0.2, 1.8], position: [0, -0.4, 0], color: "#1e1b4b" }, // Platform
    { geometry: 'box' as const, scale: [0.4, 1.2, 0.4], position: [-0.7, 0.2, -0.7], color: "#312e81" }, // Pillar 1
    { geometry: 'box' as const, scale: [0.4, 1.2, 0.4], position: [0.7, 0.2, 0.7], color: "#312e81" }, // Pillar 2
    { 
      component: Float, componentProps: { speed: 2, floatIntensity: 0.5 },
      children: [
        { 
          geometry: 'torus' as const, scale: 1.2, position: [0, 1.2, 0], rotation: [0, Math.PI/4, 0], color: "#818cf8", metalness: 1, transparent: true, opacity: 0.8,
          children: [
            { geometry: 'sphere' as const, scale: 0.3, position: [0, 0, 0], color: "#c084fc", emissive: "#d8b4fe", emissiveIntensity: 5 }
          ]
        }
      ]
    },
    { component: ForestWisps, position: [0, 0.5, 0] },
    { component: SmokeEmitter, position: [0, -0.2, 0] } // Magic mist
  ]
};

/**
 * Renders individual parts of a building based on schema
 */
const PartRenderer = ({ part, color }: { part: BuildingPart, color: string }) => {
  const { geometry, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, useConfigColor, emissive, emissiveIntensity, opacity = 1, transparent, metalness = 0, component: Component, componentProps, children } = part;

  const meshGeometry = useMemo(() => {
    if (!geometry) return null;
    if (Array.isArray(geometry)) {
      const [type, args] = geometry;
      const Cls = (THREE as any)[type.charAt(0).toUpperCase() + type.slice(1)];
      return new Cls(...args);
    }
    return GEOMETRY[geometry as keyof typeof GEOMETRY];
  }, [geometry]);

  const content = (
    <>
      {meshGeometry && (
        <mesh position={position} rotation={rotation} scale={typeof scale === 'number' ? [scale, scale, scale] : scale}>
          <primitive object={meshGeometry} attach="geometry" />
          <meshStandardMaterial 
            color={useConfigColor ? color : part.color} 
            emissive={emissive} 
            emissiveIntensity={emissiveIntensity} 
            opacity={opacity} 
            transparent={transparent}
            metalness={metalness}
          />
        </mesh>
      )}
      {children?.map((child, i) => (
        <PartRenderer key={i} part={child} color={color} />
      ))}
    </>
  );

  if (Component) {
    return (
      <group position={position} rotation={rotation}>
        <Component {...componentProps}>
          {content}
        </Component>
      </group>
    );
  }

  return content;
};

/**
 * Creates a grassy texture for the ground plane
 */
const createProceduralTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (!context) return null;
  
  context.fillStyle = '#064e3b';
  context.fillRect(0, 0, 128, 128);
  
  for (let i = 0; i < 200; i++) {
    context.fillStyle = `rgba(16, 185, 129, ${Math.random() * 0.2})`;
    context.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(GRID_SIZE, GRID_SIZE);
  return texture;
};

/**
 * Individual tile component
 */
const Tile = ({ tile, onClick, isSelected }: { tile: TileData, onClick: (variant: number) => void, isSelected: boolean }) => {
  const config = BUILDINGS[tile.buildingType];
  const worldPos = gridToWorld(tile.x, tile.y);
  
  const variant = useMemo(() => {
    if (tile.variant !== undefined) return tile.variant;
    return Math.floor(Math.random() * 100);
  }, [tile.variant]);

  const schema = useMemo(() => {
    const s = BUILDING_SCHEMAS[tile.buildingType];
    if (!s) return null;
    if (Array.isArray(s[0])) {
      const variants = s as BuildingPart[][];
      return variants[variant % variants.length];
    }
    return s as BuildingPart[];
  }, [tile.buildingType, variant]);

  return (
    <group position={worldPos} onClick={(e) => { e.stopPropagation(); onClick(variant); }}>
      {/* Base Tile */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.49, 0]} receiveShadow>
        <planeGeometry args={[0.95, 0.95]} />
        <meshStandardMaterial color={isSelected ? "#fbbf24" : (tile.buildingType === BuildingType.Road ? "#475569" : "#1e293b")} />
      </mesh>

      {/* Building Parts */}
      {schema?.map((part, i) => (
        <PartRenderer key={i} part={part} color={config.color} />
      ))}

      {/* Level Indicators (Gems) */}
      {tile.buildingType !== BuildingType.None && tile.buildingType !== BuildingType.Road && tile.level > 1 && (
        <group position={[0, 0.1, 0]}>
          {Array.from({ length: tile.level - 1 }).map((_, i) => (
            <mesh key={i} position={[0.3, 0.2 + i * 0.15, 0.3]} geometry={GEOMETRY.octa} scale={0.05}>
              <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={2} />
            </mesh>
          ))}
        </group>
      )}

      {/* Status Effects */}
      {!tile.hasMana && tile.buildingType !== BuildingType.None && tile.buildingType !== BuildingType.Road && (
        <Float speed={5} rotationIntensity={2} floatIntensity={1}>
          <mesh position={[0, 1.5, 0]} geometry={GEOMETRY.octa} scale={0.1}>
            <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" />
          </mesh>
        </Float>
      )}
    </group>
  );
};

/**
 * Main Isometric Map component
 */
const IsoMap = ({ grid, onTileClick, selectedTool, time, weather, population, isLocked }: any) => {
  const groundTexture = useMemo(() => createProceduralTexture(), []);

  return (
    <div className={`w-full h-full ${isLocked ? 'pointer-events-none' : ''}`}>
      <Canvas shadows dpr={[1, 2]}>
        <OrthographicCamera makeDefault position={[50, 50, 50]} zoom={40} near={0.1} far={1000} />
        <MapControls enableRotate={false} minZoom={20} maxZoom={100} />
        
        <ambientLight intensity={weather === 'storm' ? 0.1 : 0.4} color="#fed7aa" />
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={weather === 'clear' ? 1.8 : 0.6} 
          color="#fff7ed"
          castShadow 
          shadow-mapSize={[2048, 2048]}
        />
        
        <Sky sunPosition={[Math.cos(time * Math.PI / 12), Math.sin(time * Math.PI / 12), 0]} />
        {time > 18 || time < 6 ? <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} /> : null}

        <group>
          <EntitySystem grid={grid} population={population} />
          <WeatherSystem weather={weather} />
          
          {/* Ground Plane */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
            <planeGeometry args={[GRID_SIZE + 10, GRID_SIZE + 10]} />
            {groundTexture && <meshStandardMaterial map={groundTexture} color="#064e3b" roughness={1} />}
            {!groundTexture && <meshStandardMaterial color="#064e3b" roughness={1} />}
          </mesh>

          {/* Grid of Tiles */}
          {grid.map((row: TileData[], y: number) => row.map((tile: TileData, x: number) => (
            <Tile 
              key={`${x}-${y}`} 
              tile={tile} 
              onClick={(variant) => onTileClick(x, y, variant)} 
              isSelected={false}
            />
          )))}
        </group>
      </Canvas>
    </div>
  );
};

export default IsoMap;
