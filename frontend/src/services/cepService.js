// Consulta pública do ViaCEP — preenche o endereço a partir do CEP.
export async function buscarCep(cep) {
  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  const data = response.ok ? await response.json() : null;
  if (!data || data.erro) throw new Error("CEP não encontrado.");
  return { logradouro: data.logradouro ?? "", bairro: data.bairro ?? "", cidade: data.localidade ?? "", uf: data.uf ?? "" };
}
