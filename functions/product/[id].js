const SUPABASE_URL = "https://pichcgpdfsbzdtxtcfwe.supabase.co";
const SITE_URL = "https://pbpb.club";

const BOT_AGENTS = [
  "googlebot","yandexbot","bingbot","slurp","duckduckbot","baiduspider",
  "facebookexternalhit","twitterbot","linkedinbot","slackbot","telegrambot",
  "vkshare","semrushbot","ahrefsbot","applebot","whatsapp","rogerbot"
];

function isBot(ua) {
  return BOT_AGENTS.some(b => (ua || "").toLowerCase().includes(b));
}

async function getProduct(id, key) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/products?id=eq.${id}&select=*`,
    { headers: { "apikey": key, "Authorization": `Bearer ${key}` } }
  );
  const data = await res.json();
  return data?.[0] || null;
}

function buildHTML(p) {
  const title = `${p.name} | PBPB Mebel Club`;
  const desc = p.description || `${p.name} — дизайнерская мебель PBPB`;
  const img = p.main_image || `${SITE_URL}/og-image.webp`;
  const price = p.price || 0;
  const inStock = p.in_stock ? "InStock" : "PreOrder";
  const schema = JSON.stringify({
    "@context": "https://schema.org", "@type": "Product",
    "name": p.name, "description": desc, "image": img,
    "brand": { "@type": "Brand", "name": "PBPB Mebel Club" },
    "offers": { "@type": "Offer", "price": price, "priceCurrency": "RUB",
      "availability": `https://schema.org/${inStock}`,
      "url": `${SITE_URL}/product/${p.id}` }
  });
  return `<!DOCTYPE html><html lang="ru"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${SITE_URL}/product/${p.id}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${img}">
<meta property="og:type" content="product">
<script type="application/ld+json">${schema}</script>
</head><body>
<h1>${p.name}</h1><p>${desc}</p><p>Цена: ${price} ₽</p>
${p.dimensions ? `<p>Размеры: ${p.dimensions}</p>` : ''}
${p.materials ? `<p>Материал: ${p.materials}</p>` : ''}
<a href="${SITE_URL}/product/${p.id}">Открыть страницу товара</a>
</body></html>`;
}

export async function onRequestGet({ request, params, env }) {
  if (!isBot(request.headers.get("user-agent"))) return;
  const product = await getProduct(params.id, env.SUPABASE_KEY);
  if (!product) return;
  return new Response(buildHTML(product), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "X-Prerendered": "1"
    }
  });
}
