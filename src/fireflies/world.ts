import { AmbientWorld, type AmbientWorldOptions } from "../ambient";

export class FireflyWorld extends AmbientWorld {
  constructor(options: AmbientWorldOptions = {}) {
    super("fireflies", options);
  }
}

export type FireflyWorldOptions = AmbientWorldOptions;
