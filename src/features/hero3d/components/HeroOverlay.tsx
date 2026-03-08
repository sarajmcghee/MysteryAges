interface HeroOverlayProps {
  heading: string;
  subheading: string;
}

export function HeroOverlay({ heading, subheading }: HeroOverlayProps) {
  return (
    <div className="hero3d-overlay">
      <div className="hero3d-overlay__content">
        <p className="hero3d-kicker">Party Leader Access</p>
        <h1>{heading}</h1>
        <p>{subheading}</p>
        <small className="hero3d-attribution">
          Cozy Tavern - First Floor 2 by Nick Slough [CC-BY] via Poly Pizza
        </small>
      </div>
    </div>
  );
}
