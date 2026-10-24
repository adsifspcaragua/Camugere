export const onlyDigits = (value) => (value == null ? value : String(value).replace(/\D/g, ""));

function digitoVerificador(cpf, tamanho) {
  let soma = 0;
  for (let i = 0; i < tamanho; i++) soma += Number(cpf[i]) * (tamanho + 1 - i);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function isValidCpf(value) {
  const cpf = onlyDigits(value);
  if (!cpf || cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  return digitoVerificador(cpf, 9) === Number(cpf[9]) && digitoVerificador(cpf, 10) === Number(cpf[10]);
}
