import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"

// GET - Listar todos os carros ou buscar por termo
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const busca = searchParams.get("busca") || ""

    let query = `
      SELECT 
        id, marca, modelo, ano, placa, 
        odometro, status, ipva, seguro, revisao, observacoes, imagem,
        DATE_FORMAT(data_cadastro, '%Y-%m-%d %H:%i:%s') as data_cadastro
      FROM carros
    `

    const params = []

    if (busca) {
      query += `
        WHERE 
          marca LIKE ? OR 
          modelo LIKE ? OR 
          placa LIKE ?
      `
      params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`)
    }

    query += " ORDER BY data_cadastro DESC"

    const carros = await executeQuery(query, params)

    return NextResponse.json({ carros }, { status: 200 })
  } catch (error) {
    console.error("❌ Erro ao buscar carros:", error)
    return NextResponse.json({ error: "Erro ao buscar carros", details: error.message }, { status: 500 })
  }
}

// POST - Adicionar novo carro
export async function POST(request) {
  try {
    const body = await request.json()

    // Validações básicas
    if (!body.marca || !body.modelo || !body.placa || !body.ano || !body.odometro) {
      return NextResponse.json({ error: "Campos obrigatórios não preenchidos" }, { status: 400 })
    }

    // Validar placa única
    const placaExistente = await executeQuery("SELECT id FROM carros WHERE placa = ?", [body.placa])

    if (placaExistente.length > 0) {
      return NextResponse.json({ error: "Já existe um carro com esta placa" }, { status: 400 })
    }

    // Inserir carro
    const result = await executeQuery(
      `
      INSERT INTO carros (
        marca, modelo, ano, placa, 
        odometro, status, ipva, seguro, revisao, observacoes, imagem
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        body.marca,
        body.modelo,
        body.ano,
        body.placa.toUpperCase(),
        body.odometro,
        body.status || "Disponível",
        body.ipva || null,
        body.seguro || null,
        body.revisao || null,
        body.observacoes || null,
        body.imagem || null,
      ],
    )

    // Buscar carro inserido
    const novoCarro = await executeQuery(
      `
      SELECT 
        id, marca, modelo, ano, placa, 
        odometro, status, ipva, seguro, revisao, observacoes, imagem,
        DATE_FORMAT(data_cadastro, '%Y-%m-%d %H:%i:%s') as data_cadastro
      FROM carros 
      WHERE id = ?
      `,
      [result.insertId],
    )

    return NextResponse.json(
      {
        message: "Carro adicionado com sucesso",
        carro: novoCarro[0],
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("❌ Erro ao adicionar carro:", error)
    return NextResponse.json({ error: "Erro ao adicionar carro", details: error.message }, { status: 500 })
  }
}

// PUT - Atualizar carro existente
export async function PUT(request) {
  try {
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: "ID do carro não fornecido" }, { status: 400 })
    }

    // Validações básicas
    if (!body.marca || !body.modelo || !body.placa || !body.ano || !body.odometro) {
      return NextResponse.json({ error: "Campos obrigatórios não preenchidos" }, { status: 400 })
    }

    // Verificar se o carro existe
    const carroExistente = await executeQuery("SELECT id FROM carros WHERE id = ?", [body.id])

    if (carroExistente.length === 0) {
      return NextResponse.json({ error: "Carro não encontrado" }, { status: 404 })
    }

    // Validar placa única (exceto para o próprio carro)
    const placaExistente = await executeQuery("SELECT id FROM carros WHERE placa = ? AND id != ?", [
      body.placa,
      body.id,
    ])

    if (placaExistente.length > 0) {
      return NextResponse.json({ error: "Já existe outro carro com esta placa" }, { status: 400 })
    }

    // Atualizar carro
    await executeQuery(
      `
      UPDATE carros SET
        marca = ?,
        modelo = ?,
        ano = ?,
        placa = ?,
        odometro = ?,
        status = ?,
        ipva = ?,
        seguro = ?,
        revisao = ?,
        observacoes = ?,
        imagem = ?
      WHERE id = ?
      `,
      [
        body.marca,
        body.modelo,
        body.ano,
        body.placa.toUpperCase(),
        body.odometro,
        body.status || "Disponível",
        body.ipva || null,
        body.seguro || null,
        body.revisao || null,
        body.observacoes || null,
        body.imagem || null,
        body.id,
      ],
    )

    // Buscar carro atualizado
    const carroAtualizado = await executeQuery(
      `
      SELECT 
        id, marca, modelo, ano, placa, 
        odometro, status, ipva, seguro, revisao, observacoes, imagem,
        DATE_FORMAT(data_cadastro, '%Y-%m-%d %H:%i:%s') as data_cadastro
      FROM carros 
      WHERE id = ?
      `,
      [body.id],
    )

    return NextResponse.json(
      {
        message: "Carro atualizado com sucesso",
        carro: carroAtualizado[0],
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("❌ Erro ao atualizar carro:", error)
    return NextResponse.json({ error: "Erro ao atualizar carro", details: error.message }, { status: 500 })
  }
}

// DELETE - Remover carro
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID do carro não fornecido" }, { status: 400 })
    }

    // Verificar se o carro existe
    const carroExistente = await executeQuery("SELECT id FROM carros WHERE id = ?", [id])

    if (carroExistente.length === 0) {
      return NextResponse.json({ error: "Carro não encontrado" }, { status: 404 })
    }

    // Verificar se o carro está em uso (eventos ativos)
    // Comentado temporariamente até implementarmos a tabela de eventos
    /*
    const carroEmUso = await executeQuery(
      `
      SELECT COUNT(*) as total FROM eventos 
      WHERE carro_id = ? AND status = 'ativo'
      `,
      [id]
    )
    
    if (carroEmUso[0].total > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir um carro que está em uso" },
        { status: 400 }
      )
    }
    */

    // Remover carro
    await executeQuery("DELETE FROM carros WHERE id = ?", [id])

    return NextResponse.json({ message: "Carro removido com sucesso" }, { status: 200 })
  } catch (error) {
    console.error("❌ Erro ao remover carro:", error)
    return NextResponse.json({ error: "Erro ao remover carro", details: error.message }, { status: 500 })
  }
}
