"use client";

import { useState } from "react";
import { AsciiKoi } from "ascii-things/react";
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
