# 🎂 Bursdagstracker

En fullstack webapplikasjon for å administrere og automatisk varsle om fødselsdager i en organisasjon eller gruppe. Bygget med moderne teknologi og fokus på universell utforming.


---

## 📸 Funksjonalitet

- Registrer personer med navn, e-post, fødselsdato og avdeling
- Oversikt sortert etter hvem som har bursdag snarest
- Automatisk e-postvarsel sendes til bursdagsbarnet hver dag kl. 08:00
- Søk på navn og avdeling
- Visuell markering av bursdager i dag og kommende 7 dager
- Universell utforming (WCAG) — tastaturnavigasjon, skjermleser-støtte, ARIA-attributter

---

## 🛠️ Tech Stack

| Teknologi | Bruksområde |
|-----------|-------------|
| [React](https://react.dev) | Frontend brukergrensesnitt |
| [Vite](https://vitejs.dev) | Byggverktøy og utviklingsmiljø |
| [Supabase](https://supabase.com) | Sky-database (PostgreSQL) |
| [Resend](https://resend.com) | E-post API |
| [Vercel](https://vercel.com) | Hosting + serverless functions + cron jobs |

---

## 🏗️ Arkitektur

```
┌─────────────────────────────────────────────────────┐
│                     Brukeren                        │
│              bursdagstracker.vercel.app             │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                 Vercel (hosting)                     │
│                                                     │
│  ┌─────────────────┐   ┌──────────────────────────┐ │
│  │  React Frontend  │   │  Serverless API Function │ │
│  │   (src/App.jsx)  │   │ /api/send-birthday-emails│ │
│  └────────┬────────┘   └────────────┬─────────────┘ │
│           │                         │ Kjører kl 08:00│
└───────────┼─────────────────────────┼───────────────┘
            │                         │
┌───────────▼──────────┐   ┌──────────▼──────────────┐
│  Supabase (database)  │   │     Resend (e-post)      │
│  PostgreSQL i skyen   │   │  noreply@shahiftah.me    │
└──────────────────────┘   └─────────────────────────┘
```

**Dataflyten:**
1. Brukeren registrerer en person via frontend → lagres i Supabase
2. Vercel Cron Job kjører automatisk hver dag kl. 08:00
3. API-funksjonen henter alle personer fra Supabase
4. Sjekker om noen har bursdag i dag
5. Sender personlig gratulasjonse-post via Resend

---

## 🚀 Kom i gang lokalt

### Forutsetninger
- [Node.js](https://nodejs.org) v18 eller nyere
- En [Supabase](https://supabase.com)-konto (gratis)
- En [Resend](https://resend.com)-konto (gratis)

### 1. Klon prosjektet

```bash
git clone https://github.com/ShahiFtah/bursdagstracker.git
cd bursdagstracker
```

### 2. Installer avhengigheter

```bash
npm install
```

### 3. Sett opp Supabase

Gå til [supabase.com](https://supabase.com), lag et nytt prosjekt og kjør følgende SQL i **SQL Editor**:

```sql
CREATE TABLE people (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  birthday DATE NOT NULL,
  department TEXT,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE people ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON people
FOR ALL USING (true) WITH CHECK (true);
```

### 4. Konfigurer miljøvariabler

Lag en `.env`-fil i rotnivå:

```env
VITE_SUPABASE_URL=din_supabase_url
VITE_SUPABASE_ANON_KEY=din_anon_nøkkel
RESEND_API_KEY=din_resend_nøkkel
```

### 5. Start utviklingsserveren

```bash
npm run dev
```

Åpne [http://localhost:5173](http://localhost:5173) i nettleseren.

---

## 📁 Prosjektstruktur

```
bursdagstracker/
├── api/
│   └── send-birthday-emails.js   # Serverless funksjon + cron job
├── src/
│   ├── App.jsx                   # Hele React-applikasjonen
│   ├── main.jsx                  # Inngangspunkt
│   └── index.css                 # Global CSS (tom)
├── vercel.json                   # Cron job konfigurasjon
├── index.html
├── vite.config.js
└── package.json
```

---

## ⚙️ Automatisk e-post

E-postvarsling er implementert som en **Vercel Serverless Function** som kjøres automatisk via cron job.

**Konfigurasjon (`vercel.json`):**
```json
{
  "crons": [
    {
      "path": "/api/send-birthday-emails",
      "schedule": "0 7 * * *"
    }
  ]
}
```

Cron-uttrykket `0 7 * * *` betyr: kjør kl. 07:00 UTC hver dag (= 08:00 norsk tid).

**Manuell test:** Åpne følgende URL for å trigge funksjonen manuelt:
```
https://bursdagstracker.vercel.app/api/send-birthday-emails
```

---

## 🌐 Deploy til Vercel

```bash
# Push til GitHub
git add .
git commit -m "oppdatering"
git push

# Vercel deployer automatisk ved hver push til main
```

Vercel oppdaterer appen automatisk hver gang du pusher til `main`-branchen.

---

## ♿ Universell utforming

Applikasjonen er bygget med fokus på tilgjengelighet:

- Alle interaktive elementer har `aria-label`
- Feilmeldinger koblet til felter via `aria-describedby`
- Dynamisk innhold varsles med `aria-live`
- Fokusring synlig for tastaturnavigasjon
- Semantisk HTML med korrekte roller (`role="dialog"`, `role="alert"` osv.)
- Responsivt design for mobil og desktop

---

## 📬 Kontakt

Laget av **Shahi Ftah**
- GitHub: [@ShahiFtah](https://github.com/ShahiFtah)
- Nettside: [shahiftah.me](https://shahiftah.me)
