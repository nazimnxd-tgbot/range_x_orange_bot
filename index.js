#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import { Bot, Keyboard, InlineKeyboard } from 'grammy';
import * as cheerio from 'cheerio';
import axios from 'axios';
import crypto from 'crypto';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ======================= DATA DIRECTORY SETUP FOR RAILWAY =======================
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data_cache');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`📁 Created data directory: ${DATA_DIR}`);
}

// File paths
const USER_DB_PATH = path.join(DATA_DIR, 'subscription_db.json');
const SUB_ADMIN_FILE = path.join(DATA_DIR, 'sub_admins.json');
const SUB_ADMIN_NAMES_FILE = path.join(DATA_DIR, 'sub_admin_names.json');
const LOG_PATH = path.join(DATA_DIR, 'bot_log.txt');
const DEVICE_ID_PATH = path.join(DATA_DIR, '.device_id');

// ======================= GOOGLE DRIVE FILE IDs (আপনার ID বসান) =======================
const DRIVE_FILES = {
    subscription: { id: "12VSS_cq37C5VgJDniXxOSyANKiw3GeI8", path: "subscription_db.json" },
    subAdmins: { id: "12tbUq-SwhRWqy2F3u6R-PhIYlpzkyMsc", path: "sub_admins.json" },
    subAdminNames: { id: "1nE-jEqc7XaLE1NbSmSmjfEDuwQuxgl9o", path: "sub_admin_names.json" },
    log: { id: "1GUL8MpQMTDodYsHtR52kHbxxU_zWnKOx", path: "bot_log.txt" }
};

// ======================= GOOGLE DRIVE FUNCTIONS =======================
async function downloadFromDrive(fileId) {
    try {
        const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return response.data;
    } catch (error) {
        const url = `https://drive.usercontent.google.com/download?id=${fileId}&export=download`;
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return response.data;
    }
}

async function loadDataFromDrive() {
    console.log("📁 Loading data from Google Drive...");
    
    for (const [key, file] of Object.entries(DRIVE_FILES)) {
        if (!file.id) continue;
        try {
            const content = await downloadFromDrive(file.id);
            const filePath = path.join(DATA_DIR, file.path);
            fs.writeFileSync(filePath, content);
            console.log(`✅ Loaded: ${file.path}`);
        } catch (error) {
            console.log(`⚠️ Could not load ${file.path}, starting fresh.`);
        }
    }
    console.log("✅ All data loaded from Google Drive!");
}

// ======================= LOAD CONFIG FILES =======================
let CONFIG = {};

try {
    const envPath = path.join(__dirname, 'config', 'env.js');
    if (fs.existsSync(envPath)) {
        const envModule = await import(`file://${envPath}`);
        CONFIG = { ...CONFIG, ...envModule };
        console.log('✅ Loaded env.js');
    }
} catch(e) { console.log('⚠️ Could not load env.js'); }

try {
    const paymentPath = path.join(__dirname, 'config', 'paymentenv.js');
    if (fs.existsSync(paymentPath)) {
        const paymentModule = await import(`file://${paymentPath}`);
        CONFIG = { ...CONFIG, ...paymentModule };
        console.log('✅ Loaded paymentenv.js');
    }
} catch(e) { console.log('⚠️ Could not load paymentenv.js'); }

try {
    const cliPath = path.join(__dirname, 'config', 'cli.js');
    if (fs.existsSync(cliPath)) {
        const cliModule = await import(`file://${cliPath}`);
        CONFIG = { ...CONFIG, ...cliModule };
        console.log('✅ Loaded cli.js');
    }
} catch(e) { console.log('⚠️ Could not load cli.js'); }

try {
    const countriesPath = path.join(__dirname, 'config', 'countries.js');
    if (fs.existsSync(countriesPath)) {
        const countriesModule = await import(`file://${countriesPath}`);
        CONFIG = { ...CONFIG, ...countriesModule };
        console.log('✅ Loaded countries.js');
    }
} catch(e) { console.log('⚠️ Could not load countries.js'); }

// Configuration variables
const BOT_TOKEN = CONFIG.BOT_TOKEN || process.env.BOT_TOKEN;
const ADMIN_ID = CONFIG.ADMIN_ID || parseInt(process.env.ADMIN_ID || '7064572216');
const ADMIN_USERNAME = CONFIG.ADMIN_USERNAME || process.env.ADMIN_USERNAME || "@xDnaZim";
const USERNAME = CONFIG.USERNAME || "n.nazim1132@gmail.com";
const PASSWORD = CONFIG.PASSWORD || "Abcd1234";
const BROWSER_COUNT = CONFIG.BROWSER_COUNT || 2;
const SCAN_INTERVAL_MS = CONFIG.SCAN_INTERVAL_MS || 3000;
const SCAN_TIMEOUT_MS = CONFIG.SCAN_TIMEOUT_MS || 15000;
const LOGIN_WAIT_MS = CONFIG.LOGIN_WAIT_MS || 8000;
const HEADLESS_MODE = CONFIG.HEADLESS_MODE !== undefined ? CONFIG.HEADLESS_MODE : true;
const DEVICE_VERIFICATION_ENABLED = CONFIG.DEVICE_VERIFICATION_ENABLED !== undefined ? CONFIG.DEVICE_VERIFICATION_ENABLED : true;
const DEVICE_SHEET_URL = CONFIG.DEVICE_SHEET_URL || "https://opensheet.elk.sh/17vn-T_6SRP-FLBtkSpBhsah98cyqWWrtOEHF2AsU778/SMS_DB";
const LOGIN_URL = CONFIG.LOGIN_URL || "https://www.orangecarrier.com/login";
const CLI_ACCESS_URL = CONFIG.CLI_ACCESS_URL || "https://www.orangecarrier.com/services/cli/access";
const LIVE_RESULT_LIMIT = CONFIG.LIVE_RESULT_LIMIT || 30;
const LIVE_COUNTRY_SUMMARY_LIMIT = CONFIG.LIVE_COUNTRY_SUMMARY_LIMIT || 10;
const LIVE_UPDATE_INTERVAL_SECONDS = CONFIG.LIVE_UPDATE_INTERVAL_SECONDS || 5;
const LIVE_SHOW_COUNTRY_SUMMARY = CONFIG.LIVE_SHOW_COUNTRY_SUMMARY !== undefined ? CONFIG.LIVE_SHOW_COUNTRY_SUMMARY : true;
const LIVE_AUTO_REFRESH_ENABLED = CONFIG.LIVE_AUTO_REFRESH_ENABLED !== undefined ? CONFIG.LIVE_AUTO_REFRESH_ENABLED : true;
const DEMO_LIVE_UPDATE_ENABLED = CONFIG.DEMO_LIVE_UPDATE_ENABLED !== undefined ? CONFIG.DEMO_LIVE_UPDATE_ENABLED : true;
const DEMO_LIVE_UPDATE_INTERVAL_SECONDS = CONFIG.DEMO_LIVE_UPDATE_INTERVAL_SECONDS || 5;
const REPORT_5_MIN_LIMIT = CONFIG.REPORT_5_MIN_LIMIT || 30;
const REPORT_5_MIN_COUNTRY_LIMIT = CONFIG.REPORT_5_MIN_COUNTRY_LIMIT || 10;
const REPORT_5_MIN_SHOW_COUNTRY_SUMMARY = CONFIG.REPORT_5_MIN_SHOW_COUNTRY_SUMMARY !== undefined ? CONFIG.REPORT_5_MIN_SHOW_COUNTRY_SUMMARY : true;
const REPORT_10_MIN_LIMIT = CONFIG.REPORT_10_MIN_LIMIT || 30;
const REPORT_10_MIN_COUNTRY_LIMIT = CONFIG.REPORT_10_MIN_COUNTRY_LIMIT || 10;
const REPORT_10_MIN_SHOW_COUNTRY_SUMMARY = CONFIG.REPORT_10_MIN_SHOW_COUNTRY_SUMMARY !== undefined ? CONFIG.REPORT_10_MIN_SHOW_COUNTRY_SUMMARY : true;
const TOP_HIT_LIMIT = CONFIG.TOP_HIT_LIMIT || 30;
const TOP_HIT_COUNTRY_LIMIT = CONFIG.TOP_HIT_COUNTRY_LIMIT || 10;
const TOP_HIT_WINDOW_MINUTES = CONFIG.TOP_HIT_WINDOW_MINUTES || 30;
const TOP_HIT_SHOW_COUNTRY_SUMMARY = CONFIG.TOP_HIT_SHOW_COUNTRY_SUMMARY !== undefined ? CONFIG.TOP_HIT_SHOW_COUNTRY_SUMMARY : true;
const SEARCH_RANGE_LIMIT = CONFIG.SEARCH_RANGE_LIMIT || 30;
const SEARCH_WINDOW_MINUTES = CONFIG.SEARCH_WINDOW_MINUTES || 30;
const SEARCH_COUNTRY_SUMMARY = CONFIG.SEARCH_COUNTRY_SUMMARY || false;
const CLI_SEARCH_LIMIT = CONFIG.CLI_SEARCH_LIMIT || 30;
const CLI_SEARCH_WINDOW_MINUTES = CONFIG.CLI_SEARCH_WINDOW_MINUTES || 30;
const CLI_SEARCH_COUNTRY_SUMMARY = CONFIG.CLI_SEARCH_COUNTRY_SUMMARY || false;
const DEMO_RESULTS_LIMIT = CONFIG.DEMO_RESULTS_LIMIT || 10;
const DEMO_WINDOW_MINUTES = CONFIG.DEMO_WINDOW_MINUTES || 60;
const DEMO_COUNTRY_SUMMARY_LIMIT = CONFIG.DEMO_COUNTRY_SUMMARY_LIMIT || 5;
const DEMO_MASK_MODE = CONFIG.DEMO_MASK_MODE !== undefined ? CONFIG.DEMO_MASK_MODE : true;
const RANGES_PER_CLI = CONFIG.RANGES_PER_CLI || 30;

