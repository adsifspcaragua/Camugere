const API_BASE_URL = import.meta.env.VITE_API_URL;

function getHeaders() {
    const token = localStorage.getItem("biblioteca-auth-token")
    return { "Content-Type": "application/json", "jwt_token": token } 
}

export async function getLeitorById(id){
    const headers = getHeaders()

    const response = await fetch(`${API_BASE_URL}/leitor/get/${id}`, {headers})
    const data = await response.json()

    if(!response.ok){
        const errorJson = await response.json().catch(() => null);
        const message = errorJson?.message || "Falha ao autenticar";
        console.log(message)
    }

    return data
}

export async function listLeitores() {
    const headers = getHeaders()
    const response = await fetch(`${API_BASE_URL}/leitor/list`, {headers})

    if(!response.ok){
        const errorJson = await response.json().catch(() => null);
        console.log(errorJson)
        return
    }

    const data = await response.json()
    return data
}