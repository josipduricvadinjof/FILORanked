import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatirajSate } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebaseConfig';

type KorisnikRang = {
  uid: string;
  ime: string;
  nadimak: string;
  ukupnoSekundi: number;
  dnevnoSekundi: number;
  tjednoSekundi: number;
  mjesecnoSekundi: number;
};

const medalje = ['🥇', '🥈', '🥉'];

export default function RangListaScreen() {
  const [aktivan, setAktivan] = useState('tjedno');
  const [korisnici, setKorisnici] = useState<KorisnikRang[]>([]);
  const [ucitavanje, setUcitavanje] = useState(true);
  const { korisnik: authKorisnik } = useAuth();

  useEffect(() => {
    const q = query(
      collection(db, 'korisnici'),
      orderBy('ukupnoSekundi', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista: KorisnikRang[] = snapshot.docs.map(doc => ({
        uid: doc.id,
        ime: doc.data().ime || 'Nepoznat',
        nadimak: doc.data().nadimak || '',
        ukupnoSekundi: doc.data().ukupnoSekundi || 0,
        dnevnoSekundi: doc.data().dnevnoSekundi || 0,
        tjednoSekundi: doc.data().tjednoSekundi || 0,
        mjesecnoSekundi: doc.data().mjesecnoSekundi || 0,
      }));
      setKorisnici(lista);
      setUcitavanje(false);
    });

    return unsubscribe;
  }, []);

  function getSekunde(k: KorisnikRang): number {
    if (aktivan === 'dnevno') return k.dnevnoSekundi;
    if (aktivan === 'tjedno') return k.tjednoSekundi;
    if (aktivan === 'mjesecno') return k.mjesecnoSekundi;
    return k.ukupnoSekundi;
  }

  const sortirani = [...korisnici].sort((a, b) => getSekunde(b) - getSekunde(a));

  return (
    <View style={styles.container}>
      <Text style={styles.naslov}>🏆 Rang lista</Text>

      <View style={styles.tabovi}>
        {['dnevno', 'tjedno', 'mjesecno', 'ukupno'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, aktivan === tab && styles.tabAktivan]}
            onPress={() => setAktivan(tab)}
          >
            <Text style={[styles.tabTekst, aktivan === tab && styles.tabTekstAktivan]}>
              {tab === 'dnevno' ? 'Danas' : tab === 'tjedno' ? 'Tjedno' : tab === 'mjesecno' ? 'Mjesečno' : 'Ukupno'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {ucitavanje ? (
        <View style={styles.sredina}>
          <Text style={styles.sredina_tekst}>Učitavanje...</Text>
        </View>
      ) : sortirani.length === 0 ? (
        <View style={styles.sredina}>
          <Text style={styles.sredina_tekst}>Još nema korisnika. Budi prvi! 🚀</Text>
        </View>
      ) : (
        <ScrollView>
          {sortirani.map((k, index) => {
            const jaJa = k.uid === authKorisnik?.uid;
            const sekunde = getSekunde(k);
            if (sekunde === 0 && aktivan !== 'ukupno') return null;
            return (
              <View key={k.uid} style={[styles.red, jaJa && styles.redAktivan]}>
                <Text style={styles.medal}>
                  {index < 3 ? medalje[index] : `${index + 1}`}
                </Text>
                <View style={[styles.avatar, jaJa && styles.avatarAktivan]}>
                  <Text style={[styles.avatarTekst, jaJa && styles.avatarTekstAktivan]}>
                    {k.ime.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.infoKolona}>
                  <Text style={[styles.ime, jaJa && styles.imeAktivan]}>
                    {k.ime} {jaJa && '(ti)'}
                  </Text>
                  <Text style={styles.nadimak}>{k.nadimak}</Text>
                </View>
                <Text style={styles.sati}>{formatirajSate(sekunde)}</Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2EDE4', padding: 20, paddingTop: 60 },
  naslov: { fontSize: 28, fontWeight: 'bold', color: '#2C1810', marginBottom: 16 },
  tabovi: {
    flexDirection: 'row', backgroundColor: '#E8E0D5',
    borderRadius: 10, padding: 4, marginBottom: 16, gap: 4,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabAktivan: { backgroundColor: '#6B2737' },
  tabTekst: { fontSize: 11, color: '#8B7355', fontWeight: '500' },
  tabTekstAktivan: { color: '#F2EDE4' },
  sredina: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sredina_tekst: { fontSize: 15, color: '#8B7355' },
  red: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, padding: 14, marginBottom: 10, gap: 12,
    borderWidth: 0.5, borderColor: '#D9CFC4',
  },
  redAktivan: { borderWidth: 2, borderColor: '#6B2737', backgroundColor: '#FDF8F5' },
  medal: { fontSize: 20, width: 30, textAlign: 'center' },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#F2EDE4', alignItems: 'center', justifyContent: 'center',
  },
  avatarAktivan: { backgroundColor: '#6B2737' },
  avatarTekst: { color: '#6B2737', fontWeight: 'bold', fontSize: 13 },
  avatarTekstAktivan: { color: '#F2EDE4' },
  infoKolona: { flex: 1 },
  ime: { fontSize: 15, fontWeight: '500', color: '#2C1810' },
  imeAktivan: { color: '#6B2737' },
  nadimak: { fontSize: 12, color: '#8B7355', marginTop: 2 },
  sati: { fontSize: 13, color: '#8B7355' },
});