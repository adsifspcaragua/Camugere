import { jest } from "@jest/globals";
import fs from "fs";
import path from "path";

const { baixarCapaRemota, internalizarCapa, urlPublica, CAPAS_DIR } = await import("../src/services/capaService.js");

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(16)]);
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(16)]);
const req = { protocol: "http", get: () => "localhost:3000" };
const criados = [];
const registrar = (caminho) => (criados.push(path.basename(caminho)), caminho);

const fetchOriginal = global.fetch;
afterEach(() => {
  global.fetch = fetchOriginal;
});
afterAll(() => {
  for (const arquivo of criados) fs.rmSync(path.join(CAPAS_DIR, arquivo), { force: true });
});

describe("validação de URL (SSRF)", () => {
  it.each([
    ["http://127.0.0.1/a.png"],
    ["http://10.0.0.5/a.png"],
    ["http://192.168.1.1/a.png"],
    ["http://172.16.0.1/a.png"],
    ["http://169.254.169.254/latest/meta-data"],
    ["http://[::1]/a.png"],
    ["http://[::ffff:127.0.0.1]/a.png"],
    ["http://[::ffff:7f00:1]/a.png"],
    ["http://[::ffff:a9fe:a9fe]/latest/meta-data"],
    ["http://[::7f00:1]/a.png"],
    ["http://[64:ff9b::7f00:1]/a.png"],
    ["http://[fd00::1]/a.png"],
  ])("bloqueia endereço interno %s", async (url) => {
    await expect(baixarCapaRemota(url)).rejects.toThrow("Endereço da capa não permitido.");
  });

  it("permite IPv4 público mapeado em IPv6", async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response(PNG, { status: 200 }));
    registrar(await baixarCapaRemota("http://[::ffff:5db8:d822]/a.png"));
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("aceita só http/https", async () => {
    await expect(baixarCapaRemota("ftp://93.184.216.34/a.png")).rejects.toThrow("deve ser http ou https");
  });

  it("rejeita texto que não é URL", async () => {
    await expect(baixarCapaRemota("não é url")).rejects.toThrow("URL da capa inválida.");
  });

  it("bloqueia redirecionamento para rede interna", async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response(null, { status: 302, headers: { location: "http://127.0.0.1/x.png" } }));
    await expect(baixarCapaRemota("http://93.184.216.34/a.png")).rejects.toThrow("Endereço da capa não permitido.");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

describe("download remoto", () => {
  it("salva imagem detectando o formato real pelos bytes", async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response(JPG, { status: 200, headers: { "content-type": "image/png" } }));
    const caminho = registrar(await baixarCapaRemota("http://93.184.216.34/capa"));
    expect(caminho).toMatch(/\.jpg$/);
    expect(fs.existsSync(path.join(CAPAS_DIR, path.basename(caminho)))).toBe(true);
  });

  it("rejeita conteúdo que não é imagem", async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response("<html>oi</html> e mais texto", { status: 200 }));
    await expect(baixarCapaRemota("http://93.184.216.34/capa")).rejects.toThrow("não é uma imagem válida");
  });

  it("informa erro HTTP do servidor remoto", async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response("x", { status: 404 }));
    await expect(baixarCapaRemota("http://93.184.216.34/capa")).rejects.toThrow("HTTP 404");
  });

  it("recusa imagem declarada maior que 5MB", async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response(PNG, { status: 200, headers: { "content-length": String(6 * 1024 * 1024) } }));
    await expect(baixarCapaRemota("http://93.184.216.34/capa")).rejects.toThrow("maior que 5MB");
  });

  it("desiste após redirecionamentos demais", async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response(null, { status: 301, headers: { location: "http://93.184.216.34/outra" } }));
    await expect(baixarCapaRemota("http://93.184.216.34/capa")).rejects.toThrow("Redirecionamentos demais");
    expect(global.fetch).toHaveBeenCalledTimes(4);
  });
});

describe("data URL", () => {
  it("salva PNG em base64", async () => {
    const caminho = registrar(await baixarCapaRemota(`data:image/png;base64,${PNG.toString("base64")}`));
    expect(caminho).toMatch(/^\/uploads\/capas\/.+\.png$/);
  });

  it("recusa formato não suportado", async () => {
    await expect(baixarCapaRemota("data:image/svg+xml;base64,PHN2Zz4=")).rejects.toThrow("Formato inválido");
  });

  it("recusa data URL malformada", async () => {
    await expect(baixarCapaRemota("data:image/png,semBase64")).rejects.toThrow("Data URL de imagem inválida.");
  });
});

describe("internalizarCapa e urlPublica", () => {
  it("monta URL pública a partir do host da requisição", () => {
    expect(urlPublica(req, "/uploads/capas/a.png")).toBe("http://localhost:3000/uploads/capas/a.png");
  });

  it("mantém valor vazio", async () => {
    expect(await internalizarCapa("  ", req)).toEqual({ capaUrl: "" });
    expect(await internalizarCapa(null, req)).toEqual({ capaUrl: null });
  });

  it("mantém capa que já está no servidor", async () => {
    const caminho = registrar(await baixarCapaRemota(`data:image/png;base64,${PNG.toString("base64")}`));
    const local = `http://localhost:3000${caminho}`;
    expect(await internalizarCapa(local, req)).toEqual({ capaUrl: local });
  });

  it("baixa capa remota e devolve o link local", async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response(PNG, { status: 200 }));
    const r = await internalizarCapa("http://93.184.216.34/capa.png", req);
    expect(r.capaUrl).toMatch(/^http:\/\/localhost:3000\/uploads\/capas\/.+\.png$/);
    registrar(r.capaUrl);
  });

  it("devolve aviso, sem quebrar, quando o download falha", async () => {
    const r = await internalizarCapa("http://127.0.0.1/a.png", req);
    expect(r).toEqual({ capaUrl: undefined, aviso: "Capa não salva: Endereço da capa não permitido." });
  });
});
