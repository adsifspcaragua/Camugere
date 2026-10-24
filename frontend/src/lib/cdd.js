/**
 * Sugestão de classificação CDD a partir do assunto/título.
 * É um ponto de partida para a bibliotecária revisar — não substitui a catalogação.
 */
const REGRAS = [
  [/poe(sia|try|mas?)|poems?|verso/i, "869.1", "Literatura brasileira — poesia", "811", "Poesia"],
  [/cont(os?)|short stor/i, "869.3", "Literatura brasileira — contos e ficção", "813", "Ficção — contos"],
  [/fic(ção|cao|tion)|romance|novel|literat/i, "869.3", "Literatura brasileira — ficção", "813", "Ficção"],
  [/juvenil|infant|juvenile|children/i, "028.5", "Literatura infantojuvenil", "028.5", "Literatura infantojuvenil"],
  [/hist(ória|oria|ory)/i, "981", "História do Brasil", "900", "História"],
  [/pol[ií]tic|democra|political/i, "320", "Ciência política", "320", "Ciência política"],
  [/racis|étnic|etnic|negr|indígen|indigen|feminis|gênero|genero|gender/i, "305", "Grupos sociais", "305", "Grupos sociais"],
  [/educa|pedagog|ensino|teaching/i, "370", "Educação", "370", "Educação"],
  [/psicolog|psycholog/i, "150", "Psicologia", "150", "Psicologia"],
  [/filosof|philosoph/i, "100", "Filosofia", "100", "Filosofia"],
  [/relig|teolog|bíbli|bibli|spiritual/i, "200", "Religião", "200", "Religião"],
  [/econom|business|negócio|finan/i, "330", "Economia", "330", "Economia"],
  [/direito|law|jurid/i, "340", "Direito", "340", "Direito"],
  [/sociolog|social science|ciências sociais|sociedade/i, "300", "Ciências sociais", "300", "Ciências sociais"],
  [/comput|programa|software|tecnolog|technology/i, "005", "Computação e programação", "005", "Computação"],
  [/medic|saúde|saude|health/i, "610", "Medicina e saúde", "610", "Medicina e saúde"],
  [/culin|cozinha|cook|receita/i, "641.5", "Culinária", "641.5", "Culinária"],
  [/arte|art\b|music|música|cinema|fotograf/i, "700", "Artes", "700", "Artes"],
  [/ciênci|scienc|biolog|físic|químic|matem/i, "500", "Ciências naturais e matemática", "500", "Ciências"],
  [/geograf|viage|travel/i, "910", "Geografia e viagens", "910", "Geografia"],
  [/biograf|memória|memoir|autobiog/i, "920", "Biografias", "920", "Biografias"],
];

export function sugerirCdd(texto = "", idioma = "pt") {
  const regra = REGRAS.find(([re]) => re.test(texto));
  if (!regra) return null;
  const [, codBr, descBr, codGeral, descGeral] = regra;
  // A classe 869 é específica de literatura em português.
  const portugues = !idioma || idioma.startsWith("pt");
  return portugues ? { codigo: codBr, descricao: descBr } : { codigo: codGeral, descricao: descGeral };
}
