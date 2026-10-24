import z from "zod";
import { texto } from "./common.js";

export const createCddSchema = z.object({ id: texto(15), descricao: texto(150) });
export const updateCddSchema = z.object({ descricao: texto(150) });
