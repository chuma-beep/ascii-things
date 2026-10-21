"use client";

import { AsciiDither } from "ascii-things/dither/react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
