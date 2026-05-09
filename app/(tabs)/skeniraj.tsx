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

    if (result.data === 'NSK_CHECKIN' && !aktivan) {
      checkin();
      Alert.alert('✅ Check-in uspješan!', 'Dobrodošao u NSK. Sretno učenje!', [
        { text: 'OK', onPress: () => setSkenirano(false) }
      ]);
    } else if (result.data === 'NSK_CHECKOUT' && aktivan) {
      checkout();
      Alert.alert('👋 Check-out uspješan!', 'Sesija završena. Vidimo se sutra!', [
        { text: 'OK', onPress: () => setSkenirano(false) }
      ]);
    } else {
      Alert.alert('❌ Greška', 'Neispravan QR kod ili već si prijavljen/odjavljen.', [
        { text: 'OK', onPress: () => setSkenirano(false) }
      ]);
    }
  }

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.naslov}>📷 Kamera</Text>
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
        {aktivan ? 'Skeniraj izlazni QR kod' : 'Skeniraj ulazni QR kod'}
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
      </View>

      {aktivan && (
        <View style={styles.timerKartica}>
          <Text style={styles.timerNaslov}>⏱ Aktivna sesija</Text>
          <Text style={styles.timer}>{formatirajVrijeme(sekunde)}</Text>
        </View>
      )}

      <View style={styles.statusKartica}>
        <Text style={styles.statusTekst}>
          {aktivan ? '🟢 U knjižnici' : '⚪ Nije aktivan'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.gumb, aktivan ? styles.gumbIzlaz : styles.gumbUlaz]}
        onPress={() => handleSkan({ data: aktivan ? 'NSK_CHECKOUT' : 'NSK_CHECKIN' })}
      >
        <Text style={styles.gumbTekst}>
          {aktivan ? 'Simuliraj izlaz' : 'Simuliraj ulaz'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2EDE4', padding: 20, paddingTop: 60 },
  naslov: { fontSize: 28, fontWeight: 'bold', color: '#2C1810' },
  podnaslov: { fontSize: 14, color: '#8B7355', marginBottom: 24 },
  kameraOkvir: {
    width: 220, height: 220, alignSelf: 'center',
    borderRadius: 12, overflow: 'hidden', marginBottom: 20, position: 'relative',
  },
  kamera: { width: '100%', height: '100%' },
  kutKL: { position: 'absolute', top: 12, left: 12, width: 28, height: 28, borderTopWidth: 3, borderLeftWidth: 3, borderColor: '#F2EDE4', borderRadius: 3 },
  kutKD: { position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderTopWidth: 3, borderRightWidth: 3, borderColor: '#F2EDE4', borderRadius: 3 },
  kutDL: { position: 'absolute', bottom: 12, left: 12, width: 28, height: 28, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: '#F2EDE4', borderRadius: 3 },
  kutDD: { position: 'absolute', bottom: 12, right: 12, width: 28, height: 28, borderBottomWidth: 3, borderRightWidth: 3, borderColor: '#F2EDE4', borderRadius: 3 },
  timerKartica: {
    backgroundColor: '#2C1810', borderRadius: 12, padding: 16,
    alignItems: 'center', marginBottom: 12,
  },
  timerNaslov: { fontSize: 12, color: '#8B7355', marginBottom: 4 },
  timer: { fontSize: 32, fontWeight: 'bold', color: '#F2EDE4', letterSpacing: 2 },
  statusKartica: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    alignItems: 'center', marginBottom: 16, borderWidth: 0.5, borderColor: '#D9CFC4',
  },
  statusTekst: { fontSize: 16, fontWeight: '500', color: '#2C1810' },
  gumb: { borderRadius: 14, padding: 18, alignItems: 'center' },
  gumbUlaz: { backgroundColor: '#2C1810' },
  gumbIzlaz: { backgroundColor: '#6B2737' },
  gumbTekst: { color: '#F2EDE4', fontSize: 16, fontWeight: 'bold' },
});