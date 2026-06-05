import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { db } from '../firebaseConfig';
import { useAuth } from './AuthContext';

type Sesija = {
  id: number;
  datum: string;
  trajanje: number;
};

type Korisnik = {
  ime: string;
  nadimak: string;
  slika: string;
  ukupnoSekundi: number;
  dnevnoSekundi: number;
  tjednoSekundi: number;
  mjesecnoSekundi: number;
  zadnjiResetDan: string;
  zadnjiResetTjedan: string;
  zadnjiResetMjesec: string;
  sesije: Sesija[];
  streak: number;
  zadnjiPosjet: string;
};

type AppContextType = {
  korisnik: Korisnik;
  aktivan: boolean;
  sekunde: number;
  onboardingGotov: boolean;
  ucitavanje: boolean;
  checkin: () => Promise<void>;
  checkout: () => Promise<void>;
  spremiKorisnika: (ime: string, nadimak: string) => void;
  azurirajProfil: (novoIme: string, noviNadimak: string, novaSlika?: string) => Promise<void>;
};

const defaultKorisnik: Korisnik = {
  ime: '',
  nadimak: '',
  slika: '',
  ukupnoSekundi: 0,
  dnevnoSekundi: 0,
  tjednoSekundi: 0,
  mjesecnoSekundi: 0,
  zadnjiResetDan: '',
  zadnjiResetTjedan: '',
  zadnjiResetMjesec: '',
  sesije: [],
  streak: 0,
  zadnjiPosjet: '',
};

const AppContext = createContext<AppContextType | null>(null);

