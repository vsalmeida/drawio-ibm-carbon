export interface StyleConfig {
  bgColor: string;
  bgSize: number;
  iconColor: string;
  iconSize: number;
}

export interface GroupStyleConfig {
  width: number;
  height: number;
  borderColor: string;
  borderWidth: number;
  stripWidth: number;
  stripHeight: number;
  stripColor: string;
  iconColor: string;
  iconSize: number;
  iconPaddingLeft: number;
  labelGap: number;
  fontSize: number;
}

export type GroupEntry =
  | string
  | { name: string; overrides?: Partial<GroupStyleConfig> };

export const CONFIG = {
  bgColor: '#0f62fe',
  bgSize: 48,
  iconSize: 24,
  iconColor: '#ffffff',
  outputDir: './output',
  prefix: 'IBM Carbon',
  excludeCategories: [] as string[],
  categoryOverrides: {
    AI: { bgColor: '#A56EFF' },
    User: { bgColor: '#000000' },
  } as Record<string, Partial<StyleConfig>>,
  // Group shapes: rectangular boxes with colored border + small
  // vertical strip in the top-left holding the icon, and a default
  // label = friendlyName. Keys = Carbon subcategory (same as
  // categoryOverrides). Values = icon `name` (kebab-case, NOT
  // friendlyName) with optional per-icon overrides. All groups are
  // emitted into a single library file.
  groups: {
    AI: ['watsonx-ai', 'watsonx-data', 'ibm-watsonx--orchestrate'],
  } as Record<string, GroupEntry[]>,
} as const satisfies Record<string, unknown>;

export const getStyleForCategory = (subcategory: string): StyleConfig => {
  const { bgColor, bgSize, iconColor, iconSize, categoryOverrides } = CONFIG;
  const defaults = { bgColor, bgSize, iconColor, iconSize };
  const override = categoryOverrides[subcategory];
  return override ? { ...defaults, ...override } : defaults;
};

export const getGroupName = (entry: GroupEntry): string =>
  typeof entry === 'string' ? entry : entry.name;

export const getGroupStyleForSubcategory = (
  subcategory: string,
  overrides?: Partial<GroupStyleConfig>
): GroupStyleConfig => {
  const categoryColor = getStyleForCategory(subcategory).bgColor;
  const defaults: GroupStyleConfig = {
    width: 220,
    height: 140,
    borderColor: categoryColor,
    borderWidth: 1,
    stripWidth: 4,
    stripHeight: 48,
    stripColor: categoryColor,
    iconColor: categoryColor,
    iconSize: 24,
    iconPaddingLeft: 8,
    labelGap: 12,
    fontSize: 12,
  };
  return overrides ? { ...defaults, ...overrides } : defaults;
};
