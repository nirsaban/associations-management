# PWA Icons

This directory requires the following icon files for the PWA to work properly:

## Required Icons

- `icon-192.png` - 192x192px PNG icon
- `icon-512.png` - 512x512px PNG icon
- `icon-192-maskable.png` - 192x192px maskable icon (with safe zone padding)
- `favicon.ico` - Favicon for browser tabs

## Generating Icons

A base SVG icon is provided in `icon.svg`. To generate the required PNG files:

### Option 1: Using Online Tools
1. Upload `icon.svg` to https://realfavicongenerator.net/ or similar service
2. Download the generated icons
3. Rename them according to the manifest.json specifications

### Option 2: Using ImageMagick (if installed)
```bash
# Generate 192x192 icon
convert icon.svg -resize 192x192 icon-192.png

# Generate 512x512 icon
convert icon.svg -resize 512x512 icon-512.png

# Generate maskable icon (with padding for safe zone)
convert icon.svg -resize 154x154 -background transparent -gravity center -extent 192x192 icon-192-maskable.png

# Generate favicon
convert icon.svg -resize 32x32 favicon.ico
```

### Option 3: Using Sharp (Node.js)
```bash
# Install sharp if needed
npm install -g sharp-cli

# Generate icons
sharp icon.svg -o icon-192.png --resize 192
sharp icon.svg -o icon-512.png --resize 512
```

## Maskable Icons

Maskable icons should have:
- Important content within the safe zone (80% of the icon)
- Can extend to the edges but main content should be centered
- Background should be solid (not transparent) for best results

## Current Status

🔴 **PLACEHOLDER ICONS NEEDED**

The current manifest.json references PNG icons that need to be generated from the SVG template.

Until the PNG icons are created:
- The PWA will still install
- Default browser icons will be used
- Install prompts may not show custom branding
