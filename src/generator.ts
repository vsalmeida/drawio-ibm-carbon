import { deflateRawSync } from 'zlib';

export interface Shape {
  title: string;
  stencilXml: string;
  width: number;
  height: number;
  bgColor: string;
  label?: string;
}

/**
 * Compresses stencil XML with deflateRaw + base64,
 * matching draw.io's expected stencil encoding.
 */
const encodeStencil = (xml: string): string =>
  deflateRawSync(Buffer.from(xml, 'utf8')).toString('base64');

const buildStyle = (encodedStencil: string, bgColor: string): string =>
  `shape=stencil(${encodedStencil});` +
  `fillColor=${bgColor};` +
  `strokeColor=none;` +
  `verticalLabelPosition=bottom;` +
  `labelBackgroundColor=#ffffff;` +
  `verticalAlign=top;` +
  `align=center;` +
  `spacingTop=5;`;

const buildMxGraphModel = (
  width: number,
  height: number,
  style: string,
  label = ''
): string =>
  `<mxGraphModel>` +
  `<root>` +
  `<mxCell id="0"/>` +
  `<mxCell id="1" parent="0"/>` +
  `<mxCell id="2" value="${label}" style="${style}" vertex="1" parent="1">` +
  `<mxGeometry width="${width}" height="${height}" as="geometry"/>` +
  `</mxCell>` +
  `</root>` +
  `</mxGraphModel>`;

const xmlEscapes: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
};

const escapeXml = (s: string): string =>
  s.replace(/[&<>]/g, (ch) => xmlEscapes[ch]);

/**
 * Generates the XML content for a draw.io library (.xml).
 * JSON is embedded inside <mxlibrary>, so < > & are escaped.
 */
export const generateLibraryXml = (shapes: Shape[]): string => {
  const entries = shapes.map(
    ({ title, stencilXml, width, height, bgColor, label }) => {
      const encoded = encodeStencil(stencilXml);
      const style = buildStyle(encoded, bgColor);
      const xml = buildMxGraphModel(width, height, style, label);
      return {
        title,
        xml,
        w: width,
        h: height,
        aspect: 'fixed',
        style,
      };
    }
  );

  const json = JSON.stringify(entries);
  return `<mxlibrary>${escapeXml(json)}</mxlibrary>`;
};

const buildGroupOuterStyle = (
  borderColor: string,
  borderWidth: number
): string =>
  `rounded=0;whiteSpace=wrap;html=1;` +
  `fillColor=none;` +
  `strokeColor=${borderColor};` +
  `strokeWidth=${borderWidth};` +
  `container=1;collapsible=0;`;

const buildIconCellStyle = (
  encodedStencil: string,
  labelGap: number,
  fontSize: number
): string =>
  `shape=stencil(${encodedStencil});` +
  `labelPosition=right;verticalLabelPosition=middle;` +
  `align=left;verticalAlign=middle;` +
  `spacingLeft=${labelGap};` +
  `fontSize=${fontSize};fontColor=#000000;` +
  `strokeColor=none;fillColor=none;` +
  `resizable=0;`;

const buildGroupMxGraphModel = (
  groupStyle: string,
  groupWidth: number,
  groupHeight: number,
  iconStyle: string,
  iconCellWidth: number,
  iconCellHeight: number,
  label: string
): string =>
  `<mxGraphModel>` +
  `<root>` +
  `<mxCell id="0"/>` +
  `<mxCell id="1" parent="0"/>` +
  `<mxCell id="2" value="" style="${groupStyle}" vertex="1" parent="1">` +
  `<mxGeometry width="${groupWidth}" height="${groupHeight}" as="geometry"/>` +
  `</mxCell>` +
  `<mxCell id="3" value="${label}" style="${iconStyle}" vertex="1" parent="2">` +
  `<mxGeometry x="0" y="0" ` +
  `width="${iconCellWidth}" height="${iconCellHeight}" as="geometry"/>` +
  `</mxCell>` +
  `</root>` +
  `</mxGraphModel>`;

export interface GroupShape extends Shape {
  borderWidth: number;
  iconCellWidth: number;
  iconCellHeight: number;
  labelGap: number;
  fontSize: number;
}

/**
 * Generates the XML for a draw.io library of group shapes.
 * Each entry is a 2-cell group: an outer container (border only,
 * container=1, transparent) and a child cell holding the strip +
 * icon stencil with labelPosition=right so the label sits next
 * to the icon, vertically centered.
 */
export const generateGroupLibraryXml = (shapes: GroupShape[]): string => {
  const entries = shapes.map((shape) => {
    const {
      title,
      stencilXml,
      width,
      height,
      bgColor,
      label,
      borderWidth,
      iconCellWidth,
      iconCellHeight,
      labelGap,
      fontSize,
    } = shape;
    const encoded = encodeStencil(stencilXml);
    const groupStyle = buildGroupOuterStyle(bgColor, borderWidth);
    const iconStyle = buildIconCellStyle(encoded, labelGap, fontSize);
    const xml = buildGroupMxGraphModel(
      groupStyle,
      width,
      height,
      iconStyle,
      iconCellWidth,
      iconCellHeight,
      label ?? ''
    );
    return {
      title,
      xml,
      w: width,
      h: height,
      aspect: 'variable',
      style: groupStyle,
    };
  });

  const json = JSON.stringify(entries);
  return `<mxlibrary>${escapeXml(json)}</mxlibrary>`;
};
