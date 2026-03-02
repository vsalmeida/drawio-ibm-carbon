export type SvgCommand =
  | { type: 'M'; x: number; y: number }
  | { type: 'L'; x: number; y: number }
  | {
      type: 'C';
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      x: number;
      y: number;
    }
  | { type: 'Q'; x1: number; y1: number; x: number; y: number }
  | {
      type: 'A';
      rx: number;
      ry: number;
      rotation: number;
      largeArc: number;
      sweep: number;
      x: number;
      y: number;
    }
  | { type: 'Z' };

export type SvgElement =
  | { tag: 'path'; commands: SvgCommand[] }
  | { tag: 'circle'; cx: number; cy: number; r: number }
  | {
      tag: 'rect';
      x: number;
      y: number;
      width: number;
      height: number;
    };

export interface ParsedSvg {
  viewBox: { w: number; h: number };
  elements: SvgElement[];
}

const TOKEN_RE =
  /[MmLlHhVvCcSsQqTtAaZz]|[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g;

const COMMAND_LETTERS = new Set('MmLlHhVvCcSsQqTtAaZz'.split(''));

const tokenize = (d: string): string[] => d.match(TOKEN_RE) ?? [];

const getImplicitCmd = (lastCmd: string): string => {
  if (lastCmd === 'M') return 'L';
  if (lastCmd === 'm') return 'l';
  return lastCmd;
};

const shouldReflect = (lastCmd: string, ...types: string[]): boolean =>
  types.includes(lastCmd.toUpperCase());

/**
 * Parses an SVG path `d` attribute into absolute, normalized
 * SvgCommand[] — all relative commands converted to absolute,
 * shorthands (H, V, S, T) expanded to full forms (L, C, Q).
 */
export const parsePathData = (d: string): SvgCommand[] => {
  const tokens = tokenize(d);
  const commands: SvgCommand[] = [];

  let curX = 0;
  let curY = 0;
  let startX = 0;
  let startY = 0;
  let lastCtrlX = 0;
  let lastCtrlY = 0;
  let lastCmd = '';

  let i = 0;

  const num = (): number => {
    const val = parseFloat(tokens[i]);
    i += 1;
    return val;
  };

  while (i < tokens.length) {
    let cmd = tokens[i];

    if (COMMAND_LETTERS.has(cmd)) {
      i += 1;
    } else {
      cmd = getImplicitCmd(lastCmd);
    }

    const isRel = cmd === cmd.toLowerCase() && cmd !== 'Z';
    const upper = cmd.toUpperCase();
    const baseX = isRel ? curX : 0;
    const baseY = isRel ? curY : 0;

    switch (upper) {
      case 'M': {
        const x = num() + baseX;
        const y = num() + baseY;
        commands.push({ type: 'M', x, y });
        curX = x;
        curY = y;
        startX = x;
        startY = y;
        lastCmd = cmd;
        lastCtrlX = curX;
        lastCtrlY = curY;
        break;
      }
      case 'L': {
        const x = num() + baseX;
        const y = num() + baseY;
        commands.push({ type: 'L', x, y });
        curX = x;
        curY = y;
        lastCmd = cmd;
        lastCtrlX = curX;
        lastCtrlY = curY;
        break;
      }
      case 'H': {
        const x = num() + (isRel ? curX : 0);
        commands.push({ type: 'L', x, y: curY });
        curX = x;
        lastCmd = cmd;
        lastCtrlX = curX;
        lastCtrlY = curY;
        break;
      }
      case 'V': {
        const y = num() + (isRel ? curY : 0);
        commands.push({ type: 'L', x: curX, y });
        curY = y;
        lastCmd = cmd;
        lastCtrlX = curX;
        lastCtrlY = curY;
        break;
      }
      case 'C': {
        const x1 = num() + baseX;
        const y1 = num() + baseY;
        const x2 = num() + baseX;
        const y2 = num() + baseY;
        const x = num() + baseX;
        const y = num() + baseY;
        commands.push({ type: 'C', x1, y1, x2, y2, x, y });
        lastCtrlX = x2;
        lastCtrlY = y2;
        curX = x;
        curY = y;
        lastCmd = cmd;
        break;
      }
      case 'S': {
        const canReflect = shouldReflect(lastCmd, 'C', 'S');
        const rx1 = canReflect ? 2 * curX - lastCtrlX : curX;
        const ry1 = canReflect ? 2 * curY - lastCtrlY : curY;
        const x2 = num() + baseX;
        const y2 = num() + baseY;
        const x = num() + baseX;
        const y = num() + baseY;
        commands.push({
          type: 'C',
          x1: rx1,
          y1: ry1,
          x2,
          y2,
          x,
          y,
        });
        lastCtrlX = x2;
        lastCtrlY = y2;
        curX = x;
        curY = y;
        lastCmd = cmd;
        break;
      }
      case 'Q': {
        const x1 = num() + baseX;
        const y1 = num() + baseY;
        const x = num() + baseX;
        const y = num() + baseY;
        commands.push({ type: 'Q', x1, y1, x, y });
        lastCtrlX = x1;
        lastCtrlY = y1;
        curX = x;
        curY = y;
        lastCmd = cmd;
        break;
      }
      case 'T': {
        const canReflect = shouldReflect(lastCmd, 'Q', 'T');
        const rx1 = canReflect ? 2 * curX - lastCtrlX : curX;
        const ry1 = canReflect ? 2 * curY - lastCtrlY : curY;
        const x = num() + baseX;
        const y = num() + baseY;
        commands.push({
          type: 'Q',
          x1: rx1,
          y1: ry1,
          x,
          y,
        });
        lastCtrlX = rx1;
        lastCtrlY = ry1;
        curX = x;
        curY = y;
        lastCmd = cmd;
        break;
      }
      case 'A': {
        const rx = num();
        const ry = num();
        const rotation = num();
        const largeArc = num();
        const sweep = num();
        const x = num() + baseX;
        const y = num() + baseY;
        commands.push({
          type: 'A',
          rx,
          ry,
          rotation,
          largeArc,
          sweep,
          x,
          y,
        });
        curX = x;
        curY = y;
        lastCmd = cmd;
        lastCtrlX = curX;
        lastCtrlY = curY;
        break;
      }
      case 'Z': {
        commands.push({ type: 'Z' });
        curX = startX;
        curY = startY;
        lastCmd = cmd;
        lastCtrlX = curX;
        lastCtrlY = curY;
        break;
      }
      default:
        break;
    }
  }

  return commands;
};

const extractAttr = (tag: string, name: string): string | undefined => {
  const re = new RegExp(`${name}="([^"]*)"`, 'i');
  return re.exec(tag)?.[1];
};

const numAttr = (tag: string, name: string, fallback = 0): number =>
  parseFloat(extractAttr(tag, name) ?? '') || fallback;

/**
 * Parses a raw Carbon SVG string and extracts its viewBox
 * dimensions and geometric elements (path, circle, rect).
 */
export const parseSvgContent = (svgString: string): ParsedSvg => {
  const vbMatch = svgString.match(/viewBox="([^"]+)"/);
  let w = 32;
  let h = 32;
  if (vbMatch) {
    const parts = vbMatch[1].trim().split(/\s+/);
    w = parseFloat(parts[2] ?? '32') || 32;
    h = parseFloat(parts[3] ?? '32') || 32;
  }

  const elements: SvgElement[] = [];

  const pathRe = /<path\s[^>]*?\bd="([^"]+)"[^>]*?\/?>/gi;
  let match: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((match = pathRe.exec(svgString)) !== null) {
    elements.push({
      tag: 'path',
      commands: parsePathData(match[1]),
    });
  }

  const circleRe = /<circle\s[^>]*?\/?>/gi;
  // eslint-disable-next-line no-cond-assign
  while ((match = circleRe.exec(svgString)) !== null) {
    elements.push({
      tag: 'circle',
      cx: numAttr(match[0], 'cx'),
      cy: numAttr(match[0], 'cy'),
      r: numAttr(match[0], 'r'),
    });
  }

  const innerMatch = svgString.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
  const inner = innerMatch?.[1] ?? '';
  const rectRe = /<rect\s[^>]*?\/?>/gi;
  // eslint-disable-next-line no-cond-assign
  while ((match = rectRe.exec(inner)) !== null) {
    elements.push({
      tag: 'rect',
      x: numAttr(match[0], 'x'),
      y: numAttr(match[0], 'y'),
      width: numAttr(match[0], 'width'),
      height: numAttr(match[0], 'height'),
    });
  }

  return { viewBox: { w, h }, elements };
};
