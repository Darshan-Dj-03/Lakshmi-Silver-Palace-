// Preserved demo catalogue data. Intentionally not rendered by the app shell.
export type Category = { id: string; name: string; slug: string; image_url?: string | null };
export type Product = { id: string; sku?: string; name: string; category_id?: string | null; description?: string; price?: number | null; image_urls: string[]; is_featured?: boolean; is_published?: boolean };

export const photoSet = [
  'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1635767798638-3665a1f6c1f5?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=900&q=85',
];
export const categoryPhoto: Record<string, string> = { all: photoSet[0], bracelets: photoSet[1], anklets: photoSet[3], bangles: photoSet[2], necklaces: photoSet[4], earrings: photoSet[5], rings: photoSet[7] };
export const DEMO_CATEGORIES: Category[] = [
  { id: 'all', name: 'All pieces', slug: 'all' }, { id: 'bracelets', name: 'Bracelets', slug: 'bracelets' },
  { id: 'anklets', name: 'Anklets', slug: 'anklets' }, { id: 'bangles', name: 'Bangles', slug: 'bangles' },
  { id: 'necklaces', name: 'Necklaces', slug: 'necklaces' }, { id: 'earrings', name: 'Earrings', slug: 'earrings' }, { id: 'rings', name: 'Rings', slug: 'rings' },
];
const makeDemo = (id: string, name: string, category_id: string, price: number, photo: number, is_featured = false): Product => ({ id, name, category_id, price, image_urls: [photoSet[photo % photoSet.length]], is_featured });
export const DEMO_PRODUCTS: Product[] = [
  makeDemo('demo-br-01', 'Petal link bracelet', 'bracelets', 1890, 0, true), makeDemo('demo-br-02', 'Oval charm bracelet', 'bracelets', 2250, 6), makeDemo('demo-br-03', 'Fine chain bracelet', 'bracelets', 1490, 5), makeDemo('demo-br-04', 'Twist cuff bracelet', 'bracelets', 2790, 2), makeDemo('demo-br-05', 'Classic silver bracelet', 'bracelets', 2150, 7),
  makeDemo('demo-an-01', 'Fine chain anklet', 'anklets', 1250, 1, true), makeDemo('demo-an-02', 'Bell detail anklet', 'anklets', 1780, 3), makeDemo('demo-an-03', 'Floral anklet', 'anklets', 1950, 6), makeDemo('demo-an-04', 'Double line anklet', 'anklets', 1650, 0), makeDemo('demo-an-05', 'Classic pair anklets', 'anklets', 2390, 5),
  makeDemo('demo-bg-01', 'Engraved silver bangle', 'bangles', 3250, 2, true), makeDemo('demo-bg-02', 'Openwork bangle pair', 'bangles', 4890, 4), makeDemo('demo-bg-03', 'Textured kada', 'bangles', 2950, 7), makeDemo('demo-bg-04', 'Twin line bangles', 'bangles', 3790, 1), makeDemo('demo-bg-05', 'Floral kada bangle', 'bangles', 4250, 3),
  makeDemo('demo-nk-01', 'Round pendant necklace', 'necklaces', 3650, 4, true), makeDemo('demo-nk-02', 'Fine silver chain', 'necklaces', 2190, 0), makeDemo('demo-nk-03', 'Drop pendant necklace', 'necklaces', 4190, 5), makeDemo('demo-nk-04', 'Layered chain necklace', 'necklaces', 5290, 2), makeDemo('demo-nk-05', 'Floral motif necklace', 'necklaces', 4590, 6),
  makeDemo('demo-er-01', 'Silver hoop earrings', 'earrings', 1590, 5, true), makeDemo('demo-er-02', 'Leaf drop earrings', 'earrings', 1890, 3), makeDemo('demo-er-03', 'Round stud earrings', 'earrings', 990, 7), makeDemo('demo-er-04', 'Jhumka earrings', 'earrings', 2790, 1), makeDemo('demo-er-05', 'Petal drop earrings', 'earrings', 2150, 0),
  makeDemo('demo-rg-01', 'Floral silver ring', 'rings', 1290, 7, true), makeDemo('demo-rg-02', 'Adjustable motif ring', 'rings', 1150, 3), makeDemo('demo-rg-03', 'Twin band ring', 'rings', 1490, 2), makeDemo('demo-rg-04', 'Leaf detail ring', 'rings', 1350, 6), makeDemo('demo-rg-05', 'Classic silver ring', 'rings', 990, 4),
];
