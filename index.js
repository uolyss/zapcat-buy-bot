import 'dotenv/config';
import axios from 'axios';

const {
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID,
  BIRDEYE_API_KEY,
  ZAPCAT_MINT,
  PAIR_ADDRESS,
  POLL_INTERVAL_MS = 15000
} = process.env;

const TG_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
const BIRDEYE = axios.create({
  baseURL: 'https://public-api.birdeye.so',
  headers: { 'X-API-KEY': BIRDEYE_API_KEY }
});

// Anti-doublons basique (mémoire process)
let lastTx = null;

function fmtUsd(n, d = 2) {
  if (n === undefined || n === null) return '0.00';
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmtInt(n) {
  return Number(n || 0).toLocaleString();
}
function heartsLine() {
  return '🐱❤️ '.repeat(14).trim();
}
async function getPriceAndMcap() {
  const [p, m] = await Promise.all([
    BIRDEYE.get(`/defi/price?address=${ZAPCAT_MINT}`),
    BIRDEYE.get(`/defi/market-cap?address=${ZAPCAT_MINT}`)
  ]);
  return {
    price: Number(p?.data?.data?.value || 0),
    mcap: Number(m?.data?.data?.marketCap || 0)
  };
}
async function postTelegram(text, buttons = []) {
  const inline_keyboard = buttons.map(b => [{ text: b.text, url: b.url }]);
  await axios.post(TG_URL, {
    chat_id: TELEGRAM_CHAT_ID,
    text,
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
    reply_markup: { inline_keyboard }
  });
}

async function checkBuys() {
  try {
    // Dernier trade sur la pair
    const r = await BIRDEYE.get(`/defi/trades?address=${PAIR_ADDRESS}&limit=3`);
    const items = r?.data?.data?.items || [];
    if (!items.length) return;

    // Traite du plus ancien au plus récent pour ne rien rater
    items.reverse();

    for (const t of items) {
      const tx = t.txHash || t.tx || '';
      if (tx === lastTx) continue; // déjà envoyé

      // On ne garde que les BUY (côté entrant = SOL/USDC vers ZAPCAT)
      if (t.side !== 'buy') { lastTx = tx; continue; }

      // Prix/MC instantanés (facultatif mais joli)
      const { price, mcap } = await getPriceAndMcap();

      const msg =
`*Wen Buy!*

${heartsLine()}

🔁 *Spent* $${fmtUsd(t.amountInUsd)} (${fmtUsd(t.amountInBase, 3)} ${t.baseSymbol || 'SOL'})
📦 *Got* ${fmtInt(t.amountOut)} ZAPCAT
👤 *Buyer* [TX](https://solscan.io/tx/${tx})
🏷️ *Price* $${price.toFixed(8)}
💰 *Market Cap* $${fmtInt(mcap)}

DexT | Screener | Buy | Trending`;

      await postTelegram(msg, [
        { text: 'DexScreener', url: `https://dexscreener.com/solana/${PAIR_ADDRESS}` },
        { text: 'Buy (Jupiter)', url: `https://jup.ag/swap/SOL-${ZAPCAT_MINT}` }
      ]);

      lastTx = tx;
    }
  } catch (e) {
    console.error('checkBuys error:', e?.response?.data || e.message);
  }
}

console.log('Zapcat buy-bot started. Polling every', POLL_INTERVAL_MS, 'ms');
setInterval(checkBuys, Number(POLL_INTERVAL_MS));
checkBuys();
