export interface StyleConfig {
  bgColor: string;
  bgSize: number;
  iconColor: string;
  iconSize: number;
}

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
} as const satisfies Record<string, unknown>;

export const getStyleForCategory = (subcategory: string): StyleConfig => {
  const { bgColor, bgSize, iconColor, iconSize, categoryOverrides } = CONFIG;
  const defaults = { bgColor, bgSize, iconColor, iconSize };
  const override = categoryOverrides[subcategory];
  return override ? { ...defaults, ...override } : defaults;
};
