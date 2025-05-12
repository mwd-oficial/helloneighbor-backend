import express from "express"
import { routes } from "./src/routes/routes.js";

const app = express();
routes(app)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Servidor escutando na porta ${PORT}`);
})