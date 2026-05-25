import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatirajVrijeme, useApp } from '../../context/AppContext';

export default function SkenirajScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [skenirano, setSkenirano] = useState(false);
  const { aktivan, sekunde, checkin, checkout } = useApp();

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  function handleSkan(result: { data: string }) {
    if (skenirano) return;
    setSkenirano(true);

    if (result.data === 'FILORanked-CHECKIN' && !aktivan) {
      checkin();
      Alert.alert('✅ Check-in uspješan!', 'Dobrodošao u knjižnicu. Sretno učenje!', [
        { text: 'OK', onPress: () => setSkenirano(false) }
      ]);
    } else if (result.data === 'FILORanked-CHECKOUT' && aktivan) {
      checkout();
      Alert.alert('👋 Check-out uspješan!', 'Sesija završena. Vidimo se sutra!', [
        { text: 'OK', onPress: () => setSkenirano(false) }
      ]);
    } else if (result.data === 'FILORanked-CHECKIN' && aktivan) {
      Alert.alert('ℹ️ Već si prijavljen', 'Skeniraj izlazni QR kod kad odlaziš.', [
        { text: 'OK', onPress: () => setSkenirano(false) }
      ]);
    } else if (result.data === 'FILORanked-CHECKOUT' && !aktivan) {
      Alert.alert('ℹ️ Nisi prijavljen', 'Skeniraj ulazni QR kod pri ulasku.', [
        { text: 'OK', onPress: () => setSkenirano(false) }
      ]);
    } else {
      Alert.alert('❌ Neispravan QR kod', 'Ovo nije FILO Ranked QR kod.', [
        { text: 'OK', onPress: () => setSkenirano(false) }
      ]);
    }
  }

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.naslov}>📷 Skeniraj</Text>
        <Text style={styles.podnaslov}>Aplikacija treba pristup kameri.</Text>
        <TouchableOpacity style={styles.gumb} onPress={requestPermission}>
          <Text style={styles.gumbTekst}>Dozvoli pristup kameri</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.naslov}>📷 Skeniraj</Text>
      <Text style={styles.podnaslov}>
        {aktivan ? 'Skeniraj izlazni QR kod pri odlasku' : 'Skeniraj ulazni QR kod pri dolasku'}
      </Text>

      <View style={styles.kameraOkvir}>
        <CameraView
          style={styles.kamera}
          facing="back"
          onBarcodeScanned={handleSkan}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />
        <View style={styles.kutKL} />
        <View style={styles.kutKD} />
        <View style={styles.kutDL} />
        <View style={styles.kutDD} />
        <View style={styles.scanLinija} />
      </View>

      <View style={styles.statusKartica}>
        <View style={[styles.statusDot, { backgroundColor: aktivan ? '#4CAF50' : '#8B7355' }]} />
        <Text style={styles.statusTekst}>
          {aktivan ? 'U knjižnici' : 'Izvan knjižnice'}
        </Text>
      </View>

      {aktivan && (
        <View style={styles.timerKartica}>
          <Text style={styles.timerNaslov}>⏱ Aktivna sesija</Text>
          <Text style={styles.timer}>{formatirajVrijeme(sekunde)}</Text>
          <Text style={styles.timerInfo}>📍 Knjižnica Filozofskog fakulteta</Text>
        </View>
      )}

      {!aktivan && (
        <View style={styles.uputaKartica}>
          <Text style={styles.uputaNaslov}>Kako koristiti?</Text>
          <Text style={styles.uputaTekst}>1. Dođi u knjižnicu Filozofskog fakulteta</Text>
          <Text style={styles.uputaTekst}>2. Skeniraj QR kod na ulazu</Text>
          <Text style={styles.uputaTekst}>3. Uči i skupljaj bodove</Text>
          <Text style={styles.uputaTekst}>4. Skeniraj QR kod pri odlasku</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2EDE4', padding: 20, paddingTop: 60 },
  naslov: { fontSize: 28, fontWeight: 'bold', color: '#2C1810', marginBottom: 4 },
  podnaslov: { fontSize: 14, color: '#8B7355', marginBottom: 24 },
  kameraOkvir: { width: 260, height: 260, alignSelf: 'center', borderRadius: 16, overflow: 'hidden', marginBottom: 20, position: 'relative' },
  kamera: { width: '100%', height: '100%' },
  kutKL: { position: 'absolute', top: 12, left: 12, width: 32, height: 32, borderTopWidth: 3, borderLeftWidth: 3, borderColor: '#F2EDE4', borderRadius: 3 },
  kutKD: { position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderTopWidth: 3, borderRightWidth: 3, borderColor: '#F2EDE4', borderRadius: 3 },
  kutDL: { position: 'absolute', bottom: 12, left: 12, width: 32, height: 32, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: '#F2EDE4', borderRadius: 3 },
  kutDD: { position: 'absolute', bottom: 12, right: 12, width: 32, height: 32, borderBottomWidth: 3, borderRightWidth: 3, borderColor: '#F2EDE4', borderRadius: 3 },
  scanLinija: { position: 'absolute', left: 20, right: 20, top: '50%', height: 2, backgroundColor: '#6B2737', opacity: 0.8 },
  statusKartica: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 0.5, borderColor: '#D9CFC4', gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusTekst: { fontSize: 16, fontWeight: '500', color: '#2C1810' },
  timerKartica: { backgroundColor: '#2C1810', borderRadius: 12, padding: 16, alignItems: 'center' },
  timerNaslov: { fontSize: 12, color: '#8B7355', marginBottom: 4 },
  timer: { fontSize: 36, fontWeight: 'bold', color: '#F2EDE4', letterSpacing: 2 },
  timerInfo: { fontSize: 12, color: '#8B7355', marginTop: 8 },
  uputaKartica: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 0.5, borderColor: '#D9CFC4' },
  uputaNaslov: { fontSize: 14, fontWeight: '500', color: '#2C1810', marginBottom: 10 },
  uputaTekst: { fontSize: 13, color: '#8B7355', marginBottom: 6 },
  gumb: { backgroundColor: '#2C1810', borderRadius: 14, padding: 18, alignItems: 'center' },
  gumbTekst: { color: '#F2EDE4', fontSize: 16, fontWeight: 'bold' },
});