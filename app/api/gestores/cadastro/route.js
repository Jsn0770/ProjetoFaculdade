import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { executeQuery } from "@/lib/database"

export async function POST(request) {
  try {
    const body = await request.json()
    const { nome, email, telefone, senha, confirmarSenha, fotoPerfil } = body

    // Validações básicas
    if (!nome || !email || !telefone || !senha || !confirmarSenha) {
      return NextResponse.json(
        {
          success: false,
          message: "Todos os campos são obrigatórios",
          field: "required",
        },
        { status: 400 },
      )
    }

    // Validar nome
    if (nome.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message: "Nome deve ter pelo menos 2 caracteres",
          field: "nome",
        },
        { status: 400 },
      )
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Email inválido",
          field: "email",
        },
        { status: 400 },
      )
    }

    // Verificar se email já existe
    const emailExiste = await executeQuery("SELECT id FROM gestores WHERE email = ?", [email.toLowerCase().trim()])

    if (emailExiste.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Este email já está cadastrado",
          field: "email",
        },
        { status: 409 },
      )
    }

    // Validar telefone - 
    const telefoneRegex =  /^\(?\d{2}\)?\s\d{4,5}-\d{4}$/
    if (!telefoneRegex.test(telefone)) {
      return NextResponse.json(
        {
          success: false,
          message: "Telefone deve estar no formato (XX) XXXXX-XXXX",
          field: "telefone",
        },
        { status: 400 },
      )
    }

    // Validar senha
    if (senha.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Senha deve ter pelo menos 6 caracteres",
          field: "senha",
        },
        { status: 400 },
      )
    }

    // Validar força da senha
    const temLetraMinuscula = /[a-z]/.test(senha)
    const temLetraMaiuscula = /[A-Z]/.test(senha)
    const temNumero = /\d/.test(senha)

    if (!temLetraMinuscula || !temLetraMaiuscula || !temNumero) {
      return NextResponse.json(
        {
          success: false,
          message: "Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número",
          field: "senha",
        },
        { status: 400 },
      )
    }

    // Validar confirmação de senha
    if (senha !== confirmarSenha) {
      return NextResponse.json(
        {
          success: false,
          message: "As senhas não coincidem",
          field: "confirmarSenha",
        },
        { status: 400 },
      )
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10)

    // Inserir novo gestor no banco
    const result = await executeQuery(
      `
      INSERT INTO gestores (nome, email, telefone, senha, foto_perfil, role) 
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      [nome.trim(), email.toLowerCase().trim(), telefone, senhaHash, fotoPerfil || null, "gestor"],
    )

    // Buscar o gestor criado
    const novoGestor = await executeQuery(
      "SELECT id, nome, email, telefone, foto_perfil, role, data_cadastro FROM gestores WHERE id = ?",
      [result.insertId],
    )

    console.log("✅ Novo gestor cadastrado:", {
      id: result.insertId,
      nome: nome.trim(),
      email: email.toLowerCase().trim(),
    })

    return NextResponse.json(
      {
        success: true,
        message: "Cadastro realizado com sucesso! Você já pode fazer login.",
        data: novoGestor[0],
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("❌ Erro no cadastro:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor. Tente novamente.",
        field: "server",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
