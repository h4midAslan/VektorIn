import { useRef, useMemo, useEffect, useState, useCallback, createContext, useContext } from "react";
import { Link } from "react-router-dom";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial, Float, Stars, Trail, Html } from "@react-three/drei";
import { motion, useScroll, useTransform, AnimatePresence, useSpring } from "framer-motion";
import * as THREE from "three";
import { ArrowRight, Users, BookOpen, Network, FileText, ChevronDown, Globe, Shield } from "lucide-react";

/* ═══════════════════════════════════════
   MOBILE HOOK
═══════════════════════════════════════ */
function useMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return isMobile;
}

/* ═══════════════════════════════════════
   3D: REALISTIC AIRPLANE
═══════════════════════════════════════ */
function RealisticPlane({ orbitRadius = 2.8, speed = 0.22, tilt = 0.35 }) {
  const groupRef = useRef();
  const trailRef = useRef();
  const engineGlowRef1 = useRef();
  const engineGlowRef2 = useRef();
  const angle = useRef(0);

  useFrame((_, delta) => {
    angle.current += delta * speed;
    const a = angle.current;

    const x = Math.cos(a) * orbitRadius;
    const z = Math.sin(a) * orbitRadius;
    const y = Math.sin(a * 0.5) * 0.6 + 0.3;

    if (groupRef.current) {
      groupRef.current.position.set(x, y, z);
      // Face direction of travel
      const nextA = a + 0.01;
      const nx = Math.cos(nextA) * orbitRadius;
      const nz = Math.sin(nextA) * orbitRadius;
      const ny = Math.sin(nextA * 0.5) * 0.6 + 0.3;
      const dir = new THREE.Vector3(nx - x, ny - y, nz - z).normalize();
      groupRef.current.lookAt(
        groupRef.current.position.x + dir.x,
        groupRef.current.position.y + dir.y,
        groupRef.current.position.z + dir.z,
      );
      // Bank into the turn
      groupRef.current.rotateZ(-tilt);
    }

    // Engine glow pulse
    const pulse = 0.6 + Math.sin(Date.now() * 0.008) * 0.4;
    if (engineGlowRef1.current) engineGlowRef1.current.intensity = pulse * 1.8;
    if (engineGlowRef2.current) engineGlowRef2.current.intensity = pulse * 1.8;
  });

  const silver = { color: "#c8d4e0", metalness: 0.95, roughness: 0.12 };
  const dark   = { color: "#1a2233", metalness: 0.9,  roughness: 0.2  };
  const glass  = { color: "#3b82f6", metalness: 0.5,  roughness: 0.05, transparent: true, opacity: 0.7 };

  return (
    <group ref={groupRef}>
      {/* Trail */}
      <Trail
        width={0.06}
        length={18}
        color="#ffffff"
        attenuation={(t) => t * t}
        target={groupRef}
      >
        <mesh>
          <sphereGeometry args={[0.001]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </Trail>

      {/* Engine glows */}
      <pointLight ref={engineGlowRef1} position={[-0.09, -0.02, 0.06]} color="#60a5fa" intensity={1.8} distance={0.6} />
      <pointLight ref={engineGlowRef2} position={[0.09, -0.02, 0.06]}  color="#60a5fa" intensity={1.8} distance={0.6} />

      {/* ── FUSELAGE ── */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.028, 0.022, 0.38, 16]} />
        <meshStandardMaterial {...silver} />
      </mesh>
      {/* Nose cone */}
      <mesh position={[0, 0, -0.21]}>
        <coneGeometry args={[0.028, 0.08, 16]} />
        <meshStandardMaterial {...silver} />
      </mesh>
      {/* Tail cone */}
      <mesh position={[0, 0.006, 0.21]}>
        <coneGeometry args={[0.022, 0.07, 16]} />
        <meshStandardMaterial {...silver} />
      </mesh>

      {/* ── COCKPIT WINDOWS ── */}
      <mesh position={[0, 0.022, -0.17]} rotation={[0.5, 0, 0]}>
        <boxGeometry args={[0.038, 0.012, 0.018]} />
        <meshStandardMaterial {...glass} />
      </mesh>

      {/* ── MAIN WINGS ── */}
      {/* Left wing */}
      <mesh position={[-0.14, -0.004, 0.02]} rotation={[0, 0, 0.06]}>
        <boxGeometry args={[0.22, 0.008, 0.09]} />
        <meshStandardMaterial {...silver} />
      </mesh>
      {/* Right wing */}
      <mesh position={[0.14, -0.004, 0.02]} rotation={[0, 0, -0.06]}>
        <boxGeometry args={[0.22, 0.008, 0.09]} />
        <meshStandardMaterial {...silver} />
      </mesh>
      {/* Wing tips - left */}
      <mesh position={[-0.245, 0.01, 0.015]} rotation={[0, 0, 0.4]}>
        <boxGeometry args={[0.03, 0.022, 0.05]} />
        <meshStandardMaterial {...silver} />
      </mesh>
      {/* Wing tips - right */}
      <mesh position={[0.245, 0.01, 0.015]} rotation={[0, 0, -0.4]}>
        <boxGeometry args={[0.03, 0.022, 0.05]} />
        <meshStandardMaterial {...silver} />
      </mesh>

      {/* ── ENGINES (under wings) ── */}
      {/* Left engine */}
      <group position={[-0.1, -0.022, 0.03]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.018, 0.016, 0.075, 12]} />
          <meshStandardMaterial {...dark} />
        </mesh>
        {/* Engine intake */}
        <mesh position={[0, 0, -0.038]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.01, 0.018, 12]} />
          <meshStandardMaterial color="#0a1628" metalness={1} roughness={0.1} />
        </mesh>
        {/* Engine glow ring */}
        <mesh position={[0, 0, 0.038]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.005, 0.015, 12]} />
          <meshStandardMaterial color="#93c5fd" emissive="#3b82f6" emissiveIntensity={2} transparent opacity={0.85} />
        </mesh>
      </group>
      {/* Right engine */}
      <group position={[0.1, -0.022, 0.03]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.018, 0.016, 0.075, 12]} />
          <meshStandardMaterial {...dark} />
        </mesh>
        <mesh position={[0, 0, -0.038]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.01, 0.018, 12]} />
          <meshStandardMaterial color="#0a1628" metalness={1} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0, 0.038]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.005, 0.015, 12]} />
          <meshStandardMaterial color="#93c5fd" emissive="#3b82f6" emissiveIntensity={2} transparent opacity={0.85} />
        </mesh>
      </group>

      {/* ── HORIZONTAL STABILIZER ── */}
      <mesh position={[-0.07, 0.005, 0.175]} rotation={[0, 0, 0.04]}>
        <boxGeometry args={[0.1, 0.006, 0.038]} />
        <meshStandardMaterial {...silver} />
      </mesh>
      <mesh position={[0.07, 0.005, 0.175]} rotation={[0, 0, -0.04]}>
        <boxGeometry args={[0.1, 0.006, 0.038]} />
        <meshStandardMaterial {...silver} />
      </mesh>

      {/* ── VERTICAL STABILIZER ── */}
      <mesh position={[0, 0.038, 0.175]}>
        <boxGeometry args={[0.006, 0.055, 0.05]} />
        <meshStandardMaterial {...silver} />
      </mesh>

      {/* ── FUSELAGE STRIPE ── */}
      <mesh position={[0, 0.012, 0]}>
        <cylinderGeometry args={[0.0285, 0.0285, 0.3, 16, 1, true]} />
        <meshStandardMaterial color="#1d4ed8" metalness={0.6} roughness={0.3} transparent opacity={0.9} />
      </mesh>

      {/* ── CABIN WINDOWS (row) ── */}
      {[-0.1, -0.06, -0.02, 0.02, 0.06, 0.1].map((z, i) => (
        <mesh key={i} position={[0.029, 0.01, z]}>
          <boxGeometry args={[0.002, 0.009, 0.012]} />
          <meshStandardMaterial color="#bfdbfe" emissive="#3b82f6" emissiveIntensity={0.8} transparent opacity={0.9} />
        </mesh>
      ))}
      {[-0.1, -0.06, -0.02, 0.02, 0.06, 0.1].map((z, i) => (
        <mesh key={i} position={[-0.029, 0.01, z]}>
          <boxGeometry args={[0.002, 0.009, 0.012]} />
          <meshStandardMaterial color="#bfdbfe" emissive="#3b82f6" emissiveIntensity={0.8} transparent opacity={0.9} />
        </mesh>
      ))}

      {/* Nav lights */}
      <mesh position={[-0.246, 0.018, 0.015]}>
        <sphereGeometry args={[0.005, 6, 6]} />
        <meshStandardMaterial color="#ff4444" emissive="#ff0000" emissiveIntensity={3} />
      </mesh>
      <mesh position={[0.246, 0.018, 0.015]}>
        <sphereGeometry args={[0.005, 6, 6]} />
        <meshStandardMaterial color="#44ff44" emissive="#00ff44" emissiveIntensity={3} />
      </mesh>
      {/* Strobe */}
      <mesh position={[0, -0.002, 0]}>
        <sphereGeometry args={[0.004, 6, 6]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════
   3D: ORBIT RINGS
═══════════════════════════════════════ */
function OrbitRings() {
  const ring1 = useRef();
  const ring2 = useRef();
  const ring3 = useRef();

  useFrame((_, delta) => {
    if (ring1.current) ring1.current.rotation.z += delta * 0.12;
    if (ring2.current) ring2.current.rotation.x += delta * 0.08;
    if (ring3.current) {
      ring3.current.rotation.y += delta * 0.06;
      ring3.current.rotation.z += delta * 0.04;
    }
  });

  return (
    <group>
      {/* Ring 1 — equatorial */}
      <mesh ref={ring1} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.95, 0.004, 8, 120]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.35} />
      </mesh>

      {/* Ring 2 — tilted */}
      <mesh ref={ring2} rotation={[0.6, 0.3, 0]}>
        <torusGeometry args={[2.15, 0.003, 8, 120]} />
        <meshBasicMaterial color="#818cf8" transparent opacity={0.25} />
      </mesh>

      {/* Ring 3 — outer glow ring */}
      <mesh ref={ring3} rotation={[1.1, 0.5, 0.2]}>
        <torusGeometry args={[2.38, 0.002, 8, 120]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.18} />
      </mesh>

      {/* Ring glow dashes on ring1 */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.95, 0, Math.sin(a) * 1.95]}>
            <sphereGeometry args={[0.016, 6, 6]} />
            <meshBasicMaterial color="#7dd3fc" transparent opacity={0.7} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ═══════════════════════════════════════
   3D: GLOBE WITH NODES
