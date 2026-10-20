import { AmbientWorld, type AmbientWorldOptions } from "../ambient";

export class KoiWorld extends AmbientWorld {
  constructor(options: AmbientWorldOptions = {}) {
    super("koi", options);
  }
}

export type KoiWorldOptions = AmbientWorldOptions;
