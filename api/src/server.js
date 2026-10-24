import app from "./app.js";
import { env } from "./config/env.js";
import { agendarLembretes } from "./services/lembreteService.js";

app.listen(env.port, () => {
  console.info(`API rodando em http://localhost:${env.port}`);
  agendarLembretes();
});
