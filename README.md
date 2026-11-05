# Exergy Web (exergy.science)

Official informational landing page, interactive thermodynamic flow simulator, and privacy specification for **Exergy** — granular EV consumption, thermodynamic energy attribution, and trip telemetry for Android Automotive OS (AAOS) with companion Android & iOS apps.

Production Domain: [https://exergy.science](https://exergy.science)

---

## ⚡ Deployment via Vercel

This repository is configured for automatic, zero-configuration deployment to Vercel.

### 1. Connect to Vercel
1. Go to [vercel.com/new](https://vercel.com/new).
2. Import repository `web-gears/exergy-web`.
3. Keep default settings:
   - **Framework Preset:** `Other` (Static HTML)
   - **Build Command:** *(leave empty)*
   - **Output Directory:** *(leave empty / root)*
4. Click **Deploy**.

### 2. Configure Domain
1. In the Vercel Project Dashboard, navigate to **Settings > Domains**.
2. Add `exergy.science` (and optionally `www.exergy.science`).
3. Set your DNS records at your registrar:
   - `A` record: `@` -> `76.76.21.21`
   - `CNAME` record: `www` -> `cname.vercel-dns.com`
4. Vercel automatically issues an SSL/TLS certificate.

---

## 📁 Repository Structure

```
.
├── index.html              # Main landing page & interactive Grassmann flow simulator
├── privacy.html            # Zero-knowledge privacy policy & data sovereignty specification
├── privacy/
│   └── index.html          # Clean routing mirror for /privacy/
├── vercel.json             # Vercel deployment configuration, security headers & caching
├── robots.txt              # Search engine directives
├── sitemap.xml             # XML sitemap for exergy.science
├── assets/
│   ├── css/
│   │   └── style.css       # Zero-radius, 1px hairlines, tabular figures design system
│   ├── js/
│   │   └── main.js         # Real-time physics engine & interactive SVG Grassmann renderer
│   ├── images/             # Screen mocks & UI captures from AAOS and mobile companions
│   ├── favicon.svg         # SVG favicon
│   └── logo.svg            # Vector brand mark
└── LICENSE                 # MIT License
```

---

## 📐 Design & Visual Identity

- **Visual Thesis:** Direction 2: Thermodynamic Sankey & Grassmann Flow
- **Geometry:** Zero corner radius (`border-radius: 0px`)
- **Scaffolding:** 1px hairline drafting borders (`#25292E`)
- **Typography:** Tabular figures (`tnum`, `zero`) with Grotesque display & Monospace telemetry
- **Color Discipline:** Physical energy sink streams:
  - Traction ($F_{\text{aero}} + F_{\text{roll}}$): `#D0D4D8`
  - Climate Conditioning ($P_{\text{hvac}}$): `#4E79A7`
  - Gravitational Elevation ($m g \Delta h$): `#E19C24`
  - Auxiliary Systems ($P_{12\text{V}}$): `#9B7BB8`
  - Standby / Vampire Drain: `#33373B`
  - Regenerative Recovery ($\eta_{\text{regen}}$): `#59A14F`
