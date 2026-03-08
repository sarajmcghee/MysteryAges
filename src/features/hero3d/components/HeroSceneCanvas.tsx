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

interface IntroCameraControllerProps {
  enabled: boolean;
  from: Vec3;
  to: Vec3;
  lookAt: Vec3;
  durationSec: number;
  onDone: () => void;
}

function IntroCameraController({ enabled, from, to, lookAt, durationSec, onDone }: IntroCameraControllerProps) {
  const camera = useThree((state) => state.camera);
  const elapsed = useRef(0);
  const completed = useRef(false);

  useFrame((_, delta) => {
    if (!enabled || completed.current) {
      return;
    }

    elapsed.current += delta;
    const t = Math.min(1, elapsed.current / durationSec);
    const eased = 1 - (1 - t) * (1 - t);

    camera.position.set(
      from[0] + (to[0] - from[0]) * eased,
      from[1] + (to[1] - from[1]) * eased,
      from[2] + (to[2] - from[2]) * eased
    );
    camera.lookAt(lookAt[0], lookAt[1], lookAt[2]);

    if (t >= 1) {
      completed.current = true;
      onDone();
    }
  });

  return null;
}

export function HeroSceneCanvas({ modelPath, lowPowerMode, isMobile = false, joystick, onLoaded, onFailed }: HeroSceneCanvasProps) {
  const [introDone, setIntroDone] = useState(false);
  const joystickOffset = useRef({ x: 0, z: 0 });

  const introFrom: Vec3 = [0, 0.42, 4.35];
  const introTo: Vec3 = [0, 0.4, 3.95];
  const focusTarget: Vec3 = [0, 0.05, 1.2];

  return (
    <Canvas
      className="hero3d-canvas"
      camera={{ position: introFrom, fov: lowPowerMode ? 66 : 62 }}
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
      <TavernModel modelPath={modelPath} onLoaded={onLoaded} onFailed={onFailed} />
      <IntroCameraController
        enabled={!lowPowerMode && !introDone}
        from={introFrom}
        to={introTo}
        lookAt={focusTarget}
        durationSec={3.4}
        onDone={() => setIntroDone(true)}
      />
      <JoystickCameraController
        enabled={Boolean(joystick) && (lowPowerMode || introDone)}
        input={joystick ?? { x: 0, y: 0 }}
        basePosition={introTo}
        focusTarget={focusTarget}
        offsetRef={joystickOffset}
      />
      <OrbitControls
        enabled={!isMobile && (lowPowerMode || introDone)}
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
