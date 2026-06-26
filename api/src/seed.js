import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt" 
const prisma = new PrismaClient();

async function main() {
	console.log('Start seeding...');

	// Create CDDs (5)
	const cddsData = [
		{ id: '000001', descricao: 'Ciências Exatas' },
		{ id: '000002', descricao: 'Ciências Humanas' },
		{ id: '000003', descricao: 'Literatura' },
		{ id: '000004', descricao: 'Artes' },
		{ id: '000005', descricao: 'Tecnologia' },
	];

	const cdds = [];
	for (const c of cddsData) {
		const created = await prisma.cdd.create({ data: c });
		cdds.push(created);
	}

	// Create Authors (10)
	const autorNames = [
		{nome: 'João', sobrenome: 'Silva'},
		{nome: 'Maria', sobrenome: 'Oliveira'}, 
		{nome: 'Carlos', sobrenome: 'Souza'}, 
		{nome: 'Ana', sobrenome: 'Pereira'}, 
		{nome: 'Luiz', sobrenome: 'Gomes'},
		{nome: 'Fernanda', sobrenome: 'Almeida'},
		{nome: 'Paulo', sobrenome: 'Santana'},
		{nome: 'Beatriz', sobrenome: 'Ribeiro'},
		{nome: 'Marcos', sobrenome: 'Lima'},
		{nome: 'Patrícia', sobrenome: 'Fernandes'}];
	const autores = [];
	for(const autor of autorNames){
		const created = await prisma.autor.create({data: autor})
		autores.push(created)
	}

	// Create Users (20)
	const usuarios = [];
	for (let i = 1; i <= 20; i++) {
		const plain = `hash${i}`;
		const hashed = await bcrypt.hash(plain, 10);
		const u = await prisma.usuario.create({
			data: {
				nome: `User${i}`.slice(0, 20),
				email: `user${i}@example.com`,
				hash: hashed,
			},
		});
		usuarios.push(u);
	}

	// Create Leitors (12) using first 12 users
	const leitores = [];
	for (let i = 0; i < 12; i++) {
		const l = await prisma.leitor.create({
			data: {
				id_usuario: usuarios[i].id,
				cpf: `000.000.00${i}${i}`.slice(0, 14),
				telefone: `11900000${100 + i}`,
			},
		});
		leitores.push(l);
	}

	// Create Bibliotecarios (5) using users 13-17
	const bibliotecarios = [];
	for (let i = 12; i < 17; i++) {
		const b = await prisma.bibliotecario.create({
			data: {
				id_usuario: usuarios[i].id,
			},
		});
		bibliotecarios.push(b);
	}

	// Create Obras (10), each linked to a CDD
	const obras = [];
	for (let i = 1; i <= 10; i++) {
		const obra = await prisma.obra.create({
			data: {
				titulo: `Obra Titulo ${i}`,
				subtitulo: `Subtitulo ${i}`,
				editora: `Editora ${i}`,
				edicao: `${i}a`,
				numeroPaginas: 100 + i,
				capa: null,
				ativa: true,
				notaMedia: null,
				id_cdd: cdds[(i - 1) % cdds.length].id,
			},
		});
		obras.push(obra);
	}

	// Create Exemplares: 5 exemplares por obra (>=50 exemplares)
	const exemplares = [];
	for (const obra of obras) {
		for (let n = 1; n <= 5; n++) {
			const ex = await prisma.exemplar.create({
				data: {
					id_obra: obra.id,
					numeroInventario: `${obra.id}-${n}`,
					disponivel: true,
				},
			});
			exemplares.push(ex);
		}
	}

	// Create ObraAutor relations (each obra gets at least one autor)
	for (let i = 0; i < obras.length; i++) {
		const obra = obras[i];
		const autor = autores[i % autores.length];
		await prisma.obraAutor.create({ data: { id_obra: obra.id, id_autor: autor.id } });
		// Add an additional author to some obras
		if (i % 2 === 0) {
			const another = autores[(i + 1) % autores.length];
			await prisma.obraAutor.create({ data: { id_obra: obra.id, id_autor: another.id } });
		}
	}

	// Create Emprestimos linking leitores to exemplares
	const emprestimos = [];
	const emprestimosToCreate = Math.min(15, leitores.length, exemplares.length);
	for (let i = 0; i < emprestimosToCreate; i++) {
		const exemplar = exemplares[i];
		const leitor = leitores[i % leitores.length];

		const e = await prisma.emprestimo.create({
			data: {
				dataInicio: new Date(),
				diasLocacao: 7 + (i % 10),
				id_leitor: leitor.id,
				id_exemplar: exemplar.id,
			},
		});

		// After creating the emprestimo, mark the exemplar as unavailable
		await prisma.exemplar.update({ where: { id: exemplar.id }, data: { disponivel: false } });

		emprestimos.push(e);
	}

	// Create Comentarios (5)
	for (let i = 0; i < 5; i++) {
		await prisma.comentario.create({
			data: {
				dataPublicacao: new Date(),
				texto: `Comentário de teste ${i}`,
				nota: (i % 5) + 1,
				curtidas: i * 2,
				moderado: false,
				id_obra: obras[i % obras.length].id,
				id_leitor: leitores[i % leitores.length].id,
			},
		});
	}

	// Create Reservas (5)
	for (let i = 0; i < 5; i++) {
		await prisma.reserva.create({
			data: {
				dataReserva: new Date(),
				id_obra: obras[i % obras.length].id,
				id_leitor: leitores[i % leitores.length].id,
			},
		});
	}

	console.log('Seeding finished.');
}

main()
