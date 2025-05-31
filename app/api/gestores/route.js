import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { executeQuery } from "@/lib/database"

// GET - Listar todos os gestores
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const busca = searchParams.get("busca")

    let query = "SELECT id, nome, email, telefone, foto_perfil, role, data_cadastro FROM gestores"
    let params = []

    if (busca) {
      query += " WHERE nome LIKE ? OR email LIKE ? OR telefone LIKE ?"
      const searchTerm = `%${busca}%`
      params = [searchTerm, searchTerm, searchTerm]
    }

    query += " ORDER BY data_cadastro DESC"

    const gestores = await executeQuery(query, params)

    return NextResponse.json({
      success: true,
      data: gestores,
      total: gestores.length,
    })
  } catch (error) {
    console.error("❌ Erro ao buscar gestores:", error)
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

// POST - Criar novo gestor
export async function POST(request) {
  try {
    const body = await request.json()
    const { nome, email, telefone, senha, fotoPerfil } = body

    // Validações básicas
    if (!nome || !email || !telefone || !senha) {
      return NextResponse.json({ success: false, message: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, message: "Email inválido" }, { status: 400 })
    }

    // Validar telefone
    const telefoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/
    if (!telefoneRegex.test(telefone)) {
      return NextResponse.json(
        { success: false, message: "Telefone deve estar no formato (XX) XXXXX-XXXX" },
        { status: 400 },
      )
    }

    // Verificar se email já existe
    const emailExiste = await executeQuery("SELECT id FROM gestores WHERE email = ?", [email.toLowerCase().trim()])

    if (emailExiste.length > 0) {
      return NextResponse.json({ success: false, message: "Este email já está cadastrado" }, { status: 409 })
    }

    // Validar senha
    if (senha.length < 6) {
      return NextResponse.json({ success: false, message: "Senha deve ter pelo menos 6 caracteres" }, { status: 400 })
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10)

    // Inserir novo gestor no banco
    const result = await executeQuery(
      `INSERT INTO gestores (nome, email, telefone, senha, foto_perfil, role) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nome.trim(), email.toLowerCase().trim(), telefone, senhaHash, fotoPerfil || null, "gestor"],
    )

    // Buscar o gestor criado (sem a senha)
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
        message: "Gestor cadastrado com sucesso",
        data: novoGestor[0],
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("❌ Erro ao criar gestor:", error)
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

// PUT - Atualizar gestor
export async function PUT(request) {
  try {
    const body = await request.json()
    const { id, nome, email, telefone, senha, fotoPerfil } = body

    if (!id) {
      return NextResponse.json({ success: false, message: "ID é obrigatório" }, { status: 400 })
    }

    // Verificar se gestor existe
    const gestorExiste = await executeQuery("SELECT id FROM gestores WHERE id = ?", [id])

    if (gestorExiste.length === 0) {
      return NextResponse.json({ success: false, message: "Gestor não encontrado" }, { status: 404 })
    }

    // Validações se os campos foram fornecidos
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json({ success: false, message: "Email inválido" }, { status: 400 })
      }

      // Verificar se email já existe (exceto o próprio)
      const emailExiste = await executeQuery("SELECT id FROM gestores WHERE email = ? AND id != ?", [
        email.toLowerCase().trim(),
        id,
      ])

      if (emailExiste.length > 0) {
        return NextResponse.json({ success: false, message: "Este email já está cadastrado" }, { status: 409 })
      }
    }

    if (telefone) {
      const telefoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/
      if (!telefoneRegex.test(telefone)) {
        return NextResponse.json(
          { success: false, message: "Telefone deve estar no formato (XX) XXXXX-XXXX" },
          { status: 400 },
        )
      }
    }

    // Construir query de atualização dinamicamente
    const updateFields = []
    const updateValues = []

    if (nome) {
      updateFields.push("nome = ?")
      updateValues.push(nome.trim())
    }
    if (email) {
      updateFields.push("email = ?")
      updateValues.push(email.toLowerCase().trim())
    }
    if (telefone) {
      updateFields.push("telefone = ?")
      updateValues.push(telefone)
    }
    if (fotoPerfil !== undefined) {
      updateFields.push("foto_perfil = ?")
      updateValues.push(fotoPerfil)
    }
    if (senha) {
      if (senha.length < 6) {
        return NextResponse.json({ success: false, message: "Senha deve ter pelo menos 6 caracteres" }, { status: 400 })
      }
      const senhaHash = await bcrypt.hash(senha, 10)
      updateFields.push("senha = ?")
      updateValues.push(senhaHash)
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ success: false, message: "Nenhum campo para atualizar" }, { status: 400 })
    }

    // Adicionar ID no final dos valores
    updateValues.push(id)

    // Executar atualização
    await executeQuery(`UPDATE gestores SET ${updateFields.join(", ")} WHERE id = ?`, updateValues)

    // Buscar gestor atualizado (sem a senha)
    const gestorAtualizado = await executeQuery(
      "SELECT id, nome, email, telefone, foto_perfil, role, data_cadastro FROM gestores WHERE id = ?",
      [id],
    )

    return NextResponse.json({
      success: true,
      message: "Gestor atualizado com sucesso",
      data: gestorAtualizado[0],
    })
  } catch (error) {
    console.error("❌ Erro ao atualizar gestor:", error)
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

// DELETE - Deletar gestor
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = Number.parseInt(searchParams.get("id"))

    if (!id) {
      return NextResponse.json({ success: false, message: "ID é obrigatório" }, { status: 400 })
    }

    // Verificar se gestor existe
    const gestor = await executeQuery("SELECT id, role FROM gestores WHERE id = ?", [id])

    if (gestor.length === 0) {
      return NextResponse.json({ success: false, message: "Gestor não encontrado" }, { status: 404 })
    }

    // Não permitir deletar admin
    if (gestor[0].role === "admin") {
      return NextResponse.json({ success: false, message: "Não é possível deletar o administrador" }, { status: 403 })
    }

    // Deletar gestor
    await executeQuery("DELETE FROM gestores WHERE id = ?", [id])

    return NextResponse.json({
      success: true,
      message: "Gestor removido com sucesso",
    })
  } catch (error) {
    console.error("❌ Erro ao deletar gestor:", error)
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