// Payment config
const PAYMENT_METHODS = CONFIG.PAYMENT_METHODS || {};
const PREMIUM_PLAN = CONFIG.PREMIUM_PLAN || { duration: 30 };
const PRICE_SETTINGS = CONFIG.PRICE_SETTINGS || { bdt_amount: 130, bdt_currency: "BDT", usd_amount: 1, usd_currency: "$" };

function getPriceDisplay() {
    return `💵 Price : ${PRICE_SETTINGS.bdt_amount} ${PRICE_SETTINGS.bdt_currency} / ${PRICE_SETTINGS.usd_amount}${PRICE_SETTINGS.usd_currency}\n🗓️ Duration : ${PREMIUM_PLAN.duration} Days`;
}

function getCliTargets() {
    return CONFIG.CLI_TARGETS || [];
}

function getCountryFlag(countryName) {
    if (!countryName) return "🌍";
    if (CONFIG.getCountryFlag) return CONFIG.getCountryFlag(countryName);
    return "🌍";
}

function getCountryNameFromRange(rangeName) {
    const words = rangeName.split(' ');
    return words[0] || null;
}

// ======================= DEVICE VERIFICATION =======================
function getDeviceId() {
    const raw = os.platform() + os.hostname() + os.arch() + (os.cpus()[0]?.model || '');
    const deviceId = crypto.createHash('md5').update(raw).digest('hex');
    try {
        if (fs.existsSync(DEVICE_ID_PATH)) {
            const savedId = fs.readFileSync(DEVICE_ID_PATH, 'utf8').trim();
            if (savedId === deviceId) return deviceId;
        }
        fs.writeFileSync(DEVICE_ID_PATH, deviceId);
    } catch(e) {}
    return deviceId;
}

async function verifyDevice() {
    if (!DEVICE_VERIFICATION_ENABLED) {
        console.log(`⚠️ Device verification is DISABLED`);
        return true;
    }
    try {
        const deviceId = getDeviceId();
        console.log(`🔑 Device ID: ${deviceId}`);
        const response = await axios.get(DEVICE_SHEET_URL);
        const devices = response.data;
        const device = devices.find(d => d.device_id === deviceId);
        if (!device) {
            console.log(`❌ Device not registered!`);
            console.log(`📝 Your Device ID: ${deviceId}`);
            return false;
        }
        if (device.status !== 'active') {
            console.log(`❌ Device inactive! Status: ${device.status}`);
            return false;
        }
        console.log(`✅ Device verified!`);
        return true;
    } catch (error) {
        console.log(`❌ Device verification failed: ${error.message}`);
        return false;
    }
}

// ======================= DATABASES =======================
let users = {};
let scannerRunning = true;
let liveMessageId = null;
let activeLiveChat = null;
let liveUpdateInterval = null;
let demoLiveMessageId = null;
let activeDemoChat = null;
let demoLiveUpdateInterval = null;
let userPaymentState = {};
let userPaymentData = {};
let firstStartNotified = new Set();
let broadcastState = {};

// ======================= LIVE CACHE SYSTEM =======================
let liveDataCache = {};
let globalProcessedData = [];

// ======================= FILE OPERATIONS =======================
function loadUsers() {
    try {
        if (fs.existsSync(USER_DB_PATH)) {
            users = JSON.parse(fs.readFileSync(USER_DB_PATH, 'utf8'));
        }
        const now = Date.now();
        let changed = false;
        for (const [uid, data] of Object.entries(users)) {
            if (data.role === "premium" && data.expiry && data.expiry < now) {
                data.role = "demo";
                data.expiry = null;
                changed = true;
            }
        }
        if (changed) saveUsers();
    } catch(e) { users = {}; }
    console.log(`✅ Loaded ${Object.keys(users).length} users`);
}

function saveUsers() {
    try {
        fs.writeFileSync(USER_DB_PATH, JSON.stringify(users, null, 2), 'utf8');
    } catch(e) {}
}

function loadSubAdmins() {
    try {
        if (fs.existsSync(SUB_ADMIN_FILE)) {
            return JSON.parse(fs.readFileSync(SUB_ADMIN_FILE, 'utf8'));
        }
    } catch(e) {}
    return [];
}

function saveSubAdmins(admins) {
    try {
        fs.writeFileSync(SUB_ADMIN_FILE, JSON.stringify(admins, null, 2), 'utf8');
    } catch(e) {}
}

function loadSubAdminNames() {
    try {
        if (fs.existsSync(SUB_ADMIN_NAMES_FILE)) {
            return JSON.parse(fs.readFileSync(SUB_ADMIN_NAMES_FILE, 'utf8'));
        }
    } catch(e) {}
    return {};
}

function saveSubAdminNames(names) {
    try {
        fs.writeFileSync(SUB_ADMIN_NAMES_FILE, JSON.stringify(names, null, 2), 'utf8');
    } catch(e) {}
}

function addSubAdminWithName(uid, name) {
    const subs = loadSubAdmins();
    if (!subs.includes(uid)) {
        subs.push(uid);
        saveSubAdmins(subs);
        const names = loadSubAdminNames();
        names[String(uid)] = name;
        saveSubAdminNames(names);
        return true;
    }
    return false;
}

function removeSubAdmin(uid) {
    let subs = loadSubAdmins();
    if (subs.includes(uid)) {
        subs = subs.filter(id => id !== uid);
        saveSubAdmins(subs);
        const names = loadSubAdminNames();
        delete names[String(uid)];
        saveSubAdminNames(names);
        return true;
    }
    return false;
}

function getSubAdminName(uid) {
    const names = loadSubAdminNames();
    return names[String(uid)] || "Sub-Admin";
}

function logToFile(message) {
    try {
        fs.appendFileSync(LOG_PATH, `[${new Date().toISOString()}] ${message}\n`, 'utf8');
    } catch(e) {}
}

// ======================= USER MANAGEMENT =======================
function getUserRole(userId) {
    const uid = String(userId);
    if (uid === String(ADMIN_ID)) return "admin";
    const subAdmins = loadSubAdmins();
    if (subAdmins.includes(uid)) return "sub_admin";
    if (users[uid]?.role === "premium") {
        if (users[uid].expiry && users[uid].expiry < Date.now()) {
            users[uid].role = "demo";
            users[uid].expiry = null;
            saveUsers();
            return "demo";
        }
        return "premium";
    }
    return "demo";
}

function addDemoUser(userId, username, name) {
    const uid = String(userId);
    if (!users[uid]) {
        const now = new Date().toISOString();
        users[uid] = { 
            role: "demo", 
            name: name || "Demo User", 
            username: username || "", 
            firstSeen: now,
            startDate: now
        };
        saveUsers();
        return true;
    }
    return false;
}

function addPremiumUser(userId, name = "User", days = 30) {
    const uid = String(userId);
    const expiry = Date.now() + (days * 24 * 60 * 60 * 1000);
    const now = new Date().toISOString();
    const expiryDate = new Date(expiry);
    const formattedExpiry = expiryDate.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
    
    if (!users[uid]) {
        users[uid] = { 
            role: "premium", 
            name: name, 
            addedAt: now,
            premiumStartDate: now,
            expiry: expiry,
            expiryFormatted: formattedExpiry,
            firstSeen: now,
            startDate: now
        };
        saveUsers();
        return formattedExpiry;
    }
    if (users[uid].role !== "premium") {
        users[uid].role = "premium";
        users[uid].premiumStartDate = now;
        users[uid].expiry = expiry;
        users[uid].expiryFormatted = formattedExpiry;
        saveUsers();
        return formattedExpiry;
    }
    users[uid].expiry = expiry;
    users[uid].expiryFormatted = formattedExpiry;
    users[uid].premiumStartDate = now;
    saveUsers();
    return formattedExpiry;
}

function removeUser(userId) {
    const uid = String(userId);
    if (users[uid] && uid !== String(ADMIN_ID)) {
        delete users[uid];
        saveUsers();
        return true;
    }
    return false;
}

