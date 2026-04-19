# Monetizing this site with Google ads (AdMob vs web)

This project is a **static vanilla JavaScript** app (`index.html` + `js/app.js` + views under `js/views/`). It is intended for **GitHub Pages**–style hosting (see `docs/plan.md`).

## Important distinction

| Context | Google product you use |
|--------|-------------------------|
| **Users open your URL in a normal browser** (Chrome, Safari, desktop or mobile) | **Google AdSense** (or Ad Manager for larger publishers). The **AdMob SDK is not embedded in websites** the way it is in Android/iOS apps. |
| **Your game is inside a native or hybrid app** (Android, iOS, Capacitor, Cordova, React Native WebView, etc.) | **Google AdMob** (Mobile Ads SDK) in the app shell. The web game can stay as static HTML/JS; ads are shown by the **native layer** or by **WebView-specific APIs** (see below). |

If your goal is “ads on impostor.rgsoft.org in the browser,” plan for **AdSense** (or another web ad network), not the AdMob JavaScript SDK (it does not exist for plain sites).

---

## Path A — Ads on the public website (browser) — AdSense

### 1. Prerequisites

1. **Google account** used for AdSense.
2. **Site ownership**: you control DNS/hosting for your domain (e.g. `impostor.rgsoft.org`).
3. **Privacy policy** page that discloses advertising, cookies, and (if applicable) personalized ads and third parties. Link it from the site footer or settings.
4. **Compliance**: follow [AdSense program policies](https://support.google.com/adsense/answer/48182) and [Google Publisher Policies](https://support.google.com/admanager/answer/9335564). Games with user-generated content or sensitive themes need extra care; review policies for your exact UX.

### 2. AdSense account and site approval

1. Go to [Google AdSense](https://www.google.com/adsense/) and sign up.
2. Add your **site URL** and complete verification (meta tag or DNS, as AdSense instructs).
3. Wait for **site review**. Until approval, placeholders may show blank or “getting ready” messaging.

### 3. Technical integration in this repo

1. **Auto ads vs manual units**  
   - **Auto ads**: one script in `index.html`; Google places ads. Fastest, less layout control.  
   - **Ad units**: you create units in AdSense (display, in-article, multiplex, etc.) and paste the **ad unit code** where you want banners (e.g. below `#app`, or inside a view template).

2. **Where to put code**  
   - Global script: typically end of `<body>` in `index.html` (before or after your `app.js` module, per AdSense snippet instructions).  
   - **Placements that fit this app**: e.g. bottom of setup screen, between rounds, or a slim banner under the main card—avoid covering core controls or the “pass the phone” flow.

3. **Single Page Application behavior**  
   Your app swaps HTML via `innerHTML` in `js/app.js`. **AdSense needs stable DOM slots** or official **SPA guidance** for your integration type. Prefer:  
   - fixed containers **outside** the part of the DOM you wipe on every navigation, **or**  
   - re-initializing only where AdSense docs say it is supported for dynamic content.  
   If you destroy the node that contains the ad iframe, behavior can break; design a **persistent ad strip** in `index.html` and keep `#app` for game UI only.

4. **`ads.txt`**  
   Host `ads.txt` at the site root (`https://your-domain/ads.txt`) with the lines AdSense provides. On GitHub Pages, commit `ads.txt` next to `index.html` (or configure the host to serve it at root).

5. **EU / UK / CH consent (GDPR, etc.)**  
   If you serve users in those regions, use Google’s **Consent Management Platform** requirements (e.g. **Google-certified CMP** or IAB TCF integration) as described in current AdSense / privacy documentation. This is not optional for lawful personalized ads in many jurisdictions.

6. **Performance and UX**  
   Ads add weight and layout shift. Reserve space (min-height) for ad containers, lazy-load where policy allows, and test on slow mobile networks.

### 4. Launch checklist (web)

- [ ] AdSense site added and verified  
- [ ] `ads.txt` live at domain root  
- [ ] Privacy policy updated and linked  
- [ ] CMP / consent implemented if you target EU/UK/CH (or worldwide to be safe)  
- [ ] Ad containers do not break SPA navigation (no ads inside fully replaced `#app` fragments without a supported pattern)  
- [ ] Manual spot-check on mobile and desktop after deploy  

---

## Path B — AdMob in a mobile app that loads this website

Use this path if you ship **Android/iOS apps** that wrap or complement the web game.

### 1. AdMob setup (console)

1. Create or open an app in [AdMob](https://admob.google.com/).
2. Create **ad units** (e.g. banner, interstitial, rewarded).
3. Note the **App ID** and each **Ad unit ID** for client configuration.

### 2. Native integration

- **Android / iOS**: Integrate the [Google Mobile Ads SDK](https://developers.google.com/admob) per official guides (Kotlin/Java, Swift/Objective-C).
- **Flutter**: Use `google_mobile_ads` and follow [Flutter AdMob docs](https://developers.google.com/admob/flutter/quick-start).
- **Capacitor / Cordova**: Use a maintained community **AdMob plugin** that wraps the native SDK; keep plugin versions aligned with store policies.

### 3. WebView and your static site

If the game runs **inside a WebView**:

1. Enable **JavaScript**, **DOM storage**, and settings required by Google for ad-related content in that WebView.
2. For showing **web ad tags** (AdSense/GPT) *inside* the WebView, Google documents a **WebView API for Ads** (register the WebView with the Mobile Ads SDK) so ads and app signals work correctly. See:  
   [Integrate the WebView API for Ads (Android)](https://developers.google.com/ad-manager/mobile-ads-sdk/android/browser/webview/api-for-ads)  
   (Equivalent docs exist for iOS / Flutter.)

Alternatively, show **AdMob banners/interstitials only in native chrome** (above/below the WebView), which avoids mixing WebView ad policy with full-page `innerHTML` swaps.

### 4. Store and policy

- Complete **data safety** / privacy nutrition labels as required by Google Play and Apple App Store.
- Disclose ad usage, analytics, and ID usage in the store listing and in-app.

---

## Quick decision guide

- **“I only have a website on GitHub Pages.”** → Implement **AdSense** (Path A); treat “AdMob on the website” as a naming mix-up unless you later ship an app.  
- **“I will publish Android/iOS apps.”** → Implement **AdMob** in the app (Path B); keep the web build static or load it in a WebView with the APIs and policies above.  

---

## References (official)

- [AdSense start](https://support.google.com/adsense/answer/7402250)  
- [AdMob Android quick-start](https://developers.google.com/admob/android/quick-start)  
- [AdMob iOS quick-start](https://developers.google.com/admob/ios/quick-start)  
- [WebView API for Ads (Android)](https://developers.google.com/ad-manager/mobile-ads-sdk/android/browser/webview/api-for-ads)  

After you choose Path A or B, implement the smallest change that matches that path (e.g. one persistent ad slot in `index.html` for Path A, or native SDK only for Path B).
