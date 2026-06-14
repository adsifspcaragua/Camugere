import jwt from 'jsonwebtoken' 

export default async function authMiddleware(req, res, next){
    try {
        const token = req.headers.jwt_token

        if(!token){
            throw new Error("Token de validação não foi informado!")
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET)

        next()
    } catch (error) {
        return res.status(400).json({
            message: "Token inválido!",
            error: error.message
        })
    }
}