export type SymbolGroup = "ascii" | "blocks" | "box" | "arrows" | "shapes" | "math" | "marks";

export interface AsciiSymbol {
  char: string;
  display: string;
  name: string;
  code: string;
  group: SymbolGroup;
}

export interface SymbolRamp {
  name: string;
  value: string;
  note: string;
}

export const SYMBOL_GROUPS: Array<{ id: SymbolGroup; label: string }> = [
  { id: "ascii", label: "ASCII" },
  { id: "blocks", label: "Blocks" },
  { id: "box", label: "Box" },
  { id: "arrows", label: "Arrows" },
  { id: "shapes", label: "Shapes" },
  { id: "math", label: "Math" },
  { id: "marks", label: "Marks" },
];

const codePoint = (char: string) =>
  `U+${(char.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, "0")}`;

const symbol = (char: string, name: string, group: SymbolGroup, display = char): AsciiSymbol => ({
  char,
  display,
  name,
  code: codePoint(char),
  group,
});

const DIGIT_NAMES = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
];

const ASCII_LETTERS = Array.from({ length: 26 }, (_, index) => {
  const upper = String.fromCharCode(65 + index);
  const lower = String.fromCharCode(97 + index);
  return [
    symbol(upper, `Latin capital letter ${upper}`, "ascii"),
    symbol(lower, `Latin small letter ${lower}`, "ascii"),
  ];
}).flat();

const ASCII_DIGITS = DIGIT_NAMES.map((name, index) =>
  symbol(String(index), `Digit ${name}`, "ascii"),
);

const ASCII_PUNCTUATION: Array<[string, string, string?]> = [
  [" ", "Space", "␠"],
  ["!", "Exclamation mark"],
  ['"', "Quotation mark"],
  ["#", "Number sign"],
  ["$", "Dollar sign"],
  ["%", "Percent sign"],
  ["&", "Ampersand"],
  ["'", "Apostrophe"],
  ["(", "Left parenthesis"],
  [")", "Right parenthesis"],
  ["*", "Asterisk"],
  ["+", "Plus sign"],
  [",", "Comma"],
  ["-", "Hyphen-minus"],
  [".", "Full stop"],
  ["/", "Solidus"],
  [":", "Colon"],
  [";", "Semicolon"],
  ["<", "Less-than sign"],
  ["=", "Equals sign"],
  [">", "Greater-than sign"],
  ["?", "Question mark"],
  ["@", "Commercial at"],
  ["[", "Left square bracket"],
  ["\\", "Reverse solidus"],
  ["]", "Right square bracket"],
  ["^", "Circumflex accent"],
  ["_", "Low line"],
  ["`", "Grave accent"],
  ["{", "Left curly bracket"],
  ["|", "Vertical line"],
  ["}", "Right curly bracket"],
  ["~", "Tilde"],
];

const ASCII_PUNCTUATION_SYMBOLS = ASCII_PUNCTUATION.map(([char, name, display]) =>
  symbol(char, name, "ascii", display ?? char),
);

const groupSymbols = (group: SymbolGroup, entries: Array<[string, string]>) =>
  entries.map(([char, name]) => symbol(char, name, group));

const BLOCKS: Array<[string, string]> = [
  ["░", "Light shade"],
  ["▒", "Medium shade"],
  ["▓", "Dark shade"],
  ["█", "Full block"],
  ["▀", "Upper half block"],
  ["▄", "Lower half block"],
  ["▌", "Left half block"],
  ["▐", "Right half block"],
  ["▁", "Lower one eighth block"],
  ["▂", "Lower one quarter block"],
  ["▃", "Lower three eighths block"],
  ["▅", "Lower five eighths block"],
  ["▆", "Lower three quarters block"],
  ["▇", "Lower seven eighths block"],
  ["▉", "Left seven eighths block"],
  ["▊", "Left three quarters block"],
  ["▋", "Left five eighths block"],
  ["▍", "Left three eighths block"],
  ["▎", "Left one quarter block"],
  ["▏", "Left one eighth block"],
  ["▕", "Right one eighth block"],
  ["▔", "Upper one eighth block"],
  ["▖", "Quadrant lower left"],
  ["▗", "Quadrant lower right"],
  ["▘", "Quadrant upper left"],
  ["▝", "Quadrant upper right"],
  ["▚", "Quadrant upper left and lower right"],
  ["▞", "Quadrant upper right and lower left"],
  ["▙", "Quadrant upper left and lower left and lower right"],
  ["▛", "Quadrant upper left and upper right and lower left"],
  ["▜", "Quadrant upper left and upper right and lower right"],
  ["▟", "Quadrant upper right and lower left and lower right"],
];