function getAllUsersList() {
    const subAdmins = loadSubAdmins();
    const premiumUsers = [];
    const demoUsers = [];
    
    for (const [uid, data] of Object.entries(users)) {
        if (uid !== String(ADMIN_ID) && !subAdmins.includes(uid)) {
            if (data.role === "premium") {
                let daysLeft = 0;
                let expiryText = "N/A";
                if (data.expiry) {
                    daysLeft = Math.ceil((data.expiry - Date.now()) / (24 * 60 * 60 * 1000));
                    expiryText = data.expiryFormatted || new Date(data.expiry).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
                }
                premiumUsers.push({ userId: uid, name: data.name || "User", expiry: expiryText, daysLeft: daysLeft });
            } else if (data.role === "demo") {
                demoUsers.push({ userId: uid, name: data.name || "Demo User" });
            }
        }
    }
    
    premiumUsers.sort((a, b) => a.daysLeft - b.daysLeft);
    
    let msg = "";
    msg += "🤷‍♂️______ALL USER LIST ______ 🤷‍♂️\n\n";
    msg += "    ✅ _____BOT OWNER_____✅\n\n";
    msg += `👤 UID: \`${ADMIN_ID}\` | Name: Owner\n`;
    msg += `⏳ Validity: Lifetime\n\n`;
    
    if (subAdmins.length > 0) {
        msg += "🔰_____SUB-ADMINS PANEL_____🔰\n\n";
        for (const uid of subAdmins) {
            const name = getSubAdminName(uid);
            msg += `👤 UID: \`${uid}\` | Name: ${escapeMarkdown(name)}\n`;
            msg += `⏳ Validity: Lifetime\n\n`;
        }
    } else {
        msg += "🔰_____SUB-ADMINS PANEL_____🔰\n\n";
        msg += "❌ No Sub-Admins Found\n\n";
    }
    
    if (premiumUsers.length > 0) {
        msg += "💎_____PREMIUM USERS_____💎\n\n";
        for (const user of premiumUsers) {
            const daysText = user.daysLeft > 0 ? `${user.daysLeft} Days Left` : (user.daysLeft === 0 ? "Expires Today" : "Expired");
            msg += `👤 UID: \`${user.userId}\` | Name: ${escapeMarkdown(user.name)}\n`;
            msg += `📅 Exp: ${user.expiry} | ⏳ ${daysText}\n\n`;
        }
    } else {
        msg += "💎_____PREMIUM USERS_____💎\n\n";
        msg += "❌ No Premium Users Found\n\n";
    }
    
    if (demoUsers.length > 0) {
        msg += "❇️ _____DEMO USERS_____❇️\n\n";
        let count = 1;
        for (const user of demoUsers) {
            msg += `${count}. 👤 UID: \`${user.userId}\` | Name: ${escapeMarkdown(user.name)}\n\n`;
            count++;
        }
    } else {
        msg += "❇️ _____DEMO USERS_____❇️\n\n";
        msg += "❌ No Demo Users Found\n\n";
    }
    
    msg += "═════════════\n";
    msg += `📊 Total Premium: ${premiumUsers.length} Users\n`;
    msg += `🛡 Total Sub-Admins: ${subAdmins.length} Users\n`;
    msg += `🆓 Total Demo: ${demoUsers.length} Users\n`;
    msg += "═════════════";
    return msg;
}

function escapeMarkdown(text) {
    if (!text) return '';
    const specialChars = /[_*[\]()~`>#+\-=|{}.!]/g;
    return text.replace(specialChars, '\\$&');
}

function getUserInfo(userId, firstName, lastName, username) {
    const role = getUserRole(userId);
    let name = `${firstName || ""} ${lastName || ""}`.trim() || "User";
    name = escapeMarkdown(name);
    const uname = username ? escapeMarkdown(username) : "";
    const userData = users[String(userId)];
    
    if (role === "admin") {
        return { name, username: uname || ADMIN_USERNAME.slice(1), userId, status: "👑 ADMIN OWNER", role: "admin", accessLevel: "FULL CONTROL", panel: "ADMIN DASHBOARD", security: "MAXIMUM", systemAccess: "System Owner Access Enabled" };
    }
    if (role === "sub_admin") {
        const adminName = getSubAdminName(String(userId));
        return { name: adminName || name, username: uname || "Sub-Admin", userId, status: "🛡️ SUB-ADMIN", role: "sub_admin", accessLevel: "MODERATE CONTROL", panel: "SUB-ADMIN DASHBOARD", security: "HIGH", systemAccess: "Limited Admin Access Enabled" };
    }
    if (role === "premium") {
        const daysLeft = userData?.expiry ? Math.ceil((userData.expiry - Date.now()) / (24 * 60 * 60 * 1000)) : 30;
        const startDate = userData?.premiumStartDate ? new Date(userData.premiumStartDate).toLocaleDateString() : "N/A";
        const expiryDate = userData?.expiryFormatted || "N/A";
        return { name: userData?.name ? escapeMarkdown(userData.name) : name, username: uname || "Premium User", userId, status: `💎 PREMIUM (${daysLeft} days left)`, role: "premium", startDate, expiryDate, daysLeft, liveRange: "UNLOCKED", analytics: "UNLOCKED", features: "FULL ACCESS" };
    }
    return { name, username: uname || "Demo User", userId, status: "🎲 DEMO MODE", role: "demo", accessLevel: "LIMITED", liveData: "RESTRICTED", analytics: "LOCKED" };
}

// ======================= LIVE CACHE DATA PROCESSING =======================
function updateLiveCache(cliTarget, newResults) {
    delete liveDataCache[cliTarget];
    if (newResults.length > 0) liveDataCache[cliTarget] = newResults;
    
    const allResults = [];
    for (const cli in liveDataCache) allResults.push(...liveDataCache[cli]);
    
    const stats = {};
    for (const item of allResults) {
        const range = item.range;
        const cli = item.cli;
        const foundTime = new Date(item.found_at);
        if (!stats[range]) stats[range] = { hits: 0, clis: new Set(), lastSeen: item.found_at, lastSeenTime: foundTime };
        stats[range].hits++;
        stats[range].clis.add(cli);
        if (foundTime > stats[range].lastSeenTime) { stats[range].lastSeen = item.found_at; stats[range].lastSeenTime = foundTime; }
    }
    
    globalProcessedData = [];
    for (const [range, data] of Object.entries(stats)) globalProcessedData.push({ range, hits: data.hits, cliCount: data.clis.size, lastSeen: data.lastSeen });
    globalProcessedData.sort((a, b) => b.hits - a.hits);
    
    const cutoff = Date.now() - 30 * 60 * 1000;
    for (const cli in liveDataCache) {
        liveDataCache[cli] = liveDataCache[cli].filter(item => new Date(item.found_at).getTime() > cutoff);
        if (liveDataCache[cli].length === 0) delete liveDataCache[cli];
    }
    return globalProcessedData;
}

function getLiveResults(limit = 50) { return globalProcessedData.slice(0, limit); }

function getTimeBasedResults(minutes, limit = 50) {
    const cutoff = Date.now() - minutes * 60 * 1000;
    const stats = {};
    const allResults = [];
    for (const cli in liveDataCache) for (const item of liveDataCache[cli]) if (new Date(item.found_at).getTime() > cutoff) allResults.push(item);
    
    for (const item of allResults) {
        const range = item.range;
        const cli = item.cli;
        const foundTime = new Date(item.found_at);
        if (!stats[range]) stats[range] = { hits: 0, clis: new Set(), lastSeen: item.found_at, lastSeenTime: foundTime };
        stats[range].hits++;
        stats[range].clis.add(cli);
        if (foundTime > stats[range].lastSeenTime) { stats[range].lastSeen = item.found_at; stats[range].lastSeenTime = foundTime; }
    }
    
    const results = [];
    for (const [range, data] of Object.entries(stats)) results.push({ range, hits: data.hits, cliCount: data.clis.size, lastSeen: data.lastSeen });
    results.sort((a, b) => b.hits - a.hits);
    return results.slice(0, limit);
}

function searchByKeyword(keyword, minutes = 30, limit = 20) {
    const kw = keyword.toLowerCase();
    const cutoff = Date.now() - minutes * 60 * 1000;
    const stats = {};
    const allResults = [];
    for (const cli in liveDataCache) for (const item of liveDataCache[cli]) if (new Date(item.found_at).getTime() > cutoff && item.range.toLowerCase().includes(kw)) allResults.push(item);
    
    for (const item of allResults) {
        const range = item.range;
        if (!stats[range]) stats[range] = { hits: 0, clis: new Set(), lastSeen: item.found_at };
        stats[range].hits++;
        stats[range].clis.add(item.cli);
        if (new Date(item.found_at) > new Date(stats[range].lastSeen)) stats[range].lastSeen = item.found_at;
    }
    
    const results = [];
    for (const [range, data] of Object.entries(stats)) results.push({ range, hits: data.hits, cliCount: data.clis.size, lastSeen: data.lastSeen });
    results.sort((a, b) => b.hits - a.hits);
    return results.slice(0, limit);
}

function getCountryStats(minutes) {
    const cutoff = Date.now() - minutes * 60 * 1000;
    const countryStats = {};
    const allResults = [];
    for (const cli in liveDataCache) for (const item of liveDataCache[cli]) if (new Date(item.found_at).getTime() > cutoff) allResults.push(item);
    
    for (const item of allResults) {
        const country = getCountryNameFromRange(item.range) || item.range.split(' ')[0] || "Unknown";
        if (!countryStats[country]) countryStats[country] = { hits: 0, ranges: new Set() };
        countryStats[country].hits++;
        countryStats[country].ranges.add(item.range);
    }
    return Object.entries(countryStats).map(([country, data]) => ({ country, hits: data.hits, rangeCount: data.ranges.size })).sort((a, b) => b.hits - a.hits);
}

function getTimeAgo(foundTime) {
    const diff = (Date.now() - new Date(foundTime).getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
}

function maskRange(rangeName) {
    if (!rangeName) return rangeName;
    const parts = rangeName.split(' ');
    if (parts.length >= 3) {
        const lastPart = parts[parts.length - 1];
        if (lastPart.length >= 3) parts[parts.length - 1] = lastPart.charAt(0) + '*'.repeat(lastPart.length - 1);
        else if (lastPart.length === 2) parts[parts.length - 1] = lastPart.charAt(0) + '*';
        else if (lastPart.length === 1) parts[parts.length - 1] = '*';
        return parts.join(' ');
    }
    if (rangeName.length >= 4) return rangeName.substring(0, 3) + '***';
    return rangeName.substring(0, 1) + '*';
}

function formatResult(rangesData, title, timeWindow, totalHits = null, isDemo = false, countryStats = null, countryLimit = 10) {
    if (totalHits === null) totalHits = rangesData.reduce((s, i) => s + i.hits, 0);
    const currentTime = new Date().toLocaleTimeString();
    let msg = `🔥 **${title}** 🔥\n───────────────\n🕐 Time: ${currentTime}\n⏱️ Window: ${timeWindow}\n📊 Active Ranges: ${rangesData.length}\n───────────────\n\n`;
    
    if (countryStats && countryStats.length > 0 && countryLimit > 0) {
        msg += `🌍 **TOP COUNTRIES** 🌍\n───────────────\n`;
        for (let i = 0; i < Math.min(countryStats.length, countryLimit); i++) {
            const country = countryStats[i];
            const flag = getCountryFlag(country.country);
            msg += `${i+1}. ${flag} ${country.country} → ${country.hits} hits | ${country.rangeCount} ranges\n`;
        }
        msg += `\n───────────────\n\n`;
    }
    
    const displayCount = isDemo ? Math.min(rangesData.length, DEMO_RESULTS_LIMIT) : Math.min(rangesData.length, 30);
    if (displayCount > 0) {
        msg += `🔥 **TOP RANGES** 🔥\n───────────────\n\n`;
        for (let i = 0; i < displayCount; i++) {
            const item = rangesData[i];
            const countryName = item.range.split(' ')[0];
            const flag = getCountryFlag(countryName);
            let rangeText = item.range;
            if (isDemo && DEMO_MASK_MODE) rangeText = maskRange(item.range);
            msg += `${i+1}. 👉 \`${rangeText}\` ${flag}\n   📊 ${item.hits} hits | ${item.cliCount} CLI | ⏱️ ${getTimeAgo(item.lastSeen)}\n\n`;
        }
    } else {
        msg += "No data found.\n\n";
    }
    msg += `───────────────\n📈 Total Hits: ${totalHits}\n───────────────\n💡 Tap any range name to copy it`;
    if (isDemo) msg += `\n\n───────────────\n✨ **PREMIUM FEATURES** ✨\n───────────────\n• 🟢 Live Range Auto-Refresh\n• 📊 Advanced Analytics\n• 🔍 Country Wise Search\n• 🏆 Most Hit Analysis\n───────────────\n🔒 **UPGRADE TO PREMIUM**`;
    return msg;
}

