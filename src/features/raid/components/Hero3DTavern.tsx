import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";
import type { Group } from "three";
import "./hero-3d-tavern.css";

const MODEL_URL = `${import.meta.env.BASE_URL}models/tavern/cozy-tavern-first-floor-2.glb`;
const JOYSTICK_RADIUS = 42;

interface JoystickVector {
  x: number;
  y: number;
}

function clampMagnitude(x: number, y: number, radius: number): JoystickVector {
  const length = Math.hypot(x, y);
  if (!length || length <= radius) {
    return { x, y };
  }
  const scale = radius / length;
  return { x: x * scale, y: y * scale };
}

function TavernModel({ joystick }: { joystick: JoystickVector }) {
  const group = useRef<Group>(null);
  const cameraOffset = useRef({ x: 0, y: 0 });
  const gltf = useGLTF(MODEL_URL);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.y = -0.08 + Math.sin(t * 0.24) * 0.035;
      group.current.position.y = -1.3 + Math.sin(t * 0.4) * 0.015;
    }

    const damping = Math.min(1, delta * 5.2);
    const targetX = joystick.x * 0.26;
    const targetY = joystick.y * 0.09;
    cameraOffset.current.x += (targetX - cameraOffset.current.x) * damping;
    cameraOffset.current.y += (targetY - cameraOffset.current.y) * damping;

    state.camera.position.x = Math.sin(t * 0.16) * 0.18 + cameraOffset.current.x;
    state.camera.position.z = 6.2 + Math.cos(t * 0.2) * 0.08;
    state.camera.lookAt(cameraOffset.current.x * 0.2, -0.55 + cameraOffset.current.y, 0);
  });

  return (
    <group ref={group} scale={1.45} position={[0, -1.3, 0]}>
      <primitive object={gltf.scene} />
    </group>
  );
}

function TavernFallback() {
  return (
    <Html center>
      <div className="hero-3d-tavern__loading">Stoking the tavern hearth...</div>
    </Html>
  );
}

export function Hero3DTavern() {
  const [isMobile, setIsMobile] = useState(false);
  const [joystick, setJoystick] = useState<JoystickVector>({ x: 0, y: 0 });
  const [joystickPointerId, setJoystickPointerId] = useState<number | null>(null);
  const [dragPointerId, setDragPointerId] = useState<number | null>(null);
  const [dragInput, setDragInput] = useState<JoystickVector>({ x: 0, y: 0 });
  const padRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const onChange = () => setIsMobile(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const activeInput = useMemo(() => (isMobile ? joystick : dragInput), [isMobile, joystick, dragInput]);

  function updateJoystick(clientX: number, clientY: number) {
    const pad = padRef.current;
    if (!pad) {
      return;
    }

    const rect = pad.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const clamped = clampMagnitude(clientX - centerX, clientY - centerY, JOYSTICK_RADIUS);

    setJoystick({
      x: clamped.x / JOYSTICK_RADIUS,
      y: clamped.y / JOYSTICK_RADIUS
    });
  }

  return (
    <section className="hero-3d-tavern" aria-label="Tavern hero scene">
      <div className="hero-3d-tavern__canvas-wrap">
        <Canvas
          camera={{ position: [0, 0.2, 6.2], fov: 34 }}
          dpr={[1, 1.8]}
          shadows={false}
        >
          <color attach="background" args={["#f3ecdf"]} />
          <ambientLight intensity={0.72} color="#f0e2c2" />
          <directionalLight position={[4, 6, 4]} intensity={1.2} color="#ffe2aa" />
          <directionalLight position={[-4, 4, -4]} intensity={0.35} color="#d9e6d7" />
          <Suspense fallback={<TavernFallback />}>
            <TavernModel joystick={activeInput} />
            <Environment preset="sunset" />
          </Suspense>
          <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
        </Canvas>

        <div className="hero-3d-tavern__overlay">
          <h1>Gather the party</h1>
          <p>Finish the raid before sundown.</p>
        </div>

        <div
          className="hero-3d-tavern__drag-layer"
          onPointerDown={(event) => {
            if (isMobile) {
              return;
            }
            setDragPointerId(event.pointerId);
            dragStartRef.current = { x: event.clientX, y: event.clientY };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (isMobile || dragPointerId !== event.pointerId || !dragStartRef.current) {
              return;
            }

            const dx = event.clientX - dragStartRef.current.x;
            const dy = event.clientY - dragStartRef.current.y;
            setDragInput({
              x: Math.max(-1, Math.min(1, dx / 220)),
              y: Math.max(-1, Math.min(1, dy / 220))
            });
          }}
          onPointerUp={(event) => {
            if (dragPointerId !== event.pointerId) {
              return;
            }
            setDragPointerId(null);
            setDragInput({ x: 0, y: 0 });
            dragStartRef.current = null;
            event.currentTarget.releasePointerCapture(event.pointerId);
          }}
          onPointerCancel={() => {
            setDragPointerId(null);
            setDragInput({ x: 0, y: 0 });
            dragStartRef.current = null;
          }}
          onPointerLeave={() => {
            setDragPointerId(null);
            setDragInput({ x: 0, y: 0 });
            dragStartRef.current = null;
          }}
        />

        <div className="hero-3d-tavern__joystick-wrap" data-mobile-only="true">
          <p className="hero-3d-tavern__joystick-label">Move scene</p>
          <div
            ref={padRef}
            className="hero-3d-tavern__joystick"
            onPointerDown={(event) => {
              event.preventDefault();
              setJoystickPointerId(event.pointerId);
              event.currentTarget.setPointerCapture(event.pointerId);
              updateJoystick(event.clientX, event.clientY);
            }}
            onPointerMove={(event) => {
              if (joystickPointerId !== event.pointerId) {
                return;
              }
              updateJoystick(event.clientX, event.clientY);
            }}
            onPointerUp={(event) => {
              if (joystickPointerId !== event.pointerId) {
                return;
              }
              setJoystickPointerId(null);
              setJoystick({ x: 0, y: 0 });
              event.currentTarget.releasePointerCapture(event.pointerId);
            }}
            onPointerCancel={() => {
              setJoystickPointerId(null);
              setJoystick({ x: 0, y: 0 });
            }}
            onPointerLeave={() => {
              setJoystickPointerId(null);
              setJoystick({ x: 0, y: 0 });
            }}
          >
            <span
              className="hero-3d-tavern__joystick-knob"
              style={{
                transform: `translate(${joystick.x * JOYSTICK_RADIUS}px, ${joystick.y * JOYSTICK_RADIUS}px)`
              }}
            />
          </div>
        </div>
      </div>

      <p className="hero-3d-tavern__attribution">
        Cozy Tavern - First Floor 2 by Nick Slough [CC-BY] via Poly Pizza
      </p>
    </section>
  );
}

useGLTF.preload(MODEL_URL);
