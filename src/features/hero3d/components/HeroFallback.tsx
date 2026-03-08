interface HeroFallbackProps {
  heading: string;
  subheading: string;
}

export function HeroFallback({ heading, subheading }: HeroFallbackProps) {
  return (
    <section className="hero3d hero3d-fallback" aria-label="Tavern hero">
      <div className="hero3d-fallback__scene" aria-hidden="true" />
      <div className="hero3d-overlay">
        <p className="hero3d-kicker">Party Leader Access</p>
        <h1>{heading}</h1>
        <p>{subheading}</p>
        <small className="hero3d-attribution">
          Cozy Tavern - First Floor 2 by Nick Slough [CC-BY] via Poly Pizza
        </small>
      </div>
    </section>
  );
}

