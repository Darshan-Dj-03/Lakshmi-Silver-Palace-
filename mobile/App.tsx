import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, FlatList, Image, Linking, Modal, Pressable, ScrollView, StatusBar as NativeStatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase, isSupabaseConfigured } from './src/lib/supabase';
import AdminPortal from './src/components/AdminPortal';

type Category = { id: string; name: string; slug: string; image_url?: string | null };
type Product = { id: string; sku?: string; name: string; category_id?: string | null; description?: string; price?: number | null; image_urls: string[]; is_featured?: boolean; is_published?: boolean };

const ink = '#242126', wine = '#75192D', rose = '#F7E9E9', muted = '#82777A', canvas = '#FBF8F5';
const photoSet = [
  'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1635767798638-3665a1f6c1f5?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=900&q=85',
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=900&q=85',
];
const categoryPhoto: Record<string, string> = { all: photoSet[0], bracelets: photoSet[1], anklets: photoSet[3], bangles: photoSet[2], necklaces: photoSet[4], earrings: photoSet[5], rings: photoSet[7] };
const DEMO_CATEGORIES: Category[] = [
  { id: 'all', name: 'All pieces', slug: 'all' }, { id: 'bracelets', name: 'Bracelets', slug: 'bracelets' },
  { id: 'anklets', name: 'Anklets', slug: 'anklets' }, { id: 'bangles', name: 'Bangles', slug: 'bangles' },
  { id: 'necklaces', name: 'Necklaces', slug: 'necklaces' }, { id: 'earrings', name: 'Earrings', slug: 'earrings' }, { id: 'rings', name: 'Rings', slug: 'rings' },
];
const makeDemo = (id: string, name: string, category_id: string, price: number, photo: number, is_featured = false): Product => ({ id, name, category_id, price, image_urls: [photoSet[photo % photoSet.length]], is_featured });
const DEMO_PRODUCTS: Product[] = [
  makeDemo('demo-br-01', 'Petal link bracelet', 'bracelets', 1890, 0, true), makeDemo('demo-br-02', 'Oval charm bracelet', 'bracelets', 2250, 6), makeDemo('demo-br-03', 'Fine chain bracelet', 'bracelets', 1490, 5), makeDemo('demo-br-04', 'Twist cuff bracelet', 'bracelets', 2790, 2), makeDemo('demo-br-05', 'Classic silver bracelet', 'bracelets', 2150, 7),
  makeDemo('demo-an-01', 'Fine chain anklet', 'anklets', 1250, 1, true), makeDemo('demo-an-02', 'Bell detail anklet', 'anklets', 1780, 3), makeDemo('demo-an-03', 'Floral anklet', 'anklets', 1950, 6), makeDemo('demo-an-04', 'Double line anklet', 'anklets', 1650, 0), makeDemo('demo-an-05', 'Classic pair anklets', 'anklets', 2390, 5),
  makeDemo('demo-bg-01', 'Engraved silver bangle', 'bangles', 3250, 2, true), makeDemo('demo-bg-02', 'Openwork bangle pair', 'bangles', 4890, 4), makeDemo('demo-bg-03', 'Textured kada', 'bangles', 2950, 7), makeDemo('demo-bg-04', 'Twin line bangles', 'bangles', 3790, 1), makeDemo('demo-bg-05', 'Floral kada bangle', 'bangles', 4250, 3),
  makeDemo('demo-nk-01', 'Round pendant necklace', 'necklaces', 3650, 4, true), makeDemo('demo-nk-02', 'Fine silver chain', 'necklaces', 2190, 0), makeDemo('demo-nk-03', 'Drop pendant necklace', 'necklaces', 4190, 5), makeDemo('demo-nk-04', 'Layered chain necklace', 'necklaces', 5290, 2), makeDemo('demo-nk-05', 'Floral motif necklace', 'necklaces', 4590, 6),
  makeDemo('demo-er-01', 'Silver hoop earrings', 'earrings', 1590, 5, true), makeDemo('demo-er-02', 'Leaf drop earrings', 'earrings', 1890, 3), makeDemo('demo-er-03', 'Round stud earrings', 'earrings', 990, 7), makeDemo('demo-er-04', 'Jhumka earrings', 'earrings', 2790, 1), makeDemo('demo-er-05', 'Petal drop earrings', 'earrings', 2150, 0),
  makeDemo('demo-rg-01', 'Floral silver ring', 'rings', 1290, 7, true), makeDemo('demo-rg-02', 'Adjustable motif ring', 'rings', 1150, 3), makeDemo('demo-rg-03', 'Twin band ring', 'rings', 1490, 2), makeDemo('demo-rg-04', 'Leaf detail ring', 'rings', 1350, 6), makeDemo('demo-rg-05', 'Classic silver ring', 'rings', 990, 4),
];
const money = (value?: number | null) => value == null ? 'Price on request' : `₹${value.toLocaleString('en-IN')}`;

