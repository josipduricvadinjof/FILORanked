import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useApp } from '../context/AppContext';

export default function OnboardingScreen() {
  const [ime, setIme] = useState('');
  const [nadimak, setNadimak] = useState('');
  const [greska, setGreska] = useState('');
  const { spremiKorisnika } = useApp();

  function handleNastavak() {
    if (ime.trim().length < 2) {
      setGreska('Ime mora imati barem 2 slova.');
      return;
    }
    if (nadimak.trim().length < 2) {
      setGreska('Nadimak mora imati barem 2 slova.');
      return;
    }
    spremiKorisnika(ime.trim(), '@' + nadimak.trim().replace('@', ''));
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.gornji}>
        <Text style={styles.emoji}>📚</Text>
        <Text style={styles.naslov}>FILO Ranked</Text>
        <Text style={styles.podnaslov}>
          Dobrodošao! Unesi svoje podatke za početak.
        </Text>
      </View>

      <View style={styles.forma}>
        <Text style={styles.label}>Ime i prezime</Text>
        <TextInput
          style={styles.input}
          placeholder="npr. Marin Horvat"
          placeholderTextColor="#B0A090"
          value={ime}
          onChangeText={t => { setIme(t); setGreska(''); }}
          autoCapitalize="words"
        />
        <Text style={styles.label}>Nadimak</Text>
        <TextInput
          style={styles.input}
          placeholder="npr. marin_h"
          placeholderTextColor="#B0A090"
          value={nadimak}
          onChangeText={t => { setNadimak(t); setGreska(''); }}
          autoCapitalize="none"
        />
        {greska !== '' && <Text style={styles.greska}>{greska}</Text>}
        <TouchableOpacity
          style={[styles.gumb, (ime.length < 2 || nadimak.length < 2) && styles.gumbDisabled]}
          onPress={handleNastavak}
          disabled={ime.length < 2 || nadimak.length < 2}
        >
          <Text style={styles.gumbTekst}>Počni koristiti FILO Ranked →</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>Tvoji podaci se čuvaju samo na ovom uređaju.</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2EDE4', padding: 28, justifyContent: 'center' },
  gornji: { alignItems: 'center', marginBottom: 40 },
  emoji: { fontSize: 56, marginBottom: 12 },
  naslov: { fontSize: 32, fontWeight: 'bold', color: '#2C1810', marginBottom: 8 },
  podnaslov: { fontSize: 15, color: '#8B7355', textAlign: 'center', lineHeight: 22 },
  forma: { marginBottom: 24 },
  label: { fontSize: 13, color: '#8B7355', marginBottom: 6, fontWeight: '500' },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 16, fontSize: 15, color: '#2C1810', borderWidth: 0.5, borderColor: '#D9CFC4', marginBottom: 16 },
  greska: { color: '#6B2737', fontSize: 13, marginBottom: 12 },
  gumb: { backgroundColor: '#2C1810', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 8 },
  gumbDisabled: { opacity: 0.4 },
  gumbTekst: { color: '#F2EDE4', fontSize: 16, fontWeight: 'bold' },
  footer: { fontSize: 12, color: '#B0A090', textAlign: 'center' },
});