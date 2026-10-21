import { describe, expect, it } from "vitest";
import * as dog from "./dog";
import * as element from "./element";
import * as image from "./image";
import * as imageElement from "./image/element";
import * as imageReact from "./image/react";
import * as jellyfish from "./jellyfish";
import * as main from "./index";
import * as react from "./react";
import * as robots from "./robots";
import * as sharks from "./sharks";
import * as ui from "./ui";

/**
 * A contract test for the public runtime surface. The snapshot is the
 * 1.0 API freeze: adding an export is allowed in a minor release, removing
 * or renaming one is a breaking change.
 */
describe("public API surface", () => {
  it("matches the frozen export names", () => {
    expect({
      index: Object.keys(main).sort(),
      sharks: Object.keys(sharks).sort(),
      robots: Object.keys(robots).sort(),
      jellyfish: Object.keys(jellyfish).sort(),
      dog: Object.keys(dog).sort(),
      react: Object.keys(react).sort(),
      ui: Object.keys(ui).sort(),
      element: Object.keys(element).sort(),
      image: Object.keys(image).sort(),
      imageReact: Object.keys(imageReact).sort(),
      imageElement: Object.keys(imageElement).sort(),
    }).toMatchSnapshot();
  });
});
