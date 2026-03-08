import { useEffect, useState } from "react";
import { HeroFallback } from "./HeroFallback";
import { HeroOverlay } from "./HeroOverlay";
import { HeroSceneCanvas } from "./HeroSceneCanvas";
import { useWebGLSupport } from "../hooks/useWebGLSupport";

type Hero3DLoadState = "loading" | "ready" | "fallback";

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
  modelPath = "/models/tavern/tavern.glb",
  minHeight = 420,
  lowPowerMode,
  onLoadStateChange
}: Hero3DProps) {
  const webglSupported = useWebGLSupport();
  const [modelFailed, setModelFailed] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  const shouldFallback = !webglSupported || modelFailed;
  const resolvedLowPowerMode = lowPowerMode ?? reducedMotion;

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
        onLoaded={() => setModelLoaded(true)}
        onFailed={() => setModelFailed(true)}
      />
      <HeroOverlay heading={heading} subheading={subheading} />
      {!modelLoaded ? <p className="hero3d-loading">Loading tavern scene...</p> : null}
    </section>
  );
}