function getDanKljuc(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function getTjedanKljuc(): string {
  const d = new Date();
  const pocetak = new Date(d);
  pocetak.setDate(d.getDate() - d.getDay());
  return `${pocetak.getFullYear()}-${pocetak.getMonth()}-${pocetak.getDate()}`;
}

function getMjesecKljuc(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function provjeriResetove(k: Korisnik): Partial<Korisnik> {
  const azuriranje: Partial<Korisnik> = {};
  const danKljuc = getDanKljuc();
  const tjedanKljuc = getTjedanKljuc();
  const mjesecKljuc = getMjesecKljuc();

  if (k.zadnjiResetDan !== danKljuc) {
    azuriranje.dnevnoSekundi = 0;
    azuriranje.zadnjiResetDan = danKljuc;
  }
  if (k.zadnjiResetTjedan !== tjedanKljuc) {
    azuriranje.tjednoSekundi = 0;
    azuriranje.zadnjiResetTjedan = tjedanKljuc;
  }
  if (k.zadnjiResetMjesec !== mjesecKljuc) {
    azuriranje.mjesecnoSekundi = 0;
    azuriranje.zadnjiResetMjesec = mjesecKljuc;
  }

  if (k.zadnjiPosjet) {
    const zadnji = new Date(k.zadnjiPosjet);
    const danas = new Date();
    const juce = new Date();
    juce.setDate(danas.getDate() - 1);
    if (
      zadnji.toDateString() !== danas.toDateString() &&
      zadnji.toDateString() !== juce.toDateString()
    ) {
      azuriranje.streak = 0;
    }
  }

  return azuriranje;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { korisnik: authKorisnik } = useAuth();
  const [korisnik, setKorisnik] = useState<Korisnik>(defaultKorisnik);
  const [aktivan, setAktivan] = useState(false);
  const [sekunde, setSekunde] = useState(0);
  const [ucitavanje, setUcitavanje] = useState(true);
  const intervalRef = useRef<any>(null);
  const sekundeRef = useRef(0);
  const aktivanRef = useRef(false);
  // Ključni fix: pamti što je Firestore zadnji put rekao za aktivnaSesija
  const firestoreAktivanRef = useRef<boolean | null>(null);

  const onboardingGotov = korisnik.ime !== '';

  useEffect(() => {
    sekundeRef.current = sekunde;
  }, [sekunde]);

  useEffect(() => {
    aktivanRef.current = aktivan;
  }, [aktivan]);

  useEffect(() => {
    if (!authKorisnik) {
      setKorisnik(defaultKorisnik);
      setAktivan(false);
      setSekunde(0);
      clearInterval(intervalRef.current);
      setUcitavanje(false);
      firestoreAktivanRef.current = null;
      return;
    }

    setUcitavanje(true);
    const ref = doc(db, 'korisnici', authKorisnik.uid);

    const unsubscribe = onSnapshot(ref, async (snap) => {
      if (!snap.exists()) {
        setUcitavanje(false);
        return;
      }

      const data = snap.data();

      const ucitani: Korisnik = {
        ime: data.ime || '',
        nadimak: data.nadimak || '',
        slika: data.slika || '',
        ukupnoSekundi: data.ukupnoSekundi || 0,
        dnevnoSekundi: data.dnevnoSekundi || 0,
        tjednoSekundi: data.tjednoSekundi || 0,
        mjesecnoSekundi: data.mjesecnoSekundi || 0,
        zadnjiResetDan: data.zadnjiResetDan || '',
        zadnjiResetTjedan: data.zadnjiResetTjedan || '',
        zadnjiResetMjesec: data.zadnjiResetMjesec || '',
        sesije: data.sesije || [],
        streak: data.streak || 0,
        zadnjiPosjet: data.zadnjiPosjet || '',
      };

      const resetovi = provjeriResetove(ucitani);
      if (Object.keys(resetovi).length > 0) {
        const azuriran = { ...ucitani, ...resetovi };
        setKorisnik(azuriran);
        await updateDoc(ref, resetovi);
      } else {
        setKorisnik(ucitani);
      }

      const novoStanje = data.aktivnaSesija === true;
      const prethodnoStanje = firestoreAktivanRef.current;

      // Pokreni timer SAMO ako se stanje promijenilo iz false -> true
      if (novoStanje === true && prethodnoStanje === false) {
        setAktivan(true);
        setSekunde(0);
        sekundeRef.current = 0;
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
          setSekunde(s => s + 1);
        }, 1000);
      }
      // Zaustavi timer SAMO ako se stanje promijenilo iz true -> false
      else if (novoStanje === false && prethodnoStanje === true) {
        setAktivan(false);
        clearInterval(intervalRef.current);
        setSekunde(0);
        sekundeRef.current = 0;
      }
      // Prvo učitavanje — samo postavi stanje bez pokretanja timera ako je false
      else if (prethodnoStanje === null) {
        if (novoStanje === true) {
          setAktivan(true);
          setSekunde(0);
          sekundeRef.current = 0;
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = setInterval(() => {
            setSekunde(s => s + 1);
          }, 1000);
        } else {
          setAktivan(false);
        }
      }

      // Zapamti novo stanje iz Firestorea
      firestoreAktivanRef.current = novoStanje;

      setUcitavanje(false);
    });

    return () => {
      unsubscribe();
      clearInterval(intervalRef.current);
    };
  }, [authKorisnik]);

  async function spremiKorisnika(ime: string, nadimak: string) {
    if (!authKorisnik) return;
    const noviKorisnik: Korisnik = {
      ...defaultKorisnik,
      ime,
      nadimak,
      zadnjiResetDan: getDanKljuc(),
      zadnjiResetTjedan: getTjedanKljuc(),
      zadnjiResetMjesec: getMjesecKljuc(),
    };
    setKorisnik(noviKorisnik);
    try {
      await setDoc(doc(db, 'korisnici', authKorisnik.uid), noviKorisnik);
    } catch (e) {
      console.log('Greška spremanja:', e);
    }
  }

  async function azurirajProfil(novoIme: string, noviNadimak: string, novaSlika?: string) {
    if (!authKorisnik) return;
    const azuriran = { ...korisnik, ime: novoIme, nadimak: noviNadimak, slika: novaSlika ?? korisnik.slika };
    setKorisnik(azuriran);
    try {
      await updateDoc(doc(db, 'korisnici', authKorisnik.uid), {
        ime: novoIme,
        nadimak: noviNadimak,
        slika: novaSlika ?? korisnik.slika,
      });
    } catch (e) {
      console.log('Greška ažuriranja profila:', e);
    }
  }

  async function checkin() {
    if (!authKorisnik) return;
    try {
      await updateDoc(doc(db, 'korisnici', authKorisnik.uid), {
        aktivnaSesija: true,
        vrijemeCheckin: new Date().toISOString(),
      });
    } catch (e) {
      console.log('Greška checkin:', e);
    }
  }

  async function checkout() {
    if (!authKorisnik) return;
    setAktivan(false);
    clearInterval(intervalRef.current);

    const trenutnoSekunde = sekundeRef.current;
    const danas = new Date().toDateString();
    const novaSesija: Sesija = {
      id: Date.now(),
      datum: danas,
      trajanje: trenutnoSekunde,
    };

    const resetovi = provjeriResetove(korisnik);
    const noviKorisnik: Korisnik = {
      ...korisnik,
      ...resetovi,
      ukupnoSekundi: korisnik.ukupnoSekundi + trenutnoSekunde,
      dnevnoSekundi: (resetovi.dnevnoSekundi ?? korisnik.dnevnoSekundi) + trenutnoSekunde,
      tjednoSekundi: (resetovi.tjednoSekundi ?? korisnik.tjednoSekundi) + trenutnoSekunde,
      mjesecnoSekundi: (resetovi.mjesecnoSekundi ?? korisnik.mjesecnoSekundi) + trenutnoSekunde,
      sesije: [novaSesija, ...korisnik.sesije],
      streak: korisnik.zadnjiPosjet === danas ? korisnik.streak : korisnik.streak + 1,
      zadnjiPosjet: danas,
    };

    setKorisnik(noviKorisnik);
    setSekunde(0);
    sekundeRef.current = 0;

    try {
      await updateDoc(doc(db, 'korisnici', authKorisnik.uid), {
        aktivnaSesija: false,
        vrijemeCheckin: null,
        ukupnoSekundi: noviKorisnik.ukupnoSekundi,
        dnevnoSekundi: noviKorisnik.dnevnoSekundi,
        tjednoSekundi: noviKorisnik.tjednoSekundi,
        mjesecnoSekundi: noviKorisnik.mjesecnoSekundi,
        zadnjiResetDan: noviKorisnik.zadnjiResetDan,
        zadnjiResetTjedan: noviKorisnik.zadnjiResetTjedan,
        zadnjiResetMjesec: noviKorisnik.zadnjiResetMjesec,
        sesije: noviKorisnik.sesije,
        streak: noviKorisnik.streak,
        zadnjiPosjet: noviKorisnik.zadnjiPosjet,
      });
    } catch (e) {
      console.log('Greška ažuriranja:', e);
    }
  }

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <AppContext.Provider value={{
      korisnik,
      aktivan,
      sekunde,
      onboardingGotov,
      ucitavanje,
      checkin,
      checkout,
      spremiKorisnika,
      azurirajProfil,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp mora biti unutar AppProvider');
  return ctx;
}

export function formatirajVrijeme(sekunde: number): string {
  const h = Math.floor(sekunde / 3600);
  const m = Math.floor((sekunde % 3600) / 60);
  const s = sekunde % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatirajSate(sekunde: number): string {
  const h = Math.floor(sekunde / 3600);
  const m = Math.floor((sekunde % 3600) / 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}