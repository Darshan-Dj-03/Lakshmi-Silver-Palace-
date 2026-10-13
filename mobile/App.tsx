import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, FlatList, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { supabase, isSupabaseConfigured } from './src/lib/supabase';
import AdminPortal from './src/components/AdminPortal';

type Category = { id: string; name: string; slug: string; image_url?: string | null };
type Product = { id: string; sku?: string; name: string; category_id?: string | null; description?: string; price?: number | null; image_urls: string[]; is_featured?: boolean; is_published?: boolean };

const ink = '#24191C', wine = '#7A1527', rose = '#FAEFF0', muted = '#817276';
const DEMO_CATEGORIES: Category[] = [
  { id: 'all', name: 'All pieces', slug: 'all' }, { id: 'bracelets', name: 'Bracelets', slug: 'bracelets' },
  { id: 'anklets', name: 'Anklets', slug: 'anklets' }, { id: 'bangles', name: 'Bangles', slug: 'bangles' },
  { id: 'necklaces', name: 'Necklaces', slug: 'necklaces' }, { id: 'earrings', name: 'Earrings', slug: 'earrings' },
  { id: 'rings', name: 'Rings', slug: 'rings' },
];
const CATEGORY_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = { all: 'view-grid-outline', bracelets: 'link-variant', anklets: 'circle-double', bangles: 'circle-double', necklaces: 'necklace', earrings: 'star-four-points-outline', rings: 'ring' };
const demoPhotos = [
  'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1635767798638-3665a1f6c1f5?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=900&q=85',
];
const demoProduct = (id: string, name: string, category_id: string, price: number, photo: number, is_featured = false): Product => ({ id, name, category_id, price, image_urls: [demoPhotos[photo % demoPhotos.length]], is_featured });
const DEMO_PRODUCTS: Product[] = [
  demoProduct('demo-br-01', 'Petal link bracelet', 'bracelets', 1890, 0, true), demoProduct('demo-br-02', 'Oval charm bracelet', 'bracelets', 2250, 6), demoProduct('demo-br-03', 'Fine chain bracelet', 'bracelets', 1490, 5), demoProduct('demo-br-04', 'Twist cuff bracelet', 'bracelets', 2790, 2), demoProduct('demo-br-05', 'Classic silver bracelet', 'bracelets', 2150, 7),
  demoProduct('demo-an-01', 'Fine chain anklet', 'anklets', 1250, 1, true), demoProduct('demo-an-02', 'Bell detail anklet', 'anklets', 1780, 3), demoProduct('demo-an-03', 'Floral anklet', 'anklets', 1950, 6), demoProduct('demo-an-04', 'Double line anklet', 'anklets', 1650, 0), demoProduct('demo-an-05', 'Classic pair anklets', 'anklets', 2390, 5),
  demoProduct('demo-bg-01', 'Engraved silver bangle', 'bangles', 3250, 2, true), demoProduct('demo-bg-02', 'Openwork bangle pair', 'bangles', 4890, 4), demoProduct('demo-bg-03', 'Textured kada', 'bangles', 2950, 7), demoProduct('demo-bg-04', 'Twin line bangles', 'bangles', 3790, 1), demoProduct('demo-bg-05', 'Floral kada bangle', 'bangles', 4250, 3),
  demoProduct('demo-nk-01', 'Round pendant necklace', 'necklaces', 3650, 4, true), demoProduct('demo-nk-02', 'Fine silver chain', 'necklaces', 2190, 0), demoProduct('demo-nk-03', 'Drop pendant necklace', 'necklaces', 4190, 5), demoProduct('demo-nk-04', 'Layered chain necklace', 'necklaces', 5290, 2), demoProduct('demo-nk-05', 'Floral motif necklace', 'necklaces', 4590, 6),
  demoProduct('demo-er-01', 'Silver hoop earrings', 'earrings', 1590, 5, true), demoProduct('demo-er-02', 'Leaf drop earrings', 'earrings', 1890, 3), demoProduct('demo-er-03', 'Round stud earrings', 'earrings', 990, 7), demoProduct('demo-er-04', 'Jhumka earrings', 'earrings', 2790, 1), demoProduct('demo-er-05', 'Petal drop earrings', 'earrings', 2150, 0),
  demoProduct('demo-rg-01', 'Floral silver ring', 'rings', 1290, 7, true), demoProduct('demo-rg-02', 'Adjustable motif ring', 'rings', 1150, 3), demoProduct('demo-rg-03', 'Twin band ring', 'rings', 1490, 2), demoProduct('demo-rg-04', 'Leaf detail ring', 'rings', 1350, 6), demoProduct('demo-rg-05', 'Classic silver ring', 'rings', 990, 4),
];
const money = (v?: number | null) => v == null ? 'Ask in store' : `₹${v.toLocaleString('en-IN')}`;

