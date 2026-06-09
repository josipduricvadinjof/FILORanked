import { useRouter } from 'expo-router';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatirajSate, formatirajVrijeme, useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebaseConfig';

function Level(sekunde: number): string {
  if (sekunde >= 1080000) return '🏠 Idi doma...';
  if (sekunde >= 900000) return '🎓 FER-ovac';
  if (sekunde >= 720000) return '👑 Legenda FILO';
  if (sekunde >= 360000) return '🏛 Veteran';
  if (sekunde >= 180000) return '⭐ Akademik';
  if (sekunde >= 72000) return '📖 Kampanjac';
  if (sekunde >= 36000) return '🏃 Rekreativac';
  if (sekunde >= 3600) return '🌱 Početnik';
  return '👶 Brucoš';
}

export default function HomeScreen() {
  const { korisnik, aktivan, sekunde } = useApp();
  const { korisnik: authKorisnik } = useAuth();
  const router = useRouter();

  const [dnevniRang, setDnevniRang] = useState<number | null>(null);
  const [tjedniRang, setTjedniRang] = useState<number | null>(null);
  const [ukupniRang, setUkupniRang] = useState<number | null>(null);

  // Animacije
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rangAnim = useRef(new Animated.Value(0)).current;

  const level = Level(korisnik.ukupnoSekundi);
  const postotak = Math.min((korisnik.ukupnoSekundi / 720000) * 100, 100);
  const doLegenda = Math.max(0, Math.floor((720000 - korisnik.ukupnoSekundi) / 3600));

  const danas = new Date().toLocaleDateString('hr-HR', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  useEffect(() => {
    // Fade in animacija pri učitavanju
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();

    // Logo blaga rotacija
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Puls animacija za streak badge
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    // Animacija ranga kad se promijeni
    Animated.sequence([
      Animated.timing(rangAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(rangAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [dnevniRang, tjedniRang, ukupniRang]);

  useEffect(() => {
    if (!authKorisnik) return;
    const q = query(collection(db, 'korisnici'), orderBy('ukupnoSekundi', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const svi = snapshot.docs.map(doc => ({
        uid: doc.id,
        dnevnoSekundi: doc.data().dnevnoSekundi || 0,
        tjednoSekundi: doc.data().tjednoSekundi || 0,
        ukupnoSekundi: doc.data().ukupnoSekundi || 0,
      }));
      const sortiranoDnevno = [...svi].sort((a, b) => b.dnevnoSekundi - a.dnevnoSekundi);
      const sortiranoTjedno = [...svi].sort((a, b) => b.tjednoSekundi - a.tjednoSekundi);
      const sortiranoUkupno = [...svi].sort((a, b) => b.ukupnoSekundi - a.ukupnoSekundi);
      const dnevniIdx = sortiranoDnevno.findIndex(k => k.uid === authKorisnik.uid);
      const tjedniIdx = sortiranoTjedno.findIndex(k => k.uid === authKorisnik.uid);
      const ukupniIdx = sortiranoUkupno.findIndex(k => k.uid === authKorisnik.uid);
      setDnevniRang(dnevniIdx >= 0 ? dnevniIdx + 1 : null);
      setTjedniRang(tjedniIdx >= 0 ? tjedniIdx + 1 : null);
      setUkupniRang(ukupniIdx >= 0 ? ukupniIdx + 1 : null);
    });
    return unsubscribe;
  }, [authKorisnik]);

  function rangTekst(rang: number | null): string {
    if (rang === null) return '-';
    return `#${rang}`;
  }

  const logoRotateInterpolate = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-5deg', '5deg'],
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.headerLijevo}>
          <Animated.Image
            source={require('../../assets/images/logo.png')}
            style={[styles.logo, { transform: [{ rotate: logoRotateInterpolate }] }]}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.pozdrav}>Bok, {korisnik.ime.split(' ')[0]}! 👋</Text>
            <Text style={styles.datum}>{danas}</Text>
          </View>
        </View>
        <Animated.View style={[styles.streakBadge, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakBroj}>{korisnik.streak}</Text>
        </Animated.View>
      </Animated.View>

      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {aktivan ? (
          <View style={styles.timerKartica}>
            <Text style={styles.timerNaslov}>⏱ Aktivna sesija</Text>
            <Text style={styles.timer}>{formatirajVrijeme(sekunde)}</Text>
            <Text style={styles.timerInfo}>📍 Knjižnica Filozofskog fakulteta</Text>
            <TouchableOpacity style={styles.timerGumb} onPress={() => router.push('/(tabs)/skeniraj')}>
              <Text style={styles.timerGumbTekst}>Skeniraj izlaz</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.ulazGumb} onPress={() => router.push('/(tabs)/skeniraj')}>
            <Text style={styles.ulazGumbIkona}>📷</Text>
            <View>
              <Text style={styles.ulazGumbNaslov}>Skeniraj QR kod</Text>
              <Text style={styles.ulazGumbOpis}>Prijavi dolazak u knjižnicu</Text>
            </View>
          </TouchableOpacity>
        )}
      </Animated.View>

      <Animated.View style={[styles.rangKartica, { opacity: fadeAnim }]}>
        <Text style={styles.rangNaslov}>Tvoj rang</Text>
        <View style={styles.rangRed}>
          <Animated.View style={[styles.rangStupac, { transform: [{ scale: rangAnim }] }]}>
            <Text style={styles.rangBroj}>{rangTekst(dnevniRang)}</Text>
            <Text style={styles.rangLabel}>danas</Text>
          </Animated.View>
          <View style={styles.rangDivider} />
          <Animated.View style={[styles.rangStupac, { transform: [{ scale: rangAnim }] }]}>
            <Text style={styles.rangBroj}>{rangTekst(tjedniRang)}</Text>
            <Text style={styles.rangLabel}>tjedno</Text>
          </Animated.View>
          <View style={styles.rangDivider} />
          <Animated.View style={[styles.rangStupac, { transform: [{ scale: rangAnim }] }]}>
            <Text style={styles.rangBroj}>{rangTekst(ukupniRang)}</Text>
            <Text style={styles.rangLabel}>ukupno</Text>
          </Animated.View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.statsRed, { opacity: fadeAnim }]}>
        <View style={styles.statKartica}>
          <Text style={styles.statBroj}>{formatirajSate(korisnik.dnevnoSekundi)}</Text>
          <Text style={styles.statLabel}>danas</Text>
        </View>
        <View style={styles.statKartica}>
          <Text style={styles.statBroj}>{formatirajSate(korisnik.tjednoSekundi)}</Text>
          <Text style={styles.statLabel}>ovaj tjedan</Text>
        </View>
        <View style={styles.statKartica}>
          <Text style={styles.statBroj}>{formatirajSate(korisnik.ukupnoSekundi)}</Text>
          <Text style={styles.statLabel}>ukupno</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.levelKartica, { opacity: fadeAnim }]}>
        <View style={styles.levelRed}>
          <Text style={styles.levelNaziv}>{level}</Text>
          <Text style={styles.levelBroj}>{Math.round(postotak)}%</Text>
        </View>
        <View style={styles.progressBg}>
          <Animated.View style={[styles.progressFill, { width: `${postotak}%` }]} />
        </View>
        <Text style={styles.levelInfo}>
          {doLegenda > 0 ? `${doLegenda}h do "Legenda FILO"` : '👑 Dostigao si najviši level!'}
        </Text>
      </Animated.View>

      <Animated.View style={[styles.brziPristup, { opacity: fadeAnim }]}>
        <Text style={styles.brziPristupNaslov}>Brzi pristup</Text>
        <View style={styles.brziPristupRed}>
          <TouchableOpacity style={styles.brziGumb} onPress={() => router.push('/(tabs)/ranklist')}>
            <Text style={styles.brziGumbIkona}>🏆</Text>
            <Text style={styles.brziGumbTekst}>Rang lista</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.brziGumb} onPress={() => router.push('/(tabs)/profil')}>
            <Text style={styles.brziGumbIkona}>🏅</Text>
            <Text style={styles.brziGumbTekst}>Achievementi</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.brziGumb} onPress={() => router.push('/(tabs)/profil')}>
            <Text style={styles.brziGumbIkona}>📊</Text>
            <Text style={styles.brziGumbTekst}>Statistike</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {korisnik.sesije.length > 0 && (
        <Animated.View style={[styles.zadnjaSesija, { opacity: fadeAnim }]}>
          <Text style={styles.zadnjaSesijaNaslov}>Zadnja sesija</Text>
          <View style={styles.zadnjaSesijaRed}>
            <Text style={styles.zadnjaSesijaDatum}>{korisnik.sesije[0].datum}</Text>
            <Text style={styles.zadnjaSesijaTrajanje}>{formatirajSate(korisnik.sesije[0].trajanje)}</Text>
          </View>
        </Animated.View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2EDE4', padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerLijevo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 40, height: 40, opacity: 0.85 },
  pozdrav: { fontSize: 22, fontWeight: 'bold', color: '#2C1810' },
  datum: { fontSize: 12, color: '#8B7355', marginTop: 2 },
  streakBadge: { backgroundColor: '#6B2737', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
  streakEmoji: { fontSize: 16 },
  streakBroj: { fontSize: 18, fontWeight: 'bold', color: '#F2EDE4' },
  timerKartica: { backgroundColor: '#2C1810', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16 },
  timerNaslov: { fontSize: 13, color: '#8B7355', marginBottom: 8 },
  timer: { fontSize: 48, fontWeight: 'bold', color: '#F2EDE4', letterSpacing: 2 },
  timerInfo: { fontSize: 13, color: '#8B7355', marginTop: 8, marginBottom: 16 },
  timerGumb: { backgroundColor: '#6B2737', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  timerGumbTekst: { color: '#F2EDE4', fontSize: 14, fontWeight: '500' },
  ulazGumb: { backgroundColor: '#6B2737', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  ulazGumbIkona: { fontSize: 32 },
  ulazGumbNaslov: { fontSize: 18, fontWeight: 'bold', color: '#F2EDE4' },
  ulazGumbOpis: { fontSize: 13, color: '#D4A5A5', marginTop: 2 },
  rangKartica: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 0.5, borderColor: '#D9CFC4' },
  rangNaslov: { fontSize: 13, color: '#8B7355', marginBottom: 12, fontWeight: '500' },
  rangRed: { flexDirection: 'row', alignItems: 'center' },
  rangStupac: { flex: 1, alignItems: 'center' },
  rangBroj: { fontSize: 28, fontWeight: 'bold', color: '#6B2737' },
  rangLabel: { fontSize: 11, color: '#8B7355', marginTop: 4 },
  rangDivider: { width: 1, height: 40, backgroundColor: '#D9CFC4' },
  statsRed: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statKartica: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 0.5, borderColor: '#D9CFC4' },
  statBroj: { fontSize: 15, fontWeight: 'bold', color: '#6B2737' },
  statLabel: { fontSize: 10, color: '#8B7355', marginTop: 4, textAlign: 'center' },
  levelKartica: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 0.5, borderColor: '#D9CFC4' },
  levelRed: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  levelNaziv: { fontSize: 14, fontWeight: '500', color: '#2C1810' },
  levelBroj: { fontSize: 13, color: '#8B7355' },
  progressBg: { height: 8, backgroundColor: '#F2EDE4', borderRadius: 4, marginBottom: 8 },
  progressFill: { height: 8, backgroundColor: '#6B2737', borderRadius: 4 },
  levelInfo: { fontSize: 12, color: '#8B7355' },
  brziPristup: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 0.5, borderColor: '#D9CFC4' },
  brziPristupNaslov: { fontSize: 13, color: '#8B7355', marginBottom: 12, fontWeight: '500' },
  brziPristupRed: { flexDirection: 'row', gap: 10 },
  brziGumb: { flex: 1, backgroundColor: '#F2EDE4', borderRadius: 10, padding: 12, alignItems: 'center', gap: 6 },
  brziGumbIkona: { fontSize: 24 },
  brziGumbTekst: { fontSize: 11, color: '#2C1810', fontWeight: '500', textAlign: 'center' },
  zadnjaSesija: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 90, borderWidth: 0.5, borderColor: '#D9CFC4' },
  zadnjaSesijaNaslov: { fontSize: 13, color: '#8B7355', marginBottom: 10, fontWeight: '500' },
  zadnjaSesijaRed: { flexDirection: 'row', justifyContent: 'space-between' },
  zadnjaSesijaDatum: { fontSize: 14, color: '#2C1810' },
  zadnjaSesijaTrajanje: { fontSize: 14, color: '#6B2737', fontWeight: '500' },
});