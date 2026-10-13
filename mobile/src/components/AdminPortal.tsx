import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { File } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { StatusBar } from 'expo-status-bar';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

type Category = { id: string; name: string; slug: string; is_active: boolean; sort_order: number };
type Product = { id: string; sku: string; name: string; category_id: string | null; price: number | null; is_published: boolean; is_active: boolean };
type CsvRow = Record<string, string>;
type Notice = { kind: 'success' | 'error' | 'info'; message: string };

const wine = '#791c2c';
const ink = '#2b2022';
const muted = '#887c7d';
const slugify = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const truthy = (value?: string) => ['true', 'yes', '1', 'published', 'active'].includes((value || '').trim().toLowerCase());

function parseCsv(source: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < source.length; i += 1) {
    const character = source[i];
    if (character === '"') {
      if (quoted && source[i + 1] === '"') { cell += '"'; i += 1; }
      else quoted = !quoted;
    } else if (character === ',' && !quoted) {
      row.push(cell); cell = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && source[i + 1] === '\n') i += 1;
      row.push(cell); cell = '';
      if (row.some(value => value.trim())) rows.push(row);
      row = [];
    } else cell += character;
  }
  if (quoted) throw new Error('The CSV has an unclosed quote. Check the file and export it again.');
  row.push(cell);
  if (row.some(value => value.trim())) rows.push(row);
  return rows;
}

function Button({ title, icon, onPress, secondary = false, disabled = false }: { title: string; icon?: keyof typeof Feather.glyphMap; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.buttonSecondary, disabled && styles.disabled, pressed && styles.pressed]}>
    {icon && <Feather name={icon} size={16} color={secondary ? wine : '#fff'} />}
    <Text style={[styles.buttonText, secondary && styles.buttonTextSecondary]}>{title}</Text>
  </Pressable>;
}