// ======================= FAST PLAYWRIGHT SCANNER =======================
async function fastLoginToOrange(page, browserId) {
    try {
        console.log(`🌐 Browser ${browserId}: Logging in...`);
        await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
        await page.waitForTimeout(3000);
        
        const emailSelector = 'input[type="email"], input[name="email"], #email';
        await page.waitForSelector(emailSelector, { timeout: 15000 });
        await page.click(emailSelector, { clickCount: 3 });
        await page.keyboard.press('Backspace');
        await page.type(emailSelector, USERNAME, { delay: 30 });
        
        const passwordSelector = 'input[type="password"], #password';
        await page.waitForSelector(passwordSelector, { timeout: 10000 });
        await page.click(passwordSelector, { clickCount: 3 });
        await page.keyboard.press('Backspace');
        await page.type(passwordSelector, PASSWORD, { delay: 30 });
        
        const loginBtn = await page.$('button[type="submit"], input[type="submit"]');
        if (loginBtn) await loginBtn.click();
        else await page.keyboard.press('Enter');
        
        console.log(`⏳ Browser ${browserId}: Waiting ${LOGIN_WAIT_MS/1000} seconds...`);
        await page.waitForTimeout(LOGIN_WAIT_MS);
        console.log(`✅ Browser ${browserId}: Login successful!`);
        return true;
    } catch (e) {
        console.log(`❌ Browser ${browserId}: Login failed - ${e.message}`);
        return false;
    }
}

async function fastScanSingleTarget(page, target, browserId) {
    try {
        await page.goto(CLI_ACCESS_URL, { waitUntil: "domcontentloaded", timeout: SCAN_TIMEOUT_MS });
        await page.waitForTimeout(1000);
        await page.waitForSelector('#CLI', { timeout: 10000 });
        await page.click('#CLI', { clickCount: 3 });
        await page.keyboard.press('Backspace');
        await page.type('#CLI', target, { delay: 20 });
        await page.click('#SearchBtn');
        await page.waitForSelector('#Result table tbody tr', { timeout: 8000 });
        
        const ranges = await page.evaluate((params) => {
            const rows = document.querySelectorAll('#Result table tbody tr');
            const results = [];
            let count = 0;
            for (const row of rows) {
                if (count >= params.RANGES_PER_CLI) break;
                const cols = row.querySelectorAll('td');
                if (cols.length > 5) {
                    const rangeName = cols[0]?.textContent?.trim() || '';
                    const cli = cols[3]?.textContent?.trim() || '';
                    if (rangeName && cli && rangeName !== "No data found" && !rangeName.includes("No data") && rangeName.length > 2) {
                        results.push({ range: rangeName, cli: cli, country: params.target, found_at: new Date().toISOString(), browser: params.browserId });
                        count++;
                    }
                }
            }
            return results;
        }, { target: target, browserId: browserId, RANGES_PER_CLI: RANGES_PER_CLI });
        
        if (ranges.length > 0) {
            console.log(`✅ Browser ${browserId}: ${target} → Found ${ranges.length} ranges`);
            updateLiveCache(target, ranges);
        }
        return ranges;
    } catch (e) {
        console.log(`❌ Browser ${browserId}: ${target} - ${e.message}`);
        return [];
    }
}

async function startFastBrowserScanner(browserId, assignedTargets) {
    let browser = null, context = null, page = null;
    let targetIndex = 0, loginRetryCount = 0, maxLoginRetries = 5;
    
    while (scannerRunning) {
        try {
            if (!browser) {
                console.log(`🚀 Browser ${browserId}: Launching Playwright...`);
                browser = await chromium.launch({
                    headless: HEADLESS_MODE,
                    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled', '--disable-dev-shm-usage']
                });
                context = await browser.newContext({
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
                    viewport: { width: 1366, height: 768 }
                });
                page = await context.newPage();
                
                const loginSuccess = await fastLoginToOrange(page, browserId);
                if (!loginSuccess) {
                    loginRetryCount++;
                    if (loginRetryCount >= maxLoginRetries) {
                        await browser.close();
                        browser = null;
                        loginRetryCount = 0;
                        await new Promise(r => setTimeout(r, 30000));
                        continue;
                    }
                    await browser.close();
                    browser = null;
                    await new Promise(r => setTimeout(r, 10000));
                    continue;
                }
                loginRetryCount = 0;
            }
            
            const target = assignedTargets[targetIndex % assignedTargets.length];
            targetIndex++;
            console.log(`🔍 Browser ${browserId}: Scanning ${target}...`);
            await fastScanSingleTarget(page, target, browserId);
            await new Promise(r => setTimeout(r, SCAN_INTERVAL_MS));
        } catch (e) {
            console.log(`❌ Browser ${browserId}: ${e.message}, restarting...`);
            if (browser) { try { await browser.close(); } catch(e) {} }
            browser = null;
            await new Promise(r => setTimeout(r, 10000));
        }
    }
}

function startMultiBrowserScanner() {
    const cliTargets = getCliTargets();
    if (cliTargets.length === 0) { console.log(`⚠️ No CLI targets found!`); return; }
    const browserCount = Math.min(BROWSER_COUNT, cliTargets.length);
    const perBrowser = Math.ceil(cliTargets.length / browserCount);
    console.log(`\n🚀 Starting ${browserCount} Chrome browsers...`);
    console.log(`📋 Total CLI targets: ${cliTargets.length}`);
    console.log(`🖥️ Headless Mode: ${HEADLESS_MODE ? "ON" : "OFF"}\n`);
    for (let i = 0; i < browserCount; i++) {
        const startIdx = i * perBrowser;
        const endIdx = Math.min(startIdx + perBrowser, cliTargets.length);
        const assigned = cliTargets.slice(startIdx, endIdx);
        console.log(`📌 Browser ${i+1}: assigned ${assigned.length} targets`);
        startFastBrowserScanner(i+1, assigned);
    }
}

// ======================= KEYBOARDS =======================
function getMainKeyboard(role) {
    const kb = new Keyboard()
        .row({ text: "🎭 LIVE RESULT" }, { text: "🔍 SEARCH RANGE" })
        .row({ text: "♻️ 5 MIN" }, { text: "♻️ 10 MIN" })
        .row({ text: "🔝 TOP HIT" }, { text: "📊 CLI SEARCH" })
        .row({ text: "👤 MY INFO" }, { text: "🧑‍💻 DEVELOPER" });
    if (role === "admin" || role === "sub_admin") kb.row({ text: "👑 ADMIN PANEL" });
    return kb.resized();
}

function getAdminKeyboard(isMainAdmin) {
    const kb = new Keyboard();
    if (isMainAdmin) {
        kb.row({ text: "✅ ADD USER" }, { text: "❎ REMOVE USER" })
          .row({ text: "🔥 ADD SUB-ADMIN" }, { text: "❄️ REMOVE SUB-ADMIN" })
          .row({ text: "📋 USER LIST" }, { text: "📢 BROADCAST" })
          .row({ text: "🔙 BACK TO MAIN" });
    } else {
        kb.row({ text: "✅ ADD USER" }, { text: "❎ REMOVE USER" })
          .row({ text: "📋 USER LIST" })
          .row({ text: "🔙 BACK TO MAIN" });
    }
    return kb.resized();
}