const BOX: Array<[string, string]> = [
  ["─", "Light horizontal"],
  ["│", "Light vertical"],
  ["┌", "Light down and right"],
  ["┐", "Light down and left"],
  ["└", "Light up and right"],
  ["┘", "Light up and left"],
  ["├", "Light vertical and right"],
  ["┤", "Light vertical and left"],
  ["┬", "Light down and horizontal"],
  ["┴", "Light up and horizontal"],
  ["┼", "Light vertical and horizontal"],
  ["╭", "Light arc down and right"],
  ["╮", "Light arc down and left"],
  ["╯", "Light arc up and left"],
  ["╰", "Light arc up and right"],
  ["╱", "Light diagonal upper right to lower left"],
  ["╲", "Light diagonal upper left to lower right"],
  ["╳", "Light diagonal cross"],
  ["═", "Double horizontal"],
  ["║", "Double vertical"],
  ["╔", "Double down and right"],
  ["╗", "Double down and left"],
  ["╚", "Double up and right"],
  ["╝", "Double up and left"],
  ["╠", "Double vertical and right"],
  ["╣", "Double vertical and left"],
  ["╦", "Double down and horizontal"],
  ["╩", "Double up and horizontal"],
  ["╬", "Double vertical and horizontal"],
];

const ARROWS: Array<[string, string]> = [
  ["←", "Leftwards arrow"],
  ["↑", "Upwards arrow"],
  ["→", "Rightwards arrow"],
  ["↓", "Downwards arrow"],
  ["↔", "Left right arrow"],
  ["↕", "Up down arrow"],
  ["↖", "North west arrow"],
  ["↗", "North east arrow"],
  ["↘", "South east arrow"],
  ["↙", "South west arrow"],
  ["↚", "Leftwards arrow with stroke"],
  ["↛", "Rightwards arrow with stroke"],
  ["↞", "Leftwards two headed arrow"],
  ["↠", "Rightwards two headed arrow"],
  ["↤", "Leftwards arrow from bar"],
  ["↦", "Rightwards arrow from bar"],
  ["⇐", "Leftwards double arrow"],
  ["⇑", "Upwards double arrow"],
  ["⇒", "Rightwards double arrow"],
  ["⇓", "Downwards double arrow"],
  ["⇔", "Left right double arrow"],
  ["⇕", "Up down double arrow"],
  ["⇖", "North west double arrow"],
  ["⇗", "North east double arrow"],
  ["⇘", "South east double arrow"],
  ["⇙", "South west double arrow"],
  ["⟵", "Long leftwards arrow"],
  ["⟶", "Long rightwards arrow"],
  ["⟷", "Long left right arrow"],
];

const SHAPES: Array<[string, string]> = [
  ["■", "Black square"],
  ["□", "White square"],
  ["▪", "Black small square"],
  ["▫", "White small square"],
  ["◆", "Black diamond"],
  ["◇", "White diamond"],
  ["◈", "White diamond containing black small diamond"],
  ["●", "Black circle"],
  ["○", "White circle"],
  ["◉", "Fisheye"],
  ["◎", "Bullseye"],
  ["◐", "Circle with left half black"],
  ["◑", "Circle with right half black"],
  ["◒", "Circle with lower half black"],
  ["◓", "Circle with upper half black"],
  ["◍", "Circle with vertical fill"],
  ["◌", "Dotted circle"],
  ["◯", "Large circle"],
  ["▣", "White square containing black small square"],
  ["▤", "Square with horizontal fill"],
  ["▥", "Square with vertical fill"],
  ["▦", "Square with orthogonal crosshatch fill"],
  ["▧", "Square with upper left to lower right fill"],
  ["▨", "Square with upper right to lower left fill"],
  ["▩", "Square with diagonal crosshatch fill"],
  ["▲", "Black up-pointing triangle"],
  ["△", "White up-pointing triangle"],
  ["▼", "Black down-pointing triangle"],
  ["▽", "White down-pointing triangle"],
  ["◀", "Black left-pointing triangle"],
  ["▶", "Black right-pointing triangle"],
];

