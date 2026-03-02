import { deflateRawSync } from 'zlib';

export interface Shape {
  title: string;
  stencilXml: string;
  width: number;
  height: number;
  bgColor: string;
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
  style: string
): string =>
  `<mxGraphModel>` +
  `<root>` +
  `<mxCell id="0"/>` +
  `<mxCell id="1" parent="0"/>` +
  `<mxCell id="2" value="" style="${style}" vertex="1" parent="1">` +
  `<mxGeometry width="${width}" height="${height}" as="geometry"/>` +
  `</mxCell>` +
  `</root>` +
  `</mxGraphModel>`;

/**
 * Generates the XML content for a draw.io library (.xml).
 * JSON is embedded inside <mxlibrary>, so < > & are escaped.
 */
export const generateLibraryXml = (shapes: Shape[]): string => {
  const entries = shapes.map(
    ({ title, stencilXml, width, height, bgColor }) => {
      const encoded = encodeStencil(stencilXml);
      const style = buildStyle(encoded, bgColor);
      const xml = buildMxGraphModel(width, height, style);
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

  const xmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
  };
  const json = JSON.stringify(entries);
  const xmlContent = json.replace(/[&<>]/g, (ch) => xmlEscapes[ch]);

  return `<mxlibrary>${xmlContent}</mxlibrary>`;
};
