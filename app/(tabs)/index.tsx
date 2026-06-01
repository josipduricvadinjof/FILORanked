import { useRouter } from 'expo-router';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatirajSate, formatirajVrijeme, useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebaseConfig';

function Level(sekunde: number): string {
  if (sekunde >= 720000) return '👑 Legenda FILO';
  if (sekunde >= 360000) return '🏛 Veteran';
  if (sekunde >= 180000) return '⭐ Akademik';
  if (sekunde >= 36000) return '📖 Čitač';
  return '🌱 Početnik';
}

export default function HomeScreen() {
  const { korisnik, aktivan, sekunde } = useApp();
  const { korisnik: authKorisnik } = useAuth();
  const router = useRouter();

  const [dnevniRang, setDnevniRang] = useState<number | null>(null);
  const [tjedniRang, setTjedniRang] = useState<number | null>(null);
  const [ukupniRang, setUkupniRang] = useState<number | null>(null);

  const level = Level(korisnik.ukupnoSekundi);
  const postotak = Math.min((korisnik.ukupnoSekundi / 720000) * 100, 100);
  const doLegenda = Math.max(0, Math.floor((720000 - korisnik.ukupnoSekundi) / 3600));

  const danas = new Date().toLocaleDateString('hr-HR', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.pozdrav}>Bok, {korisnik.ime.split(' ')[0]}! 👋</Text>
          <Text style={styles.datum}>{danas}</Text>
        </View>
        <View style={styles.streakBadge}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakBroj}>{korisnik.streak}</Text>
        </View>
      </View>

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

      <View style={styles.rangKartica}>
        <Text style={styles.rangNaslov}>Tvoj rang</Text>
        <View style={styles.rangRed}>
          <View style={styles.rangStupac}>
            <Text style={styles.rangBroj}>{rangTekst(dnevniRang)}</Text>
            <Text style={styles.rangLabel}>danas</Text>
          </View>
          <View style={styles.rangDivider} />
          <View style={styles.rangStupac}>
            <Text style={styles.rangBroj}>{rangTekst(tjedniRang)}</Text>
            <Text style={styles.rangLabel}>tjedno</Text>
          </View>
          <View style={styles.rangDivider} />
          <View style={styles.rangStupac}>
            <Text style={styles.rangBroj}>{rangTekst(ukupniRang)}</Text>
            <Text style={styles.rangLabel}>ukupno</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsRed}>
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
      </View>

      <View style={styles.levelKartica}>
        <View style={styles.levelRed}>
          <Text style={styles.levelNaziv}>{level}</Text>
          <Text style={styles.levelBroj}>{Math.round(postotak)}%</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${postotak}%` }]} />
        </View>
        <Text style={styles.levelInfo}>
          {doLegenda > 0 ? `${doLegenda}h do "Legenda FILO"` : '👑 Dostigao si najviši level!'}
        </Text>
      </View>

      <View style={styles.brziPristup}>
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
      </View>

      {korisnik.sesije.length > 0 && (
        <View style={styles.zadnjaSesija}>
          <Text style={styles.zadnjaSesijaNaslov}>Zadnja sesija</Text>
          <View style={styles.zadnjaSesijaRed}>
            <Text style={styles.zadnjaSesijaDatum}>{korisnik.sesije[0].datum}</Text>
            <Text style={styles.zadnjaSesijaTrajanje}>{formatirajSate(korisnik.sesije[0].trajanje)}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2EDE4', padding: 20, paddingTop: 60, paddingBottom: 90 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  pozdrav: { fontSize: 24, fontWeight: 'bold', color: '#2C1810' },
  datum: { fontSize: 13, color: '#8B7355', marginTop: 2 },
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
  zadnjaSesija: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 40, borderWidth: 0.5, borderColor: '#D9CFC4' },
  zadnjaSesijaNaslov: { fontSize: 13, color: '#8B7355', marginBottom: 10, fontWeight: '500' },
  zadnjaSesijaRed: { flexDirection: 'row', justifyContent: 'space-between' },
  zadnjaSesijaDatum: { fontSize: 14, color: '#2C1810' },
  zadnjaSesijaTrajanje: { fontSize: 14, color: '#6B2737', fontWeight: '500' },
});