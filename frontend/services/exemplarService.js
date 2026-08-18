const token = localStorage.getItem("biblioteca-auth-token")
const API_BASE_URL = import.meta.env.VITE_API_URL;

const headers = token ? { "Content-Type": "application/json", "jwt_token": token } : { "Content-Type": "application/json" };

export async function getExemplarById(id){
    const response = await fetch(`${API_BASE_URL}/exemplar/get/${id}`, {headers})

    if(!response.ok){
        const errorJson = await response.json().catch(() => null);
        const message = errorJson?.message || "Falha ao autenticar";
        console.log(message)
    }

    const data = await response.json()

    return data
}