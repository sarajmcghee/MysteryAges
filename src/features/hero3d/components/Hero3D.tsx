import { useEffect, useState } from "react";
import { HeroFallback } from "./HeroFallback";
import { HeroOverlay } from "./HeroOverlay";
import { HeroSceneCanvas } from "./HeroSceneCanvas";
import { useWebGLSupport } from "../hooks/useWebGLSupport";

type Hero3DLoadState = "loading" | "ready" | "fallback";
const JOYSTICK_RADIUS = 34;

export interface Hero3DProps {
  className?: string;
  heading?: string;
  subheading?: string;
  modelPath?: string;
  minHeight?: number;
  lowPowerMode?: boolean;
  onLoadStateChange?: (state: Hero3DLoadState) => void;
}

export function Hero3D({
  className,
  heading = "Gather the party",
  subheading = "Finish the raid before sundown.",
  modelPath = "/models/tavern/cozy-tavern-first-floor-2.glb",
  minHeight = 420,
  lowPowerMode,
  onLoadStateChange
}: Hero3DProps) {
  const webglSupported = useWebGLSupport();
  const [modelFailed, setModelFailed] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [joystickPointerId, setJoystickPointerId] = useState<number | null>(null);
  const [joystick, setJoystick] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 900px)");
    const update = () => setIsMobile(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  const shouldFallback = !webglSupported || modelFailed;
  const resolvedLowPowerMode = lowPowerMode ?? reducedMotion;
  const mobileJoystickEnabled = isMobile && !resolvedLowPowerMode;

  useEffect(() => {
    if (!onLoadStateChange) {
      return;
    }
    if (shouldFallback) {
      onLoadStateChange("fallback");
      return;
    }
    onLoadStateChange(modelLoaded ? "ready" : "loading");
  }, [modelLoaded, onLoadStateChange, shouldFallback]);

  if (shouldFallback) {
    return <HeroFallback heading={heading} subheading={subheading} />;
  }

  return (
    <section
      className={`hero3d ${className ?? ""}`.trim()}
      style={{ minHeight }}
      aria-label="Tavern hero"
    >
      <HeroSceneCanvas
        modelPath={modelPath}
        lowPowerMode={resolvedLowPowerMode}
        isMobile={isMobile}
        {...(mobileJoystickEnabled ? { joystick } : {})}
        onLoaded={() => setModelLoaded(true)}
        onFailed={() => setModelFailed(true)}
      />
      <HeroOverlay heading={heading} subheading={subheading} />
      {mobileJoystickEnabled ? (
        <div className="hero3d-joystick-wrap">
          <p className="hero3d-joystick-label">Move scene</p>
          <div
            className="hero3d-joystick"
            onPointerDown={(event) => {
              event.preventDefault();
              setJoystickPointerId(event.pointerId);
              event.currentTarget.setPointerCapture(event.pointerId);
              updateJoystickFromPointer(event.clientX, event.clientY, event.currentTarget, setJoystick);
            }}
            onPointerMove={(event) => {
              if (joystickPointerId !== event.pointerId) {
                return;
              }
              updateJoystickFromPointer(event.clientX, event.clientY, event.currentTarget, setJoystick);
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
              className="hero3d-joystick-knob"
              style={{
                transform: `translate(${joystick.x * JOYSTICK_RADIUS}px, ${joystick.y * JOYSTICK_RADIUS}px)`
              }}
            />
          </div>
        </div>
      ) : null}
      {!modelLoaded ? <p className="hero3d-loading">Loading tavern scene...</p> : null}
    </section>
  );
}

function updateJoystickFromPointer(
  clientX: number,
  clientY: number,
  element: HTMLDivElement,
  setJoystick: (next: { x: number; y: number }) => void
) {
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const dx = clientX - centerX;
  const dy = clientY - centerY;
  const distance = Math.hypot(dx, dy);
  const scale = distance > JOYSTICK_RADIUS ? JOYSTICK_RADIUS / distance : 1;

  setJoystick({
    x: (dx * scale) / JOYSTICK_RADIUS,
    y: (dy * scale) / JOYSTICK_RADIUS
  });
}
