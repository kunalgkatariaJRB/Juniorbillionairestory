import { getShop } from "../Services/shopify.service.js";

export async function fetchShop(req, res) {
  try {
    const data = await getShop();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
 