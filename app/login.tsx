import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const [jeRegistracija, setJeRegistracija] = useState(false);
  const [ime, setIme] = useState('');
  const [nadimak, setNadimak] = useState('');
  const [email, setEmail] = useState('');
  const [lozinka, setLozinka] = useState('');
  const [zapamti, setZapamti] = useState(false);
  const [ucitavanje, setUcitavanje] = useState(false);
  const [resetModal, setResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const { prijava, registracija, resetLozinke, greska } = useAuth();

  useEffect(() => {
    ucitajSpremljene();
  }, []);

  async function ucitajSpremljene() {
    try {
      const spremljeniEmail = await SecureStore.getItemAsync('email');
      const spremljenaLozinka = await SecureStore.getItemAsync('lozinka');
      const zapamtiVrijednost = await SecureStore.getItemAsync('zapamti');
      if (zapamtiVrijednost === 'true' && spremljeniEmail && spremljenaLozinka) {
        setEmail(spremljeniEmail);
        setLozinka(spremljenaLozinka);
        setZapamti(true);
        await prijava(spremljeniEmail, spremljenaLozinka);
      }
    } catch (e) {
      console.log('Greška učitavanja:', e);
    }
  }

  async function handleSubmit() {
    setUcitavanje(true);
    try {
      if (jeRegistracija) {
        await registracija(ime.trim(), '@' + nadimak.trim().replace('@', ''), email.trim(), lozinka);
      } else {
        await prijava(email.trim(), lozinka);
        if (zapamti) {
          await SecureStore.setItemAsync('email', email.trim());
          await SecureStore.setItemAsync('lozinka', lozinka);
          await SecureStore.setItemAsync('zapamti', 'true');
        } else {
          await SecureStore.deleteItemAsync('email');
          await SecureStore.deleteItemAsync('lozinka');
          await SecureStore.setItemAsync('zapamti', 'false');
        }
      }
    } catch (e) {
      console.log('Greška:', e);
    }
    setUcitavanje(false);
  }

  async function handleReset() {
    if (!resetEmail.trim()) {
      Alert.alert('Greška', 'Unesite email adresu.');
      return;
    }
    const uspjeh = await resetLozinke(resetEmail.trim());
    if (uspjeh) {
      Alert.alert(
        '✅ Email poslan!',
        'Provjerite email inbox za link za resetiranje lozinke.',
        [{ text: 'OK', onPress: () => setResetModal(false) }]
      );
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.gornji}>
          <Text style={styles.emoji}>📚</Text>
          <Text style={styles.naslov}>NSK Ranked</Text>
          <Text style={styles.podnaslov}>
            {jeRegistracija ? 'Stvori novi račun' : 'Prijavi se u svoj račun'}
          </Text>
        </View>

        <View style={styles.forma}>
          {jeRegistracija && (
            <>
              <Text style={styles.label}>Ime i prezime</Text>
              <TextInput
                style={styles.input}
                placeholder="npr. Marin Horvat"
                placeholderTextColor="#B0A090"
                value={ime}
                onChangeText={setIme}
                autoCapitalize="words"
              />
              <Text style={styles.label}>Nadimak</Text>
              <TextInput
                style={styles.input}
                placeholder="npr. marin_h"
                placeholderTextColor="#B0A090"
                value={nadimak}
                onChangeText={setNadimak}
                autoCapitalize="none"
              />
            </>
          )}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="npr. marin@gmail.com"
            placeholderTextColor="#B0A090"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Lozinka</Text>
          <TextInput
            style={styles.input}
            placeholder="najmanje 6 znakova"
            placeholderTextColor="#B0A090"
            value={lozinka}
            onChangeText={setLozinka}
            secureTextEntry
          />

          {!jeRegistracija && (
            <>
              <View style={styles.zapamtiRed}>
                <Text style={styles.zapamtiTekst}>Zapamti me</Text>
                <Switch
                  value={zapamti}
                  onValueChange={setZapamti}
                  trackColor={{ false: '#D9CFC4', true: '#6B2737' }}
                  thumbColor={zapamti ? '#F2EDE4' : '#fff'}
                />
              </View>

              <TouchableOpacity
                style={styles.zaboravioGumb}
                onPress={() => {
                  setResetEmail(email);
                  setResetModal(true);
                }}
              >
                <Text style={styles.zaboravioTekst}>Zaboravili ste lozinku?</Text>
              </TouchableOpacity>
            </>
          )}

          {greska !== '' && (
            <Text style={styles.greska}>{greska}</Text>
          )}

          <TouchableOpacity
            style={[styles.gumb, ucitavanje && styles.gumbDisabled]}
            onPress={handleSubmit}
            disabled={ucitavanje}
          >
            <Text style={styles.gumbTekst}>
              {ucitavanje ? 'Čekaj...' : jeRegistracija ? 'Registriraj se' : 'Prijavi se'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.preklop}
            onPress={() => setJeRegistracija(!jeRegistracija)}
          >
            <Text style={styles.prekloptekst}>
              {jeRegistracija
                ? 'Već imaš račun? Prijavi se'
                : 'Nemaš račun? Registriraj se'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={resetModal} animationType="slide" transparent>
        <View style={styles.modalPozadina}>
          <View style={styles.modalKartica}>
            <Text style={styles.modalNaslov}>Resetiraj lozinku</Text>
            <Text style={styles.modalOpis}>
              Unesite email adresu i poslat ćemo vam link za resetiranje lozinke.
            </Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="npr. marin@gmail.com"
              placeholderTextColor="#B0A090"
              value={resetEmail}
              onChangeText={setResetEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TouchableOpacity style={styles.gumb} onPress={handleReset}>
              <Text style={styles.gumbTekst}>Pošalji link</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.odustaniGumb}
              onPress={() => setResetModal(false)}
            >
              <Text style={styles.odustaniTekst}>Odustani</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2EDE4' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 28 },
  gornji: { alignItems: 'center', marginBottom: 40 },
  emoji: { fontSize: 56, marginBottom: 12 },
  naslov: { fontSize: 32, fontWeight: 'bold', color: '#2C1810', marginBottom: 8 },
  podnaslov: { fontSize: 15, color: '#8B7355', textAlign: 'center' },
  forma: { marginBottom: 24 },
  label: { fontSize: 13, color: '#8B7355', marginBottom: 6, fontWeight: '500' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#2C1810',
    borderWidth: 0.5,
    borderColor: '#D9CFC4',
    marginBottom: 16,
  },
  zapamtiRed: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 0.5,
    borderColor: '#D9CFC4',
  },
  zapamtiTekst: { fontSize: 15, color: '#2C1810', fontWeight: '500' },
  zaboravioGumb: { alignItems: 'flex-end', marginBottom: 16 },
  zaboravioTekst: { fontSize: 13, color: '#6B2737', fontWeight: '500' },
  greska: { color: '#6B2737', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  gumb: {
    backgroundColor: '#2C1810',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  gumbDisabled: { opacity: 0.5 },
  gumbTekst: { color: '#F2EDE4', fontSize: 16, fontWeight: 'bold' },
  preklop: { alignItems: 'center', marginTop: 20 },
  prekloptekst: { color: '#6B2737', fontSize: 14, fontWeight: '500' },
  modalPozadina: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalKartica: {
    backgroundColor: '#F2EDE4', borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 28,
  },
  modalNaslov: { fontSize: 20, fontWeight: 'bold', color: '#2C1810', marginBottom: 8 },
  modalOpis: { fontSize: 14, color: '#8B7355', marginBottom: 20, lineHeight: 20 },
  odustaniGumb: { padding: 16, alignItems: 'center' },
  odustaniTekst: { color: '#8B7355', fontSize: 15 },
});