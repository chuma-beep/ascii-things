import { AmbientWorld, type AmbientWorldOptions } from "../ambient";

export class StarlingWorld extends AmbientWorld {
  constructor(options: AmbientWorldOptions = {}) {
    super("starlings", options);
  }
}

export type StarlingWorldOptions = AmbientWorldOptions;
