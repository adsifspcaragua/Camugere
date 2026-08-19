const token = localStorage.getItem("biblioteca-auth-token")
const API_BASE_URL = import.meta.env.VITE_API_URL + '/usuario/';

const headers = token ? { "Content-Type": "application/json", "jwt_token": token } : { "Content-Type": "application/json" };

export async function getUsuarioById(id){
    const response = await fetch(`${API_BASE_URL}get/${id}`, {headers})

    if(!response.ok){
        const errorJson = await response.json().catch(() => null);
        const message = errorJson?.message || "Falha ao autenticar";
        console.log(message)
    }

    const data = await response.json()

    return data
}