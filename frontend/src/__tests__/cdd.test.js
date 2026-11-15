import { describe, expect, it } from "vitest";
import { acharPorCodigo, acharPorDescricao, filtrarCdds, normalizarCodigo, statusCdd, sugerirCdd, sugerirCddParaLivro } from "../lib/cdd.js";
import { parseAcervoCsv } from "../lib/csvImport.js";

const cdds = [
  { id: "869.3", descricao: "Literatura brasileira — ficção", obras: 3 },
  { id: "981", descricao: "História do Brasil", obras: 1 },
  { id: "320", descricao: "Ciência política", obras: 0 },
];

describe("cdd", () => {
  it("normaliza o código digitado", () => {
    expect(normalizarCodigo(" 869,3 ")).toBe("869.3");
  });

  it("acha cadastrados pelo código e pelo assunto, sem diferenciar acentos", () => {
    expect(acharPorCodigo(cdds, "869,3")?.id).toBe("869.3");
    expect(acharPorCodigo(cdds, "999")).toBeNull();
    expect(acharPorDescricao(cdds, "historia do brasil")?.id).toBe("981");
    expect(filtrarCdds(cdds, "politica")).toHaveLength(1);
    expect(filtrarCdds(cdds, "")).toHaveLength(3);
  });

  it("informa a situação do par código/assunto", () => {
    expect(statusCdd(cdds, "", "").tipo).toBe("vazio");
    expect(statusCdd(cdds, "981", "").tipo).toBe("cadastrado");
    expect(statusCdd(cdds, "123", "Algo").tipo).toBe("novo");
    expect(statusCdd(cdds, "123", "").tipo).toBe("incompleto");
    expect(statusCdd(cdds, "", "Algo").tipo).toBe("incompleto");
  });

  it("sugere só entre os CDDs cadastrados", () => {
    expect(sugerirCdd("Uma história do país", cdds)?.id).toBe("981");
    expect(sugerirCdd("Romance de formação", cdds)?.id).toBe("869.3");
    expect(sugerirCdd("Receitas de cozinha", cdds)).toBeNull(); // 641.5 não está cadastrado
    expect(sugerirCdd("Romance", [])).toBeNull();
  });

  it("usa a classe cadastrada mais geral quando o código exato não existe", () => {
    expect(sugerirCdd("Poesia moderna", [{ id: "869", descricao: "Literatura brasileira" }])?.id).toBe("869");
  });

  it("para livros online, prefere o Dewey da fonte se estiver cadastrado", () => {
    expect(sugerirCddParaLivro({ dewey: "320", assunto: "romance", idioma: "pt" }, cdds)?.id).toBe("320");
    expect(sugerirCddParaLivro({ dewey: "999", assunto: "romance", idioma: "pt" }, cdds)?.id).toBe("869.3");
  });
});

describe("importação CSV com assunto do CDD", () => {
  it("lê a coluna Assunto CDD e só a mantém quando há código", () => {
    const csv = `Título,Autoria,CDD,Assunto CDD\n"Torto Arado","Itamar","869.3","Ficção"\n"Sem código","Autor","","Ficção"`;
    const [a, b] = parseAcervoCsv(csv);
    expect(a.cdd).toBe("869.3");
    expect(a.cddDescricao).toBe("Ficção");
    expect(b.cddDescricao).toBeNull();
  });
});
