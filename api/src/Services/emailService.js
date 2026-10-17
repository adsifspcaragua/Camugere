import nodemailer from "nodemailer";

let cachedTransporter = null;

async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  // Se o servidor tiver variáveis SMTP configuradas no .env, usa o SMTP real
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true" || Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return cachedTransporter;
  }

  // Fallback automático: cria conta de teste gratuita do Ethereal (Nodemailer) para desenvolvimento
  const testAccount = await nodemailer.createTestAccount();
  cachedTransporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  return cachedTransporter;
}

function formatarDataBR(dataInput) {
  if (!dataInput) return "—";
  const d = new Date(dataInput);
  if (isNaN(d.getTime())) return String(dataInput);
  return d.toLocaleDateString("pt-BR");
}

export async function enviarEmailEmprestimo(emprestimo) {
  const emailDestino = emprestimo?.leitor?.usuario?.email;
  const nomeLeitor = emprestimo?.leitor?.usuario?.nome || "Leitor";
  const tituloObra = emprestimo?.exemplar?.obra?.titulo || "Obra do Acervo";
  const numeroExemplar = emprestimo?.exemplar?.numeroInventario || "—";

  if (!emailDestino) {
    return { enviado: false, motivo: "Leitor não possui e-mail cadastrado." };
  }

  const dataInicioDate = emprestimo?.dataInicio ? new Date(emprestimo.dataInicio) : new Date();
  const diasLocacao = Number(emprestimo?.diasLocacao || 14);
  const dataPrevistaDate = new Date(dataInicioDate);
  dataPrevistaDate.setDate(dataPrevistaDate.getDate() + diasLocacao);

  const dataInicioBR = formatarDataBR(dataInicioDate);
  const dataDevolucaoPrevistaBR = formatarDataBR(dataPrevistaDate);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
      <div style="background-color: #d97706; color: #ffffff; padding: 24px;">
        <h2 style="margin: 0; font-size: 20px;">📚 Biblioteca Camugerê</h2>
        <p style="margin: 4px 0 0; font-size: 14px; opacity: 0.9;">Comprovante de Empréstimo Realizado</p>
      </div>
      <div style="padding: 24px; color: #1f2937; background-color: #ffffff;">
        <p style="font-size: 16px; margin-top: 0;">Olá, <strong>${nomeLeitor}</strong>!</p>
        <p style="font-size: 15px; line-height: 1.5;">
          Seu empréstimo foi registrado com sucesso no sistema da <strong>Biblioteca Camugerê</strong>. Confira abaixo os detalhes da obra retirada e a data prevista para devolução:
        </p>
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 20px 0;">
          <p style="margin: 6px 0; font-size: 15px;"><strong>Obra:</strong> ${tituloObra}</p>
          <p style="margin: 6px 0; font-size: 15px;"><strong>Exemplar:</strong> ${numeroExemplar}</p>
          <p style="margin: 6px 0; font-size: 15px;"><strong>Data do Empréstimo:</strong> ${dataInicioBR}</p>
          <p style="margin: 6px 0; font-size: 15px;"><strong>Prazo de Locação:</strong> ${diasLocacao} dia(s)</p>
          <p style="margin: 10px 0 4px; font-size: 16px; color: #b45309;">
            <strong>📅 Data de Devolução Prevista:</strong> ${dataDevolucaoPrevistaBR}
          </p>
        </div>
        <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
          Por favor, fique atento(a) ao prazo de devolução para evitar atrasos. Boa leitura!
        </p>
      </div>
    </div>
  `;

  const textoSimples = `Olá, ${nomeLeitor}!\n\nSeu empréstimo foi registrado na Biblioteca Camugerê.\n- Obra: ${tituloObra}\n- Exemplar: ${numeroExemplar}\n- Data do Empréstimo: ${dataInicioBR}\n- Data de Devolução Prevista: ${dataDevolucaoPrevistaBR}\n\nBoa leitura!`;

  const transporter = await getTransporter();
  const remetente = process.env.SMTP_FROM || process.env.SMTP_USER || '"Biblioteca Camugerê" <no-reply@camugere.org>';

  const info = await transporter.sendMail({
    from: remetente,
    to: emailDestino,
    subject: `Empréstimo confirmado: "${tituloObra}" — Devolução até ${dataDevolucaoPrevistaBR}`,
    text: textoSimples,
    html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info) || null;
  if (previewUrl) {
    console.log(`[E-mail Empréstimo] Enviado para ${emailDestino} | Visualizar e-mail: ${previewUrl}`);
  } else {
    console.log(`[E-mail Empréstimo] Enviado com sucesso para ${emailDestino}`);
  }

  return {
    enviado: true,
    emailDestino,
    nomeLeitor,
    tituloObra,
    numeroExemplar,
    dataDevolucaoPrevista: dataDevolucaoPrevistaBR,
    previewUrl,
  };
}

