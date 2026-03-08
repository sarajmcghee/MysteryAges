import { useEffect, useRef, useState } from "react";
import { Group } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useThree } from "@react-three/fiber";

interface TavernModelProps {
  modelPath: string;
  onLoaded: () => void;
  onFailed: () => void;
}

function disposeScene(root: Group): void {
  root.traverse((object) => {
    const mesh = object as {
      geometry?: { dispose?: () => void };
      material?: { dispose?: () => void } | { dispose?: () => void }[];
    };

    mesh.geometry?.dispose?.();
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((material) => material.dispose?.());
      return;
    }
    mesh.material?.dispose?.();
  });
}

export function TavernModel({ modelPath, onLoaded, onFailed }: TavernModelProps) {
  const [scene, setScene] = useState<Group | null>(null);
  const loadedRef = useRef<Group | null>(null);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    let cancelled = false;
    const loader = new GLTFLoader();

    loader.load(
      modelPath,
      (gltf) => {
        if (cancelled) {
          return;
        }

        const clone = gltf.scene.clone(true);
        loadedRef.current = clone;
        setScene(clone);
        onLoaded();
        invalidate();
      },
      undefined,
      () => {
        if (cancelled) {
          return;
        }
        onFailed();
      }
    );

    return () => {
      cancelled = true;
      if (loadedRef.current) {
        disposeScene(loadedRef.current);
        loadedRef.current = null;
      }
    };
  }, [invalidate, modelPath, onFailed, onLoaded]);

  if (!scene) {
    return (
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[1.6, 0.8, 1.1]} />
        <meshStandardMaterial color="#7f5e3d" roughness={0.9} metalness={0.05} />
      </mesh>
    );
  }

  return <primitive object={scene} />;
}
