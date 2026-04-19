import { t } from './i18n.js';

/**
 * Host apps (Capacitor / AdMob) can set `window.impostorShowRewardedAd` to a function
 * that returns a Promise resolving to `true` when the user earns the reward.
 *
 * @param {string} languageCode
 * @returns {Promise<boolean>}
 */
export function showRewardedAd(languageCode) {
    if (typeof window !== 'undefined' && typeof window.impostorShowRewardedAd === 'function') {
        return Promise.resolve(window.impostorShowRewardedAd({ language: languageCode }));
    }
    const ok = window.confirm(t(languageCode, 'unlockAdDemo'));
    return Promise.resolve(ok);
}
