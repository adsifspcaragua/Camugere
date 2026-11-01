import { importObraSchema } from "../src/schemas/obraSchema.js";

describe("importObraSchema", () => {
  it("valida e normaliza lista de obras a importar", () => {
    const input = {
      obras: [
        {
          titulo: "Torto Arado",
          autor: "Itamar Vieira Junior",
          cdd: "869t",
          isbn: "978-65-80309-31-3",
          numExemplares: 5,
        },
        {
          titulo: "O escravo",
          autor: "Carolina Maria de Jesus",
          isbn: "9788535936032",
        },
      ],
    };

    const resultado = importObraSchema.parse(input);
    expect(resultado.obras).toHaveLength(2);
    expect(resultado.obras[0].titulo).toBe("Torto Arado");
    expect(resultado.obras[0].isbn).toBe("9786580309313");
    expect(resultado.obras[0].numExemplares).toBe(5);
    expect(resultado.obras[1].numExemplares).toBe(1);
  });

  it("rejeita lista vazia", () => {
    expect(() => importObraSchema.parse({ obras: [] })).toThrow();
  });
});