export default function AdminPortal({ onClose }: { onClose: () => void }) {
  const [session, setSession] = useState<any>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<'overview' | 'products' | 'categories' | 'import'>('overview');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [editId, setEditId] = useState('');
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [csvName, setCsvName] = useState('');
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [importReport, setImportReport] = useState('');
  const fade = useRef(new Animated.Value(0)).current;
  const admin = session?.user?.app_metadata?.role === 'admin';

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }).start();
    supabase.auth.getSession().then(({ data }) => setSession(data.session)).finally(() => setCheckingSession(false));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => subscription.unsubscribe();
  }, [fade]);

  const refresh = async () => {
    const [categoryResult, productResult] = await Promise.all([
      supabase.from('categories').select('id,name,slug,is_active,sort_order').order('sort_order').order('name'),
      supabase.from('products').select('id,sku,name,category_id,price,is_published,is_active').order('created_at', { ascending: false }),
    ]);
    if (categoryResult.error || productResult.error) {
      setNotice({ kind: 'error', message: categoryResult.error?.message || productResult.error?.message || 'Could not load the catalogue.' });
      return;
    }
    setCategories((categoryResult.data || []) as Category[]);
    setProducts((productResult.data || []) as Product[]);
  };

  useEffect(() => { if (admin) void refresh(); }, [admin]);

  const counts = useMemo(() => ({ published: products.filter(product => product.is_active && product.is_published).length, visibleCategories: categories.filter(category => category.is_active).length }), [products, categories]);

  const signIn = async () => {
    if (!isSupabaseConfigured) { setNotice({ kind: 'error', message: 'Add the Supabase project URL and publishable key to mobile/.env, then restart Expo.' }); return; }
    setBusy(true); setNotice(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setNotice({ kind: 'error', message: error.message });
  };

  const signOut = async () => { await supabase.auth.signOut(); setSession(null); setTab('overview'); };

  const addCategory = async () => {
    const name = newCategory.trim();
    const slug = slugify(name);
    if (!name || !slug) return;
    setBusy(true);
    const { error } = await supabase.from('categories').insert({ name, slug, sort_order: categories.length });
    setBusy(false);
    if (error) setNotice({ kind: 'error', message: error.message });
    else { setNewCategory(''); setNotice({ kind: 'success', message: `${name} added to collections.` }); await refresh(); }
  };

  const saveCategory = async (category: Category) => {
    const name = editName.trim();
    const slug = slugify(editSlug);
    if (!name || !slug) return;
    setBusy(true);
    const { error } = await supabase.from('categories').update({ name, slug }).eq('id', category.id);
    setBusy(false);
    if (error) setNotice({ kind: 'error', message: error.message });
    else { setEditId(''); setNotice({ kind: 'success', message: 'Collection updated.' }); await refresh(); }
  };

  const toggleCategory = async (category: Category) => {
    const { error } = await supabase.from('categories').update({ is_active: !category.is_active }).eq('id', category.id);
    if (error) setNotice({ kind: 'error', message: error.message }); else await refresh();
  };

  const deleteCategory = (category: Category) => Alert.alert('Remove this collection?', `${category.name} will be removed. Its products will remain without a category.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: async () => {
      const { error } = await supabase.from('categories').delete().eq('id', category.id);
      if (error) setNotice({ kind: 'error', message: error.message }); else { setNotice({ kind: 'success', message: 'Collection removed.' }); await refresh(); }
    } },
  ]);

  const togglePublished = async (product: Product) => {
    const { error } = await supabase.from('products').update({ is_published: !product.is_published }).eq('id', product.id);
    if (error) setNotice({ kind: 'error', message: error.message }); else await refresh();
  };

  const chooseCsv = async () => {
    try {
      const selection = await DocumentPicker.getDocumentAsync({ type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel'], copyToCacheDirectory: true });
      if (selection.canceled) return;
      const asset = selection.assets[0];
      const text = await new File(asset.uri).text();
      const rows = parseCsv(text);
      if (rows.length < 2) throw new Error('This CSV has no product rows yet.');
      const headers = rows[0].map((header, index) => `${index === 0 ? header.replace(/^\uFEFF/, '') : header}`.trim().toLowerCase());
      for (const required of ['sku', 'name', 'category_slug']) if (!headers.includes(required)) throw new Error(`Missing required CSV column: ${required}`);
      const objects = rows.slice(1).map(values => Object.fromEntries(headers.map((header, index) => [header, (values[index] || '').trim()])));
      if (objects.length > 800) throw new Error('This import has more than 800 rows. Split it into smaller CSV files.');
      setCsvName(asset.name);
      setCsvRows(objects);
      setImportReport('');
      setNotice({ kind: 'info', message: `${objects.length} product rows are ready to review.` });
    } catch (error) {
      setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Could not read that CSV file.' });
    }
  };

  const importCsv = async () => {
    if (!csvRows.length) return;
    const categoryIds = new Map(categories.filter(category => category.is_active).map(category => [category.slug, category.id]));
    const problems: string[] = [];
    const seen = new Set<string>();
    const cleaned: Record<string, unknown>[] = [];
    csvRows.forEach((row, index) => {
      const line = index + 2;
      const sku = (row.sku || '').trim();
      const name = (row.name || '').trim();
      const categorySlug = slugify(row.category_slug || '');
      if (!sku || !name) { problems.push(`Row ${line}: SKU and product name are required.`); return; }
      if (seen.has(sku)) { problems.push(`Row ${line}: duplicate SKU “${sku}” in this file.`); return; }
      seen.add(sku);
      if (categorySlug && !categoryIds.has(categorySlug)) { problems.push(`Row ${line}: category “${row.category_slug}” is not an active collection.`); return; }
      const priceText = (row.price || '').replace(/[₹,\s]/g, '');
      const price = priceText ? Number(priceText) : null;
      if (priceText && (!Number.isFinite(price) || (price as number) < 0)) { problems.push(`Row ${line}: price must be zero or higher.`); return; }
      const imageUrls = (row.images || '').split('|').map(url => url.trim()).filter(Boolean);
      if (imageUrls.some(url => !/^https?:\/\//i.test(url))) { problems.push(`Row ${line}: image URLs must start with http:// or https://.`); return; }
      cleaned.push({ sku, name, category_id: categorySlug ? categoryIds.get(categorySlug) : null, description: row.description || null, price, image_urls: imageUrls, is_featured: truthy(row.is_featured), is_published: truthy(row.is_published), is_active: true });
    });
    if (problems.length) {
      setImportReport(`Nothing was imported. Fix ${problems.length} issue(s):\n${problems.slice(0, 12).join('\n')}${problems.length > 12 ? `\n…and ${problems.length - 12} more.` : ''}`);
      return;
    }
    setBusy(true); setImportReport('');
    let imported = 0;
    let failure = '';
    for (let start = 0; start < cleaned.length; start += 200) {
      const { data, error } = await supabase.from('products').upsert(cleaned.slice(start, start + 200), { onConflict: 'sku' }).select('id');
      if (error) { failure = error.message; break; }
      imported += data?.length || 0;
    }
    setBusy(false);
    if (failure) {
      setImportReport(`Import stopped after ${imported} rows: ${failure}. Upload the same file again after correcting the issue; matching SKUs update existing items.`);
      setNotice({ kind: 'error', message: 'The import was only partly completed.' });
    } else {
      setImportReport(`${imported} products added or updated. New products stay hidden unless is_published is true in the CSV.`);
      setCsvRows([]); setCsvName(''); setNotice({ kind: 'success', message: 'Product import complete.' }); await refresh();
    }
  };

  const topBar = <View style={styles.topbar}>
    <Pressable onPress={onClose} style={styles.backButton}><Feather name="arrow-left" size={18} color={wine}/><Text style={styles.backText}>Catalogue</Text></Pressable>
    <Pressable onPress={() => void signOut()} style={styles.signOut}><Feather name="log-out" size={16} color={muted}/></Pressable>
  </View>;

  if (checkingSession) return <View style={styles.screen}><StatusBar style="dark"/>{topBar}<ActivityIndicator color={wine} style={{ flex: 1 }}/></View>;

  if (!session || !admin) return <View style={styles.screen}><StatusBar style="dark"/>{topBar}
    <ScrollView contentContainerStyle={styles.loginWrap} keyboardShouldPersistTaps="handled">
      <Animated.View style={[styles.loginCard, { opacity: fade, transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
        <View style={styles.loginIcon}><MaterialCommunityIcons name="shield-lock-outline" size={28} color={wine}/></View>
        <Text style={styles.kicker}>OWNER ACCESS</Text>
        <Text style={styles.loginTitle}>{session ? 'Admin access required' : 'Welcome back'}</Text>
        <Text style={styles.bodyCopy}>{session ? 'This account does not have the owner role. Sign out and use the owner account.' : 'Sign in to manage the collections and products in your catalogue.'}</Text>
        {session ? <Button title="Sign out" icon="log-out" onPress={() => void signOut()} secondary/> : <>
          <Text style={styles.fieldLabel}>Email address</Text><TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="owner@business.com" placeholderTextColor="#b3a6a4" />
          <Text style={styles.fieldLabel}>Password</Text><TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" placeholder="Your password" placeholderTextColor="#b3a6a4" onSubmitEditing={() => void signIn()} />
          <Button title={busy ? 'Signing in…' : 'Sign in securely'} icon="arrow-right" onPress={() => void signIn()} disabled={busy}/>
        </>}
        {!!notice && <Text style={[styles.notice, notice.kind === 'error' && styles.noticeError]}>{notice.message}</Text>}
        {!isSupabaseConfigured && <Text style={styles.setupHint}>Add the Supabase URL and publishable key to mobile/.env, then restart Expo.</Text>}
        <View style={styles.securityLine}><Feather name="shield" size={15} color="#66846e"/><Text style={styles.securityText}>Changes are available to owner accounts only</Text></View>
      </Animated.View>
    </ScrollView>
  </View>;

  const navItems: Array<{ id: typeof tab; label: string; icon: keyof typeof Feather.glyphMap }> = [
    { id: 'overview', label: 'Overview', icon: 'grid' }, { id: 'products', label: 'Products', icon: 'package' },
    { id: 'categories', label: 'Collections', icon: 'layers' }, { id: 'import', label: 'CSV import', icon: 'upload' },
  ];

  return <View style={styles.screen}><StatusBar style="dark"/>{topBar}
    <Animated.View style={{ flex: 1, opacity: fade }}>
      <ScrollView contentContainerStyle={styles.adminContent} keyboardShouldPersistTaps="handled">
        <View style={styles.headingRow}><View><Text style={styles.kicker}>LAKSHMI SILVER PALACE</Text><Text style={styles.heading}>Catalogue studio</Text></View><View style={styles.ownerBadge}><View style={styles.onlineDot}/><Text style={styles.ownerBadgeText}>OWNER</Text></View></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navRail}>
          {navItems.map(item => <Pressable key={item.id} onPress={() => { setTab(item.id); setNotice(null); }} style={[styles.navChip, tab === item.id && styles.navChipActive]}><Feather name={item.icon} size={15} color={tab === item.id ? '#fff' : wine}/><Text style={[styles.navChipText, tab === item.id && styles.navChipTextActive]}>{item.label}</Text></Pressable>)}
        </ScrollView>
        {!!notice && <Pressable onPress={() => setNotice(null)} style={[styles.noticeBox, notice.kind === 'error' && styles.noticeBoxError]}><Feather name={notice.kind === 'error' ? 'alert-circle' : 'check-circle'} size={17} color={notice.kind === 'error' ? wine : '#547b5f'}/><Text style={styles.noticeBoxText}>{notice.message}</Text><Feather name="x" size={15} color={muted}/></Pressable>}

        {tab === 'overview' && <>
          <View style={styles.hero}><Text style={styles.heroKicker}>YOUR COLLECTION, AT A GLANCE</Text><Text style={styles.heroTitle}>A little shine, well organised.</Text><Text style={styles.heroText}>Changes appear in the catalogue as soon as you publish them.</Text><MaterialCommunityIcons style={styles.heroGem} name="diamond-stone" size={72} color="#f0d5bf"/></View>
          <View style={styles.stats}><View style={styles.stat}><Text style={styles.statLabel}>All products</Text><Text style={styles.statValue}>{products.length}</Text></View><View style={styles.stat}><Text style={styles.statLabel}>Published</Text><Text style={styles.statValue}>{counts.published}</Text></View><View style={styles.stat}><Text style={styles.statLabel}>Collections</Text><Text style={styles.statValue}>{counts.visibleCategories}</Text></View></View>
          <View style={styles.panel}><Text style={styles.kicker}>QUICK ACTIONS</Text><Text style={styles.panelTitle}>What would you like to update?</Text><Button title="Import up to 800 products" icon="upload" onPress={() => setTab('import')}/><View style={{ height: 9 }}/><Button title="Manage collections" icon="layers" onPress={() => setTab('categories')} secondary/></View>
          <Text style={styles.adminFootnote}>Products remain hidden until you publish them.</Text>
        </>}

        {tab === 'products' && <View style={styles.panel}><View style={styles.panelHeading}><View><Text style={styles.kicker}>CATALOGUE</Text><Text style={styles.panelTitle}>Products</Text></View><Text style={styles.countPill}>{products.length}</Text></View>
          {products.length === 0 ? <Text style={styles.bodyCopy}>No products yet. Add them with the CSV import.</Text> : products.map(product => <View key={product.id} style={styles.productRow}><View style={styles.productGlyph}><MaterialCommunityIcons name="diamond-stone" size={18} color={wine}/></View><View style={styles.rowCopy}><Text style={styles.rowTitle} numberOfLines={1}>{product.name}</Text><Text style={styles.rowSub}>{product.sku} · {categories.find(category => category.id === product.category_id)?.name || 'Unassigned'}</Text></View><Pressable onPress={() => void togglePublished(product)} style={[styles.statusPill, product.is_published && product.is_active ? styles.statusLive : styles.statusDraft]}><Text style={[styles.statusText, product.is_published && product.is_active && styles.statusTextLive]}>{product.is_published && product.is_active ? 'Live' : 'Draft'}</Text></Pressable></View>)}
        </View>}

        {tab === 'categories' && <View style={styles.panel}><Text style={styles.kicker}>SHOP BY COLLECTION</Text><Text style={styles.panelTitle}>Collections</Text><Text style={styles.bodyCopy}>Add, rename, hide, or remove a category in the catalogue.</Text>
          <View style={styles.addCategoryRow}><TextInput value={newCategory} onChangeText={setNewCategory} placeholder="e.g. Toe rings" placeholderTextColor="#b3a6a4" style={[styles.input, { flex: 1, marginBottom: 0 }]}/><Pressable onPress={() => void addCategory()} disabled={busy} style={styles.addButton}><Feather name="plus" size={19} color="#fff"/></Pressable></View>
          {categories.map(category => <View key={category.id} style={styles.categoryRow}>
            {editId === category.id ? <View style={styles.editCategory}>
              <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholder="Name"/>
              <TextInput style={styles.input} value={editSlug} onChangeText={setEditSlug} autoCapitalize="none" placeholder="category-slug"/>
              <View style={styles.inlineActions}><Button title="Save" icon="check" onPress={() => void saveCategory(category)} disabled={busy}/><Button title="Cancel" onPress={() => setEditId('')} secondary/></View>
            </View> : <>
              <View style={styles.rowCopy}><Text style={styles.rowTitle}>{category.name}</Text><Text style={styles.rowSub}>/{category.slug} · {category.is_active ? 'Visible in app' : 'Hidden'}</Text></View>
              <Pressable accessibilityLabel={`Edit ${category.name}`} style={styles.iconButton} onPress={() => { setEditId(category.id); setEditName(category.name); setEditSlug(category.slug); }}><Feather name="edit-2" size={15} color={muted}/></Pressable>
              <Pressable accessibilityLabel={`${category.is_active ? 'Hide' : 'Show'} ${category.name}`} style={styles.iconButton} onPress={() => void toggleCategory(category)}><Feather name={category.is_active ? 'eye-off' : 'eye'} size={15} color={wine}/></Pressable>
              <Pressable accessibilityLabel={`Delete ${category.name}`} style={styles.iconButton} onPress={() => deleteCategory(category)}><Feather name="trash-2" size={15} color="#a64a54"/></Pressable>
            </>}
          </View>)}
        </View>}

        {tab === 'import' && <View style={styles.panel}><Text style={styles.kicker}>BULK ADD OR UPDATE</Text><Text style={styles.panelTitle}>Import products from CSV</Text><Text style={styles.bodyCopy}>Choose a CSV file exported from Excel or Google Sheets. Imports support up to 800 rows and update existing products by SKU.</Text>
          <View style={styles.csvHelp}><Text style={styles.csvHelpTitle}>CSV columns</Text><Text style={styles.csvHelpText}>sku, name, category_slug, description, price, images, is_featured, is_published</Text><Text style={styles.csvHelpText}>Use | between image URLs. Category slugs must match a collection. New products stay hidden unless is_published is true.</Text></View>
          <Button title={csvName || 'Choose CSV file'} icon="file-text" onPress={() => void chooseCsv()} secondary/>
          {csvRows.length > 0 && <><Text style={styles.previewTitle}>{csvRows.length} rows ready · preview</Text>{csvRows.slice(0, 5).map((row, index) => <View key={`${row.sku}-${index}`} style={styles.previewRow}><Text style={styles.previewSku}>{row.sku}</Text><Text numberOfLines={1} style={styles.previewName}>{row.name}</Text><Text style={styles.previewMeta}>{row.category_slug || 'Unassigned'} · {row.price || 'No price'}</Text></View>)}<View style={{ height: 14 }}/><Button title={busy ? 'Importing…' : `Import ${csvRows.length} products`} icon="arrow-up-right" onPress={() => void importCsv()} disabled={busy}/></>}
          {!!importReport && <Text selectable style={styles.importReport}>{importReport}</Text>}
        </View>}
      </ScrollView>
    </Animated.View>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#faf7f5' },
  topbar: { height: 60, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fffefd', borderBottomWidth: 1, borderColor: '#eee6e2' },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingRight: 12 },
  backText: { color: ink, fontSize: 13, fontWeight: '700' }, signOut: { width: 38, height: 38, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f7f0ed' },
  loginWrap: { flexGrow: 1, justifyContent: 'center', padding: 22 },
  loginCard: { maxWidth: 460, width: '100%', alignSelf: 'center', padding: 25, backgroundColor: '#fffefd', borderRadius: 22, borderWidth: 1, borderColor: '#eee5e1', elevation: 3, shadowColor: '#35171d', shadowOpacity: .08, shadowRadius: 15, shadowOffset: { width: 0, height: 6 } },
  loginIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#f8edeb', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  kicker: { color: wine, fontSize: 9, letterSpacing: 1.8, fontWeight: '800' }, loginTitle: { color: ink, fontFamily: 'Georgia', fontSize: 29, marginTop: 7 }, bodyCopy: { color: muted, fontSize: 12, lineHeight: 19, marginTop: 8, marginBottom: 16 },
  fieldLabel: { color: ink, fontSize: 11, fontWeight: '700', marginTop: 9, marginBottom: 6 }, input: { minHeight: 46, borderWidth: 1, borderColor: '#e8dedb', borderRadius: 11, paddingHorizontal: 13, color: ink, backgroundColor: '#fff', marginBottom: 9, fontSize: 13 },
  button: { minHeight: 46, paddingHorizontal: 15, borderRadius: 13, backgroundColor: wine, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, buttonSecondary: { backgroundColor: '#f7eeeb' }, buttonText: { color: '#fff', fontSize: 12, fontWeight: '800' }, buttonTextSecondary: { color: wine }, disabled: { opacity: .6 }, pressed: { opacity: .84, transform: [{ scale: .99 }] },
  notice: { color: '#53755b', fontSize: 11, lineHeight: 16, marginTop: 13 }, noticeError: { color: '#9a3340' }, setupHint: { marginTop: 12, padding: 11, borderRadius: 10, backgroundColor: '#fff4ec', color: '#775f55', fontSize: 11, lineHeight: 17 }, securityLine: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderColor: '#f0e9e6', paddingTop: 16, marginTop: 18 }, securityText: { fontSize: 10, color: muted },
  adminContent: { padding: 18, paddingBottom: 38, maxWidth: 760, width: '100%', alignSelf: 'center' }, headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 7, marginBottom: 18 }, heading: { color: ink, fontFamily: 'Georgia', fontSize: 28, marginTop: 4 }, ownerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20, backgroundColor: '#eef5ee' }, onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#648d6b' }, ownerBadgeText: { color: '#587460', fontSize: 8, letterSpacing: 1, fontWeight: '800' },
  navRail: { gap: 8, paddingBottom: 16 }, navChip: { height: 39, paddingHorizontal: 13, borderRadius: 21, borderWidth: 1, borderColor: '#eadeda', backgroundColor: '#fffefd', flexDirection: 'row', alignItems: 'center', gap: 7 }, navChipActive: { backgroundColor: wine, borderColor: wine }, navChipText: { color: ink, fontSize: 10, fontWeight: '700' }, navChipTextActive: { color: '#fff' },
  noticeBox: { minHeight: 43, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#eff6ef', flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 12 }, noticeBoxError: { backgroundColor: '#fff0ef' }, noticeBoxText: { flex: 1, color: ink, fontSize: 10, lineHeight: 15 },
  hero: { minHeight: 184, borderRadius: 20, backgroundColor: wine, padding: 22, overflow: 'hidden', justifyContent: 'center', marginBottom: 13 }, heroKicker: { color: '#efd4c7', fontSize: 8, letterSpacing: 1.7, fontWeight: '800' }, heroTitle: { color: '#fffaf5', fontFamily: 'Georgia', fontSize: 25, maxWidth: '78%', marginTop: 9 }, heroText: { color: '#f3ddd6', fontSize: 11, lineHeight: 17, maxWidth: '76%', marginTop: 8 }, heroGem: { position: 'absolute', right: 19, top: 50, opacity: .7, transform: [{ rotate: '-12deg' }] },
  stats: { flexDirection: 'row', gap: 9, marginBottom: 13 }, stat: { flex: 1, minHeight: 88, padding: 12, backgroundColor: '#fffefd', borderRadius: 15, borderWidth: 1, borderColor: '#efe7e3', justifyContent: 'space-between' }, statLabel: { color: muted, fontSize: 9 }, statValue: { color: ink, fontFamily: 'Georgia', fontSize: 25 },
  panel: { backgroundColor: '#fffefd', borderRadius: 18, borderWidth: 1, borderColor: '#eee5e1', padding: 17, marginBottom: 13, elevation: 1, shadowColor: '#402327', shadowOpacity: .04, shadowRadius: 7, shadowOffset: { width: 0, height: 2 } }, panelHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, panelTitle: { color: ink, fontFamily: 'Georgia', fontSize: 21, marginTop: 5 }, countPill: { minWidth: 34, height: 34, paddingHorizontal: 8, textAlign: 'center', textAlignVertical: 'center', overflow: 'hidden', borderRadius: 17, backgroundColor: '#f8edeb', color: wine, fontSize: 12, fontWeight: '800' }, adminFootnote: { color: muted, fontSize: 10, textAlign: 'center', marginTop: 5 },
  productRow: { minHeight: 65, flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderColor: '#f1eae7' }, productGlyph: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#f8edeb', alignItems: 'center', justifyContent: 'center' }, rowCopy: { flex: 1, minWidth: 0 }, rowTitle: { color: ink, fontSize: 12, fontWeight: '700' }, rowSub: { color: muted, fontSize: 9, marginTop: 4 }, statusPill: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 14 }, statusLive: { backgroundColor: '#edf5ee' }, statusDraft: { backgroundColor: '#f8f1e6' }, statusText: { color: '#866a42', fontSize: 9, fontWeight: '700' }, statusTextLive: { color: '#53755b' },
  addCategoryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 9 }, addButton: { width: 46, height: 46, borderRadius: 13, backgroundColor: wine, alignItems: 'center', justifyContent: 'center' }, categoryRow: { minHeight: 66, borderTopWidth: 1, borderColor: '#f1eae7', flexDirection: 'row', alignItems: 'center', gap: 3 }, iconButton: { width: 34, height: 38, alignItems: 'center', justifyContent: 'center' }, editCategory: { flex: 1, paddingVertical: 11 }, inlineActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  csvHelp: { backgroundColor: '#faf4f1', borderRadius: 13, padding: 13, marginVertical: 12 }, csvHelpTitle: { color: ink, fontSize: 11, fontWeight: '800', marginBottom: 5 }, csvHelpText: { color: muted, fontSize: 10, lineHeight: 16, marginTop: 3 }, previewTitle: { color: ink, fontSize: 11, fontWeight: '800', marginTop: 16, marginBottom: 5 }, previewRow: { paddingVertical: 9, borderBottomWidth: 1, borderColor: '#f0e9e6' }, previewSku: { color: wine, fontSize: 8, fontWeight: '800' }, previewName: { color: ink, fontSize: 11, fontWeight: '700', marginTop: 3 }, previewMeta: { color: muted, fontSize: 9, marginTop: 3 }, importReport: { color: ink, fontSize: 10, lineHeight: 16, marginTop: 12, padding: 11, backgroundColor: '#f8f3ef', borderRadius: 10 },
});
