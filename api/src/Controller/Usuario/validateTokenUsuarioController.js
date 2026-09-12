import bcrypt from "bcrypt" 
import jwt from "jsonwebtoken"

export default async function validateTokenUsuarioController(req, res) {
    try {
        const payload = jwt.verify(req.body.token, process.env.JWT_SECRET)

        return res.status(200).json({
            message: "Token válido!",
            data: payload
        })
    } catch (error) {
        return res.status(500).json({
            message: "Erro!",
            error: error.message
        })
    }
}