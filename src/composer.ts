import type { StyleConfig } from './config';
import type { ParsedSvg, SvgCommand, SvgElement } from './svgParser';

const fmt = (n: number): string => {
  const s = n.toFixed(2);
  // Strip trailing zeros: "12.50" → "12.5", "12.00" → "12"
  return s.replace(/\.?0+$/, '') || '0';
};

const commandToXml = (cmd: SvgCommand): string => {
  switch (cmd.type) {
    case 'M':
      return `<move x="${fmt(cmd.x)}" y="${fmt(cmd.y)}"/>`;
    case 'L':
      return `<line x="${fmt(cmd.x)}" y="${fmt(cmd.y)}"/>`;
    case 'C':
      return (
        `<curve` +
        ` x1="${fmt(cmd.x1)}" y1="${fmt(cmd.y1)}"` +
        ` x2="${fmt(cmd.x2)}" y2="${fmt(cmd.y2)}"` +
        ` x3="${fmt(cmd.x)}" y3="${fmt(cmd.y)}"/>`
      );
    case 'Q':
      return (
        `<quad` +
        ` x1="${fmt(cmd.x1)}" y1="${fmt(cmd.y1)}"` +
        ` x2="${fmt(cmd.x)}" y2="${fmt(cmd.y)}"/>`
      );
    case 'A':
      return (
        `<arc` +
        ` rx="${fmt(cmd.rx)}" ry="${fmt(cmd.ry)}"` +
        ` x-axis-rotation="${fmt(cmd.rotation)}"` +
        ` large-arc-flag="${cmd.largeArc}"` +
        ` sweep-flag="${cmd.sweep}"` +
        ` x="${fmt(cmd.x)}" y="${fmt(cmd.y)}"/>`
      );
    case 'Z':
      return `<close/>`;
    default:
      return '';
  }
};

const elementToXml = (
  el: SvgElement,
  scale: number,
  offsetX: number,
  offsetY: number
): string => {
  if (el.tag === 'path') {
    const scaled = el.commands.map((cmd): SvgCommand => {
      switch (cmd.type) {
        case 'M':
        case 'L':
          return {
            ...cmd,
            x: cmd.x * scale + offsetX,
            y: cmd.y * scale + offsetY,
          };
        case 'C':
          return {
            ...cmd,
            x1: cmd.x1 * scale + offsetX,
            y1: cmd.y1 * scale + offsetY,
            x2: cmd.x2 * scale + offsetX,
            y2: cmd.y2 * scale + offsetY,
            x: cmd.x * scale + offsetX,
            y: cmd.y * scale + offsetY,
          };
        case 'Q':
          return {
            ...cmd,
            x1: cmd.x1 * scale + offsetX,
            y1: cmd.y1 * scale + offsetY,
            x: cmd.x * scale + offsetX,
            y: cmd.y * scale + offsetY,
          };
        case 'A':
          return {
            ...cmd,
            rx: cmd.rx * scale,
            ry: cmd.ry * scale,
            x: cmd.x * scale + offsetX,
            y: cmd.y * scale + offsetY,
          };
        case 'Z':
          return cmd;
        default:
          return cmd;
      }
    });
    const pathCmds = scaled.map(commandToXml).join('');
    return `<path>${pathCmds}</path><fill/>`;
  }

  if (el.tag === 'circle') {
    const cx = el.cx * scale + offsetX;
    const cy = el.cy * scale + offsetY;
    const rx = el.r * scale;
    const ry = el.r * scale;
    return (
      `<ellipse` +
      ` x="${fmt(cx - rx)}" y="${fmt(cy - ry)}"` +
      ` w="${fmt(rx * 2)}" h="${fmt(ry * 2)}"/>` +
      `<fill/>`
    );
  }

  if (el.tag === 'rect') {
    const x = el.x * scale + offsetX;
    const y = el.y * scale + offsetY;
    const w = el.width * scale;
    const h = el.height * scale;
    return (
      `<rect x="${fmt(x)}" y="${fmt(y)}"` +
      ` w="${fmt(w)}" h="${fmt(h)}"/>` +
      `<fill/>`
    );
  }

  return '';
};

/**
 * Creates a draw.io stencil XML from parsed SVG content.
 *
 * The stencil uses:
 * - `fillColor` (from the draw.io cell) for the background rect
 * - A hardcoded color from config for the icon shapes
 *
 * This allows users to change the background color in draw.io
 * while keeping the icon color fixed.
 */
export const createStencilXml = (
  parsed: ParsedSvg,
  config: StyleConfig
): string => {
  const { bgSize, iconSize, iconColor } = config;

  const { w: vbW, h: vbH } = parsed.viewBox;
  const scale = iconSize / Math.max(vbW, vbH);
  const scaledW = vbW * scale;
  const scaledH = vbH * scale;
  const offsetX = (bgSize - scaledW) / 2;
  const offsetY = (bgSize - scaledH) / 2;

  const iconShapes = parsed.elements
    .map((el) => elementToXml(el, scale, offsetX, offsetY))
    .join('');

  return [
    `<shape aspect="fixed" w="${bgSize}" h="${bgSize}">`,
    `<background>`,
    `<rect x="0" y="0" w="${bgSize}" h="${bgSize}"/>`,
    `</background>`,
    `<foreground>`,
    `<fill/>`,
    `<stroke/>`,
    `<save/>`,
    `<fillcolor color="${iconColor}"/>`,
    `<strokecolor color="${iconColor}"/>`,
    iconShapes,
    `<restore/>`,
    `</foreground>`,
    `<connections>`,
    `<constraint x="0.5" y="0" perimeter="0" name="N"/>`,
    `<constraint x="0.5" y="1" perimeter="0" name="S"/>`,
    `<constraint x="0" y="0.5" perimeter="0" name="W"/>`,
    `<constraint x="1" y="0.5" perimeter="0" name="E"/>`,
    `</connections>`,
    `</shape>`,
  ].join('');
};