═══════════════════════════════════════ */
function GlobeNodes() {
  const groupRef = useRef();
  const nodeCount = 32;

  const nodes = useMemo(() => {
    return Array.from({ length: nodeCount }, () => {
      const phi = Math.acos(-1 + 2 * Math.random());
      const theta = Math.random() * Math.PI * 2;
      const r = 1.55;
      return new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
    });
  }, []);

  const lineGeometries = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < nodes.length; i++)
      for (let j = i + 1; j < nodes.length; j++)
        if (nodes[i].distanceTo(nodes[j]) < 1.05)
          pairs.push(new THREE.BufferGeometry().setFromPoints([nodes[i], nodes[j]]));
    return pairs;
  }, [nodes]);

  // Baku: lat 40.41°N, lon 49.87°E → sphere coords (r=1.55)
  const bakuPos = useMemo(() => {
    const phi   = (90 - 40.41) * (Math.PI / 180);
    const theta = 49.87        * (Math.PI / 180);
    return new THREE.Vector3(
      1.58 * Math.sin(phi) * Math.cos(theta),
      1.58 * Math.cos(phi),
      1.58 * Math.sin(phi) * Math.sin(theta),
    );
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.06;
    }
  });

  return (
    <group ref={groupRef}>
      <Sphere args={[1.5, 64, 64]}>
        <MeshDistortMaterial
          color="#071630"
          emissive="#0a3a7a"
          emissiveIntensity={0.5}
          distort={0.06}
          speed={1.0}
          roughness={0.15}
          metalness={0.9}
          transparent
          opacity={0.9}
        />
      </Sphere>
      <Sphere args={[1.52, 32, 32]}>
        <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.05} />
      </Sphere>
      {lineGeometries.map((geo, i) => (
        <line key={i} geometry={geo}>
          <lineBasicMaterial color="#38bdf8" transparent opacity={0.22} />
        </line>
      ))}
      {nodes.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.024, 8, 8]} />
          <meshBasicMaterial color="#7dd3fc" />
        </mesh>
      ))}
      <Sphere args={[1.68, 32, 32]}>
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.03} side={THREE.BackSide} />
      </Sphere>

      {/* ── BAKU POINT ── */}
      <BakuPoint position={bakuPos} />
    </group>
  );
}

