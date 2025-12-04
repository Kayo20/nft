How to replace placeholder images with your own

Place your images in one of these folders:

- `src/assets/images/trees/` — tree images used by the `TreeCard` and mock NFTs
- `src/assets/images/items/` — item images (if you want to swap icons with images)

Rarity-specific tree images (already wired)

- `src/assets/images/trees/uncommon/` — put Uncommon images here (e.g. `uncommon-1.png`)
- `src/assets/images/trees/rare/` — put Rare images here
- `src/assets/images/trees/epic/` — put Epic images here
- `src/assets/images/trees/legendary/` — put Legendary images here

Naming and swapping options

1) Quick replace (recommended):
   - Replace the files named `placeholder-tree.svg` and `placeholder-item.svg` with your files (keep the same filenames). The app will automatically use them because the mock API and components reference these placeholder paths.

2) Use your own filenames:
   - Add your image files to the folders above, then open `src/lib/mockApi.ts` and set the `image` fields to the new file location using the `new URL(...)` pattern, or import them in code. Example:

     const TREE_A = new URL('../assets/images/trees/my-tree.png', import.meta.url).href;

     // then use it in the generated mock NFT
     image: TREE_A,

3) Import images in components (if you prefer compile-time import):
   - In a component:

     import myTree from '@/assets/images/trees/my-tree.png';

     // then use <img src={myTree} />

Notes & tips

- Preferred formats: PNG, JPG, SVG, WEBP. Use SVG for small vector icons.
- Keep image sizes reasonable (e.g., 200–800px) to avoid large bundles.
- When using the `new URL(..., import.meta.url).href` approach, Vite will produce correct URLs in dev and production builds.
- If an image fails to load, `TreeCard` already falls back to `placeholder-tree.svg` at runtime.

If you want, upload your image files here (or tell me their local paths) and I will add them to the project and wire them up for you.