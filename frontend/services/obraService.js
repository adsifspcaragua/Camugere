const token = localStorage.getItem("biblioteca-auth-token")
const API_BASE_URL = import.meta.env.VITE_API_URL;

const headers = token ? { "Content-Type": "application/json", "jwt_token": token } : { "Content-Type": "application/json" };

export async function getObraById(id){
    const response = await fetch(`${API_BASE_URL}/obra/get/${id}`, {headers})
    const data = await response.json()

    if(!response.ok){
        const errorJson = await response.json().catch(() => null);
        const message = errorJson?.message || "Falha ao autenticar";
        console.log(message)
    }

    return data
}