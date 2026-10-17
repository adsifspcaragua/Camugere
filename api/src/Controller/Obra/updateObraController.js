import { obraValidator, updateObra } from "../../Model/ObraModel.js";
import { internalizarCapa } from "../../Services/capaService.js";

export default async function updateObraController(req, res) {
    try {
        const { id } = req.params;
        const obra = req.body;

        const { success, data, error } = obraValidator(obra, true);

        if (!success) {
            return res.status(400).json({
                message: "Não foi possível validar a obra!",
                error: error.errors?.map((e) => e.message).join(", ") || error.message
            });
        }

        let aviso;
        if (data.capaUrl !== undefined) {
            const resultado = await internalizarCapa(data.capaUrl, req);
            aviso = resultado.aviso;
            if (resultado.capaUrl === undefined) delete data.capaUrl; // falhou: mantém a capa atual
            else data.capaUrl = resultado.capaUrl;
        }

        const result = await updateObra(Number(id), data);

        return res.status(200).json({
            message: "Obra atualizada com sucesso!",
            ...(aviso && { aviso }),
            data: result
        });
    } catch (error) {
        return res.status(500).json({
            message: "Erro ao atualizar a obra!",
            error: error.message
        });
    }
}