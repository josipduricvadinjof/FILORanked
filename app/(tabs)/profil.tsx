import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { formatirajSate, useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

const achievementi = [
  { naziv: '🌅 Ranoranioc', opis: 'Dođi prije 8h', uvjet: (s: number) => s > 0 },
  { naziv: '📚 10 sati', opis: 'Provedi 10h u knjižnici', uvjet: (s: number) => s >= 36000 },
  { naziv: '📖 50 sati', opis: 'Provedi 50h u knjižnici', uvjet: (s: number) => s >= 180000 },
  { naziv: '🏛 100 sati', opis: 'Provedi 100h u knjižnici', uvjet: (s: number) => s >= 360000 },
  { naziv: '👑 FILO legenda', opis: 'Provedi 200h u knjižnici', uvjet: (s: number) => s >= 720000 },
  { naziv: '🔥 Tjedan streak', opis: '7 dana zaredom', uvjet: (_: number, streak: number) => streak >= 7 },
  { naziv: '💪 Mjesec streak', opis: '30 dana zaredom', uvjet: (_: number, streak: number) => streak >= 30 },
];

function Level(sekunde: number): string {
  if (sekunde >= 720000) return '👑 FILO legenda';
  if (sekunde >= 360000) return '🏛 Veteran';
  if (sekunde >= 180000) return '⭐ Akademik';
  if (sekunde >= 36000) return '📖 Čitač';
  return '🌱 Početnik';
}

function formatirajDatum(datumStr: string): string {
  const d = new Date(datumStr);
  return d.toLocaleDateString('hr-HR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export default function ProfilScreen() {
  const { korisnik, azurirajProfil } = useApp();
  const { odjava } = useAuth();
  const level = Level(korisnik.ukupnoSekundi);
  const osvojeni = achievementi.filter(a => a.uvjet(korisnik.ukupnoSekundi, korisnik.streak));
  const neosvojeni = achievementi.filter(a => !a.uvjet(korisnik.ukupnoSekundi, korisnik.streak));
  const postotak = Math.min((korisnik.ukupnoSekundi / 720000) * 100, 100);

  const [modalVidljiv, setModalVidljiv] = useState(false);
  const [novoIme, setNovoIme] = useState(korisnik.ime);
  const [noviNadimak, setNoviNadimak] = useState(korisnik.nadimak);
  const [sprema, setSprema] = useState(false);
  const [privremenaSlika, setPrivremenaSlika] = useState<string | null>(null);
  const [privremenaBase64, setPrivremenaBase64] = useState<string | null>(null);

  const prikazanaSlika = privremenaSlika
    ? privremenaSlika
    : korisnik.slika
    ? `data:image/jpeg;base64,${korisnik.slika}`
    : null;

  async function odaberiSliku() {
    const dozvola = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!dozvola.granted) {
      Alert.alert('Nema dozvole', 'Trebamo pristup galeriji za promjenu slike.');
      return;
    }
    const rezultat = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.1,
      base64: true,
    });
    if (!rezultat.canceled && rezultat.assets[0].base64) {
      setPrivremenaSlika(rezultat.assets[0].uri);
      setPrivremenaBase64(rezultat.assets[0].base64);
    }
  }

  async function handleSpremi() {
    if (novoIme.trim().length < 2) {
      Alert.alert('Greška', 'Ime mora imati barem 2 slova.');
      return;
    }
    setSprema(true);
    try {
      await azurirajProfil(
        novoIme.trim(),
        noviNadimak.trim(),
        privremenaBase64 ?? undefined
      );
      setPrivremenaSlika(null);
      setPrivremenaBase64(null);
      setModalVidljiv(false);
    } catch (e) {
      Alert.alert('Greška', 'Nije moguće spremiti. Pokušaj ponovo.');
    }
    setSprema(false);
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.naslov}>👤 Profil</Text>

      <View style={styles.kartica}>
        <TouchableOpacity onPress={() => {
  setNovoIme(korisnik.ime);
  setNoviNadimak(korisnik.nadimak);
  setPrivremenaSlika(null);
  setPrivremenaBase64(null);
  setModalVidljiv(true);
}} style={styles.avatarWrapper}>
          {prikazanaSlika ? (
            <Image source={{ uri: prikazanaSlika }} style={styles.avatarSlika} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarTekst}>
                {korisnik.ime.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.kameraIkona}>
            <Text style={styles.kameraEmoji}>📷</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.ime}>{korisnik.ime}</Text>
        <Text style={styles.nadimak}>{korisnik.nadimak}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeTekst}>{level}</Text>
        </View>

        <TouchableOpacity
          style={styles.urediGumb}
          onPress={() => {
            setNovoIme(korisnik.ime);
            setNoviNadimak(korisnik.nadimak);
            setPrivremenaSlika(null);
            setPrivremenaBase64(null);
            setModalVidljiv(true);
          }}
        >
          <Text style={styles.urediGumbTekst}>✏️ Uredi profil</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRed}>
        <View style={styles.statKartica}>
          <Text style={styles.statBroj}>{formatirajSate(korisnik.ukupnoSekundi)}</Text>
          <Text style={styles.statLabel}>ukupno u knjižnici</Text>
        </View>
        <View style={styles.statKartica}>
          <Text style={styles.statBroj}>{korisnik.sesije.length}</Text>
          <Text style={styles.statLabel}>posjeta</Text>
        </View>
        <View style={styles.statKartica}>
          <Text style={styles.statBroj}>🔥 {korisnik.streak}</Text>
          <Text style={styles.statLabel}>streak</Text>
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
          {Math.max(0, Math.floor((720000 - korisnik.ukupnoSekundi) / 3600))}h do "FILO Legenda"
        </Text>
      </View>

      {korisnik.sesije.length > 0 && (
        <View style={styles.sekcija}>
          <Text style={styles.sekcijaNaslov}>Povijest posjeta</Text>
          {korisnik.sesije.map((s, i) => (
            <View key={s.id} style={styles.sesijaRed}>
              <View>
                <Text style={styles.sesijaDatum}>{formatirajDatum(s.datum)}</Text>
                <Text style={styles.sesijaInfo}>Posjet #{korisnik.sesije.length - i}</Text>
              </View>
              <Text style={styles.sesijaTrajanje}>{formatirajSate(s.trajanje)}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.sekcija}>
        <Text style={styles.sekcijaNaslov}>Osvojeni achievementi ({osvojeni.length})</Text>
        {osvojeni.length === 0 && (
          <Text style={styles.prazno}>Još nemaš achievementa — počni učiti! 📚</Text>
        )}
        {osvojeni.map(a => (
          <View key={a.naziv} style={styles.achievementRed}>
            <View>
              <Text style={styles.achievementNaziv}>{a.naziv}</Text>
              <Text style={styles.achievementOpis}>{a.opis}</Text>
            </View>
            <Text style={styles.checkmark}>✅</Text>
          </View>
        ))}
      </View>

      <View style={styles.sekcija}>
        <Text style={styles.sekacijaNaslovSivi}>Još nije osvojeno ({neosvojeni.length})</Text>
        {neosvojeni.map(a => (
          <View key={a.naziv} style={[styles.achievementRed, styles.achievementNeosvojen]}>
            <View>
              <Text style={[styles.achievementNaziv, { opacity: 0.4 }]}>{a.naziv}</Text>
              <Text style={[styles.achievementOpis, { opacity: 0.4 }]}>{a.opis}</Text>
            </View>
            <Text style={{ opacity: 0.3 }}>🔒</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.odjavaGumb} onPress={() => odjava()}>
        <Text style={styles.odjavaGumbTekst}>Odjavi se</Text>
      </TouchableOpacity>

      <Modal visible={modalVidljiv} animationType="slide" transparent>
        <View style={styles.modalPozadina}>
          <View style={styles.modalKartica}>
            <Text style={styles.modalNaslov}>Uredi profil</Text>

            <TouchableOpacity onPress={odaberiSliku} style={styles.modalAvatarWrapper}>
              {prikazanaSlika ? (
                <Image
                  source={{ uri: privremenaSlika || prikazanaSlika }}
                  style={styles.modalAvatarSlika}
                />
              ) : (
                <View style={styles.modalAvatar}>
                  <Text style={styles.modalAvatarTekst}>
                    {korisnik.ime.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={styles.promijeniSlikuTekst}>Tapni za promjenu slike</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Ime i prezime</Text>
            <TextInput
              style={styles.input}
              value={novoIme}
              onChangeText={setNovoIme}
              placeholder="Ime i prezime"
              placeholderTextColor="#B0A090"
              autoCapitalize="words"
            />

            <Text style={styles.label}>Nadimak</Text>
            <TextInput
              style={styles.input}
              value={noviNadimak}
              onChangeText={setNoviNadimak}
              placeholder="@nadimak"
              placeholderTextColor="#B0A090"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.spremiGumb, sprema && { opacity: 0.5 }]}
              onPress={handleSpremi}
              disabled={sprema}
            >
              <Text style={styles.spremiGumbTekst}>
                {sprema ? 'Spremanje...' : 'Spremi'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.odustaniGumb}
              onPress={() => setModalVidljiv(false)}
            >
              <Text style={styles.odustaniGumbTekst}>Odustani</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2EDE4', padding: 20, paddingTop: 60 },
  naslov: { fontSize: 28, fontWeight: 'bold', color: '#2C1810', marginBottom: 20 },
  kartica: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24,
    alignItems: 'center', marginBottom: 16,
    borderWidth: 0.5, borderColor: '#D9CFC4',
  },
  avatarWrapper: { position: 'relative', marginBottom: 4 },
  avatarSlika: { width: 80, height: 80, borderRadius: 40 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#6B2737', alignItems: 'center', justifyContent: 'center',
  },
  avatarTekst: { fontSize: 28, fontWeight: 'bold', color: '#F2EDE4' },
  kameraIkona: {
    position: 'absolute', bottom: 0, right: -4,
    backgroundColor: '#F2EDE4', borderRadius: 12, padding: 2,
  },
  kameraEmoji: { fontSize: 16 },
  ime: { fontSize: 22, fontWeight: 'bold', color: '#2C1810', marginTop: 8 },
  nadimak: { fontSize: 14, color: '#8B7355', marginTop: 2, marginBottom: 10 },
  badge: {
    backgroundColor: '#F2EDE4', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 6,
    borderWidth: 1, borderColor: '#D9CFC4', marginBottom: 12,
  },
  badgeTekst: { color: '#6B2737', fontWeight: '500', fontSize: 14 },
  urediGumb: {
    backgroundColor: '#F2EDE4', borderRadius: 10,
    paddingHorizontal: 20, paddingVertical: 8,
    borderWidth: 1, borderColor: '#D9CFC4',
  },
  urediGumbTekst: { color: '#2C1810', fontSize: 14, fontWeight: '500' },
  statsRed: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statKartica: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12,
    padding: 14, alignItems: 'center',
    borderWidth: 0.5, borderColor: '#D9CFC4',
  },
  statBroj: { fontSize: 16, fontWeight: 'bold', color: '#6B2737' },
  statLabel: { fontSize: 10, color: '#8B7355', marginTop: 4, textAlign: 'center' },
  levelKartica: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginBottom: 16, borderWidth: 0.5, borderColor: '#D9CFC4',
  },
  levelRed: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  levelNaziv: { fontSize: 14, fontWeight: '500', color: '#2C1810' },
  levelBroj: { fontSize: 13, color: '#8B7355' },
  progressBg: { height: 8, backgroundColor: '#F2EDE4', borderRadius: 4, marginBottom: 8 },
  progressFill: { height: 8, backgroundColor: '#6B2737', borderRadius: 4 },
  levelInfo: { fontSize: 12, color: '#8B7355' },
  sekcija: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginBottom: 16, borderWidth: 0.5, borderColor: '#D9CFC4',
  },
  sekcijaNaslov: { fontSize: 13, color: '#2C1810', marginBottom: 12, fontWeight: '500' },
  sekacijaNaslovSivi: { fontSize: 13, color: '#8B7355', marginBottom: 12, fontWeight: '500' },
  prazno: { fontSize: 13, color: '#8B7355', textAlign: 'center', padding: 12 },
  sesijaRed: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: '#F2EDE4',
  },
  sesijaDatum: { fontSize: 14, color: '#2C1810', fontWeight: '500' },
  sesijaInfo: { fontSize: 11, color: '#8B7355', marginTop: 2 },
  sesijaTrajanje: { fontSize: 14, color: '#6B2737', fontWeight: '500' },
  achievementRed: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: '#F2EDE4',
  },
  achievementNeosvojen: { opacity: 0.6 },
  achievementNaziv: { fontSize: 14, color: '#2C1810', fontWeight: '500' },
  achievementOpis: { fontSize: 12, color: '#8B7355', marginTop: 2 },
  checkmark: { fontSize: 18 },
  odjavaGumb: {
    backgroundColor: '#fff', borderRadius: 14, padding: 18,
    alignItems: 'center', marginBottom: 40,
    borderWidth: 1, borderColor: '#6B2737',
  },
  odjavaGumbTekst: { color: '#6B2737', fontSize: 16, fontWeight: 'bold' },
  modalPozadina: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalKartica: {
    backgroundColor: '#F2EDE4', borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 28,
  },
  modalNaslov: { fontSize: 20, fontWeight: 'bold', color: '#2C1810', marginBottom: 20 },
  modalAvatarWrapper: { alignItems: 'center', marginBottom: 20 },
  modalAvatarSlika: { width: 80, height: 80, borderRadius: 40, marginBottom: 8 },
  modalAvatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#6B2737', alignItems: 'center',
    justifyContent: 'center', marginBottom: 8,
  },
  modalAvatarTekst: { fontSize: 28, fontWeight: 'bold', color: '#F2EDE4' },
  promijeniSlikuTekst: { fontSize: 14, color: '#6B2737', fontWeight: '500' },
  label: { fontSize: 13, color: '#8B7355', marginBottom: 6, fontWeight: '500' },
  input: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    fontSize: 15, color: '#2C1810',
    borderWidth: 0.5, borderColor: '#D9CFC4', marginBottom: 16,
  },
  spremiGumb: {
    backgroundColor: '#2C1810', borderRadius: 14,
    padding: 18, alignItems: 'center', marginTop: 8,
  },
  spremiGumbTekst: { color: '#F2EDE4', fontSize: 16, fontWeight: 'bold' },
  odustaniGumb: { padding: 16, alignItems: 'center' },
  odustaniGumbTekst: { color: '#8B7355', fontSize: 15 },
});