const MATH: Array<[string, string]> = [
  ["±", "Plus-minus sign"],
  ["×", "Multiplication sign"],
  ["÷", "Division sign"],
  ["≈", "Almost equal to"],
  ["≠", "Not equal to"],
  ["≡", "Identical to"],
  ["≤", "Less-than or equal to"],
  ["≥", "Greater-than or equal to"],
  ["∞", "Infinity"],
  ["∑", "N-ary summation"],
  ["∏", "N-ary product"],
  ["√", "Square root"],
  ["∫", "Integral"],
  ["∂", "Partial differential"],
  ["∆", "Increment"],
  ["∇", "Nabla"],
  ["∈", "Element of"],
  ["∉", "Not an element of"],
  ["⊂", "Subset of"],
  ["⊃", "Superset of"],
  ["⊆", "Subset of or equal to"],
  ["⊇", "Superset of or equal to"],
  ["∪", "Union"],
  ["∩", "Intersection"],
  ["∧", "Logical and"],
  ["∨", "Logical or"],
  ["¬", "Not sign"],
  ["∀", "For all"],
  ["∃", "There exists"],
  ["∅", "Empty set"],
  ["∴", "Therefore"],
  ["∵", "Because"],
];

const MARKS: Array<[string, string]> = [
  ["★", "Black star"],
  ["☆", "White star"],
  ["✦", "Black four pointed star"],
  ["✧", "White four pointed star"],
  ["✩", "Stress outlined white star"],
  ["✪", "Circled white star"],
  ["✫", "Open centre black star"],
  ["✬", "Black centre white star"],
  ["✭", "Outlined black star"],
  ["✮", "Heavy outlined black star"],
  ["✯", "Pinwheel star"],
  ["✰", "Shadowed white star"],
  ["✓", "Check mark"],
  ["✔", "Heavy check mark"],
  ["✕", "Multiplication x"],
  ["✖", "Heavy multiplication x"],
  ["✗", "Ballot x"],
  ["✘", "Heavy ballot x"],
  ["•", "Bullet"],
  ["·", "Middle dot"],
  ["°", "Degree sign"],
  ["′", "Prime"],
  ["″", "Double prime"],
  ["‽", "Interrobang"],
  ["¡", "Inverted exclamation mark"],
  ["¿", "Inverted question mark"],
  ["§", "Section sign"],
  ["¶", "Pilcrow sign"],
  ["©", "Copyright sign"],
  ["®", "Registered sign"],
  ["™", "Trade mark sign"],
];

export const SYMBOLS: AsciiSymbol[] = [
  ...ASCII_LETTERS,
  ...ASCII_DIGITS,
  ...ASCII_PUNCTUATION_SYMBOLS,
  ...groupSymbols("blocks", BLOCKS),
  ...groupSymbols("box", BOX),
  ...groupSymbols("arrows", ARROWS),
  ...groupSymbols("shapes", SHAPES),
  ...groupSymbols("math", MATH),
  ...groupSymbols("marks", MARKS),
];

export const SYMBOL_RAMPS: SymbolRamp[] = [
  { name: "Classic", value: " .:-=+*#%@", note: "10 steps" },
  {
    name: "Fine",
    value: " .'`^\",:;Il!i~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
    note: "70 steps",
  },
  { name: "Blocks", value: " ░▒▓█", note: "5 steps" },
  { name: "Dots", value: " ·•●", note: "4 steps" },
  { name: "Braille", value: " ⠁⠃⠇⡇⣇⣿", note: "7 steps" },
  { name: "Kanji", value: " 永龍風水火土空海月花鳥", note: "12 steps" },
];
