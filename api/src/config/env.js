import "dotenv/config";

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  return value;
}

export const env = {
  port: Number(process.env.PORT || 3000),
  jwtSecret: process.env.JEST_WORKER_ID ? "test-secret" : required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",
  corsOrigin: process.env.CORS_ORIGIN?.split(",").map((o) => o.trim()) || "*",
  apiPublicUrl: process.env.API_PUBLIC_URL,
};