/* ═══════════════════════════════════════
   3D: BAKU POINT
═══════════════════════════════════════ */
function BakuPoint({ position }) {
  const dotRef   = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Pulsing dot
    if (dotRef.current) {
      const s = 1 + Math.sin(t * 2.5) * 0.35;
      dotRef.current.scale.setScalar(s);
    }
    // Expanding rings
    if (ring1Ref.current) {
      const s1 = 1 + ((t * 0.8) % 1) * 2.5;
      ring1Ref.current.scale.setScalar(s1);
      ring1Ref.current.material.opacity = Math.max(0, 0.7 - ((t * 0.8) % 1) * 0.7);
    }
    if (ring2Ref.current) {
      const s2 = 1 + (((t * 0.8) + 0.5) % 1) * 2.5;
      ring2Ref.current.scale.setScalar(s2);
      ring2Ref.current.material.opacity = Math.max(0, 0.7 - (((t * 0.8) + 0.5) % 1) * 0.7);
    }
  });

  return (
    <group position={position}>
      {/* Core glowing dot */}
      <mesh ref={dotRef}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshBasicMaterial color="#f97316" />
      </mesh>
      {/* Point light glow */}
      <pointLight color="#f97316" intensity={1.2} distance={0.5} />

      {/* Expanding pulse rings */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.03, 0.045, 24]} />
        <meshBasicMaterial color="#fb923c" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.03, 0.045, 24]} />
        <meshBasicMaterial color="#fb923c" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>

      {/* HTML label */}
      <Html
        position={[0.08, 0.08, 0]}
        style={{ pointerEvents: "none", userSelect: "none" }}
        distanceFactor={4}
      >
        <div style={{
          fontFamily: "'Courier New', monospace",
          fontSize: "9px",
          color: "#fb923c",
          whiteSpace: "nowrap",
          background: "rgba(4,12,24,0.75)",
          border: "1px solid rgba(251,146,60,0.45)",
          borderRadius: "3px",
          padding: "2px 6px",
          letterSpacing: "0.08em",
          lineHeight: 1.5,
        }}>
          <span style={{ color: "#fdba74", fontWeight: 700 }}>UBBB</span>
          {" · "}BAKU
          <br />
          <span style={{ color: "#94a3b8", fontSize: "8px" }}>40.41°N 49.87°E</span>
        </div>
      </Html>
    </group>
  );
}

/* ═══════════════════════════════════════
   3D: PARTICLES
═══════════════════════════════════════ */
function ParticleField() {
  const ref = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(1500 * 3);
    for (let i = 0; i < 1500; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 24;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 24;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 24;
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.008;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#7dd3fc" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

/* ═══════════════════════════════════════
   3D: FLOATING ORBS
═══════════════════════════════════════ */
function FloatingOrb({ position, color, size = 0.4, speed = 1 }) {
  const meshRef = useRef();
  const base = position[1];
  useFrame((state) => {
    if (meshRef.current)
      meshRef.current.position.y = base + Math.sin(state.clock.elapsedTime * speed) * 0.18;
  });
  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[size, 32, 32]} />
      <MeshDistortMaterial color={color} emissive={color} emissiveIntensity={0.55}
        distort={0.35} speed={2} transparent opacity={0.55} />
    </mesh>
  );
}

