import { AmbientWorld, type AmbientWorldOptions } from "../ambient";

export class CityWorld extends AmbientWorld {
  constructor(options: AmbientWorldOptions = {}) {
    super("city", options);
  }
}

export type CityWorldOptions = AmbientWorldOptions;
