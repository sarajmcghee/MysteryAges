import { useEffect, useState } from "react";

function detectWebGL(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    return gl !== null;
  } catch {
    return false;
  }
}

export function useWebGLSupport(): boolean {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(detectWebGL());
  }, []);

  return supported;
}

