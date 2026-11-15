// Consulta pública do ViaCEP — preenche o endereço a partir do CEP.
export async function buscarCep(cep) {
  let response;
  try {
    response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: AbortSignal.timeout(8000) });
  } catch {
    throw new Error("Não foi possível consultar o CEP agora (sem internet ou serviço fora do ar).");
  }
  // O ViaCEP responde 400 para CEP malformado e { erro: true } para CEP inexistente.
  const data = response.ok ? await response.json().catch(() => null) : null;
  if (!data || data.erro) throw new Error("CEP não encontrado. Confira os números.");
  return { logradouro: data.logradouro ?? "", bairro: data.bairro ?? "", cidade: data.localidade ?? "", uf: data.uf ?? "" };
}
