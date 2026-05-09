import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatirajSate, formatirajVrijeme, useApp } from '../../context/AppContext';

export default function HomeScreen() {
  const { korisnik, aktivan, sekunde } = useApp();
  const router = useRouter();

  const ukupnoSati = formatirajSate(korisnik.ukupnoSekundi);

  const tjednoSekundi = korisnik.sesije
    .filter(s => {
      const tjedan = new Date();
      tjedan.setDate(tjedan.getDate() - 7);
      return new Date(s.datum) >= tjedan;
    })
    .reduce((acc, s) => acc + s.trajanje, 0);

  const postotak = Math.min((korisnik.ukupnoSekundi / 720000) * 100, 100);
  const doLegenda = Math.max(0, Math.floor((720000 - korisnik.ukupnoSekundi) / 3600));

  return (
    <ScrollView style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.naslov}>NSK Ranked 📚</Text>
        <Text style={styles.podnaslov}>Nacionalna i sveučilišna knjižnica</Text>
      </View>

      {aktivan && (
        <View style={styles.timerKartica}>
          <Text style={styles.timerNaslov}>⏱ Aktivna sesija</Text>
          <Text style={styles.timer}>{formatirajVrijeme(sekunde)}</Text>
          <Text style={styles.timerInfo}>📍 NSK, Zagreb</Text>
        </View>
      )}

      <View style={styles.kartica}>
        <Text style={styles.karticeNaslov}>Tvoj rang danas</Text>
        <Text style={styles.rang}>#4</Text>
        <Text style={styles.sati}>
          {tjednoSekundi > 0
            ? formatirajSate(tjednoSekundi) + ' ovaj tjedan'
            : '0min ovaj tjedan'}
        </Text>
      </View>

      <View style={styles.statsRed}>
        <View style={styles.statKartica}>
          <Text style={styles.statBroj}>🔥 {korisnik.streak}</Text>
          <Text style={styles.statLabel}>dan streak</Text>
        </View>
        <View style={styles.statKartica}>
          <Text style={styles.statBroj}>{ukupnoSati}</Text>
          <Text style={styles.statLabel}>ukupno</Text>
        </View>
        <View style={styles.statKartica}>
          <Text style={styles.statBroj}>🏅 {korisnik.sesije.length}</Text>
          <Text style={styles.statLabel}>posjeta</Text>
        </View>
      </View>

      <View style={styles.levelKartica}>
        <View style={styles.levelRed}>
          <Text style={styles.levelNaziv}>⭐ Akademik</Text>
          <Text style={styles.levelBroj}>{ukupnoSati} / 200h</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${postotak}%` }]} />
        </View>
        <Text style={styles.levelInfo}>{doLegenda}h do razine "Legenda NSK"</Text>
      </View>

      <TouchableOpacity
        style={styles.gumb}
        onPress={() => router.push('/(tabs)/skeniraj')}
      >
        <Text style={styles.gumbTekst}>
          {aktivan ? '🟢 Trenutno si u knjižnici' : 'Skeniraj QR kod'}
        </Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2EDE4',
    padding: 20,
    paddingTop: 60,
  },
  header: { marginBottom: 24 },
  naslov: { fontSize: 28, fontWeight: 'bold', color: '#2C1810' },
  podnaslov: { fontSize: 14, color: '#8B7355', marginTop: 4 },
  timerKartica: {
    backgroundColor: '#2C1810',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  timerNaslov: { fontSize: 13, color: '#8B7355', marginBottom: 8 },
  timer: { fontSize: 42, fontWeight: 'bold', color: '#F2EDE4', letterSpacing: 2 },
  timerInfo: { fontSize: 13, color: '#8B7355', marginTop: 8 },
  kartica: {
    backgroundColor: '#6B2737',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    marginBottom: 16,
  },
  karticeNaslov: { fontSize: 13, color: '#D4A5A5', marginBottom: 8 },
  rang: { fontSize: 52, fontWeight: 'bold', color: '#F2EDE4' },
  sati: { fontSize: 13, color: '#D4A5A5', marginTop: 4 },
  statsRed: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statKartica: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#D9CFC4',
  },
  statBroj: { fontSize: 20, fontWeight: 'bold', color: '#2C1810' },
  statLabel: { fontSize: 11, color: '#8B7355', marginTop: 4 },
  levelKartica: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: '#D9CFC4',
  },
  levelRed: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  levelNaziv: { fontSize: 14, fontWeight: '500', color: '#2C1810' },
  levelBroj: { fontSize: 13, color: '#8B7355' },
  progressBg: { height: 8, backgroundColor: '#F2EDE4', borderRadius: 4, marginBottom: 8 },
  progressFill: { height: 8, backgroundColor: '#6B2737', borderRadius: 4 },
  levelInfo: { fontSize: 12, color: '#8B7355' },
  gumb: {
    backgroundColor: '#2C1810',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginBottom: 40,
  },
  gumbTekst: { color: '#F2EDE4', fontSize: 16, fontWeight: 'bold' },
});