import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface OrderItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CustomerInfo {
  name: string;
  phone: string;
  method: "delivery" | "pickup";
  address?: string | null;
  notes?: string | null;
}

interface OrderPayload {
  orderId: string;
  customer: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  timestamp?: string;
}

Deno.serve(async (req: Request) => {
  // 1. Handle CORS Preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 2. Read Secrets from Environment Variables
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const chatId = Deno.env.get("TELEGRAM_CHAT_ID");

    if (!botToken || !chatId) {
      console.error("[send-telegram-order] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in environment secrets.");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Telegram credentials are not configured in Supabase Secrets.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 3. Parse and Validate Request Payload
    const payload: OrderPayload = await req.json();
    const { orderId, customer, items, subtotal, deliveryFee, total, timestamp } = payload;

    if (!orderId || !customer || !items || !Array.isArray(items)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid order payload. Missing required fields.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 4. Format Items List for Telegram (HTML)
    const itemsListText = items
      .map((item) => {
        const itemTotal = (Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2);
        return `• <b>${escapeHtml(item.name)}</b> x${item.quantity} — $${itemTotal}`;
      })
      .join("\n");

    // 5. Construct HTML message
    const message = `
🍔 <b>NEW ORDER ${escapeHtml(orderId)}</b>

👤 <b>Customer Info:</b>
• <b>Name:</b> ${escapeHtml(customer.name || "N/A")}
• <b>Phone:</b> ${escapeHtml(customer.phone || "N/A")}
• <b>Method:</b> ${customer.method === "delivery" ? "🚗 Delivery" : "🏪 Pickup"}
${customer.method === "delivery" && customer.address ? `• <b>Address:</b> ${escapeHtml(customer.address)}\n` : ""}${customer.notes ? `• <b>Notes:</b> ${escapeHtml(customer.notes)}\n` : ""}
🛒 <b>Ordered Items:</b>
${itemsListText || "No items listed"}

💰 <b>Payment Summary:</b>
• <b>Subtotal:</b> $${Number(subtotal || 0).toFixed(2)}
• <b>Delivery Fee:</b> $${Number(deliveryFee || 0).toFixed(2)}
• <b>Total Amount:</b> <b>$${Number(total || 0).toFixed(2)}</b>

⏰ <b>Order Timestamp:</b> ${escapeHtml(timestamp || new Date().toLocaleString())}
`.trim();

    // 6. Send Request to Telegram Bot API
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const tgResponse = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });

    const tgData = await tgResponse.json();

    if (!tgResponse.ok || !tgData.ok) {
      console.error("[send-telegram-order] Telegram API error:", tgData);
      return new Response(
        JSON.stringify({
          success: false,
          error: tgData.description || "Failed to deliver message via Telegram Bot API.",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Order notification sent successfully to Telegram.",
        data: tgData.result,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("[send-telegram-order] Unhandled error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Internal server error.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function escapeHtml(text: string): string {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