/* ═══════════════════════════════════════
   3D: MOUSE PARALLAX CAMERA
═══════════════════════════════════════ */
function CameraRig({ mouseX, mouseY }) {
  const { camera } = useThree();
  useFrame((state) => {
    const baseX = Math.sin(state.clock.elapsedTime * 0.08) * 0.3;
    const baseY = Math.cos(state.clock.elapsedTime * 0.06) * 0.15 + 0.2;
    camera.position.x += (mouseX.current * 1.2 + baseX - camera.position.x) * 0.04;
    camera.position.y += (-mouseY.current * 0.8 + baseY - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

/* ═══════════════════════════════════════
   HERO SCENE
═══════════════════════════════════════ */
function HeroScene({ mouseX, mouseY }) {
  return (
    <Canvas camera={{ position: [0, 0.3, 5.2], fov: 48 }}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0 }}>
      <ambientLight intensity={0.25} />
      <pointLight position={[6, 6, 4]} intensity={2.2} color="#38bdf8" />
      <pointLight position={[-6, -4, -4]} intensity={1.0} color="#818cf8" />
      <pointLight position={[0, 10, 0]} intensity={0.6} color="#ffffff" />
      <pointLight position={[0, -8, 3]} intensity={0.4} color="#0ea5e9" />

      <Stars radius={90} depth={70} count={3500} factor={3} fade speed={0.4} />
      <ParticleField />

      <Float speed={0.8} rotationIntensity={0.05} floatIntensity={0.15}>
        <GlobeNodes />
        <OrbitRings />
      </Float>

      <RealisticPlane orbitRadius={2.9} speed={0.28} tilt={0.32} />

      <FloatingOrb position={[-3.8, 1.2, -2.5]} color="#0ea5e9" size={0.32} speed={0.7} />
      <FloatingOrb position={[3.5, -1.2, -2]}   color="#6366f1" size={0.25} speed={1.1} />
      <FloatingOrb position={[2.8, 2.2, -3.5]}  color="#22d3ee" size={0.18} speed={1.4} />
      <FloatingOrb position={[-3.0, -1.8, -2]}  color="#a78bfa" size={0.20} speed={0.9} />

      <CameraRig mouseX={mouseX} mouseY={mouseY} />
    </Canvas>
  );
}

/* ═══════════════════════════════════════
   HUD OVERLAY
═══════════════════════════════════════ */
function HUDOverlay() {
  const isMobile = useMobile();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1200);
    return () => clearInterval(id);
  }, []);

  const alt   = (9144 + Math.round(Math.sin(tick * 0.4) * 38)).toLocaleString();
  const spd   = 847  + Math.round(Math.sin(tick * 0.3) * 5);
  const hdg   = String(45 + Math.round(Math.sin(tick * 0.2) * 3)).padStart(3, "0");
  const pitch = (2.1  + Math.sin(tick * 0.25) * 0.4).toFixed(1);

  const mono = {
    fontFamily: "'Courier New', monospace",
    letterSpacing: "0.06em",
  };

  const label = { fontSize: "9px", color: "#38bdf8", opacity: 0.7, marginBottom: "2px", ...mono };
  const value = { fontSize: "13px", color: "#e0f2fe", fontWeight: 700, ...mono };
  const dim   = { fontSize: "9px", color: "#38bdf8", opacity: 0.55, ...mono };

  // Corner bracket helper
  const Corner = ({ pos }) => {
    const size = 18, thick = 1.5;
    const styles = {
      tl: { top: 0, left: 0,  borderTop: `${thick}px solid #38bdf8`, borderLeft:  `${thick}px solid #38bdf8` },
      tr: { top: 0, right: 0, borderTop: `${thick}px solid #38bdf8`, borderRight: `${thick}px solid #38bdf8` },
      bl: { bottom: 0, left:  0, borderBottom: `${thick}px solid #38bdf8`, borderLeft:  `${thick}px solid #38bdf8` },
      br: { bottom: 0, right: 0, borderBottom: `${thick}px solid #38bdf8`, borderRight: `${thick}px solid #38bdf8` },
    };
    return <div style={{ position: "absolute", width: size, height: size, opacity: 0.6, ...styles[pos] }} />;
  };

  if (isMobile) return null;

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 20,
      pointerEvents: "none", userSelect: "none",
    }}>
      {/* ── TOP LEFT: Mission ID ── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        style={{ position: "absolute", top: 90, left: 28, ...mono }}
      >
        <div style={{ fontSize: "9px", color: "#38bdf8", opacity: 0.6, marginBottom: 4 }}>MISSION</div>
        <div style={{ fontSize: "14px", color: "#7dd3fc", fontWeight: 700 }}>HASH-01</div>
        <div style={{ fontSize: "10px", color: "#38bdf8", opacity: 0.7, marginTop: 2 }}>MAA CAMPUS NET</div>
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 6px #22c55e" }} />
          <span style={{ fontSize: "9px", color: "#22c55e", opacity: 0.9 }}>ONLINE</span>
        </div>
      </motion.div>

      {/* ── TOP RIGHT: Heading + pitch ── */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.3, duration: 0.8 }}
        style={{ position: "absolute", top: 90, right: 28, textAlign: "right" }}
      >
        <div style={label}>HDG</div>
        <div style={value}>{hdg}°</div>
        <div style={{ marginTop: 10 }}>
          <div style={label}>PITCH</div>
          <div style={value}>{pitch}°</div>
        </div>
      </motion.div>

      {/* ── BOTTOM LEFT: Altitude ── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        style={{ position: "absolute", bottom: 100, left: 28 }}
      >
        <div style={label}>ALTITUDE</div>
        <div style={{ ...value, fontSize: "16px" }}>{alt} <span style={{ ...dim, fontSize: "10px" }}>m</span></div>
        <div style={{ marginTop: 10 }}>
          <div style={label}>ORIGIN</div>
          <div style={{ ...value, fontSize: "11px" }}>UBBB · BAKU</div>
        </div>
      </motion.div>

      {/* ── BOTTOM RIGHT: Speed ── */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        style={{ position: "absolute", bottom: 100, right: 28, textAlign: "right" }}
      >
        <div style={label}>AIRSPEED</div>
        <div style={{ ...value, fontSize: "16px" }}>{spd} <span style={{ ...dim, fontSize: "10px" }}>km/h</span></div>
        <div style={{ marginTop: 10 }}>
          <div style={label}>PLATFORM</div>
          <div style={{ ...value, fontSize: "11px", color: "#fb923c" }}>hashcampus.site</div>
        </div>
      </motion.div>

      {/* ── CENTER RETICLE ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.6, duration: 0.9 }}
        style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 72, height: 72,
        }}
      >
        {/* Outer ring */}
        <div style={{
          position: "absolute", inset: 0,
          border: "1px solid rgba(56,189,248,0.35)",
          borderRadius: "50%",
        }} />
        {/* Inner dot */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: 6, height: 6,
          transform: "translate(-50%,-50%)",
          background: "#38bdf8",
          borderRadius: "50%",
          boxShadow: "0 0 10px #38bdf8",
        }} />
        {/* Cross hairs */}
        {[0, 90, 180, 270].map(deg => (
          <div key={deg} style={{
            position: "absolute",
            top: "50%", left: "50%",
            width: 12, height: 1,
            background: "rgba(56,189,248,0.55)",
            transformOrigin: "left center",
            transform: `translateY(-50%) rotate(${deg}deg) translateX(20px)`,
          }} />
        ))}
        {/* Corner brackets on reticle */}
        <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />
      </motion.div>

      {/* ── HORIZONTAL SCAN LINE ── */}
      <motion.div
        animate={{ top: ["15%", "85%", "15%"] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute", left: "5%", right: "5%",
          height: "1px",
          background: "linear-gradient(to right, transparent, rgba(56,189,248,0.18), rgba(56,189,248,0.35), rgba(56,189,248,0.18), transparent)",
        }}
      />

      {/* ── SIDE TICK MARKS (left) ── */}
      <div style={{ position: "absolute", left: 16, top: "30%", bottom: "30%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} style={{ width: i % 3 === 0 ? 10 : 5, height: 1, background: "rgba(56,189,248,0.3)" }} />
        ))}
      </div>
      {/* Right ticks */}
      <div style={{ position: "absolute", right: 16, top: "30%", bottom: "30%", display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "flex-end" }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} style={{ width: i % 3 === 0 ? 10 : 5, height: 1, background: "rgba(56,189,248,0.3)" }} />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   ANIMATED COUNTER
