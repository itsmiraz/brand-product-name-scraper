import { Router, Request, Response } from "express";
import { fetchProducts } from "../services/scraper";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const { brandName, website, facebook, instagram } = req.body;

    if (!website) {
      return res.status(400).json({ error: "Website is required" });
    }

    const products = await fetchProducts({
      brandName,
      website,
      facebook,
      instagram,
    });

    if (!products || products.length === 0) {
      return res
        .status(404)
        .json({ error: "No products found for this brand." });
    }

    res.json({ brand: brandName, products });
  } catch (err: any) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
});

export default router;
