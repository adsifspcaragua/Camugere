// Projeções reutilizadas — nunca expõem o hash da senha.
export const usuarioPublico = { id: true, nome: true, email: true };

// Versão enxuta, usada dentro de empréstimos.
export const leitorResumoSelect = {
  id: true,
  id_usuario: true,
  telefone: true,
  usuario: { select: usuarioPublico },
};

export const suspensaoSelect = {
  id: true,
  id_leitor: true,
  motivo: true,
  dataInicio: true,
  dataFim: true,
  dataEncerramento: true,
  bibliotecario: { select: { id: true, usuario: { select: { nome: true } } } },
};

export const enderecoCampos = ["cep", "logradouro", "numero", "complemento", "bairro", "cidade", "uf"];

export const leitorSelect = {
  id: true,
  id_usuario: true,
  cpf: true,
  telefone: true,
  ...Object.fromEntries(enderecoCampos.map((campo) => [campo, true])),
  usuario: { select: usuarioPublico },
  // Só as não encerradas: a ativa (se houver) está entre elas.
  suspensoes: { where: { dataEncerramento: null }, select: suspensaoSelect, orderBy: { dataInicio: "desc" } },
};

export const exemplarSelect = { id: true, id_obra: true, numeroInventario: true, disponivel: true };

export const emprestimoSelect = {
  id: true,
  dataInicio: true,
  diasLocacao: true,
  statusDevolucao: true,
  dataDevolucao: true,
  lembreteEnviadoEm: true,
  id_leitor: true,
  id_exemplar: true,
  leitor: { select: leitorResumoSelect },
  exemplar: {
    select: {
      ...exemplarSelect,
      obra: { select: { id: true, titulo: true, capaUrl: true } },
    },
  },
};
