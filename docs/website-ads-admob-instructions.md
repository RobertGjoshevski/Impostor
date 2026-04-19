# Website ads (AdSense) — this project

This game is a **static vanilla JavaScript** app (`index.html` + `js/app.js` + views under `js/views/`), usually hosted on **GitHub Pages** with a custom hostname such as `impostor.rgsoft.org` (see `docs/plan.md`).

---

## AdMob vs AdSense (quick)

| Where users play | Use |
|------------------|-----|
| **In a normal browser** at your URL | **Google AdSense** (web tags). There is no “AdMob JavaScript SDK” for a plain website. |
| **Inside your Android / iOS app** | **Google AdMob** (native SDK). |

If you started with **AdMob**, Google also created an **AdSense account for payments**. To show ads on **your own site**, that account must include **AdSense for Content** (upgrade / application from the same Google account). See [Upgrade AdSense linked to AdMob](https://support.google.com/adsense/answer/6023158).

---

## Domain model (rgsoft.org vs impostor.rgsoft.org)

- In AdSense **Sites**, you add **`rgsoft.org`** only. **`impostor.rgsoft.org`** cannot be registered as its own site (Google treats normal subdomains of your domain that way).  
  References: [Site management change](https://support.google.com/adsense/answer/12170421), [How to enter your site URL](https://support.google.com/adsense/answer/2784438).

- That does **not** block ads on the subdomain: Google states that consolidating subdomains under the domain **does not impact ad serving or earnings**. You still implement and deploy ads on **`https://impostor.rgsoft.org`**.

- **`ads.txt`**: If the file that AdSense expects for the **game host** lives on the **subdomain**, use Google’s pattern: crawlable **`https://impostor.rgsoft.org/ads.txt`** plus, when needed, a **`subdomain=impostor.rgsoft.org`** line on **`https://rgsoft.org/ads.txt`** so the root file points crawlers at the subdomain file. Details: [Ads.txt FAQs](https://support.google.com/adsense/answer/9785052).

This repo includes **`ads.txt`** at the project root so GitHub Pages can serve **`https://impostor.rgsoft.org/ads.txt`** after deploy. Keep the **`google.com, pub-…, DIRECT, …`** line exactly as shown in your AdSense account.

---

## Already done (your current state)

Use this as a checklist; tick what applies:

- [x] **AdSense for Content** enabled (not only the AdMob-linked payments view).
- [x] **`rgsoft.org`** added under **Sites** and **verified**.
- [x] **Subdomain** referenced for **`ads.txt`** (e.g. `subdomain=impostor.rgsoft.org` on `rgsoft.org` if Google’s flow required it, and/or `ads.txt` deployed on the subdomain).

---

## What to do next — put ads on this website

Do these **in order**:

### 1. Confirm the site is ready to earn

In AdSense, open **Sites** (for **`rgsoft.org`**) and resolve anything Google flags until the property is **Ready** / ads are allowed. If **ads.txt** is still flagged, fix the live URLs until the **Sites** table shows a good **ads.txt** status for the relevant host.

### 2. Choose how ads are inserted

Pick **one** primary approach (you can refine later):

| Approach | Where in AdSense | In this repo |
|----------|------------------|--------------|
| **Auto ads** | **Ads** → enable **Auto ads** for your site; use the **global snippet** Google provides. | Paste the snippet in **`index.html`** per Google’s placement (often `<head>` or top of `<body>`, `async`). Google chooses positions. |
| **Manual ad units** | **Ads** → **By ad unit** → **New ad unit** (e.g. **Display**, responsive). | Paste the **ad unit** code into a **container that is not destroyed** when views change (see below). |

### 3. Respect this app’s SPA behavior

`js/app.js` replaces **`#app`** with `innerHTML` on navigation. **Do not** put the only ad slot **inside** markup that gets wiped every screen, or the ad iframe may break.

**Recommended:** In **`index.html`**, keep **`#app`** for the game only, and add a **persistent** wrapper, for example:

- A **banner strip** above or below `#app` (sibling of `#app`, not inside it), **or**
- A dedicated `<aside id="ads">` next to `#app` for your manual unit.

Put **Auto ads** script once globally; for **manual** units, put the `<ins class="adsbygoogle">` block in that persistent region and follow AdSense’s **one-push-per-slot** rules when the DOM is stable.

### 4. Deploy

Push/build so **`https://impostor.rgsoft.org/`** serves the updated **`index.html`** and **`https://impostor.rgsoft.org/ads.txt`** matches AdSense.

### 5. Privacy and EU / UK / CH

- Add a **privacy policy** that mentions ads, cookies, and Google as a vendor; link it from the game UI.
- For traffic in **EU / UK / CH**, follow AdSense **Privacy & messaging** and use a **Google-certified CMP** (or equivalent) where required so personalized ads and consent are handled correctly.

### 6. After launch

- Do **not** click your own ads to test.
- Wait for reporting to populate; if ads stay blank, check **site / policy status**, browser ad blockers, and any **Content-Security-Policy** on the host that might block `pagead2.googlesyndication.com`.

---

## Launch checklist (copy for issues / PRs)

- [ ] **Sites**: `rgsoft.org` ready; no blocking policy or `ads.txt` issues for your setup  
- [ ] **AdSense script** and/or **ad unit** added to **`index.html`** (persistent slot outside `#app` if manual)  
- [ ] **`ads.txt`** live on **`impostor.rgsoft.org`** (and parent **`rgsoft.org`** if you use `subdomain=` delegation)  
- [ ] **Privacy policy** linked; **CMP** if you serve EU/UK/CH  
- [ ] Tested on real phone + desktop without ad blocker  

---

## Path B — AdMob (native apps only)

If you also ship **Android/iOS** apps:

1. [AdMob console](https://admob.google.com/) → app → **ad units**.  
2. Integrate the [Mobile Ads SDK](https://developers.google.com/admob) (or Flutter / Capacitor plugins).  
3. If the game runs in a **WebView** with web ad tags, see [WebView API for Ads](https://developers.google.com/ad-manager/mobile-ads-sdk/android/browser/webview/api-for-ads) (Android; iOS/Flutter have equivalents).

---

## References (official)

- [AdSense: connect your site](https://support.google.com/adsense/answer/7584263)  
- [AdSense: set up ads on your site](https://support.google.com/adsense/answer/7037624)  
- [AdSense: Auto ads](https://support.google.com/adsense/answer/9261805)  
- [Site management / subdomains](https://support.google.com/adsense/answer/12170421)  
- [Ads.txt FAQs (subdomain=)](https://support.google.com/adsense/answer/9785052)  
- [Upgrade AdSense linked to AdMob](https://support.google.com/adsense/answer/6023158)  