function BrandMark({ size = 42 }: { size?: number }) {
  return <Image source={require('./assets/brand-mark.png')} style={{ width: size, height: size, borderRadius: size / 2 }} resizeMode="cover" />;
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
  const [adminOpen, setAdminOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [tab, setTab] = useState<'Home' | 'Shop' | 'Saved'>('Home');
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
      Animated.parallel([Animated.timing(pageOpacity, { toValue: 1, duration: 700, delay: 180, useNativeDriver: true }), Animated.timing(pageLift, { toValue: 0, duration: 700, delay: 180, useNativeDriver: true })]),
    ]).start();
    const timer = setTimeout(() => setSplash(false), 1650);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => { AsyncStorage.getItem('lsp-saved-products').then(value => { if (value) setFavorites(JSON.parse(value)); }).catch(() => undefined).finally(() => setFavoritesReady(true)); }, []);
  useEffect(() => { if (favoritesReady) AsyncStorage.setItem('lsp-saved-products', JSON.stringify(favorites)).catch(() => undefined); }, [favorites, favoritesReady]);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    let mounted = true;
    (async () => {
      try {
        const [categoryResult, productResult] = await Promise.all([
          supabase.from('categories').select('id,name,slug,image_url').eq('is_active', true).order('sort_order'),
          supabase.from('products').select('id,sku,name,category_id,description,price,image_urls,is_featured,is_published').eq('is_published', true).order('created_at', { ascending: false }),
        ]);
        if (!mounted) return;
        if (categoryResult.error) setCatalogError('Collections are temporarily unavailable.');
        else setCategories([{ id: 'all', name: 'All pieces', slug: 'all' }, ...(categoryResult.data || [])]);
        if (productResult.error) setCatalogError('The catalogue is temporarily unavailable.');
        else if (productResult.data?.length) { setProducts(productResult.data as Product[]); setIsPreviewCatalog(false); }
        else {
          const ids = new Map((categoryResult.data || []).map(category => [category.slug, category.id]));
          setProducts(DEMO_PRODUCTS.map(product => ({ ...product, category_id: ids.get(product.category_id || '') || product.category_id })));
          setIsPreviewCatalog(true);
        }
      } catch {
        if (mounted) setCatalogError('Could not connect. Check your internet connection and try again.');
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  const categoryFor = (product: Product) => categories.find(category => category.id === product.category_id);
  const visible = useMemo(() => products.filter(product =>
    (activeCategory === 'all' || product.category_id === categories.find(category => category.slug === activeCategory || category.id === activeCategory)?.id) &&
    (!query || product.name.toLowerCase().includes(query.toLowerCase()) || product.description?.toLowerCase().includes(query.toLowerCase())) &&
    (tab !== 'Saved' || favorites.includes(product.id))), [products, activeCategory, categories, query, tab, favorites]);
  const openWhatsApp = () => Linking.openURL('https://wa.me/message/55KV75D2E2BSB1');
  const chooseCategory = (category: Category) => { setActiveCategory(category.slug); setTab('Home'); };
  const toggleFavorite = (id: string) => setFavorites(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);

  const productCard = ({ item, index }: { item: Product; index: number }) => (
    <Pressable onPress={() => setSelected(item)} style={({ pressed }) => [styles.productCard, index % 2 ? styles.cardRight : styles.cardLeft, pressed && styles.productPressed]}>
      <View style={styles.productPhotoWrap}>
        {item.image_urls?.[0] ? <Image source={{ uri: item.image_urls[0] }} style={styles.productPhoto} resizeMode="cover" /> : <View style={[styles.productPhoto, styles.photoFallback]}><MaterialCommunityIcons name="diamond-stone" size={38} color="#b7a3a0" /></View>}
        {item.is_featured && <View style={styles.featuredTag}><Text style={styles.featuredText}>LSP EDIT</Text></View>}
        <Pressable accessibilityRole="button" accessibilityLabel={favorites.includes(item.id) ? 'Remove from saved' : 'Save product'} style={styles.heart} hitSlop={8} onPress={() => toggleFavorite(item.id)}><Feather name="heart" size={17} color={favorites.includes(item.id) ? wine : ink} fill={favorites.includes(item.id) ? wine : 'transparent'} /></Pressable>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productCategory}>{categoryFor(item)?.name || 'SILVER COLLECTION'}</Text>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.priceLine}><Text style={styles.productPrice}>{money(item.price)}</Text><Feather name="arrow-up-right" size={15} color={wine} /></View>
      </View>
    </Pressable>
  );

  if (adminOpen) return <AdminPortal onClose={() => setAdminOpen(false)} />;
  const logoTilt = markRotate.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '0deg'] });
  const selectedCategory = categories.find(category => category.slug === activeCategory);

  const categoryTiles = <View style={styles.categoryGrid}>{categories.filter(category => category.slug !== 'all').map((category, index) => (
    <Pressable key={category.id} onPress={() => chooseCategory(category)} style={({ pressed }) => [styles.categoryTile, index % 2 ? styles.tileRight : styles.tileLeft, pressed && styles.productPressed]}>
      <Image source={{ uri: category.image_url || categoryPhoto[category.slug] || photoSet[index % photoSet.length] }} style={styles.categoryTileImage} resizeMode="cover" />
      <LinearGradient colors={['transparent', 'rgba(29,17,20,.67)']} style={styles.categoryShade} />
      <View style={styles.categoryTileText}><Text style={styles.categoryTileName}>{category.name}</Text><Feather name="arrow-up-right" size={16} color="#fff" /></View>
    </Pressable>
  ))}</View>;

  return <SafeAreaView style={styles.safe} edges={['top']}>
    <View style={styles.app}>
      <NativeStatusBar barStyle={splash ? 'light-content' : 'dark-content'} backgroundColor={splash ? wine : canvas} />
      <View style={styles.topbar}>
        <Pressable style={styles.brandRow} onPress={() => { setActiveCategory('all'); setTab('Home'); }}>
          <BrandMark size={42} />
          <View><Text style={styles.brandName}>LAKSHMI <Text style={{ color: wine }}>SILVER</Text></Text><Text style={styles.brandSub}>PALACE  ·  EST. 1998</Text></View>
        </Pressable>
        <View style={styles.headerActions}>
          <Pressable accessibilityLabel="Search" style={styles.roundIcon} onPress={() => searchRef.current?.focus()}><Feather name="search" size={19} color={ink} /></Pressable>
          <Pressable accessibilityLabel="Saved products" style={styles.roundIcon} onPress={() => setTab(tab === 'Saved' ? 'Home' : 'Saved')}><Feather name="heart" size={19} color={ink} /></Pressable>
          <Pressable accessibilityLabel="Owner administration" style={styles.roundIcon} onPress={() => setAdminOpen(true)}><Feather name="user" size={19} color={ink} /></Pressable>
        </View>
      </View>
      <View style={styles.stickyFilters}>
        <View style={styles.searchBox}><Feather name="search" size={17} color={muted} /><TextInput ref={searchRef} placeholder="Search silver jewellery" placeholderTextColor="#9c9292" value={query} onChangeText={setQuery} style={styles.searchInput} returnKeyType="search" /><Pressable onPress={openWhatsApp} style={styles.chatButton}><Feather name="message-circle" size={16} color={wine} /><Text style={styles.chatLabel}>WHATSAPP</Text></Pressable></View>
      </View>

      <FlatList data={loading || tab === 'Shop' ? [] : visible} renderItem={productCard} keyExtractor={product => product.id} numColumns={2} columnWrapperStyle={styles.productRow} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.listContent}
        ListHeaderComponent={<Animated.View style={{ opacity: pageOpacity, transform: [{ translateY: pageLift }] }}>
          {tab === 'Home' && <>
            <View style={styles.heroWrap}>
              <Image source={{ uri: photoSet[4] }} style={styles.heroImage} resizeMode="cover" />
              <LinearGradient colors={['rgba(39,11,20,.06)', 'rgba(48,12,25,.88)']} start={{ x: .5, y: 0 }} end={{ x: .5, y: 1 }} style={styles.heroOverlay} />
              <View style={styles.heroCopy}><Text style={styles.heroOverline}>SHRI LAXMI SILVER PALACE</Text><Text style={styles.heroTitle}>A little silver.{ '\n' }A lot of meaning.</Text><Pressable onPress={() => { setActiveCategory('all'); searchRef.current?.blur(); }} style={styles.heroCta}><Text style={styles.heroCtaText}>EXPLORE COLLECTION</Text><Feather name="arrow-right" size={15} color={wine} /></Pressable></View>
              <View style={styles.heroDots}><View style={styles.dotActive}/><View style={styles.dot}/><View style={styles.dot}/></View>
            </View>
            {isPreviewCatalog && <View style={styles.previewNotice}><Feather name="info" size={13} color={wine}/><Text style={styles.previewNoticeText}>Preview catalogue</Text></View>}
            <View style={styles.content}>
              <View style={styles.sectionHeading}><View><Text style={styles.eyebrow}>CURATED FOR YOU</Text><Text style={styles.sectionTitle}>Shop by category</Text></View><Pressable onPress={() => setTab('Shop')}><Text style={styles.seeAll}>VIEW ALL <Feather name="arrow-right" size={12} color={wine} /></Text></Pressable></View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRail}>{categories.filter(category => category.slug !== 'all').map(category => <Pressable key={category.id} onPress={() => chooseCategory(category)} style={styles.categoryItem}><Image source={{ uri: category.image_url || categoryPhoto[category.slug] || photoSet[0] }} style={styles.categoryImage} /><Text style={styles.categoryLabel} numberOfLines={1}>{category.name}</Text></Pressable>)}</ScrollView>
            </View>
          </>}
          {tab === 'Shop' && <View style={styles.content}><View style={styles.pageHeading}><Text style={styles.eyebrow}>THE COLLECTION</Text><Text style={styles.pageTitle}>Shop</Text></View>{categoryTiles}</View>}
          <View style={styles.content}>
            {tab !== 'Shop' && <View style={[styles.sectionHeading, styles.catalogHeading]}><View><Text style={styles.eyebrow}>{tab === 'Saved' ? 'YOUR SELECTION' : 'SILVER COLLECTION'}</Text><Text style={styles.sectionTitle}>{tab === 'Saved' ? 'Saved pieces' : selectedCategory?.name || 'All pieces'}</Text></View><Text style={styles.count}>{visible.length} pieces</Text></View>}
            {loading && tab !== 'Shop' && <ActivityIndicator color={wine} style={{ marginVertical: 40 }} />}
            {!!catalogError && tab !== 'Shop' && <View style={styles.catalogNotice}><Feather name="wifi-off" size={16} color={wine}/><Text style={styles.catalogNoticeText}>{catalogError}</Text></View>}
            {!loading && !visible.length && <View style={styles.empty}><MaterialCommunityIcons name={tab === 'Saved' ? 'heart-outline' : 'diamond-stone'} size={34} color="#b9a2a3"/><Text style={styles.emptyTitle}>{catalogError ? 'Catalogue unavailable' : tab === 'Saved' ? 'No saved pieces yet' : 'No pieces found'}</Text></View>}
          </View>
        </Animated.View>}
        ListFooterComponent={<View style={styles.footer}><Text style={styles.footerTitle}>Shri Laxmi Silver Palace</Text><Text style={styles.footerAddress}>Mahajan Complex · B. Mahendra New Killa</Text><Pressable onPress={openWhatsApp} style={styles.footerContact}><Feather name="message-circle" size={15} color={wine} /><Text style={styles.footerContactText}> Chat with us</Text></Pressable><Pressable onPress={() => setAdminOpen(true)} style={styles.adminLink}><Text style={styles.adminLinkText}>Owner access</Text></Pressable></View>}
      />

      <View style={styles.bottomNav}>{([['Home', 'home'], ['Shop', 'grid'], ['Saved', 'heart'], ['Contact', 'message-circle']] as const).map(([label, icon]) => <Pressable key={label} onPress={() => label === 'Contact' ? openWhatsApp() : setTab(label === 'Shop' ? 'Shop' : label)} style={styles.navItem}><View style={[styles.navIcon, tab === label && styles.navIconActive]}><Feather name={icon} size={19} color={tab === label ? wine : '#857b7e'} /></View><Text style={[styles.navLabel, tab === label && styles.navLabelActive]}>{label}</Text></Pressable>)}</View>

      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.detailBackdrop}><Pressable style={{ flex: 1 }} onPress={() => setSelected(null)} /><View style={styles.detailSheet}>
          <View style={styles.sheetHandle} /><Pressable accessibilityLabel="Close product details" onPress={() => setSelected(null)} style={styles.sheetClose}><Feather name="x" size={20} color={ink}/></Pressable>
          {selected && <ScrollView showsVerticalScrollIndicator={false}><Image source={{ uri: selected.image_urls?.[0] }} style={styles.detailPhoto} resizeMode="cover"/><Text style={styles.eyebrow}>{categoryFor(selected)?.name || 'LSP COLLECTION'}</Text><Text style={styles.detailTitle}>{selected.name}</Text><Text style={styles.detailPrice}>{money(selected.price)}</Text>{!!selected.description && <Text style={styles.detailDescription}>{selected.description}</Text>}<View style={styles.detailDivider}/><Text style={styles.detailNote}>For availability, sizing and product details, contact our store.</Text><View style={styles.detailActions}><Pressable onPress={() => toggleFavorite(selected.id)} style={styles.detailSave}><Feather name="heart" size={18} color={wine} fill={favorites.includes(selected.id) ? wine : 'transparent'} /></Pressable><Pressable style={styles.enquireButton} onPress={() => { setSelected(null); openWhatsApp(); }}><Feather name="message-circle" size={17} color="#fff"/><Text style={styles.enquireText}>ENQUIRE ON WHATSAPP</Text></Pressable></View></ScrollView>}
        </View></View>
      </Modal>
      {splash && <View style={styles.splash}><Animated.View style={[styles.splashRing, { opacity: ringOpacity, transform: [{ scale: ring }] }]} /><Animated.View style={{ transform: [{ scale: markScale }, { rotate: logoTilt }], opacity: markOpacity, alignItems: 'center' }}><BrandMark size={104}/><Text style={styles.splashName}>LAKSHMI SILVER PALACE</Text></Animated.View></View>}
    </View>
  </SafeAreaView>;
}