function getDemoKeyboard() {
    return new Keyboard()
        .row({ text: "📊 DEMO RESULTS" })
        .row({ text: "✅ UPGRADE TO PREMIUM" })
        .row({ text: "👤 MY INFO" }, { text: "📞 CONTACT US" })
        .resized();
}

function getBroadcastKeyboard() {
    return new Keyboard().row({ text: "💎 PREMIUM USERS" }, { text: "🎲 DEMO USERS" }).row({ text: "👥 ALL USERS" }, { text: "🔙 BACK" }).resized();
}

function getPaymentMethodsKeyboard() {
    return new Keyboard().row({ text: "📲 Bkash" }, { text: "💰 Nagad" }).row({ text: "🚀 Rocket" }, { text: "🪙 Binance" }).row({ text: "🔙 Back" }).resized();
}

function getBackKeyboard() {
    return new Keyboard().row({ text: "🔙 Back" }).resized();
}

// ======================= BOT SETUP =======================
const bot = new Bot(BOT_TOKEN);
const userStates = {};

async function startLiveUpdates(chatId) {
    if (liveUpdateInterval) clearInterval(liveUpdateInterval);
    activeLiveChat = chatId;
    liveUpdateInterval = setInterval(async () => {
        if (!activeLiveChat || !liveMessageId) return;
        const results = getTimeBasedResults(3, LIVE_RESULT_LIMIT);
        const countryStats = LIVE_SHOW_COUNTRY_SUMMARY ? getCountryStats(3) : null;
        if (results.length > 0) {
            const total = results.reduce((s, r) => s + r.hits, 0);
            const msg = formatResult(results, "LIVE RESULT", "Last 3 Minutes", total, false, countryStats, LIVE_COUNTRY_SUMMARY_LIMIT);
            try { await bot.api.editMessageText(activeLiveChat, liveMessageId, msg, { parse_mode: "Markdown" }); } catch(e) {}
        }
    }, LIVE_UPDATE_INTERVAL_SECONDS * 1000);
}

async function startDemoLiveUpdates(chatId) {
    if (demoLiveUpdateInterval) clearInterval(demoLiveUpdateInterval);
    activeDemoChat = chatId;
    demoLiveUpdateInterval = setInterval(async () => {
        if (!activeDemoChat || !demoLiveMessageId) return;
        const res = getTimeBasedResults(DEMO_WINDOW_MINUTES, DEMO_RESULTS_LIMIT);
        const countryStats = DEMO_MASK_MODE ? getCountryStats(DEMO_WINDOW_MINUTES).slice(0, DEMO_COUNTRY_SUMMARY_LIMIT) : null;
        if (res.length > 0) {
            const msg = formatResult(res, "DEMO RESULTS", `Last ${DEMO_WINDOW_MINUTES} Minutes`, res.reduce((s, r) => s + r.hits, 0), true, countryStats, DEMO_COUNTRY_SUMMARY_LIMIT);
            try { await bot.api.editMessageText(activeDemoChat, demoLiveMessageId, msg, { parse_mode: "Markdown" }); } catch(e) {}
        }
    }, DEMO_LIVE_UPDATE_INTERVAL_SECONDS * 1000);
}

async function sendBroadcast(ctx, targetType, message) {
    let successCount = 0, failCount = 0, targetUsers = [];
    if (targetType === "premium") {
        for (const [uid, data] of Object.entries(users)) if (data.role === "premium") targetUsers.push(uid);
    } else if (targetType === "demo") {
        for (const [uid, data] of Object.entries(users)) if (data.role === "demo") targetUsers.push(uid);
    } else if (targetType === "all") {
        for (const [uid, data] of Object.entries(users)) if (data.role === "premium" || data.role === "demo") targetUsers.push(uid);
    }
    for (const uid of targetUsers) {
        try { await ctx.api.sendMessage(uid, message, { parse_mode: "Markdown" }); successCount++; await new Promise(r => setTimeout(r, 50)); } catch(e) { failCount++; }
    }
    return { successCount, failCount, total: targetUsers.length };
}

bot.catch((err) => { console.error("Bot error:", err.message); logToFile(`Bot error: ${err.message}`); });

// ==================== COMMANDS ====================
bot.command("start", async (ctx) => {
    try {
        const uid = ctx.from.id;
        const role = getUserRole(uid);
        delete userStates[uid];
        delete broadcastState[uid];
        
        const fullName = `${ctx.from.first_name || ""} ${ctx.from.last_name || ""}`.trim() || "User";
        const escapedFullName = escapeMarkdown(fullName);
        
        if (role === "demo") {
            const isNew = addDemoUser(uid, ctx.from.username, fullName);
            if (isNew && !firstStartNotified.has(String(uid))) {
                firstStartNotified.add(String(uid));
                try { await ctx.api.sendMessage(ADMIN_ID, `🆕 **NEW DEMO USER!**\n👤 ${fullName}\n🆔 \`${uid}\``, { parse_mode: "Markdown" }); } catch(e) {}
            }
            const welcomeMsg = `👋 Hello ${escapedFullName} ⚡\n\n🎉 Welcome To Range X Orange Bot 🎉\n━━━━━━━━━━━━━━━\n\n📌 **Bot Features:**\n• 🟢 Live Results\n• ⏱️ 5 Minute Report\n• 🕙 10 Minute Report\n• 🔍 Range Search\n• 📊 CLI Analytics\n• 🏆 Most Hit Ranges\n\n━━━━━━━━━━━━━━━\n⚡ Fast • Live • Real-Time Monitoring System\n🔒 **Premium Access Required For Full Features**\n\n🚀 Use Buttons Below`;
            const kb = getDemoKeyboard();
            await ctx.reply(welcomeMsg, { parse_mode: "Markdown", reply_markup: kb });
        } 
        else if (role === "premium") {
            const userData = users[String(uid)];
            const daysLeft = userData?.expiry ? Math.ceil((userData.expiry - Date.now()) / (24 * 60 * 60 * 1000)) : 30;
            const welcomeMsg = `👋 Welcome Back ${escapedFullName} ⚡\n\n🎉 **Premium Access Active** 🎉\n━━━━━━━━━━━━━━━\n\n📌 **Premium Features Unlocked:**\n• 🟢 Live Results (Auto-Refresh)\n• ⏱️ 5 Minute Report\n• 🕙 10 Minute Report\n• 🔍 Range Search (Full Access)\n• 📊 CLI Analytics (Advanced)\n• 🏆 Most Hit Ranges\n• 🌍 Country Wise Search\n• 📈 Advanced Statistics\n\n━━━━━━━━━━━━━━━\n💎 **Your Premium Plan**\n📅 Valid for: ${daysLeft} days remaining\n━━━━━━━━━━━━━━━\n⚡ Fast • Live • Real-Time Monitoring System\n✅ **Full Access Granted**\n\n🚀 Use Buttons Below`;
            const kb = getMainKeyboard(role);
            await ctx.reply(welcomeMsg, { parse_mode: "Markdown", reply_markup: kb });
        }
        else if (role === "admin") {
            const welcomeMsg = `👋 Hello ${escapedFullName} ⚡\n\n🎉 **Welcome To Range X Orange Bot** 🎉\n━━━━━━━━━━━━━━━\n\n👑 **Admin Dashboard Active**\n\n📌 **Bot Features:**\n• 🟢 Live Results\n• ⏱️ 5 Minute Report\n• 🕙 10 Minute Report\n• 🔍 Range Search\n• 📊 CLI Analytics\n• 🏆 Most Hit Ranges\n\n━━━━━━━━━━━━━━━\n🛡️ **Admin Access**\n• ✅ Add/Remove Users\n• 🔥 Add/Remove Sub-Admins\n• 📋 User List\n• 📢 Broadcast Message\n━━━━━━━━━━━━━━━\n⚡ Fast • Live • Real-Time Monitoring System\n\n🚀 Use Buttons Below`;
            const kb = getMainKeyboard(role);
            await ctx.reply(welcomeMsg, { parse_mode: "Markdown", reply_markup: kb });
        }
        else if (role === "sub_admin") {
            const adminName = getSubAdminName(String(uid));
            const welcomeMsg = `👋 Hello ${escapeMarkdown(adminName) || escapedFullName} ⚡\n\n🎉 **Welcome To Range X Orange Bot** 🎉\n━━━━━━━━━━━━━━━\n\n🛡️ **Sub-Admin Dashboard Active**\n\n📌 **Bot Features:**\n• 🟢 Live Results\n• ⏱️ 5 Minute Report\n• 🕙 10 Minute Report\n• 🔍 Range Search\n• 📊 CLI Analytics\n• 🏆 Most Hit Ranges\n\n━━━━━━━━━━━━━━━\n🛡️ **Sub-Admin Access**\n• ✅ Add/Remove Users\n• 📋 User List\n━━━━━━━━━━━━━━━\n⚡ Fast • Live • Real-Time Monitoring System\n\n🚀 Use Buttons Below`;
            const kb = getMainKeyboard(role);
            await ctx.reply(welcomeMsg, { parse_mode: "Markdown", reply_markup: kb });
        }
    } catch (e) {
        console.error("Start error:", e.message);
        await ctx.reply("⚠️ An error occurred. Please try again.");
    }
});

