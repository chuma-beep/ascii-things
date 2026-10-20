import { AmbientWorld, type AmbientWorldOptions } from "../ambient";

export class ServerWorld extends AmbientWorld {
  constructor(options: AmbientWorldOptions = {}) {
    super("servers", options);
  }
}

export type ServerWorldOptions = AmbientWorldOptions;
