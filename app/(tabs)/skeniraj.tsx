import { useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatirajVrijeme, useApp } from '../../context/AppContext';

export default function SkenirajScreen() {
  const { aktivan, sekunde, checkin, checkout } = useApp();
  const [skenirano, setSkenirano] = useState(false);
  const [kameraAktivna, setKameraAktivna] = useState(false);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  async function pokreniSkener() {
    if (Platform.OS !== 'web') return;
    setKameraAktivna(true);

    setTimeout(async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText: string) => {
            if (skenirano) return;
            setSkenirano(true);
            scanner.stop().then(() => {
              setKameraAktivna(false);
              handleSkan(decodedText);
            });
          },
          () => {}
        );
      } catch (e) {
        console.log('Greška skenera:', e);
        setKameraAktivna(false);
      }
    }, 300);
  }

  function zaustaviSkener() {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setKameraAktivna(false);
    setSkenirano(false);
  }

  function handleSkan(data: string) {
    const jeCheckin = data === 'FILORanked-CHECKIN' ||
                      data.includes('filoranked') && data.includes('checkin');
    const jeCheckout = data === 'FILORanked-CHECKOUT' ||
                       data.includes('filoranked') && data.includes('checkout');

    if (jeCheckin && !aktivan) {
      checkin();
      alert('✅ Check-in uspješan! Dobrodošao u knjižnicu. Sretno učenje!');
      setSkenirano(false);
    } else if (jeCheckout && aktivan) {
      checkout();
      alert('👋 Check-out uspješan! Sesija završena. Vidimo se sutra!');
      setSkenirano(false);
    } else if (jeCheckin && aktivan) {
      alert('ℹ️ Već si prijavljen. Skeniraj izlazni QR kod kad odlaziš.');
      setSkenirano(false);
    } else if (jeCheckout && !aktivan) {
      alert('ℹ️ Nisi prijavljen. Skeniraj ulazni QR kod pri ulasku.');
      setSkenirano(false);
    } else {
      alert('❌ Neispravan QR kod. Ovo nije FILO Ranked QR kod.');
      setSkenirano(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.naslov}>📷 Skeniraj</Text>
      <Text style={styles.podnaslov}>
        {aktivan ? 'Skeniraj izlazni QR kod pri odlasku' : 'Skeniraj ulazni QR kod pri dolasku'}
      </Text>

      {!kameraAktivna ? (
        <View style={styles.okvir}>
          <Text style={styles.okvirTekst}>📷</Text>
          <Text style={styles.okvirOpis}>Tapni gumb za aktivaciju kamere</Text>
        </View>
      ) : (
        <View style={styles.kameraOkvir}>
          <div id="qr-reader" style={{ width: '100%', height: '100%' }} />
          <View style={styles.kutKL} />
          <View style={styles.kutKD} />
          <View style={styles.kutDL} />
          <View style={styles.kutDD} />
        </View>
      )}

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

      {!kameraAktivna ? (
        <TouchableOpacity style={styles.gumb} onPress={pokreniSkener}>
          <Text style={styles.gumbTekst}>
            {aktivan ? '📷 Skeniraj izlaz' : '📷 Skeniraj ulaz'}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={[styles.gumb, styles.gumbStop]} onPress={zaustaviSkener}>
          <Text style={styles.gumbTekst}>⏹ Zaustavi skener</Text>
        </TouchableOpacity>
      )}

      {!aktivan && !kameraAktivna && (
        <View style={styles.uputaKartica}>
          <Text style={styles.uputaNaslov}>Kako koristiti?</Text>
          <Text style={styles.uputaTekst}>1. Dođi u knjižnicu Filozofskog fakulteta</Text>
          <Text style={styles.uputaTekst}>2. Tapni "Skeniraj ulaz" i usmjeri kameru na QR kod</Text>
          <Text style={styles.uputaTekst}>3. Uči i skupljaj bodove</Text>
          <Text style={styles.uputaTekst}>4. Pri odlasku tapni "Skeniraj izlaz"</Text>
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2EDE4' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 60, flexGrow: 1 },
  naslov: { fontSize: 28, fontWeight: 'bold', color: '#2C1810', marginBottom: 4 },
  podnaslov: { fontSize: 14, color: '#8B7355', marginBottom: 24 },
  okvir: {
    width: 260, height: 260, alignSelf: 'center',
    borderRadius: 16, backgroundColor: '#E8E0D5',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  okvirTekst: { fontSize: 48, marginBottom: 12 },
  okvirOpis: { fontSize: 13, color: '#8B7355', textAlign: 'center' },
  kameraOkvir: {
    width: 260, height: 260, alignSelf: 'center',
    borderRadius: 16, overflow: 'hidden',
    marginBottom: 20, position: 'relative',
  },
  kutKL: { position: 'absolute', top: 12, left: 12, width: 32, height: 32, borderTopWidth: 3, borderLeftWidth: 3, borderColor: '#F2EDE4', borderRadius: 3 },
  kutKD: { position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderTopWidth: 3, borderRightWidth: 3, borderColor: '#F2EDE4', borderRadius: 3 },
  kutDL: { position: 'absolute', bottom: 12, left: 12, width: 32, height: 32, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: '#F2EDE4', borderRadius: 3 },
  kutDD: { position: 'absolute', bottom: 12, right: 12, width: 32, height: 32, borderBottomWidth: 3, borderRightWidth: 3, borderColor: '#F2EDE4', borderRadius: 3 },
  statusKartica: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 12, borderWidth: 0.5, borderColor: '#D9CFC4', gap: 8,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusTekst: { fontSize: 16, fontWeight: '500', color: '#2C1810' },
  timerKartica: {
    backgroundColor: '#2C1810', borderRadius: 12, padding: 16,
    alignItems: 'center', marginBottom: 12,
  },
  timerNaslov: { fontSize: 12, color: '#8B7355', marginBottom: 4 },
  timer: { fontSize: 36, fontWeight: 'bold', color: '#F2EDE4', letterSpacing: 2 },
  timerInfo: { fontSize: 12, color: '#8B7355', marginTop: 8 },
  gumb: {
    backgroundColor: '#2C1810', borderRadius: 14,
    padding: 18, alignItems: 'center', marginBottom: 12,
  },
  gumbStop: { backgroundColor: '#6B2737' },
  gumbTekst: { color: '#F2EDE4', fontSize: 16, fontWeight: 'bold' },
  uputaKartica: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    borderWidth: 0.5, borderColor: '#D9CFC4',
  },
  uputaNaslov: { fontSize: 14, fontWeight: '500', color: '#2C1810', marginBottom: 10 },
  uputaTekst: { fontSize: 13, color: '#8B7355', marginBottom: 6 },
});