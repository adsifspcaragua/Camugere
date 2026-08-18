const token = localStorage.getItem(STORAGE_KEY)
API_BASE_URL = import.meta.env.VITE_API_URL;

const headers = token ? { "Content-Type": "application/json", "jwt_token": token } : { "Content-Type": "application/json" };

export async function getLeitorById(id){
    const response = await fetch(`${API_BASE_URL}leitor/get/${id}`, headers)
    const data = await response.json()

    return data
}