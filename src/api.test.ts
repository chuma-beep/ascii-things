import { describe, expect, it } from "vitest";
import * as ants from "./ants";
import * as city from "./city";
import * as dither from "./dither";
import * as ditherElement from "./dither/element";
import * as ditherReact from "./dither/react";
import * as dog from "./dog";
import * as element from "./element";
import * as fireflies from "./fireflies";
import * as image from "./image";
import * as imageElement from "./image/element";
import * as imageReact from "./image/react";
import * as jellyfish from "./jellyfish";
import * as koi from "./koi";
import * as main from "./index";
import * as react from "./react";
import * as robots from "./robots";
import * as servers from "./servers";
import * as sharks from "./sharks";
import * as starlings from "./starlings";
import * as ui from "./ui";
import * as webgl from "./webgl";
import * as webglElement from "./webgl/element";
import * as webglReact from "./webgl/react";

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
      starlings: Object.keys(starlings).sort(),
      fireflies: Object.keys(fireflies).sort(),
      ants: Object.keys(ants).sort(),
      koi: Object.keys(koi).sort(),
      city: Object.keys(city).sort(),
      servers: Object.keys(servers).sort(),
      react: Object.keys(react).sort(),
      ui: Object.keys(ui).sort(),
      element: Object.keys(element).sort(),
      image: Object.keys(image).sort(),
      imageReact: Object.keys(imageReact).sort(),
      imageElement: Object.keys(imageElement).sort(),
      dither: Object.keys(dither).sort(),
      ditherReact: Object.keys(ditherReact).sort(),
      ditherElement: Object.keys(ditherElement).sort(),
      webgl: Object.keys(webgl).sort(),
      webglReact: Object.keys(webglReact).sort(),
      webglElement: Object.keys(webglElement).sort(),
    }).toMatchSnapshot();
  });
});
