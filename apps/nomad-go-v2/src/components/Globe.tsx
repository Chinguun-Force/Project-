import { useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";

// Mission markers for Mongolia
const missionMarkers = [
  { lat: 47.9185, lon: 106.9177, name: "Ulaanbaatar" },
  { lat: 47.9077, lon: 107.4333, name: "Terelj" },
  { lat: 47.2046, lon: 102.8256, name: "Khogno Khan" },
  { lat: 49.036, lon: 104.055, name: "Khuvsgul Lake" },
  { lat: 43.5702, lon: 104.4228, name: "Gobi Desert" },
  { lat: 46.2725, lon: 106.6047, name: "Kharkhorin" },
];

function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

function GlobeMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 0.3;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 0.3;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += delta * 0.1;

    // Smooth mouse follow
    targetRef.current.x += (mouseRef.current.x - targetRef.current.x) * 0.05;
    targetRef.current.y += (mouseRef.current.y - targetRef.current.y) * 0.05;
    meshRef.current.rotation.x = targetRef.current.y * 0.3;
  });

  const globeMaterial = useMemo(() => {
    return new THREE.MeshPhongMaterial({
      color: new THREE.Color("#1A1D26"),
      emissive: new THREE.Color("#0a0c12"),
      specular: new THREE.Color("#F4C64D"),
      shininess: 30,
      transparent: true,
      opacity: 0.95,
    });
  }, []);

  return (
    <group>
      {/* Main globe */}
      <mesh ref={meshRef} material={globeMaterial}>
        <sphereGeometry args={[2, 64, 64]} />
      </mesh>

      {/* Atmosphere glow */}
      <mesh>
        <sphereGeometry args={[2.08, 64, 64]} />
        <meshBasicMaterial
          color={new THREE.Color("#A8C69F")}
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Gold rim glow */}
      <mesh>
        <sphereGeometry args={[2.12, 64, 64]} />
        <meshBasicMaterial
          color={new THREE.Color("#F4C64D")}
          transparent
          opacity={0.04}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Mission markers */}
      {missionMarkers.map((marker, i) => {
        const pos = latLonToVector3(marker.lat, marker.lon, 2.05);
        return (
          <group key={i} position={pos}>
            {/* Marker dot */}
            <mesh>
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshBasicMaterial
                color={new THREE.Color("#F4C64D")}
                transparent
                opacity={0.9}
              />
            </mesh>
            {/* Glow ring */}
            <mesh>
              <ringGeometry args={[0.04, 0.06, 16]} />
              <meshBasicMaterial
                color={new THREE.Color("#A8C69F")}
                transparent
                opacity={0.5}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}

      {/* Wireframe overlay */}
      <mesh>
        <sphereGeometry args={[2.01, 32, 32]} />
        <meshBasicMaterial
          color={new THREE.Color("#A8C69F")}
          transparent
          opacity={0.06}
          wireframe
        />
      </mesh>
    </group>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 3, 5]} intensity={1} color="#ffffff" />
      <pointLight position={[-5, -3, -5]} intensity={0.3} color="#F4C64D" />
      <GlobeMesh />
      <Stars
        radius={100}
        depth={50}
        count={2000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />
    </>
  );
}

export default function Globe() {
  return (
    <div className="w-full h-full min-h-[400px]">
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
