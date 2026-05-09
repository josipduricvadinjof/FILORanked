import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebaseConfig';

type AuthContextType = {
  korisnik: User | null;
  ucitavanje: boolean;
  registracija: (ime: string, nadimak: string, email: string, lozinka: string) => Promise<void>;
  prijava: (email: string, lozinka: string) => Promise<void>;
  odjava: () => Promise<void>;
  resetLozinke: (email: string) => Promise<boolean>;
  greska: string;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [korisnik, setKorisnik] = useState<User | null>(null);
  const [ucitavanje, setUcitavanje] = useState(true);
  const [greska, setGreska] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setKorisnik(user);
      setUcitavanje(false);
    });
    return unsubscribe;
  }, []);

  async function registracija(ime: string, nadimak: string, email: string, lozinka: string) {
    try {
      setGreska('');
      const { user } = await createUserWithEmailAndPassword(auth, email, lozinka);
      await setDoc(doc(db, 'korisnici', user.uid), {
        ime,
        nadimak,
        email,
        ukupnoSekundi: 0,
        dnevnoSekundi: 0,
        tjednoSekundi: 0,
        mjesecnoSekundi: 0,
        streak: 0,
        zadnjiPosjet: '',
        zadnjiResetDan: '',
        zadnjiResetTjedan: '',
        zadnjiResetMjesec: '',
        sesije: [],
        slika: '',
        createdAt: new Date().toISOString(),
      });
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        setGreska('Ovaj email je već registriran.');
      } else if (e.code === 'auth/weak-password') {
        setGreska('Lozinka mora imati barem 6 znakova.');
      } else {
        setGreska('Greška pri registraciji. Pokušaj ponovo.');
      }
      throw e;
    }
  }

  async function prijava(email: string, lozinka: string) {
    try {
      setGreska('');
      await signInWithEmailAndPassword(auth, email, lozinka);
    } catch (e: any) {
      if (e.code === 'auth/invalid-credential') {
        setGreska('Pogrešan email ili lozinka.');
      } else {
        setGreska('Greška pri prijavi. Pokušaj ponovo.');
      }
      throw e;
    }
  }

  async function odjava() {
    await signOut(auth);
  }

  async function resetLozinke(email: string): Promise<boolean> {
    try {
      setGreska('');
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        setGreska('Nema korisnika s tim emailom.');
      } else {
        setGreska('Greška. Provjeri email i pokušaj ponovo.');
      }
      return false;
    }
  }

  return (
    <AuthContext.Provider value={{
      korisnik,
      ucitavanje,
      registracija,
      prijava,
      odjava,
      resetLozinke,
      greska,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth mora biti unutar AuthProvider');
  return ctx;
}