bot.command("myinfo", async (ctx) => {
    try {
        const info = getUserInfo(ctx.from.id, ctx.from.first_name, ctx.from.last_name, ctx.from.username);
        let msg = "";
        if (info.role === "admin") {
            msg = `👤 **USER PROFILE**\n────────────────────────\n1. Name: \`${info.name}\`\n2. Username: @${info.username}\n3. User ID: \`${info.userId}\`\n4. Status: ${info.status}\n────────────────────────\n🛡 Access Level: ${info.accessLevel}\n⚙️ Panel: ${info.panel}\n🔐 Security: ${info.security}\n🛡 ${info.systemAccess}\n────────────────────────`;
        } else if (info.role === "sub_admin") {
            msg = `👤 **USER PROFILE**\n────────────────────────\n1. Name: \`${info.name}\`\n2. Username: @${info.username}\n3. User ID: \`${info.userId}\`\n4. Status: ${info.status}\n────────────────────────\n🛡 Access Level: ${info.accessLevel}\n⚙️ Panel: ${info.panel}\n🔐 Security: ${info.security}\n🛡 ${info.systemAccess}\n────────────────────────`;
        } else if (info.role === "premium") {
            msg = `👤 **USER PROFILE**\n────────────────────────\n1. Name: \`${info.name}\`\n2. Username: @${info.username}\n3. User ID: \`${info.userId}\`\n4. Status: ${info.status}\n────────────────────────\n⭐ Premium Start: ${info.startDate}\n⏰ Premium Expiry: ${info.expiryDate}\n📊 Validity: ${info.daysLeft} days remaining\n────────────────────────\n⚡ Live Range: ${info.liveRange}\n📊 Analytics: ${info.analytics}\n🔥 Features: ${info.features}\n────────────────────────\n🔥 **Thanks for joining Premium!** 😊`;
        } else {
            msg = `👤 **USER PROFILE**\n────────────────────────\n1. Name: \`${info.name}\`\n2. Username: @${info.username}\n3. User ID: \`${info.userId}\`\n4. Status: ${info.status}\n────────────────────────\n📊 Access Level: ${info.accessLevel}\n⚠️ Live Data: ${info.liveData}\n⚠️ Analytics: ${info.analytics}\n────────────────────────\n\n🔒 **Upgrade anytime to unlock full features** 😊`;
        }
        await ctx.reply(msg, { parse_mode: "Markdown" });
    } catch (e) { await ctx.reply("⚠️ An error occurred. Please use /start"); }
});

bot.command("cancel", async (ctx) => {
    const uid = ctx.from.id;
    if (userStates[uid]) { delete userStates[uid]; await ctx.reply("❌ Operation cancelled."); }
    else if (userPaymentState[uid]) { delete userPaymentState[uid]; delete userPaymentData[uid]; await ctx.reply("❌ Payment cancelled."); }
    else if (broadcastState[uid]) { delete broadcastState[uid]; await ctx.reply("❌ Broadcast cancelled."); }
    else await ctx.reply("Nothing to cancel.");
});

// ==================== BUTTON HANDLERS ====================
bot.hears("👤 MY INFO", async (ctx) => {
    try {
        const info = getUserInfo(ctx.from.id, ctx.from.first_name, ctx.from.last_name, ctx.from.username);
        let msg = "";
        if (info.role === "admin") {
            msg = `👤 **USER PROFILE**\n────────────────────────\n1. Name: \`${info.name}\`\n2. Username: @${info.username}\n3. User ID: \`${info.userId}\`\n4. Status: ${info.status}\n────────────────────────\n🛡 Access Level: ${info.accessLevel}\n⚙️ Panel: ${info.panel}\n🔐 Security: ${info.security}\n🛡 ${info.systemAccess}\n────────────────────────`;
        } else if (info.role === "sub_admin") {
            msg = `👤 **USER PROFILE**\n────────────────────────\n1. Name: \`${info.name}\`\n2. Username: @${info.username}\n3. User ID: \`${info.userId}\`\n4. Status: ${info.status}\n────────────────────────\n🛡 Access Level: ${info.accessLevel}\n⚙️ Panel: ${info.panel}\n🔐 Security: ${info.security}\n🛡 ${info.systemAccess}\n────────────────────────`;
        } else if (info.role === "premium") {
            msg = `👤 **USER PROFILE**\n────────────────────────\n1. Name: \`${info.name}\`\n2. Username: @${info.username}\n3. User ID: \`${info.userId}\`\n4. Status: ${info.status}\n────────────────────────\n⭐ Premium Start: ${info.startDate}\n⏰ Premium Expiry: ${info.expiryDate}\n📊 Validity: ${info.daysLeft} days remaining\n────────────────────────\n⚡ Live Range: ${info.liveRange}\n📊 Analytics: ${info.analytics}\n🔥 Features: ${info.features}\n────────────────────────\n🔥 **Thanks for joining Premium!** 😊`;
        } else {
            msg = `👤 **USER PROFILE**\n────────────────────────\n1. Name: \`${info.name}\`\n2. Username: @${info.username}\n3. User ID: \`${info.userId}\`\n4. Status: ${info.status}\n────────────────────────\n📊 Access Level: ${info.accessLevel}\n⚠️ Live Data: ${info.liveData}\n⚠️ Analytics: ${info.analytics}\n────────────────────────\n\n🔒 **Upgrade anytime to unlock full features** 😊`;
        }
        await ctx.reply(msg, { parse_mode: "Markdown" });
    } catch (e) { await ctx.reply("⚠️ An error occurred. Please try again."); }
});

bot.hears("🎭 LIVE RESULT", async (ctx) => {
    const role = getUserRole(ctx.from.id);
    if (role === "demo") return await ctx.reply("🚫 **Premium Feature!**", { parse_mode: "Markdown" });
    const results = getTimeBasedResults(3, LIVE_RESULT_LIMIT);
    const countryStats = LIVE_SHOW_COUNTRY_SUMMARY ? getCountryStats(3) : null;
    if (results.length === 0) {
        const msg = await ctx.reply("🔄 **Live Monitor Starting...**\n\nCollecting data...", { parse_mode: "Markdown" });
        liveMessageId = msg.message_id;
    } else {
        const total = results.reduce((s, r) => s + r.hits, 0);
        const sent = await ctx.reply(formatResult(results, "LIVE RESULT", "Last 3 Minutes", total, false, countryStats, LIVE_COUNTRY_SUMMARY_LIMIT), { parse_mode: "Markdown" });
        liveMessageId = sent.message_id;
    }
    if (LIVE_AUTO_REFRESH_ENABLED) await startLiveUpdates(ctx.chat.id);
});

bot.hears("♻️ 5 MIN", async (ctx) => {
    const role = getUserRole(ctx.from.id);
    if (role === "demo") return await ctx.reply("🚫 **Premium Feature!**", { parse_mode: "Markdown" });
    const res = getTimeBasedResults(5, REPORT_5_MIN_LIMIT);
    const countryStats = REPORT_5_MIN_SHOW_COUNTRY_SUMMARY ? getCountryStats(5) : null;
    if (!res.length) return await ctx.reply("⚠️ No data found.");
    await ctx.reply(formatResult(res, "5 MIN REPORT", "Last 5 Minutes", res.reduce((s, r) => s + r.hits, 0), false, countryStats, REPORT_5_MIN_COUNTRY_LIMIT), { parse_mode: "Markdown" });
});

bot.hears("♻️ 10 MIN", async (ctx) => {
    const role = getUserRole(ctx.from.id);
    if (role === "demo") return await ctx.reply("🚫 **Premium Feature!**", { parse_mode: "Markdown" });
    const res = getTimeBasedResults(10, REPORT_10_MIN_LIMIT);
    const countryStats = REPORT_10_MIN_SHOW_COUNTRY_SUMMARY ? getCountryStats(10) : null;
    if (!res.length) return await ctx.reply("⚠️ No data found.");
    await ctx.reply(formatResult(res, "10 MIN REPORT", "Last 10 Minutes", res.reduce((s, r) => s + r.hits, 0), false, countryStats, REPORT_10_MIN_COUNTRY_LIMIT), { parse_mode: "Markdown" });
});

bot.hears("🔝 TOP HIT", async (ctx) => {
    const role = getUserRole(ctx.from.id);
    if (role === "demo") return await ctx.reply("🚫 **Premium Feature!**", { parse_mode: "Markdown" });
    const res = getTimeBasedResults(TOP_HIT_WINDOW_MINUTES, TOP_HIT_LIMIT);
    const countryStats = TOP_HIT_SHOW_COUNTRY_SUMMARY ? getCountryStats(TOP_HIT_WINDOW_MINUTES) : null;
    if (!res.length) return await ctx.reply("⚠️ No data found.");
    await ctx.reply(formatResult(res, "MOST HIT RANGES", `Last ${TOP_HIT_WINDOW_MINUTES} Minutes`, res.reduce((s, r) => s + r.hits, 0), false, countryStats, TOP_HIT_COUNTRY_LIMIT), { parse_mode: "Markdown" });
});

bot.hears("🔍 SEARCH RANGE", async (ctx) => {
    const role = getUserRole(ctx.from.id);
    if (role === "demo") return await ctx.reply("🚫 **Premium Feature!**", { parse_mode: "Markdown" });
    userStates[ctx.from.id] = "search_range";
    await ctx.reply("⚠️ **Enter Range Name or Country:**\nExample: `Nigeria` or `88017`\n\n/cancel to stop", { parse_mode: "Markdown" });
});

bot.hears("📊 CLI SEARCH", async (ctx) => {
    const role = getUserRole(ctx.from.id);
    if (role === "demo") return await ctx.reply("🚫 **Premium Feature!**", { parse_mode: "Markdown" });
    userStates[ctx.from.id] = "cli_search";
    await ctx.reply("⚠️ **Enter CLI Number:**\nExample: `8801712345678`\n\n/cancel to stop", { parse_mode: "Markdown" });
});

