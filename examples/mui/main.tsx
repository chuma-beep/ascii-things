import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  CssBaseline,
  Divider,
  Slider,
  Stack,
  ThemeProvider,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  createTheme,
} from "@mui/material";
import { AsciiJellyfish, AsciiKoi } from "../../src/react";
import { AsciiSurface } from "../../src/webgl/react";

const theme = createTheme({
  palette: {
    mode: "dark",
    background: { default: "#070809", paper: "#0b0d0f" },
    text: { primary: "#ece8df", secondary: "#8d8a82" },
    primary: { main: "#ff7a1a" },
    divider: "#24262a",
  },
  typography: {
    fontFamily: "ui-monospace, SFMono-Regular, 'Geist Mono', Menlo, monospace",
    fontSize: 12,
  },
  shape: { borderRadius: 8 },
});

function JellyfishCard() {
  const [seed, setSeed] = useState(3);

  return (
    <Card variant="outlined">
      <CardHeader
        title="Jellyfish bloom"
        subheader="ascii-things/react · neon"
        slotProps={{
          title: { variant: "subtitle2" },
          subheader: { variant: "caption" },
        }}
        action={<Chip label="live" size="small" variant="outlined" />}
      />
      <Box sx={{ height: 280, bgcolor: "#050607" }}>
        <AsciiJellyfish palette="neon" seed={seed} label="A live ASCII jellyfish bloom" />
      </Box>
      <CardActions sx={{ justifyContent: "space-between" }}>
        <Typography variant="caption" color="text.secondary">
          seeded world / neon
        </Typography>
        <Button size="small" variant="contained" onClick={() => setSeed((value) => value + 1)}>
          Re-seed
        </Button>
      </CardActions>
    </Card>
  );
}

function KoiCard() {
  const [density, setDensity] = useState(0.16);

  return (
    <Card variant="outlined">
      <CardHeader
        title="Koi pond"
        subheader="ascii-things/react · koi"
        slotProps={{
          title: { variant: "subtitle2" },
          subheader: { variant: "caption" },
        }}
        action={<Chip label="live" size="small" variant="outlined" />}
      />
      <Box sx={{ height: 240, bgcolor: "#050607" }}>
        <AsciiKoi palette="abyss" seed={9} label="A live ASCII koi pond" />
      </Box>
      <CardContent>
        <Typography variant="caption" color="text.secondary">
          Animated scenes share the sized-box pattern. Controls stay outside the canvas.
        </Typography>
      </CardContent>
      <Divider />
      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
          Surface density / {density.toFixed(2)}
        </Typography>
        <Slider
          size="small"
          aria-label="Surface density"
          min={0.05}
          max={0.4}
          step={0.01}
          value={density}
          onChange={(_, value) => setDensity(value as number)}
        />
      </Box>
    </Card>
  );
}

const RAMP = [".:-=+*#%@", " .:-=+*#%@", "█▓▒░ ", "0123456789"] as const;

function SurfaceCard() {
  const [ramp, setRamp] = useState<string>(RAMP[0]);

  return (
    <Card variant="outlined">
      <CardHeader
        title="WebGL surface"
        subheader="ascii-things/webgl · fragment shader"
        slotProps={{
          title: { variant: "subtitle2" },
          subheader: { variant: "caption" },
        }}
        action={<Chip label="webgl" size="small" variant="outlined" />}
      />
      <Box sx={{ height: 300, bgcolor: "#050607" }}>
        <AsciiSurface
          text="ASCII-THINGS"
          glyphs={ramp}
          density={0.16}
          pointer
          label="A shader-backed ASCII glyph field"
        />
      </Box>
      <CardContent>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={ramp}
          onChange={(_, value: string | null) => value && setRamp(value)}
          aria-label="Glyph ramp"
        >
          {RAMP.map((value, index) => (
            <ToggleButton key={value} value={value} aria-label={`Ramp ${index + 1}`}>
              {index + 1}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </CardContent>
    </Card>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ maxWidth: 1040, mx: "auto", px: 3, py: 8 }}>
        <Stack spacing={1.5} sx={{ mb: 5 }}>
          <Typography variant="overline" sx={{ color: "primary.main", letterSpacing: "0.22em" }}>
            Design system recipe
          </Typography>
          <Typography variant="h4" component="h1">
            ascii-things inside Material UI
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 620 }}>
            MUI owns the card, the theme, and the controls. The scene wrappers fill a sized{" "}
            <code>Box</code>. Everything below is a normal MUI component around an ascii-things
            canvas.
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          }}
        >
          <JellyfishCard />
          <KoiCard />
          <Box sx={{ gridColumn: { md: "1 / -1" } }}>
            <SurfaceCard />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(<App />);
}
