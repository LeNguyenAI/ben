const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

type BookingPayload = {
  id?: string;
  booking_type?: string;
  name?: string;
  phone?: string;
  booking_date?: string | null;
  booking_time?: string | null;
  guests?: string;
  purpose?: string;
  area?: string;
  event_type?: string;
  event_scale?: string;
  budget?: string;
  concept?: string;
  note?: string;
  source?: string;
  created_at?: string;
};

const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char] || char));

const textValue = (value?: string | null) => {
  const text = String(value || "").trim();
  return text || "Chưa có";
};

const renderRows = (booking: BookingPayload) => {
  const rows: Array<[string, string]> = [
    ["Họ tên", textValue(booking.name)],
    ["Số điện thoại", textValue(booking.phone)],
    ["Ngày đến", textValue(booking.booking_date)],
    ["Giờ đến", textValue(booking.booking_time)],
    ["Số khách", textValue(booking.guests)],
    ["Nhu cầu", textValue(booking.booking_type)],
    ["Mục đích", textValue(booking.purpose)],
    ["Khu vực mong muốn", textValue(booking.area)],
    ["Loại sự kiện", textValue(booking.event_type)],
    ["Quy mô khách", textValue(booking.event_scale)],
    ["Ngân sách dự kiến", textValue(booking.budget)],
    ["Setup / concept", textValue(booking.concept)],
    ["Ghi chú", textValue(booking.note)],
    ["Nguồn", textValue(booking.source || "website")]
  ];
  return rows.map(([label, value]) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#665;font-weight:700;width:180px">${escapeHtml(label)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#222">${escapeHtml(value)}</td>
    </tr>
  `).join("");
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
  const toEmail = Deno.env.get("BOOKING_NOTIFY_EMAIL") || "cskhbenchillgarden@gmail.com";
  const fromEmail = Deno.env.get("BOOKING_FROM_EMAIL") || "Bến Chill Garden <onboarding@resend.dev>";

  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: "Missing RESEND_API_KEY" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  let booking: BookingPayload = {};
  try {
    const body = await req.json();
    booking = body.booking || body;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  if (!booking.name || !booking.phone) {
    return new Response(JSON.stringify({ error: "Booking name and phone are required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const subject = `Khách đặt bàn mới - ${booking.name} - ${booking.phone}`;
  const html = `
    <div style="font-family:Arial,sans-serif;background:#f6f1e7;padding:24px">
      <div style="max-width:680px;margin:auto;background:#fff;border-radius:18px;overflow:hidden;border:1px solid #eadfcb">
        <div style="background:#07100c;color:#fff8e8;padding:22px 24px">
          <p style="margin:0 0 6px;color:#dca63a;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Bến Chill Garden</p>
          <h1 style="margin:0;font-size:26px;line-height:1.2">Có khách đặt bàn mới</h1>
        </div>
        <div style="padding:20px 24px">
          <p style="margin:0 0 16px;color:#5d5a50">Vui lòng gọi hoặc nhắn Zalo xác nhận lại với khách trước khi giữ bàn.</p>
          <table style="width:100%;border-collapse:collapse;font-size:15px">${renderRows(booking)}</table>
          <div style="margin-top:20px">
            <a href="tel:${escapeHtml(booking.phone || "")}" style="display:inline-block;background:#dca63a;color:#17200b;text-decoration:none;font-weight:700;padding:12px 16px;border-radius:999px;margin-right:8px">Gọi khách</a>
            <a href="https://zalo.me/${escapeHtml(String(booking.phone || "").replace(/[^0-9]/g, ""))}" style="display:inline-block;background:#102217;color:#fff8e8;text-decoration:none;font-weight:700;padding:12px 16px;border-radius:999px">Nhắn Zalo</a>
          </div>
        </div>
      </div>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject,
      html
    })
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    return new Response(JSON.stringify({ error: "Email send failed", detail: result }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ ok: true, result }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});