function BrandMark({ size = 42 }: { size?: number }) {
  return <View style={[styles.brandMark, { width: size, height: size, borderRadius: size / 2, backgroundColor: 'transparent', borderWidth: 0 }]}>
    <Image source={require('./assets/brand-mark.png')} style={{ width: size, height: size, borderRadius: size / 2 }} resizeMode="cover" />
  </View>;
}

export default function App() {
  const [categories, setCategories] = useState<Category[]>(isSupabaseConfigured ? [{ id: 'all', name: 'All pieces', slug: 'all' }] : DEMO_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(isSupabaseConfigured ? [] : DEMO_PRODUCTS);
  const [isPreviewCatalog, setIsPreviewCatalog] = useState(!isSupabaseConfigured);
  const [activeCategory, setActiveCategory] = useState('all');
  const [catalogError, setCatalogError] = useState('');
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoritesReady, setFavoritesReady] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [tab, setTab] = useState('Home');
  const [splash, setSplash] = useState(true);
  const markScale = useRef(new Animated.Value(.72)).current;
  const markRotate = useRef(new Animated.Value(0)).current;
  const markOpacity = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(.6)).current;
  const ringOpacity = useRef(new Animated.Value(.7)).current;
  const pageOpacity = useRef(new Animated.Value(0)).current;
  const pageLift = useRef(new Animated.Value(12)).current;
  const searchRef = useRef<TextInput>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(markScale, { toValue: 1, tension: 42, friction: 7, useNativeDriver: true }),
      Animated.timing(markRotate, { toValue: 1, duration: 720, useNativeDriver: true }),
      Animated.timing(markOpacity, { toValue: 1, duration: 550, useNativeDriver: true }),
      Animated.timing(ring, { toValue: 1.18, duration: 1300, useNativeDriver: true }),
      Animated.timing(ringOpacity, { toValue: 0, duration: 1300, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(pageOpacity, { toValue: 1, duration: 700, delay: 180, useNativeDriver: true }),
        Animated.timing(pageLift, { toValue: 0, duration: 700, delay: 180, useNativeDriver: true }),
      ]),
    ]).start();
    const timer = setTimeout(() => setSplash(false), 1650);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => { AsyncStorage.getItem('lsp-saved-products').then(value => { if (value) setFavorites(JSON.parse(value)); }).catch(() => undefined).finally(() => setFavoritesReady(true)); }, []);
  useEffect(() => { if (favoritesReady) AsyncStorage.setItem('lsp-saved-products', JSON.stringify(favorites)).catch(() => undefined); }, [favorites, favoritesReady]);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    (async () => {
      const [c, p] = await Promise.all([
        supabase.from('categories').select('id,name,slug,image_url').eq('is_active', true).order('sort_order'),
        supabase.from('products').select('id,sku,name,category_id,description,price,image_urls,is_featured,is_published').eq('is_published', true).order('created_at', { ascending: false }),
      ]);
      if (c.error) setCatalogError('Collections could not be reached. Please try again in a moment.');
      else setCategories([{ id: 'all', name: 'All pieces', slug: 'all' }, ...(c.data || [])]);
      if (p.error) setCatalogError('The catalogue could not be reached. Please try again in a moment.');
      else if (p.data?.length) { setProducts(p.data as Product[]); setIsPreviewCatalog(false); }
      else {
        const idsBySlug = new Map((c.data || []).map(category => [category.slug, category.id]));
        setProducts(DEMO_PRODUCTS.map(product => ({ ...product, category_id: idsBySlug.get(product.category_id || '') || product.category_id })));
        setIsPreviewCatalog(true);
      }
      setLoading(false);
    })();
  }, []);

  const visible = useMemo(() => products.filter(p =>
    (activeCategory === 'all' || p.category_id === categories.find(c => c.slug === activeCategory || c.id === activeCategory)?.id) &&
    (!query || p.name.toLowerCase().includes(query.toLowerCase()) || p.description?.toLowerCase().includes(query.toLowerCase())) &&
    (tab !== 'Saved' || favorites.includes(p.id))), [products, activeCategory, categories, query, tab, favorites]);

  const chooseCategory = (category: Category) => { setActiveCategory(category.slug); setDrawer(false); setTab('Home'); };
  const openWhatsApp = () => Linking.openURL('https://wa.me/message/55KV75D2E2BSB1');
  const productCard = ({ item, index }: { item: Product; index: number }) => (
    <Pressable onPress={() => setSelected(item)} style={({ pressed }) => [styles.productCard, { marginRight: index % 2 === 0 ? 7 : 0, marginLeft: index % 2 ? 7 : 0 }, pressed && styles.productPressed]}>
      <View style={styles.productPhotoWrap}>
        {item.image_urls?.[0] ? <Image source={{ uri: item.image_urls[0] }} style={styles.productPhoto} resizeMode="cover" /> : <View style={[styles.productPhoto, styles.photoFallback]}><MaterialCommunityIcons name="diamond-stone" size={38} color="#c2a5a0" /></View>}
        {item.is_featured && <View style={styles.featuredTag}><Text style={styles.featuredText}>THE EDIT</Text></View>}
        <Pressable style={styles.heart} hitSlop={8} onPress={() => setFavorites(favorites.includes(item.id) ? favorites.filter(id => id !== item.id) : [...favorites, item.id])}>
          <Feather name={favorites.includes(item.id) ? 'heart' : 'heart'} size={17} color={favorites.includes(item.id) ? wine : '#4b3b3f'} fill={favorites.includes(item.id) ? wine : 'transparent'} />
        </Pressable>
      </View>
      <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
      <Text style={styles.productPrice}>{money(item.price)}</Text>
      <Text style={styles.productHint}>View details <Feather name="arrow-up-right" size={11} /></Text>
    </Pressable>
  );

  if (adminOpen) return <AdminPortal onClose={() => setAdminOpen(false)} />;
  const logoTilt = markRotate.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '0deg'] });

  return <View style={styles.app}>
    <ExpoStatusBar style={splash ? 'light' : 'dark'} />
    <View style={styles.topbar}>
      <Pressable style={styles.brandRow} onPress={() => { setActiveCategory('all'); setTab('Home'); }}>
        <BrandMark size={39} />
        <View><Text style={styles.brandName}>LAKSHMI <Text style={{ color: wine }}>SILVER</Text></Text><Text style={styles.brandSub}>PALACE  ·  EST. 1998</Text></View>
      </Pressable>
      <View style={styles.headerActions}>
        <Pressable style={styles.roundIcon} onPress={() => searchRef.current?.focus()}><Feather name="search" size={19} color={ink} /></Pressable>
        <Pressable style={styles.roundIcon} onPress={() => setTab(tab === 'Saved' ? 'Home' : 'Saved')}><Feather name="heart" size={19} color={ink} /></Pressable>
        <Pressable style={styles.roundIcon} onPress={() => setDrawer(true)}><Feather name="menu" size={21} color={ink} /></Pressable>
      </View>
    </View>
    <View style={styles.stickyFilters}>
      <View style={styles.searchBox}><Feather name="search" size={17} color={muted} /><TextInput ref={searchRef} placeholder="Search products" placeholderTextColor="#aa9ea0" value={query} onChangeText={setQuery} style={styles.searchInput} returnKeyType="search" /><Pressable onPress={openWhatsApp} style={styles.chatButton}><Feather name="message-circle" size={16} color={wine} /><Text style={styles.chatLabel}>WHATSAPP</Text></Pressable></View>
    </View>
    <FlatList data={loading ? [] : visible} renderItem={productCard} keyExtractor={p => p.id} numColumns={2} columnWrapperStyle={styles.productRow} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 16 }}
      ListHeaderComponent={<Animated.View style={{ opacity: pageOpacity, transform: [{ translateY: pageLift }] }}>
      <LinearGradient colors={['#7A1527', '#4c0d1b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.heroCopy}><Text style={styles.heroOverline}>{isPreviewCatalog ? 'SAMPLE CATALOGUE' : 'SHRI LAXMI SILVER PALACE'}</Text><Text style={[styles.heroTitle, width < 380 && { fontSize: 27, lineHeight: 32 }]}>Silver, simply{ '\n' }chosen.</Text><Pressable onPress={() => { setActiveCategory('all'); setTab('Home'); }} style={styles.heroCta}><Text style={styles.heroCtaText}>BROWSE COLLECTION</Text><Feather name="arrow-right" size={15} color={wine} /></Pressable></View>
        <View style={[styles.heroSeal, width < 380 && { right: 8, width: 100, height: 100 }]}><MaterialCommunityIcons name="flower-tulip-outline" size={width < 380 ? 61 : 79} color="#e9c8a5" /><Text style={styles.heroSealText}>LSP{ '\n' }COLLECTION</Text></View>
        <View style={styles.heroSparkle}><Feather name="sun" size={18} color="#f1ddc4" /></View>
      </LinearGradient>
      {isPreviewCatalog && <View style={styles.previewNotice}><Feather name="info" size={14} color={wine}/><Text style={styles.previewNoticeText}>Preview items only · replace with the real catalogue before launch</Text></View>}
      <View style={styles.content}>
        <View style={styles.sectionHeading}><View><Text style={styles.eyebrow}>CATEGORIES</Text><Text style={styles.sectionTitle}>Browse by category</Text></View><Pressable onPress={() => setDrawer(true)}><Text style={styles.seeAll}>ALL <Feather name="arrow-right" size={12} color={wine} /></Text></Pressable></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRail}>
          {categories.map(c => <Pressable key={c.id} onPress={() => chooseCategory(c)} style={styles.categoryItem}>
            <View style={[styles.categoryCircle, (activeCategory === c.slug || activeCategory === c.id) && styles.categoryCircleActive]}>
              <MaterialCommunityIcons name={CATEGORY_ICONS[c.slug] || 'diamond-stone'} size={24} color={(activeCategory === c.slug || activeCategory === c.id) ? '#fff' : wine} />
            </View><Text style={[styles.categoryLabel, activeCategory === c.slug && styles.categoryLabelActive]}>{c.name}</Text>
          </Pressable>)}
        </ScrollView>
        <View style={[styles.sectionHeading, { marginTop: 25, marginBottom: 14 }]}><View><Text style={styles.eyebrow}>{tab === 'Saved' ? 'SAVED' : 'CATALOGUE'}</Text><Text style={styles.sectionTitle}>{tab === 'Saved' ? 'Saved products' : activeCategory === 'all' ? 'All products' : categories.find(c => c.slug === activeCategory)?.name || 'Products'}</Text></View><Text style={styles.count}>{visible.length} items</Text></View>
        {loading && <ActivityIndicator color={wine} style={{ marginVertical: 40 }} />}
        {!!catalogError && <View style={styles.catalogNotice}><Feather name="wifi-off" size={16} color={wine}/><Text style={styles.catalogNoticeText}>{catalogError}</Text></View>}
        {!loading && !visible.length && <View style={styles.empty}><MaterialCommunityIcons name={tab === 'Saved' ? 'heart-outline' : 'diamond-stone'} size={34} color="#be9ea0"/><Text style={styles.emptyTitle}>{catalogError ? 'Catalogue unavailable' : tab === 'Saved' ? 'No saved products' : 'No products found'}</Text></View>}
      </View>
      </Animated.View>}
      ListFooterComponent={<View style={styles.content}>
        <View style={styles.footer}><BrandMark size={39} /><Text style={styles.footerTitle}>Shri Laxmi Silver Palace</Text><Text style={styles.footerAddress}>Mahajan Complex, Opp. B. Mahendra New Killa</Text><Pressable onPress={openWhatsApp} style={styles.footerContact}><Feather name="message-circle" size={15} color={wine} /><Text style={styles.footerContactText}> WhatsApp</Text></Pressable></View>
      </View>} />
    <View style={styles.bottomNav}>
      {[['Home', 'home'], ['Discover', 'compass'], ['Saved', 'heart'], ['Contact', 'message-circle']].map(([label, icon]) => <Pressable key={label} onPress={() => label === 'Contact' ? openWhatsApp() : label === 'Discover' ? setDrawer(true) : setTab(label)} style={styles.navItem}><Feather name={icon as any} size={19} color={tab === label ? wine : '#95878b'} /><Text style={[styles.navLabel, tab === label && styles.navLabelActive]}>{label}</Text></Pressable>)}
    </View>

    <Modal visible={drawer} transparent animationType="fade" onRequestClose={() => setDrawer(false)}>
      <View style={styles.drawerBackdrop}><Pressable style={{ flex: 1 }} onPress={() => setDrawer(false)} /><View style={styles.drawer}>
        <View style={styles.drawerTop}><BrandMark size={48} /><Pressable onPress={() => setDrawer(false)} style={styles.closeButton}><Feather name="x" size={21} color={ink} /></Pressable></View><Text style={styles.drawerTitle}>Browse collections</Text><Text style={styles.drawerCaption}>CATEGORIES</Text>
        {categories.map(c => <Pressable key={c.id} style={styles.drawerLink} onPress={() => chooseCategory(c)}><Text style={styles.drawerLinkText}>{c.name}</Text><Feather name="arrow-up-right" size={16} color={wine} /></Pressable>)}
        <View style={{ flex: 1 }} /><Pressable style={styles.drawerContact} onPress={openWhatsApp}><Feather name="message-circle" size={18} color="#fff"/><Text style={styles.drawerContactText}> Talk to our team</Text></Pressable>
        <Pressable accessibilityRole="button" style={styles.adminPortalLink} onPress={() => { setDrawer(false); setAdminOpen(true); }}><Feather name="lock" size={14} color={muted}/><Text style={styles.adminPortalText}>Owner admin</Text><Feather name="arrow-right" size={14} color={muted}/></Pressable>
        <Text style={styles.drawerSmall}>LAKSHMI SILVER PALACE</Text>
      </View></View>
    </Modal>
    <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
      <View style={styles.detailBackdrop}><Pressable style={{ flex: 1 }} onPress={() => setSelected(null)} /><View style={styles.detailSheet}>
        <View style={styles.sheetHandle} /><Pressable onPress={() => setSelected(null)} style={styles.sheetClose}><Feather name="x" size={20} color={ink}/></Pressable>
        {selected && <><Image source={{ uri: selected.image_urls?.[0] }} style={styles.detailPhoto} resizeMode="cover"/><Text style={styles.eyebrow}>SHRI LAXMI SILVER PALACE</Text><Text style={styles.detailTitle}>{selected.name}</Text><Text style={styles.detailPrice}>{money(selected.price)}</Text>{!!selected.description && <Text style={styles.detailDescription}>{selected.description}</Text>}<View style={styles.detailDivider}/><Pressable style={styles.enquireButton} onPress={() => { setSelected(null); openWhatsApp(); }}><Feather name="message-circle" size={17} color="#fff"/><Text style={styles.enquireText}>ENQUIRE ABOUT THIS PIECE</Text></Pressable></>}
      </View></View>
    </Modal>
    {splash && <View style={styles.splash}><Animated.View style={[styles.splashRing, { opacity: ringOpacity, transform: [{ scale: ring }] }]} /><Animated.View style={{ transform: [{ scale: markScale }, { rotate: logoTilt }], opacity: markOpacity, alignItems: 'center' }}><BrandMark size={104}/><Text style={styles.splashName}>LAKSHMI SILVER PALACE</Text></Animated.View></View>}
  </View>;
}

