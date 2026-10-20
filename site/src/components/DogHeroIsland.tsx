import { useEffect, useState } from "react";
import { AsciiDogHero } from "ascii-things/ui";
import "ascii-things/ui.css";

/**
 * The first-party `AsciiDogHero` recipe as an Astro island. It adds one thing
 * the component cannot know on the server: the current reduced-motion setting.
 */
export default function DogHeroIsland() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return (
    <div className="docs-dog-hero">
      <AsciiDogHero
        palette="abyss"
        seed={7}
        dogs={[{ size: 1.15 }]}
        spread={[0.68, 0.68]}
        stageLabel=""
        calm={reducedMotion}
        title={
          <>
            A small scene.
            <br />
            <em>A very good dog.</em>
          </>
        }
        lede="The full recipe: a live engine, a framed stage, a command input, and a live readout. Type a command and the dog fetches the ball."
      />
    </div>
  );
}
