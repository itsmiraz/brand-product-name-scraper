import express from "express";
import bodyParser from "body-parser";
import productRouter from "./routes/products";

const app = express();
app.use(bodyParser.json());

app.use("/api/products", productRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
