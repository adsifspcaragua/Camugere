
import { jest } from "@jest/globals";

jest.unstable_mockModule("@prisma/client", () => {
    return {
        PrismaClient: jest.fn().mockImplementation(() => {
            return {
                Cdd: {
                    findMany: jest.fn().mockResolvedValue([{ id: "000", descricao: "Informatica" }])
                }
            };
        })
    };
});

const { listCdd } = await import("../Model/CddModel.js");

describe("CddModel", () => {
    it("should list Cdds", async () => {
        const result = await listCdd();
        expect(result).toEqual([{ id: "000", descricao: "Informatica" }]);
    });
});

