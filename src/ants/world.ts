import { AmbientWorld, type AmbientWorldOptions } from "../ambient";

export class AntWorld extends AmbientWorld {
  constructor(options: AmbientWorldOptions = {}) {
    super("ants", options);
  }
}

export type AntWorldOptions = AmbientWorldOptions;
