"use client";

import { useState } from "react";
import { AsciiSurface } from "ascii-things/webgl/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
