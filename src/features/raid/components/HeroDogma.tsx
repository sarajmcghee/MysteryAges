import { useState } from "react";
import "./dogma-theme.css";

interface HeroDogmaProps {
  agentsOnline: number;
  activeBoss: string;
  blockers: number;
  onPrimaryAction: () => void;
  onSecondaryAction: () => void;
  illustrationSrc?: string;
}

export function HeroDogma({
  agentsOnline,
  activeBoss,
  blockers,
  onPrimaryAction,
  onSecondaryAction,
  illustrationSrc = `${import.meta.env.BASE_URL}dogma-reference.jpg`
}: HeroDogmaProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasImage = Boolean(illustrationSrc) && !imageFailed;

  return (
    <section className="dogma-hero" aria-labelledby="dogma-hero-title">
      <div className="dogma-hero__inner">
        <div className="dogma-hero__content dogma-fade-in">
          <p className="dogma-kicker">Cottage Command</p>
          <h1 id="dogma-hero-title" className="dogma-title">
            Gather the party.
            <br />
            Finish the raid before sundown.
          </h1>
          <p className="dogma-subtitle">
            A handcrafted leader console for assigning quests, calming blockers, and keeping every agent in sync.
          </p>

          <div className="dogma-cta-row" role="group" aria-label="Hero actions">
            <button type="button" className="dogma-btn dogma-btn--primary" onClick={onPrimaryAction}>
              Enter Command Deck
            </button>
            <button type="button" className="dogma-btn dogma-btn--secondary" onClick={onSecondaryAction}>
              Assign First Task
            </button>
          </div>

          <dl className="dogma-status" aria-label="Party status">
            <div>
              <dt>Agents Online</dt>
              <dd>{agentsOnline}</dd>
            </div>
            <div>
              <dt>Active Boss</dt>
              <dd>{activeBoss}</dd>
            </div>
            <div>
              <dt>Blockers</dt>
              <dd>{blockers}</dd>
            </div>
          </dl>
        </div>

        <div className={`dogma-hero__art dogma-float ${hasImage ? "dogma-hero__art--image" : ""}`} aria-hidden="true">
          {hasImage ? (
            <>
              <img
                className="dogma-hero__image"
                src={illustrationSrc}
                alt=""
                loading="eager"
                onError={() => setImageFailed(true)}
              />
              <div className="dogma-cloud dogma-cloud--a" />
              <div className="dogma-cloud dogma-cloud--b" />
            </>
          ) : (
            <>
              <div className="dogma-cloud dogma-cloud--a" />
              <div className="dogma-cloud dogma-cloud--b" />
              <div className="dogma-hill" />
              <div className="dogma-shop">
                <div className="dogma-roof" />
                <div className="dogma-awning" />
                <div className="dogma-upper-window" />
                <div className="dogma-door" />
                <div className="dogma-window dogma-window--left" />
                <div className="dogma-window dogma-window--right" />
                <div className="dogma-stairs" />
              </div>
              <div className="dogma-lamp" />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
