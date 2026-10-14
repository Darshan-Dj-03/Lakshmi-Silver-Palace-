import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

const palette = {
  paper: '#FBF7F1',
  white: '#FFFEFC',
  ink: '#2A2020',
  muted: '#817574',
  wine: '#761C31',
  wineDark: '#4D1322',
  gold: '#D3B27A',
  blush: '#F1E4E1',
  line: '#E9E0D8',
};

const heroImage = 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=1200&q=90';
const storyImage = 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1000&q=85';
const collections = [
  { name: 'Bracelets', image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=420&q=85' },
  { name: 'Anklets', image: 'https://images.unsplash.com/photo-1635767798638-3665a1f6c1f5?auto=format&fit=crop&w=420&q=85' },
  { name: 'Bangles', image: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=420&q=85' },
  { name: 'Necklaces', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=420&q=85' },
  { name: 'Earrings', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=420&q=85' },
  { name: 'Rings', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=420&q=85' },
];

export default function App() {
  const scrollRef = useRef<ScrollView>(null);
  const categoryY = useRef(0);
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroRise = useRef(new Animated.Value(18)).current;
  const heroScale = useRef(new Animated.Value(1.035)).current;
  const categoriesOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(heroOpacity, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.spring(heroRise, { toValue: 0, tension: 48, friction: 8, useNativeDriver: true }),
        Animated.timing(heroScale, { toValue: 1, duration: 1100, useNativeDriver: true }),
      ]),
      Animated.timing(categoriesOpacity, { toValue: 1, duration: 480, useNativeDriver: true }),
    ]).start();
  }, [categoriesOpacity, heroOpacity, heroRise, heroScale]);

  const scrollToCategories = () => scrollRef.current?.scrollTo({ y: Math.max(categoryY.current - 16, 0), animated: true });
  const openWhatsApp = () => Linking.openURL('https://wa.me/message/55KV75D2E2BSB1');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.paper} />
      <View style={styles.app}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <Image source={require('./assets/brand-mark.png')} style={styles.brandMark} resizeMode="cover" />
            <View>
              <Text style={styles.brandName}>LAKSHMI <Text style={styles.brandAccent}>SILVER</Text></Text>
              <Text style={styles.brandSub}>PALACE  ·  EST. 1998</Text>
            </View>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Browse collections" onPress={scrollToCategories} hitSlop={10} style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}>
            <Feather name="menu" size={23} color={palette.ink} />
          </Pressable>
        </View>

        <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Animated.View style={{ opacity: heroOpacity, transform: [{ translateY: heroRise }] }}>
            <View style={styles.heroImage}>
              <Animated.Image source={{ uri: heroImage }} style={[styles.heroFill, { transform: [{ scale: heroScale }] }]} resizeMode="cover" />
              <LinearGradient colors={['rgba(57,17,27,0.88)', 'rgba(75,24,35,0.48)', 'rgba(45,19,22,0.08)']} start={{ x: 0, y: 0.7 }} end={{ x: 1, y: 0.25 }} style={styles.heroShade} />
              <View style={styles.heroFrame} />
              <View style={styles.heroCopy}>
                <View style={styles.eyebrowRow}><View style={styles.eyebrowLine} /><Text style={styles.eyebrow}>THE SILVER EDIT</Text></View>
                <Text style={styles.heroTitle}>A little silver.{ '\n' }A lasting story.</Text>
                <Text style={styles.heroDescription}>Thoughtfully chosen pieces, made to be kept close.</Text>
                <Pressable onPress={scrollToCategories} style={({ pressed }) => [styles.heroButton, pressed && styles.buttonPressed]}>
                  <Text style={styles.heroButtonText}>EXPLORE COLLECTIONS</Text>
                  <Feather name="arrow-up-right" size={16} color={palette.wineDark} />
                </Pressable>
              </View>
              <View style={styles.heroSeal}>
                <Feather name="sun" size={17} color={palette.gold} />
                <Text style={styles.sealText}>MADE TO{ '\n' }TREASURE</Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View
            onLayout={event => { categoryY.current = event.nativeEvent.layout.y; }}
            style={[styles.categorySection, { opacity: categoriesOpacity }]}
          >
            <View style={styles.sectionHeading}>
              <View>
                <Text style={styles.sectionEyebrow}>FIND YOUR FAVOURITE</Text>
                <Text style={styles.sectionTitle}>Shop by category</Text>
              </View>
              <View style={styles.seeAll}>
                <Text style={styles.seeAllText}>06 COLLECTIONS</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRail}>
              {collections.map((category, index) => (
                <View key={category.name} style={styles.categoryItem}>
                  <View style={[styles.categoryImageWrap, index % 2 === 1 && styles.categoryImageAlt]}>
                    <Image source={{ uri: category.image }} style={styles.categoryImage} resizeMode="cover" />
                    <View style={styles.categoryIndex}><Text style={styles.categoryIndexText}>{String(index + 1).padStart(2, '0')}</Text></View>
                  </View>
                  <Text style={styles.categoryLabel} numberOfLines={1}>{category.name}</Text>
                </View>
              ))}
            </ScrollView>
          </Animated.View>

          <View style={styles.noteCard}>
            <View style={styles.noteIcon}><Feather name="feather" size={18} color={palette.wine} /></View>
            <View style={styles.noteCopy}>
              <Text style={styles.noteEyebrow}>A NOTE FROM THE HOUSE</Text>
              <Text style={styles.noteTitle}>For the moments that stay with you.</Text>
            </View>
            <Feather name="arrow-up-right" size={17} color={palette.wine} />
          </View>

          <View style={styles.editorialCard}>
            <Image source={{ uri: storyImage }} style={styles.editorialImage} resizeMode="cover" />
            <LinearGradient colors={['rgba(32,22,23,0.02)', 'rgba(32,22,23,0.62)']} style={styles.editorialShade} />
            <View style={styles.editorialCopy}>
              <Text style={styles.editorialEyebrow}>THE EVERYDAY HEIRLOOM</Text>
              <Text style={styles.editorialTitle}>Elegance, in{ '\n' }every detail.</Text>
            </View>
          </View>
          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <Pressable style={styles.bottomItem} onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}>
            <Feather name="home" size={20} color={palette.wine} /><Text style={styles.bottomActive}>Home</Text>
          </Pressable>
          <Pressable style={styles.bottomItem} onPress={scrollToCategories}>
            <Feather name="grid" size={20} color={palette.muted} /><Text style={styles.bottomLabel}>Collections</Text>
          </Pressable>
          <Pressable style={styles.bottomItem} onPress={openWhatsApp}>
            <Feather name="message-circle" size={20} color={palette.muted} /><Text style={styles.bottomLabel}>Contact</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.paper },
  app: { flex: 1, backgroundColor: palette.paper },
  header: { height: 70, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: palette.paper, borderBottomWidth: 1, borderBottomColor: '#EDE5DD' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { width: 42, height: 42, borderRadius: 21, backgroundColor: palette.white },
  brandName: { color: palette.ink, fontSize: 13, fontWeight: '800', letterSpacing: 1.15 },
  brandAccent: { color: palette.wine },
  brandSub: { color: palette.muted, fontSize: 8, letterSpacing: 2.25, marginTop: 3, fontWeight: '600' },
  headerAction: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F2EAE3', alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
  scrollContent: { paddingTop: 17, paddingBottom: 8 },
  heroImage: { height: 365, marginHorizontal: 17, overflow: 'hidden', borderRadius: 25, justifyContent: 'flex-end', backgroundColor: palette.wineDark },
  heroFill: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  heroShade: { ...StyleSheet.absoluteFill },
  heroFrame: { position: 'absolute', top: 12, left: 12, right: 12, bottom: 12, borderWidth: 1, borderColor: 'rgba(237,215,174,0.45)', borderRadius: 17 },
  heroCopy: { paddingHorizontal: 25, paddingBottom: 29, paddingTop: 24, maxWidth: 340 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 14 },
  eyebrowLine: { width: 24, height: 1, backgroundColor: palette.gold },
  eyebrow: { color: '#E8D7B8', fontSize: 9, letterSpacing: 2.3, fontWeight: '700' },
  heroTitle: { color: '#FFF9F0', fontFamily: 'Georgia', fontSize: 38, lineHeight: 43, letterSpacing: -0.8 },
  heroDescription: { color: '#F2E5D9', fontSize: 12, lineHeight: 19, marginTop: 10, maxWidth: 235 },
  heroButton: { alignSelf: 'flex-start', minHeight: 42, paddingHorizontal: 15, marginTop: 19, borderRadius: 23, backgroundColor: '#F5EBD9', flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroButtonText: { color: palette.wineDark, fontSize: 9, letterSpacing: 1, fontWeight: '800' },
  buttonPressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  heroSeal: { position: 'absolute', top: 23, right: 23, width: 72, height: 72, borderRadius: 36, borderWidth: 1, borderColor: 'rgba(241,222,190,0.65)', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: 'rgba(52,22,28,0.24)' },
  sealText: { color: '#F4E5D0', fontSize: 6, letterSpacing: 1.5, lineHeight: 9, fontWeight: '700', textAlign: 'center' },
  categorySection: { marginTop: 30 },
  sectionHeading: { paddingHorizontal: 21, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 17 },
  sectionEyebrow: { color: '#9B7F64', fontSize: 8, letterSpacing: 2, fontWeight: '700', marginBottom: 5 },
  sectionTitle: { color: palette.ink, fontFamily: 'Georgia', fontSize: 23 },
  seeAll: { paddingBottom: 3 },
  seeAllText: { color: palette.wine, fontSize: 8, letterSpacing: 1.2, fontWeight: '800' },
  categoryRail: { paddingHorizontal: 17, gap: 13 },
  categoryItem: { width: 82, alignItems: 'center' },
  categoryImageWrap: { width: 78, height: 78, borderRadius: 25, backgroundColor: palette.blush, padding: 4, borderWidth: 1, borderColor: '#E6D6D1' },
  categoryImageAlt: { backgroundColor: '#E9E4D8', borderColor: '#DDD2BE' },
  categoryImage: { width: '100%', height: '100%', borderRadius: 21 },
  categoryIndex: { position: 'absolute', bottom: -5, right: -4, width: 23, height: 23, borderRadius: 12, backgroundColor: palette.wine, borderWidth: 2, borderColor: palette.paper, alignItems: 'center', justifyContent: 'center' },
  categoryIndexText: { color: '#FFF8EC', fontSize: 7, fontWeight: '700' },
  categoryLabel: { color: palette.ink, fontSize: 10, fontWeight: '600', marginTop: 10, textAlign: 'center' },
  noteCard: { marginHorizontal: 19, marginTop: 31, minHeight: 83, borderRadius: 17, paddingHorizontal: 14, backgroundColor: '#F1E8DE', flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#E8DED3' },
  noteIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FCF7EF', alignItems: 'center', justifyContent: 'center' },
  noteCopy: { flex: 1 },
  noteEyebrow: { color: '#9C8061', fontSize: 7, letterSpacing: 1.5, fontWeight: '800', marginBottom: 5 },
  noteTitle: { color: palette.ink, fontFamily: 'Georgia', fontSize: 14, lineHeight: 19 },
  editorialCard: { height: 205, marginTop: 25, marginHorizontal: 19, borderRadius: 19, overflow: 'hidden', backgroundColor: palette.wineDark, justifyContent: 'flex-end' },
  editorialImage: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  editorialShade: { ...StyleSheet.absoluteFill },
  editorialCopy: { paddingHorizontal: 20, paddingBottom: 18 },
  editorialEyebrow: { color: '#F0D9B4', fontSize: 7, letterSpacing: 1.9, fontWeight: '800', marginBottom: 6 },
  editorialTitle: { color: '#FFF9F0', fontFamily: 'Georgia', fontSize: 24, lineHeight: 27 },
  bottomSpacer: { height: 10 },
  bottomBar: { minHeight: 61, backgroundColor: palette.white, borderTopWidth: 1, borderTopColor: palette.line, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  bottomItem: { minWidth: 70, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 5 },
  bottomActive: { color: palette.wine, fontSize: 9, fontWeight: '800' },
  bottomLabel: { color: palette.muted, fontSize: 9, fontWeight: '600' },
});

