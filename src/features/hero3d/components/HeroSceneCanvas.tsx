import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr } from "@react-three/drei";
import { TavernModel } from "./TavernModel";

interface HeroSceneCanvasProps {
  modelPath: string;
  lowPowerMode: boolean;
  onLoaded: () => void;
  onFailed: () => void;
}

export function HeroSceneCanvas({ modelPath, lowPowerMode, onLoaded, onFailed }: HeroSceneCanvasProps) {
  return (
    <Canvas
      className="hero3d-canvas"
      camera={{ position: [0, 1.7, 5.4], fov: lowPowerMode ? 52 : 48 }}
      dpr={lowPowerMode ? [1, 1.2] : [1, 1.5]}
      frameloop="demand"
      gl={{
        antialias: !lowPowerMode,
        alpha: true,
        powerPreference: lowPowerMode ? "low-power" : "high-performance"
      }}
    >
      <AdaptiveDpr pixelated />
      <color attach="background" args={["#221810"]} />
      <ambientLight intensity={0.72} />
      <directionalLight position={[3.5, 6, 4]} intensity={1.3} />
      <directionalLight position={[-4, 2, -2]} intensity={0.45} color="#f8c18b" />
      <group scale={0.95} position={[0, -1.15, 0]}>
        <TavernModel modelPath={modelPath} onLoaded={onLoaded} onFailed={onFailed} />
      </group>
    </Canvas>
  );
}