═══════════════════════════════════════ */
function Counter({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef();
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const num = parseInt(target);
        const duration = 1800;
        const steps = 60;
        let step = 0;
        const timer = setInterval(() => {
          step++;
          setCount(Math.round((num * step) / steps));
          if (step >= steps) clearInterval(timer);
        }, duration / steps);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ═══════════════════════════════════════
   MOCKUP: STEP 1 — REGISTRATION
═══════════════════════════════════════ */
function RegistrationMockup({ active }) {
  const email    = "sardar@naa.edu.az";
  const name     = "Sardar Soltanzada";
  const [eLen, setELen] = useState(0);
  const [nLen, setNLen] = useState(0);
  const [stage, setStage] = useState(0); // 0 typing, 1 loading, 2 done

  useEffect(() => {
    if (!active) { setELen(0); setNLen(0); setStage(0); return; }
    let t;
    // type name
    let ni = 0;
    t = setInterval(() => { ni++; setNLen(ni); if (ni >= name.length) clearInterval(t); }, 55);
    // type email after name done
    setTimeout(() => {
      let ei = 0;
      const t2 = setInterval(() => { ei++; setELen(ei); if (ei >= email.length) clearInterval(t2); }, 45);
    }, name.length * 55 + 300);
    // loading + done
    setTimeout(() => setStage(1), name.length * 55 + email.length * 45 + 700);
    setTimeout(() => setStage(2), name.length * 55 + email.length * 45 + 1700);
    return () => clearInterval(t);
  }, [active]);

  const card = {
    background: "rgba(6,18,36,0.95)", border: "1px solid rgba(56,189,248,0.15)",
    borderRadius: 16, padding: "28px 24px", width: "100%", maxWidth: 360,
    boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
  };
  const inp = {
    width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 14,
    fontFamily: "inherit", outline: "none", boxSizing: "border-box",
  };
  const lbl = { fontSize: 11, color: "#64748b", marginBottom: 5, display: "block" };

  return (
    <div style={card}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <span style={{ fontSize: 22, fontWeight: 900, background: "linear-gradient(135deg,#38bdf8,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Hash</span>
        <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Qeydiyyat — MAA tələbəsi</p>
      </div>

      {/* Name field */}
      <div style={{ marginBottom: 14 }}>
        <span style={lbl}>Ad Soyad</span>
        <div style={{ ...inp, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>{name.slice(0, nLen)}{nLen < name.length && active ? <span style={{ borderRight: "2px solid #38bdf8", marginLeft: 1, animation: "blink 1s infinite" }}>&nbsp;</span> : null}</span>
        </div>
      </div>

      {/* Email field */}
      <div style={{ marginBottom: 20 }}>
        <span style={lbl}>Email</span>
        <div style={{ ...inp, display: "flex", alignItems: "center", justifyContent: "space-between",
          borderColor: eLen === email.length ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.1)" }}>
          <span style={{ color: eLen > 0 ? "#e2e8f0" : "#475569" }}>
            {email.slice(0, eLen)}{eLen > 0 && eLen < email.length && active ? <span style={{ borderRight: "2px solid #38bdf8", marginLeft: 1 }}>&nbsp;</span> : null}
          </span>
          {eLen === email.length && <span style={{ color: "#22c55e", fontSize: 16 }}>✓</span>}
        </div>
        {eLen === email.length && (
          <p style={{ fontSize: 10, color: "#22c55e", marginTop: 4 }}>✓ MAA email təsdiqləndi</p>
        )}
      </div>

      {/* Button */}
      <div style={{
        width: "100%", padding: "12px", borderRadius: 10, textAlign: "center",
        fontWeight: 700, fontSize: 14,
        background: stage === 0 ? "linear-gradient(135deg,#0ea5e9,#2563eb)" :
                    stage === 1 ? "rgba(14,165,233,0.4)" : "linear-gradient(135deg,#22c55e,#16a34a)",
        boxShadow: "0 0 30px rgba(14,165,233,0.3)", transition: "all 0.5s", cursor: "default",
      }}>
        {stage === 0 && "Qeydiyyatdan keç →"}
        {stage === 1 && <span style={{ opacity: 0.7 }}>Yüklənir...</span>}
        {stage === 2 && "✓ Uğurla qeydiyyat oldunuz!"}
      </div>

      {/* Verify email note */}
      {stage === 2 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginTop: 14, padding: "10px 14px", borderRadius: 8,
            background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)",
            fontSize: 11, color: "#86efac", textAlign: "center" }}>
          📬 naa.edu.az emailinə doğrulama linki göndərildi
        </motion.div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   MOCKUP: STEP 2 — PROFILE BUILD
═══════════════════════════════════════ */
function ProfileMockup({ active }) {
  const skills = ["Python", "AutoCAD", "MATLAB", "Aviasiya", "C++", "SolidWorks"];
  const [visSkills, setVisSkills] = useState(0);
  const [progress, setProgress]   = useState(0);
  const [showConn, setShowConn]   = useState(false);

  useEffect(() => {
    if (!active) { setVisSkills(0); setProgress(0); setShowConn(false); return; }
    // progress bar
    let p = 0;
    const t1 = setInterval(() => { p += 2; setProgress(Math.min(p, 85)); if (p >= 85) clearInterval(t1); }, 30);
    // skills appear one by one
    skills.forEach((_, i) => setTimeout(() => setVisSkills(i + 1), 400 + i * 320));
    setTimeout(() => setShowConn(true), 400 + skills.length * 320 + 300);
    return () => clearInterval(t1);
  }, [active]);

  const card = {
    background: "rgba(6,18,36,0.95)", border: "1px solid rgba(56,189,248,0.15)",
    borderRadius: 16, padding: "24px", width: "100%", maxWidth: 360,
    boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
  };

  return (
    <div style={card}>
      {/* Avatar + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg,#0ea5e9,#6366f1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, fontWeight: 900, color: "#fff",
          boxShadow: "0 0 20px rgba(14,165,233,0.4)" }}>S</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>Sardar Soltanzada</div>
          <div style={{ fontSize: 12, color: "#38bdf8", marginTop: 2 }}>Aviasiya Mühəndisliyi</div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 1 }}>III kurs · MAA</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginBottom: 6 }}>
          <span>Profil tamamlanma</span><span style={{ color: "#38bdf8" }}>{progress}%</span>
        </div>
        <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 99 }}>
          <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.05 }}
            style={{ height: "100%", borderRadius: 99,
              background: "linear-gradient(90deg,#0ea5e9,#6366f1)",
              boxShadow: "0 0 8px rgba(14,165,233,0.5)" }} />
        </div>
      </div>

      {/* Skills */}
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10 }}>Bacarıqlar</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
        {skills.slice(0, visSkills).map((s, i) => (
          <motion.span key={s} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
            style={{ fontSize: 11, padding: "4px 10px", borderRadius: 99,
              background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.25)",
              color: "#7dd3fc" }}>{s}</motion.span>
        ))}
      </div>

      {/* Connection requests */}
      <AnimatePresence>
        {showConn && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: "10px 14px", borderRadius: 10,
              background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)",
              display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "#a5b4fc" }}>🔔 3 əlaqə istəyi gözləyir</span>
            <span style={{ fontSize: 11, color: "#6366f1", fontWeight: 600, cursor: "default" }}>Bax →</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════
   MOCKUP: STEP 3 — NETWORK / FEED
═══════════════════════════════════════ */
function NetworkMockup({ active }) {
  const posts = [
    { initials: "A", name: "Anar Hüseynov", dept: "Hava Nəqliyyatı", text: "Drone layihəm üçün komanda axtarıram. Python + Arduino biləni var?", likes: 18, comments: 5, color: "#0ea5e9" },
    { initials: "N", name: "Nigar Əliyeva",  dept: "Aviasiya Elektronikası", text: "HackMAA 2026 yarışmasına qeydiyyat başladı! Komanda quranlar DM göndərsin 🚀", likes: 42, comments: 11, color: "#8b5cf6" },
    { initials: "R", name: "Rauf Quliyev",   dept: "Texniki Texnologiyalar", text: "MATLAB ilə uçuş simulyasiyası hazırladım — kim maraqlanır?", likes: 9, comments: 3, color: "#22c55e" },
  ];
  const [visPosts, setVisPosts] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [likedPost, setLikedPost] = useState(null);

  useEffect(() => {
    if (!active) { setVisPosts(0); setShowNotif(false); setLikedPost(null); return; }
    setTimeout(() => setShowNotif(true), 200);
    posts.forEach((_, i) => setTimeout(() => setVisPosts(i + 1), 600 + i * 500));
    setTimeout(() => setLikedPost(0), 600 + posts.length * 500 + 300);
  }, [active]);

  const card = {
    background: "rgba(6,18,36,0.95)", border: "1px solid rgba(56,189,248,0.15)",
    borderRadius: 16, padding: "16px", width: "100%", maxWidth: 360,
    boxShadow: "0 24px 80px rgba(0,0,0,0.5)", overflow: "hidden",
  };

  return (
    <div style={card}>
      {/* Notification */}
      <AnimatePresence>
        {showNotif && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: "9px 12px", borderRadius: 10, marginBottom: 14,
              background: "rgba(251,146,60,0.09)", border: "1px solid rgba(251,146,60,0.25)",
              display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#fdba74" }}>
            <span>🔔</span>
            <span><strong>Anar Hüseynov</strong> sizi izləməyə başladı</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Posts */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {posts.slice(0, visPosts).map((p, i) => (
          <motion.div key={p.name} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            style={{ padding: "12px", borderRadius: 10,
              background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                background: `linear-gradient(135deg,${p.color},${p.color}88)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 800, color: "#fff" }}>{p.initials}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{p.name}</div>
                <div style={{ fontSize: 10, color: "#475569" }}>{p.dept}</div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5, marginBottom: 10 }}>{p.text}</p>
            <div style={{ display: "flex", gap: 16, fontSize: 11 }}>
              <span
                style={{ color: likedPost === i ? "#f43f5e" : "#64748b", cursor: "default",
                  fontWeight: likedPost === i ? 700 : 400 }}>
                {likedPost === i ? "♥" : "♡"} {likedPost === i ? p.likes + 1 : p.likes}
              </span>
              <span style={{ color: "#64748b" }}>💬 {p.comments}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   ONBOARDING SHOWCASE (scroll-driven)
═══════════════════════════════════════ */
const steps = [
  { num: "01", title: "Qeydiyyat",       desc: "@naa.edu.az emailinlə platformaya qoşul. Email real vaxtda doğrulanır.", tag: "30 saniyə" },
  { num: "02", title: "Profil yarat",    desc: "İxtisasını, bacarıqlarını və layihələrini əlavə et. Profil kartın avtomatik hazırlanır.", tag: "2 dəqiqə" },
  { num: "03", title: "Şəbəkəyə qoşul", desc: "Həmyaşıdlarınla əlaqə saxla, komanda tap, layihə başlat.", tag: "İndi" },
];

function StepRow({ step, index, mockup }) {
  const rowRef   = useRef();
  const [active, setActive] = useState(false);
  const isMobile = useMobile();
  const isEven   = index % 2 === 0;

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setActive(e.isIntersecting),
      { threshold: 0.45 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <motion.div
      ref={rowRef}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.4 }}
      transition={{ duration: 0.7 }}
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : isEven ? "row" : "row-reverse",
        alignItems: "center",
        justifyContent: "center",
        gap: isMobile ? 28 : "clamp(32px,6vw,80px)",
        padding: isMobile ? "48px 20px" : "clamp(60px,8vw,100px) clamp(16px,5vw,48px)",
        maxWidth: 1000,
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* Step info */}
      <div style={{ flexShrink: 0, maxWidth: isMobile ? "100%" : 260, width: isMobile ? "100%" : "auto" }}>
        {/* Step number badge */}
        <motion.div
          animate={{
            background: active
              ? "linear-gradient(135deg,#0ea5e9,#6366f1)"
              : "rgba(255,255,255,0.04)",
            boxShadow: active
              ? "0 0 28px rgba(14,165,233,0.45)"
              : "none",
          }}
          transition={{ duration: 0.5 }}
          style={{
            width: 52, height: 52, borderRadius: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 900,
            color: active ? "#fff" : "#334155",
            border: active ? "none" : "1px solid rgba(255,255,255,0.07)",
            marginBottom: 18,
          }}
        >
          {step.num}
        </motion.div>

        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
          textTransform: "uppercase", color: "#38bdf8", marginBottom: 8 }}>
          {step.tag}
        </div>
        <h3 style={{ fontSize: "clamp(1.4rem,2.5vw,1.9rem)", fontWeight: 900,
          color: "#f1f5f9", lineHeight: 1.2, marginBottom: 12 }}>
          {step.title}
        </h3>
        <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, margin: 0 }}>
          {step.desc}
        </p>

        {/* Connector dot */}
        {index < steps.length - 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 28 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%",
              background: active ? "#38bdf8" : "#1e3a5f",
              boxShadow: active ? "0 0 8px #38bdf8" : "none",
              transition: "all 0.4s" }} />
            <div style={{ flex: 1, height: 1,
              background: active
                ? "linear-gradient(to right,#38bdf8,transparent)"
                : "rgba(255,255,255,0.05)",
              transition: "all 0.4s" }} />
          </div>
        )}
      </div>

      {/* Mockup */}
      <div style={{ flex: 1, minWidth: 0, maxWidth: 380,
        display: "flex", justifyContent: "center" }}>
        <motion.div
          animate={{ scale: active ? 1 : 0.97, opacity: active ? 1 : 0.5 }}
          transition={{ duration: 0.5 }}
          style={{ width: "100%" }}
        >
          {mockup(active)}
        </motion.div>
      </div>
    </motion.div>
  );
}

function OnboardingShowcase() {
  const mockups = [
    (active) => <RegistrationMockup active={active} />,
    (active) => <ProfileMockup     active={active} />,
    (active) => <NetworkMockup     active={active} />,
  ];

  return (
    <section style={{ position: "relative" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        style={{ textAlign: "center", padding: "72px 24px 0" }}
      >
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em",
          textTransform: "uppercase", color: "#38bdf8", marginBottom: 10 }}>
          Necə işləyir
        </p>
        <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.8rem)", fontWeight: 900,
          color: "#fff", lineHeight: 1.1, margin: 0 }}>
          Real vaxtda başla
        </h2>
      </motion.div>

      {/* Vertical connector line between rows */}
      <div style={{ position: "absolute", left: "50%", top: "18%", bottom: "10%",
        width: 1, background: "rgba(56,189,248,0.07)",
        transform: "translateX(-50%)", pointerEvents: "none" }} />

      {steps.map((s, i) => (
        <StepRow key={s.num} step={s} index={i} mockup={mockups[i]} />
      ))}
    </section>
  );
}

/* ═══════════════════════════════════════
   FEATURE CARDS & DATA
═══════════════════════════════════════ */
const features = [
  { icon: FileText, title: "Akademik Lent",      desc: "Layihələrini, tədqiqatlarını və fikirlərini həmyaşıdlarınla paylaş.", gradient: "from-sky-500 to-blue-600",    glow: "rgba(14,165,233,0.18)" },
  { icon: Users,    title: "Tələbə Şəbəkəsi",    desc: "İxtisas və bacarıq filtri ilə düzgün insanı tap, komanda qur.",        gradient: "from-indigo-500 to-violet-600", glow: "rgba(99,102,241,0.18)" },
  { icon: Network,  title: "Professional Bağlantı", desc: "Əlaqə istəyi göndər, peşəkar şəbəkəni genişləndir.",             gradient: "from-blue-500 to-cyan-600",  glow: "rgba(6,182,212,0.18)" },
  { icon: BookOpen, title: "Məqalə Yaz",          desc: "Bilik paylaş, sahənə dair dərin məzmun hazırla.",                    gradient: "from-violet-500 to-purple-600", glow: "rgba(139,92,246,0.18)" },
  { icon: Shield,   title: "Qapalı Kampus",        desc: "Yalnız @naa.edu.az emaili ilə giriş — tam güvənli mühit.",           gradient: "from-emerald-500 to-teal-600", glow: "rgba(16,185,129,0.18)" },
];

/* ═══════════════════════════════════════
   MAIN LANDING
═══════════════════════════════════════ */
export default function Landing() {
  const containerRef = useRef();
  const mouseX = useRef(0);
  const mouseY = useRef(0);
  const [mounted, setMounted] = useState(false);
  const isMobile = useMobile();

  const { scrollYProgress } = useScroll({ target: containerRef });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale   = useTransform(scrollYProgress, [0, 0.2], [1, 0.92]);

  const handleMouseMove = useCallback((e) => {
    mouseX.current = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY.current = (e.clientY / window.innerHeight - 0.5) * 2;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    setTimeout(() => setMounted(true), 120);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#040c18] text-white overflow-x-hidden">

      {/* ── NAV ── */}
      <motion.nav
        initial={{ y: -70, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 md:px-8 py-4"
        style={{ background: "linear-gradient(180deg,rgba(4,12,24,0.95) 0%,transparent 100%)", backdropFilter: "blur(14px)" }}
      >
        <span className="text-2xl font-black tracking-tight select-none"
          style={{ background: "linear-gradient(135deg,#38bdf8,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Hash
        </span>
        <div className="flex items-center gap-3">
          <Link to="/login" className="px-5 py-2 text-sm font-medium text-sky-300 hover:text-white transition-colors duration-200">
            Daxil ol
          </Link>
          <Link to="/register" className="px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 hover:scale-105"
            style={{ background: "linear-gradient(135deg,#0ea5e9,#2563eb)", boxShadow: "0 0 24px rgba(14,165,233,0.4)" }}>
            Qeydiyyat
          </Link>
        </div>
      </motion.nav>

      {/* ── HERO ── */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      >
        {/* Background radial */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse 90% 65% at 50% 42%, #0c2550 0%, #040c18 72%)"
        }} />
        {/* Ambient glow blobs */}
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(14,165,233,0.07)" }} />
        <div className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(99,102,241,0.07)" }} />

        {/* 3D Canvas */}
        <HeroScene mouseX={mouseX} mouseY={mouseY} />

        {/* Hero text */}
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto pointer-events-none">
          <AnimatePresence>
            {mounted && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.7 }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-semibold tracking-widest uppercase pointer-events-auto"
                  style={{ border: "1px solid rgba(56,189,248,0.28)", background: "rgba(56,189,248,0.07)", color: "#7dd3fc" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                  Milli Aviasiya Akademiyası · Qapalı Platforma
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 36 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45, duration: 0.85 }}
                  className="text-4xl md:text-8xl font-black leading-[1.05] tracking-tight mb-5"
                >
                  Bilik paylaş.
                  <br />
                  <span style={{
                    background: "linear-gradient(135deg,#38bdf8 0%,#818cf8 55%,#22d3ee 100%)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                  }}>
                    Hündürlüyə qalx.
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.62, duration: 0.7 }}
                  className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
                  style={{ color: "#94a3b8" }}
                >
                  Hash — MAA tələbələri üçün vahid akademik şəbəkə. Layihə tap,
                  komanda qur, sahənin ən yaxşıları ilə əlaqə saxla.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.78, duration: 0.7 }}
                  className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-20 pointer-events-auto px-4"
                >
                  <Link to="/register"
                    className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl w-full sm:w-auto justify-center"
                    style={{ background: "linear-gradient(135deg,#0ea5e9,#2563eb)", boxShadow: "0 0 50px rgba(14,165,233,0.45), inset 0 1px 0 rgba(255,255,255,0.12)" }}>
                    Platformaya qoşul <ArrowRight size={18} />
                  </Link>
                  <Link to="/login"
                    className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-medium transition-all duration-300 hover:scale-105 w-full sm:w-auto justify-center"
                    style={{ border: "1px solid rgba(255,255,255,0.11)", background: "rgba(255,255,255,0.04)", backdropFilter: "blur(8px)" }}>
                    Daxil ol
                  </Link>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.7 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-8 md:gap-14 z-10"
        >
          {[
            { target: "3000", suffix: "+", label: "Tələbə" },
            { target: "5",    suffix: "+", label: "Fakültə" },
            { target: "1",    suffix: "",  label: "Platforma" },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-black text-white">
                <Counter target={s.target} suffix={s.suffix} />
              </p>
              <p className="text-sm mt-0.5" style={{ color: "#475569" }}>{s.label}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          animate={{ y: [0, 9, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10"
          style={{ color: "#1e3a5f" }}
        >
          <ChevronDown size={22} />
        </motion.div>
      </motion.section>

      {/* ── FEATURES ── */}
      <section className="relative py-36 px-6 max-w-7xl mx-auto">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(14,165,233,0.05)" }} />

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "#38bdf8" }}>İmkanlar</p>
          <h2 className="text-4xl md:text-5xl font-black text-white">Platforma nə verir?</h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 44 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              whileHover={{ y: -8, scale: 1.025 }}
              className="group relative rounded-2xl p-7 cursor-default transition-all duration-300"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(10px)" }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = `0 24px 70px ${f.glow}, inset 0 1px 0 rgba(255,255,255,0.07)`;
                e.currentTarget.style.border = "1px solid rgba(255,255,255,0.12)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.border = "1px solid rgba(255,255,255,0.06)";
              }}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 shadow-lg`}>
                <f.icon size={22} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── ONBOARDING SHOWCASE ── */}
      <OnboardingShowcase />

      {/* ── CTA ── */}
      <section className="px-6 pb-36 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 44 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden rounded-3xl p-8 md:p-14 text-center"
          style={{
            background: "linear-gradient(135deg,rgba(12,37,80,0.92) 0%,rgba(4,12,24,0.97) 100%)",
            border: "1px solid rgba(56,189,248,0.14)",
            boxShadow: "0 0 130px rgba(14,165,233,0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-64 rounded-full blur-3xl pointer-events-none"
            style={{ background: "rgba(14,165,233,0.13)" }} />
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "#38bdf8" }}>Başlamağa hazırsan?</p>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 relative">
            Akademik karyeranı<br />bu gün inşa et.
          </h2>
          <p className="mb-10 max-w-md mx-auto" style={{ color: "#64748b" }}>
            @naa.edu.az və ya @student.naa.edu.az email ünvanınla qeydiyyatdan keç.
          </p>
          <Link to="/register"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
            style={{ background: "linear-gradient(135deg,#0ea5e9,#2563eb)", boxShadow: "0 0 55px rgba(14,165,233,0.48)" }}>
            Qeydiyyatdan keç <ArrowRight size={18} />
          </Link>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t text-center py-10 text-sm"
        style={{ borderColor: "rgba(255,255,255,0.05)", color: "#334155" }}>
        <span className="font-bold" style={{ color: "#38bdf8" }}>Hash</span>
        {" "}· Milli Aviasiya Akademiyası · hashcampus.site · © 2026
      </footer>
    </div>
  );
}