bot.hears("🧑‍💻 DEVELOPER", async (ctx) => {
    await ctx.reply(`👨‍💻 **DEVELOPER INFO**\n─────────────────\n👑 Owner: ${ADMIN_USERNAME}\n🛠️ Version: 4.0.0\n📅 Last Update: May 2026\n\n💬 For support, contact ${ADMIN_USERNAME}`, { parse_mode: "Markdown" });
});

bot.hears("📞 CONTACT US", async (ctx) => {
    await ctx.reply(`📞 **CONTACT US**\n─────────────────\n👑 Owner: ${ADMIN_USERNAME}\n\n💬 Feel free to reach out!`, { parse_mode: "Markdown" });
});

bot.hears("📊 DEMO RESULTS", async (ctx) => {
    const res = getTimeBasedResults(DEMO_WINDOW_MINUTES, DEMO_RESULTS_LIMIT);
    const countryStats = DEMO_MASK_MODE ? getCountryStats(DEMO_WINDOW_MINUTES).slice(0, DEMO_COUNTRY_SUMMARY_LIMIT) : null;
    if (!res.length) return await ctx.reply("⚠️ Scanning data... Please wait.");
    const sent = await ctx.reply(formatResult(res, "DEMO RESULTS", `Last ${DEMO_WINDOW_MINUTES} Minutes`, res.reduce((s, r) => s + r.hits, 0), true, countryStats, DEMO_COUNTRY_SUMMARY_LIMIT), { parse_mode: "Markdown" });
    demoLiveMessageId = sent.message_id;
    if (DEMO_LIVE_UPDATE_ENABLED) await startDemoLiveUpdates(ctx.chat.id);
});

bot.hears("✅ UPGRADE TO PREMIUM", async (ctx) => {
    const premiumMsg = `💎 **Active Premium Plan** 💎\n━━━━━━━━━━━━━━━━━━\n${getPriceDisplay()}\n\n⚡ Fast Access • Premium Features\n🔒 Secure Payment System\n\n━━━━━━━━━━━━━━━━━━\n👇 **Choose Payment Method**`;
    await ctx.reply(premiumMsg, { parse_mode: "Markdown", reply_markup: getPaymentMethodsKeyboard() });
});

for (const [key, method] of Object.entries(PAYMENT_METHODS)) {
    bot.hears(`${method.emoji} ${method.name}`, async (ctx) => {
        const uid = ctx.from.id;
        userPaymentState[uid] = { step: "waiting_ss", method: key.toLowerCase() };
        const msg = `${method.emoji} **${method.name} Payment**\n━━━━━━━━━━━━━━━━━━\n💵 Send ${method.amount} ${method.currency} to:\n\`${method.number || method.id}\`\n\n📸 **Send a screenshot of your transaction**\n\n⚠️ Only image supported\n\nAfter sending screenshot, send your transaction ID or number.`;
        await ctx.reply(msg, { parse_mode: "Markdown", reply_markup: getBackKeyboard() });
    });
}

bot.on(":photo", async (ctx) => {
    try {
        const uid = ctx.from.id;
        const paymentState = userPaymentState[uid];
        if (!paymentState || paymentState.step !== "waiting_ss") {
            await ctx.reply("❌ No pending payment request. Use /start and click UPGRADE TO PREMIUM.");
            return;
        }
        const photo = ctx.message.photo[ctx.message.photo.length - 1];
        const fullName = `${ctx.from.first_name || ""} ${ctx.from.last_name || ""}`.trim() || "User";
        userPaymentData[uid] = {
            photoId: photo.file_id,
            name: fullName,
            username: ctx.from.username || "No username",
            userId: uid,
            method: paymentState.method
        };
        userPaymentState[uid] = { step: "waiting_number", method: paymentState.method };
        await ctx.reply(`📸 **Screenshot received!**\n\nNow send your **Transaction ID/Number**:\n\n⚠️ Any number or text is accepted.\nExample: \`2467\` or \`TRX123456\``, { parse_mode: "Markdown", reply_markup: getBackKeyboard() });
    } catch (e) { console.error("Photo handler error:", e.message); await ctx.reply("⚠️ An error occurred. Please try again."); }
});

bot.on(":text", async (ctx) => {
    try {
        const uid = ctx.from.id;
        const text = ctx.message.text.trim();
        const paymentState = userPaymentState[uid];
        const paymentData = userPaymentData[uid];
        
        if (paymentState && paymentState.step === "waiting_number" && paymentData && !paymentData.transactionId) {
            if (!text || text.length < 1) {
                await ctx.reply("❌ **Invalid input!**\n\nPlease send a valid Transaction ID / Number:\nExample: `2467` or `TRX123456`", { parse_mode: "Markdown" });
                return;
            }
            paymentData.transactionId = text;
            userPaymentData[uid] = paymentData;
            await ctx.reply("✅ **Submitted Successfully!**\n⏳ Wait for Admin approval.\n\nYou will be notified once approved.", { parse_mode: "Markdown" });
            
            const adminMsg = `🔔 ══ PAYMENT REQUEST ══ 🔔\n━━━━━━━━━━━━━━━━━━\n👤 Name: ${escapeMarkdown(paymentData.name)}\n🆔 User ID: \`${uid}\`\n📛 Username: @${paymentData.username}\n💳 Method: ${paymentData.method.toUpperCase()}\n🔢 Trx ID: \`${text}\`\n\n👇 **Action:**`;
            const approveKeyboard = new InlineKeyboard().row(InlineKeyboard.text("✅ Approve", `approve_${uid}`), InlineKeyboard.text("❌ Reject", `reject_${uid}`));
            await ctx.api.sendPhoto(ADMIN_ID, paymentData.photoId, { caption: adminMsg, parse_mode: "Markdown", reply_markup: approveKeyboard });
            delete userPaymentState[uid];
            delete userPaymentData[uid];
            return;
        }
        
        const state = userStates[uid];
        const broadcast = broadcastState[uid];
        
        if (broadcast && broadcast.step === "waiting_message") {
            const targetType = broadcast.type;
            let targetName = targetType === "premium" ? "PREMIUM USERS" : (targetType === "demo" ? "DEMO USERS" : "ALL USERS");
            await ctx.reply(`📢 **Sending broadcast to ${targetName}...**\n\n⏳ Please wait...`, { parse_mode: "Markdown" });
            const result = await sendBroadcast(ctx, targetType, text);
            delete broadcastState[uid];
            await ctx.reply(`✅ **Broadcast Complete!**\n\n📊 Target: ${targetName}\n✅ Sent: ${result.successCount} users\n❌ Failed: ${result.failCount} users\n📬 Total: ${result.total} users\n\n👑 Use /start to return to main menu.`, { parse_mode: "Markdown" });
            return;
        }
        
        if (state === "search_range") {
            delete userStates[uid];
            const res = searchByKeyword(text, SEARCH_WINDOW_MINUTES, SEARCH_RANGE_LIMIT);
            const countryStats = SEARCH_COUNTRY_SUMMARY ? getCountryStats(SEARCH_WINDOW_MINUTES) : null;
            if (!res.length) return await ctx.reply(`❌ No data found for: **${escapeMarkdown(text)}**`, { parse_mode: "Markdown" });
            await ctx.reply(formatResult(res, `SEARCH: ${text.toUpperCase()}`, `Last ${SEARCH_WINDOW_MINUTES} Minutes`, res.reduce((s, r) => s + r.hits, 0), false, countryStats, 10), { parse_mode: "Markdown" });
        }
        else if (state === "cli_search") {
            delete userStates[uid];
            const res = searchByKeyword(text, CLI_SEARCH_WINDOW_MINUTES, CLI_SEARCH_LIMIT);
            const countryStats = CLI_SEARCH_COUNTRY_SUMMARY ? getCountryStats(CLI_SEARCH_WINDOW_MINUTES) : null;
            if (!res.length) return await ctx.reply(`❌ No data found for CLI: **${escapeMarkdown(text)}**`, { parse_mode: "Markdown" });
            await ctx.reply(formatResult(res, `CLI SEARCH: ${text.toUpperCase()}`, `Last ${CLI_SEARCH_WINDOW_MINUTES} Minutes`, res.reduce((s, r) => s + r.hits, 0), false, countryStats, 10), { parse_mode: "Markdown" });
        }
        else if (state === "add_user" && /^\d+$/.test(text)) {
            delete userStates[uid];
            const expiryFormatted = addPremiumUser(text, "Premium User", PREMIUM_PLAN.duration);
            await ctx.reply(`✅ User \`${text}\` added as PREMIUM for ${PREMIUM_PLAN.duration} days!\n📅 Expires: ${expiryFormatted}`, { parse_mode: "Markdown" });
            try { await ctx.api.sendMessage(text, `🎉 **Congratulations!** You have been upgraded to PREMIUM for ${PREMIUM_PLAN.duration} days!\n📅 Valid until: ${expiryFormatted}\nUse /start to access all features.`, { parse_mode: "Markdown" }); } catch(e) {}
        }
        else if (state === "remove_user" && /^\d+$/.test(text)) {
            delete userStates[uid];
            if (removeUser(text)) await ctx.reply(`✅ User \`${text}\` removed!`, { parse_mode: "Markdown" });
            else await ctx.reply(`⚠️ User \`${text}\` not found.`, { parse_mode: "Markdown" });
        }
        else if (state === "add_subadmin" && /^\d+$/.test(text)) {
            delete userStates[uid];
            if (addSubAdminWithName(text, "Sub-Admin")) {
                await ctx.reply(`✅ User \`${text}\` is now a SUB-ADMIN!`, { parse_mode: "Markdown" });
                try { await ctx.api.sendMessage(text, "🛡️ **You have been promoted to SUB-ADMIN!**\nUse /start to access admin panel.", { parse_mode: "Markdown" }); } catch(e) {}
            } else { await ctx.reply(`⚠️ User \`${text}\` is already a SUB-ADMIN.`, { parse_mode: "Markdown" }); }
        }
        else if (state === "remove_subadmin" && /^\d+$/.test(text)) {
            delete userStates[uid];
            if (removeSubAdmin(text)) await ctx.reply(`✅ User \`${text}\` removed from SUB-ADMIN.`, { parse_mode: "Markdown" });
            else await ctx.reply(`⚠️ User \`${text}\` is not a SUB-ADMIN.`, { parse_mode: "Markdown" });
        }
    } catch (e) { console.error("Text input error:", e.message); await ctx.reply("⚠️ An error occurred. Please try again."); }
});