const width = Dimensions.get('window').width;
const layoutWidth = Math.min(width, 560);
const cardWidth = (layoutWidth - 48) / 2;
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: canvas }, app: { flex: 1, backgroundColor: canvas },
  topbar: { minHeight: 69, paddingHorizontal: 17, backgroundColor: canvas, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 }, brandName: { fontSize: 12, letterSpacing: 1.2, fontWeight: '800', color: ink }, brandSub: { fontSize: 8, letterSpacing: 1.5, color: muted, marginTop: 3 },
  headerActions: { flexDirection: 'row', gap: 7 }, roundIcon: { width: 38, height: 38, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3EBE8' },
  stickyFilters: { backgroundColor: canvas, paddingHorizontal: 17, paddingTop: 5, paddingBottom: 12 }, searchBox: { height: 46, backgroundColor: '#F2ECEA', borderRadius: 24, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 9 }, searchInput: { flex: 1, fontSize: 12, color: ink, paddingVertical: 0 }, chatButton: { height: 29, paddingLeft: 10, borderLeftWidth: 1, borderColor: '#DED3D0', flexDirection: 'row', alignItems: 'center', gap: 4 }, chatLabel: { fontSize: 8, letterSpacing: .8, color: wine, fontWeight: '800' },
  listContent: { paddingBottom: 12 }, heroWrap: { height: Math.min(330, width * .64), marginHorizontal: 15, marginTop: 2, borderRadius: 19, overflow: 'hidden', backgroundColor: '#5b2431', elevation: 4, shadowColor: '#481422', shadowOpacity: .18, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } }, heroImage: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' }, heroOverlay: { ...StyleSheet.absoluteFill }, heroCopy: { position: 'absolute', left: 20, right: 20, bottom: 38 }, heroOverline: { color: '#F3DFD0', fontSize: 8, letterSpacing: 2, fontWeight: '800' }, heroTitle: { color: '#fffaf5', fontFamily: 'Georgia', fontSize: 27, lineHeight: 34, marginTop: 8 }, heroCta: { marginTop: 13, backgroundColor: '#FFF8F2', borderRadius: 24, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', gap: 9, alignItems: 'center' }, heroCtaText: { fontSize: 8, letterSpacing: .9, color: wine, fontWeight: '800' }, heroDots: { position: 'absolute', bottom: 15, right: 18, flexDirection: 'row', gap: 5 }, dotActive: { width: 15, height: 5, borderRadius: 3, backgroundColor: '#fff' }, dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#ffffff80' },
  content: { paddingHorizontal: 17 }, sectionHeading: { marginTop: 23, marginBottom: 14, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }, catalogHeading: { marginTop: 24, marginBottom: 15 }, eyebrow: { fontSize: 8, color: wine, fontWeight: '800', letterSpacing: 1.6 }, sectionTitle: { fontSize: 20, color: ink, fontFamily: 'Georgia', marginTop: 4 }, pageHeading: { marginTop: 15, marginBottom: 17 }, pageTitle: { fontSize: 30, color: ink, fontFamily: 'Georgia', marginTop: 4 }, seeAll: { color: wine, fontSize: 8, letterSpacing: .8, fontWeight: '800', marginBottom: 3 }, count: { color: muted, fontSize: 10, marginBottom: 3 },
  categoryRail: { gap: 13, paddingBottom: 3 }, categoryItem: { alignItems: 'center', width: 76 }, categoryImage: { width: 70, height: 70, borderRadius: 17, backgroundColor: '#EEE2DE' }, categoryLabel: { marginTop: 7, fontSize: 9, color: '#5F5558', fontWeight: '600' }, categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5, maxWidth: 560, alignSelf: 'center' }, categoryTile: { width: (layoutWidth - 44) / 2, height: (layoutWidth - 44) / 2 * .83, borderRadius: 15, overflow: 'hidden', marginBottom: 10, backgroundColor: '#E9DEDB' }, tileLeft: { marginLeft: 5, marginRight: 5 }, tileRight: { marginLeft: 5, marginRight: 5 }, categoryTileImage: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' }, categoryShade: { ...StyleSheet.absoluteFill }, categoryTileText: { position: 'absolute', left: 12, right: 12, bottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, categoryTileName: { color: '#fff', fontFamily: 'Georgia', fontSize: 17, fontWeight: '600' },
  previewNotice: { alignSelf: 'flex-start', marginLeft: 18, marginTop: 8, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: '#F4E8E4', flexDirection: 'row', alignItems: 'center', gap: 6 }, previewNoticeText: { color: '#78585C', fontSize: 8 },
  productRow: { paddingHorizontal: 15, justifyContent: 'space-between', marginBottom: 13, width: '100%', maxWidth: 560, alignSelf: 'center' }, productCard: { width: cardWidth, backgroundColor: '#fff', borderRadius: 15, overflow: 'hidden', elevation: 2, shadowColor: '#39252A', shadowOpacity: .07, shadowRadius: 7, shadowOffset: { width: 0, height: 2 } }, cardLeft: { marginRight: 4 }, cardRight: { marginLeft: 4 }, productPhotoWrap: { width: '100%', height: cardWidth * 1.12, backgroundColor: '#EFE9E5', position: 'relative', overflow: 'hidden' }, productPhoto: { width: '100%', height: '100%' }, photoFallback: { alignItems: 'center', justifyContent: 'center' }, productInfo: { paddingHorizontal: 10, paddingTop: 10, paddingBottom: 12 }, productCategory: { fontSize: 7, letterSpacing: 1.1, color: '#9A777B', fontWeight: '800' }, productName: { marginTop: 5, color: ink, fontSize: 12, lineHeight: 17, fontWeight: '600', minHeight: 34 }, priceLine: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, productPrice: { color: ink, fontSize: 13, fontWeight: '800' }, featuredTag: { position: 'absolute', left: 8, top: 8, backgroundColor: '#FFF9F4', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12 }, featuredText: { fontSize: 7, letterSpacing: .8, fontWeight: '800', color: wine }, heart: { position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 17, backgroundColor: 'rgba(255,255,255,.94)', alignItems: 'center', justifyContent: 'center' }, productPressed: { opacity: .93, transform: [{ scale: .985 }] },
  empty: { paddingVertical: 35, alignItems: 'center' }, emptyTitle: { fontFamily: 'Georgia', color: ink, fontSize: 17, marginTop: 10 }, catalogNotice: { marginTop: 14, padding: 12, gap: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F6E9E5', borderRadius: 10 }, catalogNoticeText: { flex: 1, color: wine, fontSize: 10 },
  footer: { alignItems: 'center', paddingTop: 22, paddingBottom: 23, marginTop: 12, borderTopWidth: 1, borderColor: '#EFE7E2' }, footerTitle: { fontFamily: 'Georgia', color: ink, fontSize: 16 }, footerAddress: { marginTop: 7, fontSize: 9, color: muted, textAlign: 'center' }, footerContact: { marginTop: 11, flexDirection: 'row', alignItems: 'center' }, footerContactText: { color: wine, fontSize: 10, fontWeight: '700' }, adminLink: { paddingVertical: 12, paddingHorizontal: 20 }, adminLinkText: { color: '#9B8E90', fontSize: 9 },
  bottomNav: { minHeight: 65, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#FFFEFC', borderTopWidth: 1, borderColor: '#F0E9E5', paddingBottom: 2 }, navItem: { minWidth: 58, alignItems: 'center', gap: 2 }, navIcon: { width: 48, height: 31, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, navIconActive: { backgroundColor: '#F6E8E9' }, navLabel: { fontSize: 8, color: '#857b7e' }, navLabelActive: { color: wine, fontWeight: '800' },
  detailBackdrop: { flex: 1, backgroundColor: 'rgba(22,14,16,.5)', justifyContent: 'flex-end' }, detailSheet: { height: '89%', backgroundColor: '#FFFEFC', paddingHorizontal: 17, paddingTop: 9, paddingBottom: 22, borderTopLeftRadius: 22, borderTopRightRadius: 22 }, sheetHandle: { width: 40, height: 4, backgroundColor: '#D9CCCA', borderRadius: 3, alignSelf: 'center', marginBottom: 11 }, sheetClose: { position: 'absolute', zIndex: 2, right: 22, top: 18, width: 34, height: 34, borderRadius: 18, backgroundColor: '#ffffffdd', alignItems: 'center', justifyContent: 'center' }, detailPhoto: { width: '100%', height: Math.min(350, width * 1.02), backgroundColor: '#F0EAE6', borderRadius: 13, marginBottom: 18 }, detailTitle: { fontFamily: 'Georgia', fontSize: 24, color: ink, marginTop: 7 }, detailPrice: { fontSize: 18, color: ink, fontWeight: '800', marginTop: 9 }, detailDescription: { fontSize: 12, lineHeight: 19, color: muted, marginTop: 11 }, detailDivider: { height: 1, backgroundColor: '#EEE6E2', marginVertical: 17 }, detailNote: { fontSize: 11, color: muted, lineHeight: 17 }, detailActions: { flexDirection: 'row', gap: 10, marginTop: 17, marginBottom: 25 }, detailSave: { height: 49, width: 51, borderRadius: 25, backgroundColor: '#F6E8E9', alignItems: 'center', justifyContent: 'center' }, enquireButton: { flex: 1, backgroundColor: wine, minHeight: 49, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 26 }, enquireText: { fontSize: 10, letterSpacing: .7, color: '#fff', fontWeight: '800' },
  splash: { ...StyleSheet.absoluteFill, zIndex: 20, backgroundColor: '#7A1527', alignItems: 'center', justifyContent: 'center' }, splashRing: { position: 'absolute', width: 170, height: 170, borderRadius: 90, borderWidth: 1, borderColor: 'rgba(255,235,219,.32)' }, splashName: { color: '#fff', fontSize: 12, letterSpacing: 2.4, fontWeight: '800', marginTop: 16 },
});
