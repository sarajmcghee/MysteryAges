import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, OrbitControls } from "@react-three/drei";
import { useRef, useState, type MutableRefObject } from "react";
import { MOUSE } from "three";
import { TavernModel } from "./TavernModel";

interface HeroSceneCanvasProps {
  modelPath: string;
  lowPowerMode: boolean;
  isMobile?: boolean;
  joystick?: { x: number; y: number };
  onLoaded: () => void;
  onFailed: () => void;
}

type Vec3 = [number, number, number];

export function HeroSceneCanvas({ modelPath, lowPowerMode, isMobile = false, joystick, onLoaded, onFailed }: HeroSceneCanvasProps) {
  const [cameraReady, setCameraReady] = useState(false);
  const joystickOffset = useRef({ x: 0, z: 0 });

  const startPosition: Vec3 = [0, 0.42, 3.45];
  const focusTarget: Vec3 = [0, 0.06, 0.75];

  return (
    <Canvas
      className="hero3d-canvas"
      camera={{ position: startPosition, fov: lowPowerMode ? 66 : 62 }}
      dpr={lowPowerMode ? [1, 1.2] : [1, 1.5]}
      frameloop="demand"
      onCreated={({ camera }) => {
        camera.lookAt(focusTarget[0], focusTarget[1], focusTarget[2]);
        setCameraReady(true);
      }}
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
      <TavernModel modelPath={modelPath} onLoaded={onLoaded} onFailed={onFailed} />
      <JoystickCameraController
        enabled={Boolean(joystick) && cameraReady}
        input={joystick ?? { x: 0, y: 0 }}
        basePosition={startPosition}
        focusTarget={focusTarget}
        offsetRef={joystickOffset}
      />
      <OrbitControls
        enabled={!isMobile && cameraReady}
        enablePan
        enableZoom
        enableRotate
        panSpeed={0.62}
        zoomSpeed={0.5}
        rotateSpeed={0.45}
        minDistance={1.8}
        maxDistance={10}
        minPolarAngle={Math.PI * 0.3}
        maxPolarAngle={Math.PI * 0.62}
        target={focusTarget}
        mouseButtons={{
          LEFT: MOUSE.PAN,
          MIDDLE: MOUSE.DOLLY,
          RIGHT: MOUSE.ROTATE
        }}
      />
    </Canvas>
  );
}

interface JoystickCameraControllerProps {
  enabled: boolean;
  input: { x: number; y: number };
  basePosition: Vec3;
  focusTarget: Vec3;
  offsetRef: MutableRefObject<{ x: number; z: number }>;
}

function JoystickCameraController({ enabled, input, basePosition, focusTarget, offsetRef }: JoystickCameraControllerProps) {
  const camera = useThree((state) => state.camera);

  useFrame((_, delta) => {
    if (!enabled) {
      return;
    }
    const damping = Math.min(1, delta * 6);
    const tx = input.x * 0.95;
    const tz = -input.y * 1.25;
    offsetRef.current.x += (tx - offsetRef.current.x) * damping;
    offsetRef.current.z += (tz - offsetRef.current.z) * damping;
    camera.position.set(
      basePosition[0] + offsetRef.current.x,
      basePosition[1],
      basePosition[2] + offsetRef.current.z
    );
    camera.lookAt(
      focusTarget[0] + offsetRef.current.x * 0.45,
      focusTarget[1],
      focusTarget[2] - 0.6
    );
  });

  return null;
}
