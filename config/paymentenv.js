// ======================= PAYMENT CONFIGURATION =======================

// ========== MAIN PRICE SETTINGS (Change here only) ==========
export const PRICE_SETTINGS = {
  // BDT Price (for Bkash, Nagad, Rocket)
  bdt_amount: 130,
  bdt_currency: "BDT",
  
  // USD Price (for Binance)
  usd_amount: 1,
  usd_currency: "$"
};

// ========== PREMIUM PLAN ==========
export const PREMIUM_PLAN = {
  duration: 30, // days
  name: "Premium Plan"
};

// ========== PAYMENT METHODS ==========
export const PAYMENT_METHODS = {
  BKASH: {
    name: "Bkash",
    emoji: "📲",
    number: "01335544922",
    get amount() { return PRICE_SETTINGS.bdt_amount; },
    get currency() { return PRICE_SETTINGS.bdt_currency; }
  },
  NAGAD: {
    name: "Nagad",
    emoji: "💰",
    number: "01335544922",
    get amount() { return PRICE_SETTINGS.bdt_amount; },
    get currency() { return PRICE_SETTINGS.bdt_currency; }
  },
  ROCKET: {
    name: "Rocket",
    emoji: "🚀",
    number: "01335544922",
    get amount() { return PRICE_SETTINGS.bdt_amount; },
    get currency() { return PRICE_SETTINGS.bdt_currency; }
  },
  BINANCE: {
    name: "Binance",
    emoji: "🪙",
    id: "757443450",
    get amount() { return PRICE_SETTINGS.usd_amount; },
    get currency() { return PRICE_SETTINGS.usd_currency; }
  }
};

// ========== PRICE DISPLAY HELPER ==========
export function getPriceDisplay() {
  return `💵 Price : ${PRICE_SETTINGS.bdt_amount} ${PRICE_SETTINGS.bdt_currency} / ${PRICE_SETTINGS.usd_amount}${PRICE_SETTINGS.usd_currency}\n🗓️ Duration : ${PREMIUM_PLAN.duration} Days`;
}

// ========== PAYMENT MESSAGES ==========
export const PAYMENT_MESSAGES = {
  get header() {
    return `💎 **Active Premium Plan** 💎\n━━━━━━━━━━━━━━━━━━\n${getPriceDisplay()}\n\n⚡ Fast Access • Premium Features\n🔒 Secure Payment System\n\n━━━━━━━━━━━━━━━━━━\n👇 **Choose Payment Method**`;
  },
  
  getPaymentInstruction(method) {
    const m = PAYMENT_METHODS[method.toUpperCase()];
    if (!m) return "";
    
    if (m.number) {
      return `${m.emoji} **${m.name} Payment**\n━━━━━━━━━━━━━━━━━━\n💵 Send ${m.amount} ${m.currency} to:\n\`${m.number}\`\n\n📸 **Send a screenshot of your transaction**\n\n⚠️ Only image supported\n\nAfter sending screenshot, send your transaction ID or number.`;
    } else {
      return `${m.emoji} **${m.name} Payment**\n━━━━━━━━━━━━━━━━━━\n💵 Send ${m.amount}${m.currency} to:\n\`${m.id}\`\n\n📸 **Send a screenshot of your transaction**\n\n⚠️ Only image supported\n\nAfter sending screenshot, send your Transaction ID or Payment ID.`;
    }
  },
  
  screenshot_received: "📸 **Screenshot received!**\n\nNow send your **Transaction ID/Number**:\n\n⚠️ Any number or text is accepted.\nExample: `2467` or `TRX123456`",
  
  invalid_input: "❌ **Invalid input!**\n\nPlease send a valid Transaction ID / Number:\nExample: `2467` or `TRX123456`",
  
  success: "✅ **Submitted Successfully!**\n⏳ Wait for Admin approval.\n\nYou will be notified once approved.",
  
  get approved() {
    return `🎉 **PAYMENT ACCEPTED!**\n\n✅ Your Premium Subscription is now **ACTIVE**!\n📅 Valid for: ${PREMIUM_PLAN.duration} Days\n\n🚀 You can now access all Live Features.\nUse /start to access the menu.`;
  },
  
  rejected: "❌ **Your payment request has been rejected.**\n\nPlease contact admin if needed.\nContact: {admin_username}"
};

// ========== ADMIN NOTIFICATION ==========
export const ADMIN_NOTIFICATION = {
  get header() {
    return `🔔 ══ PAYMENT REQUEST ══ 🔔\n━━━━━━━━━━━━━━━━━━\n💵 Amount    : ${PRICE_SETTINGS.bdt_amount} ${PRICE_SETTINGS.bdt_currency} / ${PRICE_SETTINGS.usd_amount}${PRICE_SETTINGS.usd_currency}\n🗓️ Duration  : ${PREMIUM_PLAN.duration} Days`;
  },
  user_line: "👤 Name      : {name}\n🆔 User ID   : `{user_id}`\n📛 Username  : @{username}",
  method_line: "🏦 Method    : {method}",
  transaction_line: "🔢 Trx ID    : `{transaction_id}`",
  action_line: "\n👇 **Action:**",
  
  get approved_response() {
    return `✅ **APPROVED & ADDED**\n📅 Expiry: {expiry}`;
  },
  
  get rejected_response() {
    return `❌ **REJECTED**\n\nPayment request has been rejected.`;
  }
};

// ========== BUTTON LABELS ==========
export const BUTTON_LABELS = {
  approve: "✅ Approve",
  reject: "❌ Reject",
  back: "🔙 Back",
  upgrade: "✅ UPGRADE TO PREMIUM"
};

// ========== EXPORT ALL ==========
export const PAYMENT_CONFIG = {
  prices: PRICE_SETTINGS,
  plan: PREMIUM_PLAN,
  methods: PAYMENT_METHODS,
  messages: PAYMENT_MESSAGES,
  admin: ADMIN_NOTIFICATION,
  buttons: BUTTON_LABELS
};
