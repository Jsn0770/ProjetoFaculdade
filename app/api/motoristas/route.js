import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"

// GET - Listar motoristas com busca opcional
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const busca = searchParams.get("busca") || ""

    let query = `
      SELECT 
        id,
        nome,
        telefone,
        cnh,
        vencimento_cnh,
        categoria,
        status,
        observacoes,
        data_cadastro,
        data_atualizacao
      FROM motoristas 
      WHERE 1=1
    `
    const params = []

    if (busca) {
      query += ` AND (
        nome LIKE ? OR 
        telefone LIKE ? OR 
        cnh LIKE ?
      )`
      const searchTerm = `%${busca}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }

    query += ` ORDER BY data_cadastro DESC`

    const motoristas = await executeQuery(query, params)

    return NextResponse.json({
      success: true,
      data: motoristas,
      total: motoristas.length,
    })
  } catch (error) {
    console.error("❌ Erro ao buscar motoristas:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
        error: error.message,
      },
      { status: 500 },
    )
  }
}

// POST - Criar novo motorista
export async function POST(request) {
  try {
    const body = await request.json()
    const { nome, telefone, cnh, vencimentoCnh, categoria = "B", status = "Ativo", observacoes = "" } = body

    // Validações
    if (!nome || !telefone || !cnh || !vencimentoCnh) {
      return NextResponse.json(
        {
          success: false,
          message: "Nome, telefone, CNH e vencimento são obrigatórios",
        },
        { status: 400 },
      )
    }

    // Validar formato da CNH (11 dígitos)
    if (!/^\d{11}$/.test(cnh)) {
      return NextResponse.json(
        {
          success: false,
          message: "CNH deve conter exatamente 11 dígitos",
        },
        { status: 400 },
      )
    }

    // Validar se CNH não está vencida
    const hoje = new Date()
    const dataVencimento = new Date(vencimentoCnh)
    if (dataVencimento < hoje) {
      return NextResponse.json(
        {
          success: false,
          message: "CNH está vencida",
        },
        { status: 400 },
      )
    }

    // Verificar se CNH já existe
    const cnhExistente = await executeQuery("SELECT id FROM motoristas WHERE cnh = ?", [cnh])

    if (cnhExistente.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Já existe um motorista com esta CNH",
        },
        { status: 400 },
      )
    }

    // Inserir novo motorista
    const result = await executeQuery(
      `INSERT INTO motoristas 
       (nome, telefone, cnh, vencimento_cnh, categoria, status, observacoes) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nome, telefone, cnh, vencimentoCnh, categoria, status, observacoes],
    )

    // Buscar o motorista criado
    const novoMotorista = await executeQuery("SELECT * FROM motoristas WHERE id = ?", [result.insertId])

    return NextResponse.json(
      {
        success: true,
        message: "Motorista criado com sucesso",
        data: novoMotorista[0],
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("❌ Erro ao criar motorista:", error)

    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        {
          success: false,
          message: "CNH já cadastrada no sistema",
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
        error: error.message,
      },
      { status: 500 },
    )
  }
}

// PUT - Atualizar motorista
export async function PUT(request) {
  try {
    const body = await request.json()
    const { id, nome, telefone, cnh, vencimentoCnh, categoria, status, observacoes } = body

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "ID do motorista é obrigatório",
        },
        { status: 400 },
      )
    }

    // Validações
    if (!nome || !telefone || !cnh || !vencimentoCnh) {
      return NextResponse.json(
        {
          success: false,
          message: "Nome, telefone, CNH e vencimento são obrigatórios",
        },
        { status: 400 },
      )
    }

    // Validar formato da CNH
    if (!/^\d{11}$/.test(cnh)) {
      return NextResponse.json(
        {
          success: false,
          message: "CNH deve conter exatamente 11 dígitos",
        },
        { status: 400 },
      )
    }

    // Verificar se motorista existe
    const motoristaExistente = await executeQuery("SELECT id FROM motoristas WHERE id = ?", [id])

    if (motoristaExistente.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Motorista não encontrado",
        },
        { status: 404 },
      )
    }

    // Verificar se CNH já existe em outro motorista
    const cnhExistente = await executeQuery("SELECT id FROM motoristas WHERE cnh = ? AND id != ?", [cnh, id])

    if (cnhExistente.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Já existe outro motorista com esta CNH",
        },
        { status: 400 },
      )
    }

    // Atualizar motorista
    await executeQuery(
      `UPDATE motoristas SET 
       nome = ?, telefone = ?, cnh = ?, vencimento_cnh = ?, 
       categoria = ?, status = ?, observacoes = ?, data_atualizacao = NOW()
       WHERE id = ?`,
      [nome, telefone, cnh, vencimentoCnh, categoria, status, observacoes, id],
    )

    // Buscar motorista atualizado
    const motoristaAtualizado = await executeQuery("SELECT * FROM motoristas WHERE id = ?", [id])

    return NextResponse.json({
      success: true,
      message: "Motorista atualizado com sucesso",
      data: motoristaAtualizado[0],
    })
  } catch (error) {
    console.error("❌ Erro ao atualizar motorista:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
        error: error.message,
      },
      { status: 500 },
    )
  }
}

// DELETE - Remover motorista
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "ID do motorista é obrigatório",
        },
        { status: 400 },
      )
    }

    // Verificar se motorista existe
    const motorista = await executeQuery("SELECT nome FROM motoristas WHERE id = ?", [id])

    if (motorista.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Motorista não encontrado",
        },
        { status: 404 },
      )
    }

    // Remover motorista (removemos a verificação de eventos por enquanto)
    await executeQuery("DELETE FROM motoristas WHERE id = ?", [id])

    return NextResponse.json({
      success: true,
      message: `Motorista ${motorista[0].nome} removido com sucesso`,
    })
  } catch (error) {
    console.error("❌ Erro ao remover motorista:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
