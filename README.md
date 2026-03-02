<p align="center">
  <h3 align="center">draw.io IBM Carbon Icons</h3>

  <p align="center">
    Generate draw.io shape libraries from <br />
    IBM Carbon Design System icons
    <br />
    <a href="#"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="/../../issues">Report Bug</a>
    ·
    <a href="/../../issues">Request Feature</a>
  </p>
</p>

## Table of contents

1. [About The Project](#about-the-project)
   - [Built With](#built-with)
2. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
3. [Usage](#usage)
4. [Customization](#customization)
   - [Per-Category Style Overrides](#per-category-style-overrides)
   - [Global Defaults](#global-defaults)
5. [Project Structure](#project-structure)
6. [Contributing](#contributing)
7. [License](#license)

## About The Project

This tool generates [draw.io](https://draw.io) (diagrams.net) custom shape libraries (`.xml`) from the full set of [IBM Carbon Design System](https://carbondesignsystem.com/) icons.

- **2,500+ Icons:** All non-deprecated icons from `@carbon/icons` are exported, organized by subcategory.
- **25 Libraries:** Each subcategory becomes a separate `.xml` library file, ready to import.
- **Colored Backgrounds:** Icons are composited onto a colored square background with configurable size and colors.
- **Per-Category Styling:** Override background color, icon color, and sizes for specific subcategories.

### Built With

| Package / Tool                                                           | Description                                            |
| ------------------------------------------------------------------------ | ------------------------------------------------------ |
| **[@carbon/icons](https://www.npmjs.com/package/@carbon/icons)**         | IBM Carbon Design System icon metadata and SVG assets. |
| **[TypeScript](https://www.typescriptlang.org/)**                        | Type-safe development.                                 |
| **[tsx](https://github.com/privatenumber/tsx)**                          | TypeScript execution without a build step.             |
| **[eslint](https://eslint.org/)** + **[prettier](https://prettier.io/)** | Linting and code formatting.                           |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en) (v18+)
- [Yarn](https://yarnpkg.com/getting-started/install)

### Installation

1. **Clone the Repository**

```bash
git clone https://github.com/your-org/drawio-ibm-carbon.git
cd drawio-ibm-carbon
```

2. **Install Dependencies**

```bash
yarn install
```

## Usage

Generate all library files:

```bash
yarn generate
```

The generated `.xml` files will be saved to the `./output` directory.

To import into draw.io:

1. Open [draw.io](https://app.diagrams.net/)
2. Go to **File → Open Library**
3. Select any `.xml` file from the `output/` folder
4. The icons will appear in the sidebar, ready to drag onto the canvas

## Customization

### Per-Category Style Overrides

You can customize the appearance of specific subcategories in `src/config.ts` via `categoryOverrides`. Any property not overridden falls back to the global defaults.

```ts
categoryOverrides: {
  AI: { bgColor: '#A56EFF' },
  Status: { bgColor: '#198038', iconColor: '#defbe6' },
}
```

Available style properties:

| Property    | Type     | Description                       |
| ----------- | -------- | --------------------------------- |
| `bgColor`   | `string` | Background square color (hex).    |
| `bgSize`    | `number` | Background square size in pixels. |
| `iconColor` | `string` | Icon fill color.                  |
| `iconSize`  | `number` | Icon size in pixels.              |

### Global Defaults

| Property    | Default   |
| ----------- | --------- |
| `bgColor`   | `#0f62fe` |
| `bgSize`    | `48`      |
| `iconColor` | `#ffffff` |
| `iconSize`  | `24`      |

## Project Structure

```
.
├── src/
│   ├── config.ts       # Global config, style overrides, and helper
│   ├── index.ts        # Entry point — reads metadata, groups icons, writes files
│   ├── svgParser.ts    # SVG parsing and path normalization
│   ├── composer.ts     # Composites icon SVG onto colored background
│   └── generator.ts    # Generates draw.io library XML from shapes
├── output/             # Generated .xml library files (gitignored)
├── package.json
├── tsconfig.json
└── README.md
```

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the Apache 2.0 License. See [LICENSE](/LICENSE) for more information.
