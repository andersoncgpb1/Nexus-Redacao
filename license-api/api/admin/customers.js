const { getSupabase } = require("../../lib/supabase");
const { requireAdmin } = require("../../lib/admin");
const { sendJson, readJson, handleOptions } = require("../../lib/http");

module.exports = async function customers(req, res) {
  if (handleOptions(req, res)) return;
  if (!requireAdmin(req, res)) return;

  try {
    if (req.method === "GET") return await listCustomers(req, res);
    if (req.method === "POST") return await createCustomer(req, res);
    if (req.method === "PUT") return await updateCustomer(req, res);
    return sendJson(res, 405, { ok: false, error: "Metodo nao permitido." });
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { ok: false, error: "Erro ao processar cliente." });
  }
};

async function listCustomers(req, res) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("customers")
    .select("*, licenses(id,status,expires_at,max_activations)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return sendJson(res, 200, {
    ok: true,
    customers: (data || []).map((customer) => ({
      id: customer.id,
      name: customer.name,
      document: customer.document,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
      city: customer.city,
      state: customer.state,
      notes: customer.notes,
      status: customer.status,
      createdAt: customer.created_at,
      licenses: customer.licenses || []
    }))
  });
}

async function createCustomer(req, res) {
  const body = await readJson(req);
  if (!body.name) return sendJson(res, 400, { ok: false, error: "Informe o nome do cliente." });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("customers")
    .insert(toCustomerPayload(body))
    .select("*")
    .single();

  if (error) throw error;
  return sendJson(res, 201, { ok: true, customer: data });
}

async function updateCustomer(req, res) {
  const body = await readJson(req);
  if (!body.id) return sendJson(res, 400, { ok: false, error: "Informe o cliente." });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("customers")
    .update(toCustomerPayload(body))
    .eq("id", body.id)
    .select("*")
    .single();

  if (error) throw error;
  return sendJson(res, 200, { ok: true, customer: data });
}

function toCustomerPayload(body) {
  return {
    name: String(body.name || "").trim(),
    document: String(body.document || "").trim() || null,
    email: String(body.email || "").trim() || null,
    phone: String(body.phone || "").trim() || null,
    company: String(body.company || "").trim() || null,
    city: String(body.city || "").trim() || null,
    state: String(body.state || "").trim() || null,
    notes: String(body.notes || "").trim() || null,
    status: String(body.status || "active").trim()
  };
}