const { width } = Dimensions.get('window');
const cardWidth = Math.min(210, (width - 47) / 2);
const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: '#fbf8f6' },
  brandMark: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#e9d8c8' },
  topbar: { height: 68, paddingHorizontal: 17, backgroundColor: '#fffdfc', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1e9e7' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 }, brandName: { fontSize: 12, letterSpacing: 1.2, fontWeight: '800', color: ink }, brandSub: { fontSize: 8, letterSpacing: 1.5, color: muted, marginTop: 3 },
  headerActions: { flexDirection: 'row', gap: 5 }, roundIcon: { width: 37, height: 37, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f2ef' },
  hero: { minHeight: 232, marginHorizontal: 15, marginTop: 14, borderRadius: 20, paddingHorizontal: 22, paddingVertical: 25, flexDirection: 'row', overflow: 'hidden', alignItems: 'center', elevation: 4, shadowColor: '#5b1421', shadowOpacity: .14, shadowRadius: 13, shadowOffset: { width: 0, height: 6 } }, heroCopy: { zIndex: 2 }, heroOverline: { color: '#efd3c6', fontSize: 9, letterSpacing: 2.3, fontWeight: '700' }, heroTitle: { color: '#fffaf5', fontFamily: 'Georgia', fontSize: 31, lineHeight: 36, marginTop: 8 }, heroBody: { color: '#f2dbd4', fontSize: 11, lineHeight: 16, marginTop: 6 }, heroCta: { marginTop: 14, backgroundColor: '#fff7ef', borderRadius: 20, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', gap: 8, alignItems: 'center' }, heroCtaText: { fontSize: 8, letterSpacing: 1, color: wine, fontWeight: '800' }, heroSeal: { position: 'absolute', right: 15, top: 52, width: 124, height: 124, borderRadius: 65, borderWidth: 1, borderColor: 'rgba(242,213,185,.45)', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-10deg' }] }, heroSealText: { color: '#f1d5bb', fontSize: 8, letterSpacing: 2, textAlign: 'center', marginTop: -12, lineHeight: 11 }, heroSparkle: { position: 'absolute', right: 110, top: 25 },
  stickyFilters: { backgroundColor: '#fffdfc', paddingHorizontal: 17, paddingTop: 12, paddingBottom: 10 }, searchBox: { height: 46, backgroundColor: '#f6f1ef', borderRadius: 24, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 9 }, searchInput: { flex: 1, fontSize: 12, color: ink, paddingVertical: 0 }, chatButton: { height: 29, paddingLeft: 10, borderLeftWidth: 1, borderColor: '#e3d8d5', flexDirection: 'row', alignItems: 'center', gap: 4 }, chatLabel: { fontSize: 8, letterSpacing: .8, color: wine, fontWeight: '800' },
  content: { paddingHorizontal: 17 }, sectionHeading: { marginTop: 22, marginBottom: 14, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }, eyebrow: { fontSize: 8, color: wine, fontWeight: '800', letterSpacing: 1.6 }, sectionTitle: { fontSize: 19, color: ink, fontFamily: 'Georgia', marginTop: 4 }, seeAll: { color: wine, fontSize: 8, letterSpacing: .8, fontWeight: '800', marginBottom: 3 }, count: { color: muted, fontSize: 10, marginBottom: 3 },
  categoryRail: { gap: 15, paddingBottom: 3 }, categoryItem: { alignItems: 'center', width: 68 }, categoryCircle: { width: 57, height: 57, borderRadius: 30, backgroundColor: '#f7eeee', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#f0e4e2' }, categoryCircleActive: { backgroundColor: wine, borderColor: wine }, categoryLabel: { marginTop: 7, fontSize: 9, color: '#6e5e62' }, categoryLabelActive: { color: wine, fontWeight: '800' },
  storyBanner: { minHeight: 69, marginTop: 23, borderRadius: 4, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 11 }, storyIcon: { width: 40, height: 40, borderRadius: 21, backgroundColor: '#fffaf5', alignItems: 'center', justifyContent: 'center' }, storyEyebrow: { fontSize: 7, letterSpacing: 1.6, color: wine, fontWeight: '800' }, storyTitle: { fontSize: 14, fontFamily: 'Georgia', color: ink, marginTop: 3 },
  productRow: { marginBottom: 16 }, productCard: { width: cardWidth, backgroundColor: '#fffefd', paddingBottom: 11, paddingHorizontal: 0, borderRadius: 14, overflow: 'hidden', elevation: 2, shadowColor: '#40252a', shadowOpacity: .07, shadowRadius: 9, shadowOffset: { width: 0, height: 3 } }, productPhotoWrap: { width: '100%', height: cardWidth * 1.15, backgroundColor: '#f5efed', position: 'relative', overflow: 'hidden' }, productPhoto: { width: '100%', height: '100%' }, photoFallback: { alignItems: 'center', justifyContent: 'center' }, featuredTag: { position: 'absolute', left: 8, top: 8, backgroundColor: '#fff9f4', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12 }, featuredText: { fontSize: 7, letterSpacing: 1, fontWeight: '800', color: wine }, heart: { position: 'absolute', top: 8, right: 8, width: 31, height: 31, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.94)', alignItems: 'center', justifyContent: 'center' }, productName: { marginTop: 9, marginHorizontal: 10, color: ink, fontSize: 12, lineHeight: 17, fontFamily: 'Georgia', minHeight: 34 }, productPrice: { marginTop: 4, marginHorizontal: 10, color: ink, fontSize: 12, fontWeight: '700' }, productHint: { marginTop: 5, marginHorizontal: 10, color: wine, fontSize: 9 },
  productPressed: { opacity: .94, transform: [{ scale: .985 }] }, previewNotice: { flexDirection: 'row', alignItems: 'center', gap: 7, marginHorizontal: 18, marginTop: 10, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#f8edeb' }, previewNoticeText: { color: '#765b5e', fontSize: 9, flex: 1 },
  empty: { paddingVertical: 35, alignItems: 'center' }, emptyTitle: { fontFamily: 'Georgia', color: ink, fontSize: 18, marginTop: 10 }, emptyText: { color: muted, fontSize: 11, marginTop: 5 }, catalogNotice: { marginTop: 14, padding: 12, gap: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff4ee' }, catalogNoticeText: { flex: 1, color: wine, fontSize: 10 }, promise: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: '#faf4f1', paddingHorizontal: 12, paddingVertical: 16, marginVertical: 13 }, promiseText: { fontSize: 10, color: '#5e494e' },
  footer: { alignItems: 'center', paddingTop: 23, paddingBottom: 22, borderTopWidth: 1, borderColor: '#f0e7e4' }, footerTitle: { marginTop: 10, fontFamily: 'Georgia', color: ink, fontSize: 16 }, footerSub: { marginTop: 7, fontSize: 8, letterSpacing: 1.2, color: wine, fontWeight: '700' }, footerAddress: { marginTop: 8, fontSize: 10, color: muted, textAlign: 'center' }, footerContact: { marginTop: 11, flexDirection: 'row', alignItems: 'center' }, footerContactText: { color: wine, fontSize: 10, fontWeight: '700' }, copyright: { fontSize: 8, letterSpacing: 1.5, color: '#9b8f91', marginTop: 18 },
  bottomNav: { height: 62, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#fffefd', borderTopWidth: 1, borderColor: '#f1e9e7' }, navItem: { minWidth: 50, alignItems: 'center', gap: 3 }, navLabel: { fontSize: 8, color: '#95878b' }, navLabelActive: { color: wine, fontWeight: '800' },
  drawerBackdrop: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(24,12,15,.42)' }, drawer: { width: Math.min(325, width * .84), backgroundColor: '#fffdfc', paddingHorizontal: 22, paddingTop: 55, paddingBottom: 20, borderTopRightRadius: 24, borderBottomRightRadius: 24 }, drawerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, closeButton: { width: 36, height: 36, borderRadius: 20, backgroundColor: '#f6efed', alignItems: 'center', justifyContent: 'center' }, drawerTitle: { fontFamily: 'Georgia', fontSize: 24, color: ink, marginTop: 28 }, drawerCaption: { fontSize: 8, letterSpacing: 1.5, color: wine, fontWeight: '800', marginTop: 6, marginBottom: 15 }, drawerLink: { paddingVertical: 15, borderBottomWidth: 1, borderColor: '#f0e8e5', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, drawerLinkText: { color: ink, fontFamily: 'Georgia', fontSize: 17 }, drawerContact: { height: 47, backgroundColor: wine, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', borderRadius: 24 }, drawerContactText: { color: '#fff', fontSize: 12, fontWeight: '700' }, adminPortalLink: { minHeight: 42, marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, adminPortalText: { color: muted, fontSize: 10, fontWeight: '600', letterSpacing: .2 }, drawerSmall: { color: muted, fontSize: 8, letterSpacing: 1, textAlign: 'center', marginTop: 8 },
  detailBackdrop: { flex: 1, backgroundColor: 'rgba(24,12,15,.5)', justifyContent: 'flex-end' }, detailSheet: { backgroundColor: '#fffdfc', paddingHorizontal: 20, paddingBottom: 27, paddingTop: 10, borderTopLeftRadius: 18, borderTopRightRadius: 18 }, sheetHandle: { width: 39, height: 4, backgroundColor: '#dccdc9', borderRadius: 3, alignSelf: 'center', marginBottom: 10 }, sheetClose: { position: 'absolute', zIndex: 2, right: 18, top: 17, width: 31, height: 31, borderRadius: 16, backgroundColor: '#ffffffdd', alignItems: 'center', justifyContent: 'center' }, detailPhoto: { width: '100%', height: 210, backgroundColor: '#f5efed', marginBottom: 18 }, detailTitle: { fontFamily: 'Georgia', fontSize: 22, color: ink, marginTop: 6 }, detailPrice: { fontSize: 15, color: wine, fontWeight: '700', marginTop: 8 }, detailDescription: { fontSize: 12, lineHeight: 19, color: muted, marginTop: 11 }, detailDivider: { height: 1, backgroundColor: '#f0e7e4', marginVertical: 18 }, enquireButton: { backgroundColor: wine, minHeight: 47, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 3 }, enquireText: { fontSize: 10, letterSpacing: 1, color: '#fff', fontWeight: '800' }, noCart: { textAlign: 'center', color: muted, fontSize: 9, marginTop: 9 },
  splash: { ...StyleSheet.absoluteFill, zIndex: 20, backgroundColor: '#7A1527', alignItems: 'center', justifyContent: 'center' }, splashRing: { position: 'absolute', width: 170, height: 170, borderRadius: 90, borderWidth: 1, borderColor: 'rgba(255,235,219,.32)' }, splashName: { color: '#fff', fontSize: 12, letterSpacing: 2.4, fontWeight: '800', marginTop: 16 }, splashSub: { color: '#ecd2be', fontSize: 8, letterSpacing: 4, marginTop: 6 }, splashTag: { position: 'absolute', bottom: 54, color: '#ecd2be', letterSpacing: 2, fontSize: 8 },
});
