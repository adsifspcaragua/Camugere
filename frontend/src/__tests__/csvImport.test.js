import { describe, expect, it } from "vitest";
import { cleanAno, cleanAutor, cleanCdd, cleanIsbn, parseAcervoCsv, parseRawCsv } from "../lib/csvImport.js";

describe("csvImport", () => {
  it("faz parse de formato de exportação nativo do Camugere", () => {
    const csv = `Título,Autoria,CDD,ISBN,Exemplares,Disponíveis
"Torto Arado","Itamar Vieira Junior","869t","9786580309313",5,5
"O escravo","Carolina Maria de Jesus","869e","9788535936032",2,2`;

    const obras = parseAcervoCsv(csv);
    expect(obras).toHaveLength(2);
    expect(obras[0].titulo).toBe("Torto Arado");
    expect(obras[0].autor).toBe("Itamar Vieira Junior");
    expect(obras[0].cdd).toBe("869t");
    expect(obras[0].isbn).toBe("9786580309313");
    expect(obras[0].numExemplares).toBe(5);

    expect(obras[1].titulo).toBe("O escravo");
    expect(obras[1].numExemplares).toBe(2);
  });

  it("faz parse do formato legado da biblioteca agrupando exemplares físicos", () => {
    const csv = `publicId,isbn,title,publisher,edition,numberOfPages,subject,cover,status,description,code,subtitle,writers,classification
10d2ea18-a02d-4d7d-93f7-046ecc39a1b2,9788535936032,O escravo,Companhia das Letras,2023,206,{869e},,disponível,"Sinopse...",5,,"{""Carolina Maria de Jesus""}",869e
8466b6ea-4636-48b3-9a40-0d4467a95546,9788535936032,O escravo,Companhia das Letras,2023,206,{869e},,disponível,"Sinopse...",6,,"{""Carolina Maria de Jesus""}",869e
b20e2e8d-6388-4259-945e-09421e8ccbde,9788534705202,Becos da memória,Pallas,2017,198,{869b},,disponível,,7,,"{""Conceição Evaristo""}",869b
72164454-fbc6-4998-aab7-ad47a04b654c,9788534705202,Becos da memória,Pallas,2017,198,{869b},,disponível,,8,,"{""Conceição Evaristo""}",869b`;

    const obras = parseAcervoCsv(csv);
    expect(obras).toHaveLength(2);
    expect(obras[0].titulo).toBe("O escravo");
    expect(obras[0].autor).toBe("Carolina Maria de Jesus");
    expect(obras[0].numExemplares).toBe(2);
    expect(obras[0].editora).toBe("Companhia das Letras");
    expect(obras[0].numeroPaginas).toBe(206);

    expect(obras[1].titulo).toBe("Becos da memória");
    expect(obras[1].autor).toBe("Conceição Evaristo");
    expect(obras[1].numExemplares).toBe(2);
  });

  it("faz parse do formato simplificado title,writers,classification", () => {
    const csv = `title,writers,classification
O escravo,"{""Carolina Maria de Jesus""}",869e
O escravo,"{""Carolina Maria de Jesus""}",869e
O idiota,,891.7h`;

    const obras = parseAcervoCsv(csv);
    expect(obras).toHaveLength(2);
    expect(obras[0].titulo).toBe("O escravo");
    expect(obras[0].numExemplares).toBe(2);
    expect(obras[1].titulo).toBe("O idiota");
    expect(obras[1].numExemplares).toBe(1);
  });

  it("limpa autores e chaves de array legado", () => {
    expect(cleanAutor('{"Carolina Maria de Jesus"}')).toBe("Carolina Maria de Jesus");
    expect(cleanAutor('"{""Eliana Alves Cruz""}"')).toBe("Eliana Alves Cruz");
    expect(cleanCdd("{869e}")).toBe("869e");
    expect(cleanIsbn("978-65-80309-31-3")).toBe("9786580309313");
    expect(cleanAno("2023")).toBe(2023);
    expect(cleanAno("1905-07-09")).toBe(null);
  });
});