bot.hears("👑 ADMIN PANEL", async (ctx) => {
    const role = getUserRole(ctx.from.id);
    if (role !== "admin" && role !== "sub_admin") return await ctx.reply("🚫 You don't have admin access!");
    const kb = getAdminKeyboard(role === "admin");
    await ctx.reply("👑 **ADMIN PANEL**\nSelect an option:", { parse_mode: "Markdown", reply_markup: kb });
});

bot.hears("🔙 BACK TO MAIN", async (ctx) => {
    const role = getUserRole(ctx.from.id);
    delete userStates[ctx.from.id];
    delete broadcastState[ctx.from.id];
    const kb = role === "demo" ? getDemoKeyboard() : getMainKeyboard(role);
    await ctx.reply(`👋 **Back to Main Menu**`, { parse_mode: "Markdown", reply_markup: kb });
});

bot.hears("🔙 Back", async (ctx) => {
    const premiumMsg = `💎 **Active Premium Plan** 💎\n━━━━━━━━━━━━━━━━━━\n${getPriceDisplay()}\n\n⚡ Fast Access • Premium Features\n🔒 Secure Payment System\n\n━━━━━━━━━━━━━━━━━━\n👇 **Choose Payment Method**`;
    await ctx.reply(premiumMsg, { parse_mode: "Markdown", reply_markup: getPaymentMethodsKeyboard() });
});

bot.hears("✅ ADD USER", async (ctx) => {
    const role = getUserRole(ctx.from.id);
    if (role !== "admin" && role !== "sub_admin") return await ctx.reply("🚫 No permission!");
    userStates[ctx.from.id] = "add_user";
    await ctx.reply("⚠️ **Type User ID to ADD:**\nExample: `7064572216`\n\n/cancel to stop");
});

bot.hears("❎ REMOVE USER", async (ctx) => {
    const role = getUserRole(ctx.from.id);
    if (role !== "admin" && role !== "sub_admin") return await ctx.reply("🚫 No permission!");
    userStates[ctx.from.id] = "remove_user";
    await ctx.reply("⚠️ **Type User ID to REMOVE:**\nExample: `7064572216`\n\n/cancel to stop");
});

bot.hears("📋 USER LIST", async (ctx) => {
    const role = getUserRole(ctx.from.id);
    if (role !== "admin" && role !== "sub_admin") return await ctx.reply("🚫 No permission!");
    const userListMsg = getAllUsersList();
    await ctx.reply(userListMsg, { parse_mode: "Markdown" });
});

bot.hears("📢 BROADCAST", async (ctx) => {
    const role = getUserRole(ctx.from.id);
    if (role !== "admin" && role !== "sub_admin") return await ctx.reply("🚫 No permission!");
    await ctx.reply("📢 **Select Broadcast Target**\n\nChoose who you want to send message to:", { parse_mode: "Markdown", reply_markup: getBroadcastKeyboard() });
});

bot.hears("💎 PREMIUM USERS", async (ctx) => {
    const role = getUserRole(ctx.from.id);
    if (role !== "admin" && role !== "sub_admin") return;
    broadcastState[ctx.from.id] = { type: "premium", step: "waiting_message" };
    await ctx.reply("📢 **BROADCAST TO PREMIUM USERS**\n\n✏️ Send your message below:\n\n⚠️ Message will be sent to all premium users.\n\n🔙 Send /cancel to stop broadcast.");
});

bot.hears("🎲 DEMO USERS", async (ctx) => {
    const role = getUserRole(ctx.from.id);
    if (role !== "admin" && role !== "sub_admin") return;
    broadcastState[ctx.from.id] = { type: "demo", step: "waiting_message" };
    await ctx.reply("📢 **BROADCAST TO DEMO USERS**\n\n✏️ Send your message below:\n\n⚠️ Message will be sent to all demo users.\n\n🔙 Send /cancel to stop broadcast.");
});

bot.hears("👥 ALL USERS", async (ctx) => {
    const role = getUserRole(ctx.from.id);
    if (role !== "admin" && role !== "sub_admin") return;
    broadcastState[ctx.from.id] = { type: "all", step: "waiting_message" };
    await ctx.reply("📢 **BROADCAST TO ALL USERS**\n\n✏️ Send your message below:\n\n⚠️ Message will be sent to all premium and demo users.\n\n🔙 Send /cancel to stop broadcast.");
});

bot.hears("🔙 BACK", async (ctx) => {
    const role = getUserRole(ctx.from.id);
    if (role !== "admin" && role !== "sub_admin") return;
    const kb = getAdminKeyboard(role === "admin");
    await ctx.reply("👑 **ADMIN PANEL**\nSelect an option:", { parse_mode: "Markdown", reply_markup: kb });
});

bot.hears("🔥 ADD SUB-ADMIN", async (ctx) => {
    if (getUserRole(ctx.from.id) !== "admin") return await ctx.reply("🚫 Only main admin can do this!");
    userStates[ctx.from.id] = "add_subadmin";
    await ctx.reply("⚠️ **Type User ID to make SUB-ADMIN:**\nExample: `123456789`\n\n/cancel to stop");
});

bot.hears("❄️ REMOVE SUB-ADMIN", async (ctx) => {
    if (getUserRole(ctx.from.id) !== "admin") return await ctx.reply("🚫 Only main admin can do this!");
    userStates[ctx.from.id] = "remove_subadmin";
    await ctx.reply("⚠️ **Type User ID to remove from SUB-ADMIN:**\nExample: `123456789`\n\n/cancel to stop");
});

// ==================== INLINE CALLBACK HANDLERS ====================
bot.callbackQuery(/^approve_(.+)$/, async (ctx) => {
    if (getUserRole(ctx.from.id) !== "admin") { await ctx.answerCallbackQuery("🚫 Only admin can approve!"); return; }
    const userId = ctx.match[1];
    const paymentData = userPaymentData[userId];
    if (!paymentData) { await ctx.answerCallbackQuery("Payment request not found!"); return; }
    const expiryFormatted = addPremiumUser(userId, paymentData.name || "User", PREMIUM_PLAN.duration);
    try { await ctx.api.sendMessage(userId, `🎉 **PAYMENT ACCEPTED!**\n\n✅ Your Premium Subscription is now **ACTIVE**!\n📅 Valid until: ${expiryFormatted}\n\n🚀 You can now access all Live Features.\nUse /start to access the menu.`, { parse_mode: "Markdown" }); } catch(e) {}
    const currentCaption = ctx.message.caption || "";
    await ctx.editMessageCaption(currentCaption + `\n\n✅ **APPROVED & ADDED**\n📅 Expiry: ${expiryFormatted}`, { parse_mode: "Markdown" });
    await ctx.answerCallbackQuery("✅ Approved!");
    delete userPaymentData[userId];
});

bot.callbackQuery(/^reject_(.+)$/, async (ctx) => {
    if (getUserRole(ctx.from.id) !== "admin") { await ctx.answerCallbackQuery("🚫 Only admin can reject!"); return; }
    const userId = ctx.match[1];
    const paymentData = userPaymentData[userId];
    try { await ctx.api.sendMessage(userId, `❌ **Your payment request has been rejected.**\n\nPlease contact admin if needed.\nContact: ${ADMIN_USERNAME}`, { parse_mode: "Markdown" }); } catch(e) {}
    const currentCaption = ctx.message.caption || "";
    await ctx.editMessageCaption(currentCaption + `\n\n❌ **REJECTED**\n\nPayment request has been rejected.`, { parse_mode: "Markdown" });
    await ctx.answerCallbackQuery("❌ Rejected!");
    delete userPaymentData[userId];
});

// ==================== START ====================
async function main() {
    console.log("\n" + "=".repeat(60));
    console.log("🤖 Range X Orange Bot v4.0");
    console.log("=".repeat(60));
    
    await loadDataFromDrive();
    
    console.log("\n🔐 Checking device authorization...");
    const isVerified = await verifyDevice();
    if (!isVerified) { console.log("\n❌ Device not authorized! Bot cannot run."); process.exit(1); }
    
    console.log(`\n👑 Admin ID: ${ADMIN_ID}`);
    console.log(`🔥 Chrome Browsers: ${BROWSER_COUNT}`);
    console.log(`🖥️ Headless Mode: ${HEADLESS_MODE ? "ON" : "OFF"}`);
    console.log(`📁 Data Directory: ${DATA_DIR}`);
    console.log(`🔄 Live Auto Refresh: ${LIVE_AUTO_REFRESH_ENABLED ? "ON" : "OFF"}`);
    console.log(`✅ Bot is running with Polling\n`);
    
    loadUsers();
    startMultiBrowserScanner();
    bot.start();
    console.log("\n🎯 Scanner is running...\n");
}

main();
