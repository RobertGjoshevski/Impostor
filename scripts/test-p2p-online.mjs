/**
 * Headless check: Host + 2 clients over WebRTC (localhost BroadcastChannel signaling).
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173/';

function delay(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

async function clickIf(page, selector) {
    await page.waitForSelector(selector, { timeout: 15000 });
    await page.click(selector);
}

async function main() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const host = await context.newPage();
    const c1 = await context.newPage();
    const c2 = await context.newPage();
    host.setDefaultTimeout(20000);
    c1.setDefaultTimeout(20000);
    c2.setDefaultTimeout(20000);

    await host.goto(BASE);
    await host.waitForSelector('#playOnlineBtn');
    await host.click('#playOnlineBtn');
    await host.click('#hostRoomBtn');
    await host.fill('#hostNameInput', 'HostAda');
    await host.click('#createRoomBtn');
    await host.waitForSelector('#roomCodeDisplay');
    const code = (await host.textContent('#roomCodeDisplay')).trim();
    if (!/^[A-Z]{4}$/.test(code)) throw new Error(`Bad room code: ${code}`);
    console.log('room', code);

    async function join(page, name) {
        await page.goto(BASE);
        await page.waitForSelector('#playOnlineBtn');
        await page.click('#playOnlineBtn');
        await page.click('#joinRoomBtn');
        await page.fill('#joinNameInput', name);
        await page.fill('#joinCodeInput', code);
        await page.click('#joinRoomSubmitBtn');
        await page.waitForSelector('#onlinePlayerList', { timeout: 25000 });
    }

    await join(c1, 'ClientBea');
    await join(c2, 'ClientCal');

    await host.waitForFunction(() => {
        const items = document.querySelectorAll('#onlinePlayerList li');
        return items.length >= 3;
    });

    const start = host.locator('#startOnlineBtn');
    await start.waitFor();
    if (await start.isDisabled()) {
        throw new Error('Start still disabled with 3 players');
    }
    await start.click();

    await host.waitForSelector('#revealCard', { timeout: 15000 });
    await c1.waitForSelector('#revealCard', { timeout: 15000 });
    await c2.waitForSelector('#revealCard', { timeout: 15000 });

    const secrets = [];
    for (const page of [host, c1, c2]) {
        const leaked = await page.evaluate(() => {
            const text = document.body.innerText;
            return {
                bodyHasImpostorList: /The Impostors/i.test(text) && /Deceiver/i.test(text),
            };
        });
        if (leaked.bodyHasImpostorList) throw new Error('Results leaked on reveal');
        const card = page.locator('#revealCard');
        await card.hover();
        await page.mouse.down();
        await delay(400);
        const secret = await page.locator('#revealedState').innerText();
        secrets.push(secret);
        await page.mouse.up();
        await delay(200);
        await page.click('#doneBtn');
    }

    const impostors = secrets.filter((s) => /IMPOSTOR/i.test(s)).length;
    const innocents = secrets.filter((s) => /INNOCENT/i.test(s)).length;
    if (impostors < 1 || innocents < 1) {
        throw new Error(`Role split wrong: ${JSON.stringify(secrets)}`);
    }
    const innocentSecrets = secrets.filter((s) => /INNOCENT/i.test(s));
    const impostorSecrets = secrets.filter((s) => /IMPOSTOR/i.test(s));
    for (const imp of impostorSecrets) {
        for (const inn of innocentSecrets) {
            const wordLine = inn.split('\n').pop();
            if (wordLine && imp.includes(wordLine) && wordLine.length > 2) {
                throw new Error(`Impostor saw crew word ${wordLine}`);
            }
        }
    }

    await host.waitForSelector('#firstPlayerContinueBtn', { timeout: 15000 });
    await host.click('#firstPlayerContinueBtn');
    await host.waitForSelector('#myVoteSelect');
    await c1.waitForSelector('#myVoteSelect');
    await c2.waitForSelector('#myVoteSelect');

    async function vote(page) {
        const select = page.locator('#myVoteSelect');
        const values = await select.locator('option:not([disabled])').evaluateAll((opts) =>
            opts.map((o) => o.value).filter(Boolean),
        );
        if (!values.length) throw new Error('No vote options');
        await select.selectOption(values[0]);
    }
    await vote(host);
    await vote(c1);
    await vote(c2);

    await host.waitForFunction(() => {
        const btn = document.getElementById('endRoundBtn');
        return btn && !btn.disabled;
    });
    await host.click('#endRoundBtn');
    await host.waitForSelector('#replayBtn');
    await c1.waitForFunction(() => document.body.innerText.includes('Waiting for the host'));
    console.log('ok');
    await browser.close();
}

main().catch(async (err) => {
    console.error(err);
    process.exit(1);
});
