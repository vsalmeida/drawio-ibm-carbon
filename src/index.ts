import rawMetadata from '@carbon/icons/metadata.json';

import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  CONFIG,
  getGroupName,
  getGroupStyleForSubcategory,
  getStyleForCategory,
} from './config';
import { createGroupStencilXml, createStencilXml } from './composer';
import {
  generateGroupLibraryXml,
  generateLibraryXml,
  type GroupShape,
  type Shape,
} from './generator';
import { parseSvgContent } from './svgParser';

interface IconAsset {
  size: number;
  filepath: string;
  source: string;
  optimized: { data: string };
}

interface IconMeta {
  name: string;
  friendlyName: string;
  category: string;
  subcategory: string;
  deprecated?: true;
  sizes: number[];
  assets: IconAsset[];
}

interface CarbonMetadata {
  icons: IconMeta[];
}

const metadata = rawMetadata as CarbonMetadata;

const sanitizeFilename = (name: string): string =>
  // eslint-disable-next-line no-control-regex
  name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').trim();

const cleanLabel = (name: string): string =>
  name
    .replace(/[®™©℠]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Returns the asset with the preferred size (default 32px),
 * falling back to the largest available.
 */
const getBestAsset = (
  assets: IconAsset[],
  preferredSize = 32
): IconAsset | undefined =>
  assets.find((a) => a.size === preferredSize) ??
  assets.sort((a, b) => b.size - a.size)[0];

const main = (): void => {
  const { icons: allIcons } = metadata;

  const active = allIcons.filter((icon) => icon.deprecated !== true);
  console.log(`Active icons loaded: ${active.length}`);

  // Group by subcategory — each group becomes a draw.io tab
  const grouped = new Map<string, IconMeta[]>();
  for (const icon of active) {
    const key = icon.subcategory || 'Other';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(icon);
  }
  console.log(`Categories found: ${grouped.size}\n`);

  mkdirSync(CONFIG.outputDir, { recursive: true });

  let totalIcons = 0;
  let totalFiles = 0;

  const sortedCategories = [...grouped.entries()].sort(([a], [b]) =>
    a.localeCompare(b)
  );

  for (const [subcategory, icons] of sortedCategories) {
    if (CONFIG.excludeCategories.includes(subcategory)) {
      console.log(`  - IBM Carbon - ${subcategory} (skipped)`);
      // eslint-disable-next-line no-continue
      continue;
    }

    const style = getStyleForCategory(subcategory);

    const shapes = icons.reduce<Shape[]>((acc, icon) => {
      const asset = getBestAsset(icon.assets);
      if (asset) {
        const rawSvg = asset.optimized.data;
        const parsed = parseSvgContent(rawSvg);
        const stencilXml = createStencilXml(parsed, style);
        acc.push({
          title: cleanLabel(icon.friendlyName),
          stencilXml,
          width: style.bgSize,
          height: style.bgSize,
          bgColor: style.bgColor,
        });
      }
      return acc;
    }, []);

    if (shapes.length === 0) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const libraryName = `${CONFIG.prefix} - ${subcategory}`;
    const filename = join(
      CONFIG.outputDir,
      `${sanitizeFilename(libraryName)}.xml`
    );

    writeFileSync(filename, generateLibraryXml(shapes), 'utf8');
    console.log(`  + ${libraryName} (${shapes.length} icons)`);
    totalIcons += shapes.length;
    totalFiles += 1;
  }

  const iconIndex = new Map<string, IconMeta>();
  for (const icon of active) iconIndex.set(icon.name, icon);

  const groupSubcategories = Object.entries(CONFIG.groups).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  const groupShapes: GroupShape[] = [];

  for (const [subcategory, entries] of groupSubcategories) {
    if (CONFIG.excludeCategories.includes(subcategory)) {
      // eslint-disable-next-line no-continue
      continue;
    }

    for (const entry of entries) {
      const name = getGroupName(entry);
      const icon = iconIndex.get(name);
      if (!icon) {
        console.warn(
          `  ! group "${name}" not found in Carbon icons (${subcategory})`
        );
        // eslint-disable-next-line no-continue
        continue;
      }
      const asset = getBestAsset(icon.assets);
      if (!asset) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const overrides = typeof entry === 'string' ? undefined : entry.overrides;
      const style = getGroupStyleForSubcategory(subcategory, overrides);
      const parsed = parseSvgContent(asset.optimized.data);
      const stencilXml = createGroupStencilXml(parsed, style);

      const friendly = cleanLabel(icon.friendlyName);
      groupShapes.push({
        title: friendly,
        label: friendly,
        stencilXml,
        width: style.width,
        height: style.height,
        bgColor: style.borderColor,
        borderWidth: style.borderWidth,
        iconCellWidth:
          style.stripWidth + style.iconPaddingLeft + style.iconSize,
        iconCellHeight: style.stripHeight,
        labelGap: style.labelGap,
        fontSize: style.fontSize,
      });
    }
  }

  if (groupShapes.length > 0) {
    const libraryName = `${CONFIG.prefix} - Groups`;
    const filename = join(
      CONFIG.outputDir,
      `${sanitizeFilename(libraryName)}.xml`
    );

    writeFileSync(filename, generateGroupLibraryXml(groupShapes), 'utf8');
    console.log(`  + ${libraryName} (${groupShapes.length} groups)`);
  }

  console.log(
    `\nDone! ${totalFiles} libraries generated with ${totalIcons} icons total.`
  );
  if (groupShapes.length > 0) {
    console.log(`      1 groups library with ${groupShapes.length} groups.`);
  }
  console.log(`Output: ${CONFIG.outputDir}/`);
};

main();
