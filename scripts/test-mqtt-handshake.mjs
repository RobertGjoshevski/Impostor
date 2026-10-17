/** Two isolated browser contexts (no BroadcastChannel) must connect via MQTT + WebRTC. */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173/';

async function openJoin(page, name, code) {
    await page.goto(BASE);
    await page.click('#playOnlineBtn');
    await page.click('#joinRoomBtn');
    await page.fill('#joinNameInput', name);
    await page.fill('#joinCodeInput', code);
    await page.click('#joinRoomSubmitBtn');
    await page.waitForSelector('#onlinePlayerList', { timeout: 25000 });
}

const browser = await chromium.launch({ headless: true });
const hostCtx = await browser.newContext();
const clientCtx = await browser.newContext();
const host = await hostCtx.newPage();
const client = await clientCtx.newPage();
host.setDefaultTimeout(25000);
client.setDefaultTimeout(25000);

await host.goto(BASE);
await host.click('#playOnlineBtn');
await host.click('#hostRoomBtn');
await host.fill('#hostNameInput', 'HostAda');
await host.click('#createRoomBtn');
await host.waitForSelector('#roomCodeDisplay');
const code = (await host.textContent('#roomCodeDisplay')).trim();
if (!/^[A-Z]{4}$/.test(code)) throw new Error(`bad code ${code}`);
console.log('room', code);

await openJoin(client, 'ClientBea', code);
await host.waitForFunction(() => document.querySelectorAll('#onlinePlayerList li').length >= 2);
const roster = await host.locator('#onlinePlayerList').innerText();
if (!/ClientBea/.test(roster)) throw new Error(`host roster missing name: ${roster}`);
if (/\b[0-9a-f]{8}…/i.test(roster)) throw new Error(`host roster still showing raw ids: ${roster}`);
const clientErr = await client.locator('p.text-error').count();
if (clientErr) {
    const errText = await client.locator('p.text-error').innerText();
    throw new Error(`client join error: ${errText}`);
}
console.log('mqtt+webrtc ok');
await browser.close();
