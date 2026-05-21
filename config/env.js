// ======================= TELEGRAM BOT CONFIGURATION =======================
export const BOT_TOKEN = "8748227133:AAGoaJStAZIp5e-0W9gKXIF5jLLoa1ZZOtg";
export const ADMIN_ID = 7064572216;
export const ADMIN_USERNAME = "@xDnaZim";

// ======================= ORANGE CARRIER LOGIN CREDENTIALS =======================
export const USERNAME = "n.nazim1132@gmail.com";
export const PASSWORD = "Abcd1234";

// ======================= BROWSER CONFIGURATION =======================
export const BROWSER_COUNT = 3;
export const SCAN_INTERVAL_MS = 1000;
export const SCAN_TIMEOUT_MS = 3000;
export const LOGIN_WAIT_MS = 10000;
export const HEADLESS_MODE = true; // Railway-এ true রাখুন

// ======================= DEVICE VERIFICATION =======================
export const DEVICE_VERIFICATION_ENABLED = false;
export const DEVICE_SHEET_URL = "https://opensheet.elk.sh/17vn-T_6SRP-FLBtkSpBhsah98cyqWWrtOEHF2AsU778/SMS_DB";

// ======================= CHROME PATH =======================
export const CHROME_PATH = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

// ======================= URLS =======================
export const LOGIN_URL = "https://www.orangecarrier.com/login";
export const CLI_ACCESS_URL = "https://www.orangecarrier.com/services/cli/access";

// ======================= FILE PATHS (Railway Persistent Volume) =======================
export const DATA_DIR = process.env.DATA_DIR || "/data/orange_bot_data";
export const USER_DB_FILE = `${DATA_DIR}/subscription_db.json`; // ← subscription_db.json
export const SUB_ADMIN_FILE = `${DATA_DIR}/sub_admins.json`;
export const SUB_ADMIN_NAMES_FILE = `${DATA_DIR}/sub_admin_names.json`;
export const LOG_FILE_PATH = `${DATA_DIR}/bot_log.txt`;

// ======================= NOTIFICATION SETTINGS =======================
export const BOT_ONLINE_NOTIFICATION = false;

// ======================= LIVE RESULT CONFIGURATION =======================
export const LIVE_RESULT_LIMIT = 20;
export const LIVE_COUNTRY_SUMMARY_LIMIT = 10;
export const LIVE_UPDATE_INTERVAL_SECONDS = 5;
export const LIVE_SHOW_COUNTRY_SUMMARY = true;
export const LIVE_AUTO_REFRESH_ENABLED = true;

// ======================= DEMO RESULT LIVE UPDATE CONFIGURATION =======================
export const DEMO_LIVE_UPDATE_ENABLED = true;
export const DEMO_LIVE_UPDATE_INTERVAL_SECONDS = 5;

// ======================= 5 MIN REPORT CONFIGURATION =======================
export const REPORT_5_MIN_LIMIT = 25;
export const REPORT_5_MIN_COUNTRY_LIMIT = 10;
export const REPORT_5_MIN_SHOW_COUNTRY_SUMMARY = true;

// ======================= 10 MIN REPORT CONFIGURATION =======================
export const REPORT_10_MIN_LIMIT = 25;
export const REPORT_10_MIN_COUNTRY_LIMIT = 10;
export const REPORT_10_MIN_SHOW_COUNTRY_SUMMARY = true;

// ======================= TOP HIT (30 MIN) REPORT CONFIGURATION =======================
export const TOP_HIT_LIMIT = 30;
export const TOP_HIT_COUNTRY_LIMIT = 10;
export const TOP_HIT_WINDOW_MINUTES = 30;
export const TOP_HIT_SHOW_COUNTRY_SUMMARY = true;

// ======================= SEARCH RANGE CONFIGURATION =======================
export const SEARCH_RANGE_LIMIT = 20;
export const SEARCH_WINDOW_MINUTES = 30;
export const SEARCH_COUNTRY_SUMMARY = false;

// ======================= CLI SEARCH CONFIGURATION =======================
export const CLI_SEARCH_LIMIT = 20;
export const CLI_SEARCH_WINDOW_MINUTES = 30;
export const CLI_SEARCH_COUNTRY_SUMMARY = false;

// ======================= DEMO MODE CONFIGURATION =======================
export const DEMO_RESULTS_LIMIT = 10;
export const DEMO_WINDOW_MINUTES = 60;
export const DEMO_COUNTRY_SUMMARY_LIMIT = 5;
export const DEMO_MASK_MODE = true;

// ======================= RANGES PER CLI SCAN =======================
export const RANGES_PER_CLI = 30;
