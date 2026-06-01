import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebaseConfig';

export default function CheckoutScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<'provjera' | 'login' | 'cekanje' | 'uspjeh' | 'nijePrijavljen'>('provjera');
  const [email, setEmail] = useState('');
  const [lozinka, setLozinka] = useState('');
  const [greska, setGreska] = useState('');
  const [ucitavanje, setUcitavanje] = useState(false);

  useEffect(() => {
    provjeriAuth();
  }, []);

  async function provjeriAuth() {
    let pokusaji = 0;
    const interval = setInterval(async () => {
      pokusaji++;
      const user = auth.currentUser;

      if (user) {
        clearInterval(interval);
        await napraviCheckout(user.uid);
        return;
      }

      if (pokusaji >= 10) {
        clearInterval(interval);
        setStatus('login');
      }
    }, 500);
  }

  async function napraviCheckout(uid: string) {
    setStatus('cekanje');
    try {
      const ref = doc(db, 'korisnici', uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        setStatus('login');
        return;
      }

      const data = snap.data();
      const aktivan = data.aktivnaSesija === true;
      const vrijemeCheckin = data.vrijemeCheckin;

      if (!aktivan || !vrijemeCheckin) {
        setStatus('nijePrijavljen');
        setTimeout(() => router.replace('/(tabs)'), 2500);
        return;
      }

      const pocetak = new Date(vrijemeCheckin);
      const kraj = new Date();
      const trajanje = Math.floor((kraj.getTime() - pocetak.getTime()) / 1000);

      const novaSesija = {
        id: Date.now(),
        datum: kraj.toDateString(),
        trajanje,
      };

      const stareSesije = data.sesije || [];

      await setDoc(ref, {
        aktivnaSesija: false,
        vrijemeCheckin: null,
        ukupnoSekundi: (data.ukupnoSekundi || 0) + trajanje,
        dnevnoSekundi: (data.dnevnoSekundi || 0) + trajanje,
        tjednoSekundi: (data.tjednoSekundi || 0) + trajanje,
        mjesecnoSekundi: (data.mjesecnoSekundi || 0) + trajanje,
        sesije: [novaSesija, ...stareSesije],
        streak: data.zadnjiPosjet === kraj.toDateString()
          ? (data.streak || 0)
          : (data.streak || 0) + 1,
        zadnjiPosjet: kraj.toDateString(),
      }, { merge: true });

      setStatus('uspjeh');
      setTimeout(() => router.replace('/(tabs)'), 2500);

    } catch (e) {
      console.log('Greška:', e);
      setStatus('login');
    }
  }

  async function handlePrijava() {
    if (!email || !lozinka) {
      setGreska('Unesite email i lozinku.');
      return;
    }
    setUcitavanje(true);
    setGreska('');
    try {
      const { user } = await signInWithEmailAndPassword(auth, email.trim(), lozinka);
      await napraviCheckout(user.uid);
    } catch (e: any) {
      setGreska('Pogrešan email ili lozinka.');
      setUcitavanje(false);
    }
  }

  if (status === 'provjera') {
    return (
      <View style={styles.container}>
        <Text style={styles.emoji}>⏳</Text>
        <Text style={styles.tekst}>Provjera prijave...</Text>
      </View>
    );
  }

  if (status === 'login') {
    return (
      <View style={styles.container}>
        <Text style={styles.emoji}>📚</Text>
        <Text style={styles.naslov}>FILO Ranked</Text>
        <Text style={styles.podnaslov}>Prijavi se za check-out iz knjižnice</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#B0A090"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Lozinka"
          placeholderTextColor="#B0A090"
          value={lozinka}
          onChangeText={setLozinka}
          secureTextEntry
        />

        {greska !== '' && <Text style={styles.greska}>{greska}</Text>}

        <TouchableOpacity
          style={[styles.gumb, ucitavanje && { opacity: 0.5 }]}
          onPress={handlePrijava}
          disabled={ucitavanje}
        >
          <Text style={styles.gumbTekst}>
            {ucitavanje ? 'Čekaj...' : '👋 Prijavi se i check-out'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registracijaGumb}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.registracijaTekst}>Nemaš račun? Registriraj se →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'cekanje') {
    return (
      <View style={styles.container}>
        <Text style={styles.emoji}>⏳</Text>
        <Text style={styles.tekst}>Check-out u tijeku...</Text>
      </View>
    );
  }

  if (status === 'uspjeh') {
    return (
      <View style={styles.container}>
        <Text style={styles.emoji}>👋</Text>
        <Text style={styles.naslov}>Check-out uspješan!</Text>
        <Text style={styles.podnaslov}>Sesija završena. Vidimo se sutra!</Text>
        <Text style={styles.info}>Preusmjeravamo te na početnu...</Text>
      </View>
    );
  }

  if (status === 'nijePrijavljen') {
    return (
      <View style={styles.container}>
        <Text style={styles.emoji}>ℹ️</Text>
        <Text style={styles.naslov}>Nisi bio prijavljen!</Text>
        <Text style={styles.podnaslov}>Skeniraj ulazni QR kod pri dolasku.</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2EDE4', alignItems: 'center', justifyContent: 'center', padding: 28 },
  emoji: { fontSize: 56, marginBottom: 12 },
  naslov: { fontSize: 26, fontWeight: 'bold', color: '#2C1810', marginBottom: 8, textAlign: 'center' },
  podnaslov: { fontSize: 15, color: '#8B7355', textAlign: 'center', marginBottom: 24 },
  info: { fontSize: 13, color: '#8B7355', marginTop: 8 },
  tekst: { fontSize: 15, color: '#8B7355' },
  input: {
    width: '100%', backgroundColor: '#fff', borderRadius: 12,
    padding: 16, fontSize: 15, color: '#2C1810',
    borderWidth: 0.5, borderColor: '#D9CFC4', marginBottom: 12,
  },
  greska: { color: '#6B2737', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  gumb: {
    width: '100%', backgroundColor: '#2C1810', borderRadius: 14,
    padding: 18, alignItems: 'center', marginTop: 8,
  },
  gumbTekst: { color: '#F2EDE4', fontSize: 16, fontWeight: 'bold' },
  registracijaGumb: { marginTop: 16 },
  registracijaTekst: { color: '#6B2737', fontSize: 14, fontWeight: '500' },
});