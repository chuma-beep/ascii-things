import { useState } from "react";
import { AsciiDither } from "../../../src/dither/react";
import { AsciiKoi } from "../../../src/react";
import { AsciiSurface } from "../../../src/webgl/react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";

export function KoiCard() {
  const [seed, setSeed] = useState(12);

  return (
    <Card className="overflow-hidden border-white/10 bg-card">
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle>Koi pond</CardTitle>
          <CardDescription>ascii-things/react · abyss</CardDescription>
        </div>
        <Badge>live</Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-64 w-full bg-black">
          <AsciiKoi palette="abyss" seed={seed} label="A live ASCII koi pond" />
        </div>
      </CardContent>
      <CardFooter>
        <span className="text-[11px] text-muted-foreground">seed / {seed}</span>
        <Button variant="outline" size="sm" onClick={() => setSeed((value) => value + 1)}>
          Re-seed
        </Button>
      </CardFooter>
    </Card>
  );
}

export function DitherCard() {
  return (
    <Card className="overflow-hidden border-white/10 bg-card">
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle>Dither field</CardTitle>
          <CardDescription>ascii-things/dither · bayer8</CardDescription>
        </div>
        <Badge>canvas</Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-40 w-full bg-black">
          <AsciiDither text="ASCII-THINGS" matrix="bayer8" density={0.12} />
        </div>
      </CardContent>
    </Card>
  );
}

export function SurfaceCard() {
  const [dense, setDense] = useState(false);

  return (
    <Card className="overflow-hidden border-white/10 bg-card">
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle>WebGL surface</CardTitle>
          <CardDescription>ascii-things/webgl · shader field</CardDescription>
        </div>
        <Badge>webgl</Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-72 w-full bg-[#050607]">
          <AsciiSurface
            text="ASCII-THINGS"
            density={dense ? 0.34 : 0.16}
            glyphs=".:-=+*#%@"
            pointer
            label="A shader-backed ASCII glyph field"
          />
        </div>
      </CardContent>
      <CardFooter>
        <span className="text-[11px] text-muted-foreground">
          density / {dense ? "0.34" : "0.16"}
        </span>
        <Button variant="outline" size="sm" onClick={() => setDense((value) => !value)}>
          Toggle density
        </Button>
      </CardFooter>
    </Card>
  );
}
