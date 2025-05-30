import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { executeQuery } from "@/lib/database"

const JWT_SECRET = process.env.JWT_SECRET || "fleetflow-secret-key-2024"

export async function POST(request) {
  try {
    const body = await request.json()
    const { email, senha } = body

    // Validações básicas
    if (!email || !senha) {
      return NextResponse.json(
        {
          success: false,
          message: "Email e senha são obrigatórios",
        },
        { status: 400 },
      )
    }

    // Buscar gestor por email
    const gestores = await executeQuery("SELECT * FROM gestores WHERE email = ? AND ativo = TRUE", [
      email.toLowerCase().trim(),
    ])

    if (gestores.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Email ou senha inválidos",
        },
        { status: 401 },
      )
    }

    const gestor = gestores[0]

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, gestor.senha)

    if (!senhaValida) {
      return NextResponse.json(
        {
          success: false,
          message: "Email ou senha inválidos",
        },
        { status: 401 },
      )
    }

    // Gerar JWT token
    const token = jwt.sign(
      {
        id: gestor.id,
        email: gestor.email,
        role: gestor.role,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    )

    // Dados do usuário sem senha
    const { senha: _, ...dadosUsuario } = gestor

    console.log("✅ Login realizado:", {
      id: gestor.id,
      email: gestor.email,
      role: gestor.role,
    })

    return NextResponse.json({
      success: true,
      message: "Login realizado com sucesso",
      data: {
        user: dadosUsuario,
        token,
      },
    })
  } catch (error) {
    console.error("❌ Erro no login:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
