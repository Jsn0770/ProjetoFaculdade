import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

// Simulando um banco de dados em memória (em produção seria um banco real)
const gestores = [
  {
    id: 1,
    nome: "Administrador",
    email: "admin@fleetflow.com",
    telefone: "(11) 99999-9999",
    senha: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
    fotoPerfil: null,
    dataCadastro: new Date().toISOString(),
    role: "admin",
  },
]

// GET - Listar todos os gestores
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const busca = searchParams.get("busca")

    let gestoresFiltrados = gestores

    if (busca) {
      gestoresFiltrados = gestores.filter(
        (gestor) =>
          gestor.nome.toLowerCase().includes(busca.toLowerCase()) ||
          gestor.email.toLowerCase().includes(busca.toLowerCase()) ||
          gestor.telefone.includes(busca),
      )
    }

    // Remove senhas da resposta
    const gestoresSemSenha = gestoresFiltrados.map(({ senha, ...gestor }) => gestor)

    return NextResponse.json({
      success: true,
      data: gestoresSemSenha,
      total: gestoresSemSenha.length,
    })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}

// POST - Criar novo gestor
export async function POST(request) {
  try {
    const body = await request.json()
    const { nome, email, telefone, senha, fotoPerfil } = body

    // Validações
    if (!nome || !email || !telefone || !senha) {
      return NextResponse.json({ success: false, message: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, message: "Email inválido" }, { status: 400 })
    }

    // Validar telefone
    const telefoneRegex = /^$$\d{2}$$\s\d{4,5}-\d{4}$/
    if (!telefoneRegex.test(telefone)) {
      return NextResponse.json(
        { success: false, message: "Telefone deve estar no formato (XX) XXXXX-XXXX" },
        { status: 400 },
      )
    }

    // Verificar se email já existe
    const emailExiste = gestores.find((g) => g.email === email)
    if (emailExiste) {
      return NextResponse.json({ success: false, message: "Este email já está cadastrado" }, { status: 409 })
    }

    // Validar senha
    if (senha.length < 6) {
      return NextResponse.json({ success: false, message: "Senha deve ter pelo menos 6 caracteres" }, { status: 400 })
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10)

    // Criar novo gestor
    const novoGestor = {
      id: Date.now(),
      nome,
      email,
      telefone,
      senha: senhaHash,
      fotoPerfil: fotoPerfil || null,
      dataCadastro: new Date().toISOString(),
      role: "gestor",
    }

    gestores.push(novoGestor)

    // Retornar sem a senha
    const { senha: _, ...gestorSemSenha } = novoGestor

    return NextResponse.json(
      {
        success: true,
        message: "Gestor cadastrado com sucesso",
        data: gestorSemSenha,
      },
      { status: 201 },
    )
  } catch (error) {
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}

// PUT - Atualizar gestor
export async function PUT(request) {
  try {
    const body = await request.json()
    const { id, nome, email, telefone, senha, fotoPerfil } = body

    if (!id) {
      return NextResponse.json({ success: false, message: "ID é obrigatório" }, { status: 400 })
    }

    const gestorIndex = gestores.findIndex((g) => g.id === id)
    if (gestorIndex === -1) {
      return NextResponse.json({ success: false, message: "Gestor não encontrado" }, { status: 404 })
    }

    // Validações se os campos foram fornecidos
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json({ success: false, message: "Email inválido" }, { status: 400 })
      }

      // Verificar se email já existe (exceto o próprio)
      const emailExiste = gestores.find((g) => g.email === email && g.id !== id)
      if (emailExiste) {
        return NextResponse.json({ success: false, message: "Este email já está cadastrado" }, { status: 409 })
      }
    }

    if (telefone) {
      const telefoneRegex = /^$$\d{2}$$\s\d{4,5}-\d{4}$/
      if (!telefoneRegex.test(telefone)) {
        return NextResponse.json(
          { success: false, message: "Telefone deve estar no formato (XX) XXXXX-XXXX" },
          { status: 400 },
        )
      }
    }

    // Atualizar campos
    const gestorAtualizado = { ...gestores[gestorIndex] }

    if (nome) gestorAtualizado.nome = nome
    if (email) gestorAtualizado.email = email
    if (telefone) gestorAtualizado.telefone = telefone
    if (fotoPerfil !== undefined) gestorAtualizado.fotoPerfil = fotoPerfil

    // Se senha foi fornecida, fazer hash
    if (senha) {
      if (senha.length < 6) {
        return NextResponse.json({ success: false, message: "Senha deve ter pelo menos 6 caracteres" }, { status: 400 })
      }
      gestorAtualizado.senha = await bcrypt.hash(senha, 10)
    }

    gestores[gestorIndex] = gestorAtualizado

    // Retornar sem a senha
    const { senha: _, ...gestorSemSenha } = gestorAtualizado

    return NextResponse.json({
      success: true,
      message: "Gestor atualizado com sucesso",
      data: gestorSemSenha,
    })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}

// DELETE - Deletar gestor
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = Number.parseInt(searchParams.get("id"))

    if (!id) {
      return NextResponse.json({ success: false, message: "ID é obrigatório" }, { status: 400 })
    }

    const gestorIndex = gestores.findIndex((g) => g.id === id)
    if (gestorIndex === -1) {
      return NextResponse.json({ success: false, message: "Gestor não encontrado" }, { status: 404 })
    }

    // Não permitir deletar admin
    if (gestores[gestorIndex].role === "admin") {
      return NextResponse.json({ success: false, message: "Não é possível deletar o administrador" }, { status: 403 })
    }

    gestores.splice(gestorIndex, 1)

    return NextResponse.json({
      success: true,
      message: "Gestor removido com sucesso",
    })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}
