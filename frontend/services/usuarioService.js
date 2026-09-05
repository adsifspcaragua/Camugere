const token = localStorage.getItem("biblioteca-auth-token")
const API_BASE_URL = import.meta.env.VITE_API_URL + '/usuario/';

function getHeaders() {
    const token = localStorage.getItem("biblioteca-auth-token");
    return { "Content-Type": "application/json", "jwt_token": token } 
}

export async function getUsuarioById(id){
    const headers = getHeaders()
    const response = await fetch(`${API_BASE_URL}get/${id}`, {headers})

    if(!response.ok){
        const errorJson = await response.json().catch(() => null);
        console.log(errorJson)
        return
    }

    const data = await response.json()
    return data
}