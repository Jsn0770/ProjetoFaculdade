import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/database"

// GET - Listar eventos com busca opcional
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const busca = searchParams.get("busca") || ""

    let query = `
      SELECT 
        e.id, e.motorista_id, e.carro_id, e.gestor_id,
        e.tipo, e.odometro, e.telefone_motorista, e.observacoes,
        DATE_FORMAT(e.data_hora, '%d/%m/%Y %H:%i:%s') as data_hora,
        m.nome as motorista_nome,
        CONCAT(c.marca, ' ', c.modelo, ' - ', c.placa) as carro_info,
        g.nome as gestor_nome
      FROM eventos e
      LEFT JOIN motoristas m ON e.motorista_id = m.id
      LEFT JOIN carros c ON e.carro_id = c.id
      LEFT JOIN gestores g ON e.gestor_id = g.id
    `

    const params = []

    if (busca) {
      query += ` WHERE (
        m.nome LIKE ? OR 
        c.marca LIKE ? OR 
        c.modelo LIKE ? OR 
        c.placa LIKE ? OR
        e.tipo LIKE ? OR
        g.nome LIKE ?
      )`
      const searchTerm = `%${busca}%`
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
    }

    query += ` ORDER BY e.data_hora DESC`

    const eventos = await executeQuery(query, params)

    return NextResponse.json({
      success: true,
      data: eventos,
      total: eventos.length,
    })
  } catch (error) {
    console.error("❌ Erro ao buscar eventos:", error)
    return NextResponse.json({ success: false, message: "Erro ao buscar eventos" }, { status: 500 })
  }
}

// POST - Criar novo evento
export async function POST(request) {
  try {
    const data = await request.json()
    const { motorista_id, carro_id, gestor_id, tipo, odometro, telefone_motorista, observacoes } = data

    // Validações obrigatórias
    if (!motorista_id || !carro_id || !gestor_id || !tipo || !telefone_motorista) {
      return NextResponse.json(
        { success: false, message: "Campos obrigatórios: motorista_id, carro_id, gestor_id, tipo, telefone_motorista" },
        { status: 400 },
      )
    }

    // Validar tipo de evento
    if (!["Saída", "Chegada"].includes(tipo)) {
      return NextResponse.json({ success: false, message: "Tipo deve ser 'Saída' ou 'Chegada'" }, { status: 400 })
    }

    // Validar telefone
    const telefoneNumeros = telefone_motorista.replace(/\D/g, "")
    if (telefoneNumeros.length < 10) {
      return NextResponse.json({ success: false, message: "Telefone deve ter pelo menos 10 dígitos" }, { status: 400 })
    }

    // Verificar se motorista existe
    const motorista = await executeQuery("SELECT id, nome FROM motoristas WHERE id = ?", [motorista_id])
    if (motorista.length === 0) {
      return NextResponse.json({ success: false, message: "Motorista não encontrado" }, { status: 404 })
    }

    // Verificar se carro existe
    const carro = await executeQuery("SELECT id, marca, modelo, placa, odometro FROM carros WHERE id = ?", [carro_id])
    if (carro.length === 0) {
      return NextResponse.json({ success: false, message: "Carro não encontrado" }, { status: 404 })
    }

    // Validações específicas por tipo de evento
    let odometroEvento
    if (tipo === "Saída") {
      // Verificar se carro já está em uso
      const carroEmUso = await executeQuery(
        `
        SELECT COUNT(*) as total FROM eventos 
        WHERE carro_id = ? AND tipo = 'Saída' 
        AND NOT EXISTS (
          SELECT 1 FROM eventos e2 
          WHERE e2.carro_id = eventos.carro_id 
          AND e2.tipo = 'Chegada' 
          AND e2.data_hora > eventos.data_hora
        )
      `,
        [carro_id],
      )

      if (carroEmUso[0].total > 0) {
        return NextResponse.json(
          { success: false, message: "Este carro já está em uso. Registre a chegada antes de fazer nova saída." },
          { status: 400 },
        )
      }

      // Verificar se motorista já está em viagem
      const motoristaEmViagem = await executeQuery(
        `
        SELECT COUNT(*) as total FROM eventos 
        WHERE motorista_id = ? AND tipo = 'Saída' 
        AND NOT EXISTS (
          SELECT 1 FROM eventos e2 
          WHERE e2.motorista_id = eventos.motorista_id 
          AND e2.tipo = 'Chegada' 
          AND e2.data_hora > eventos.data_hora
        )
      `,
        [motorista_id],
      )

      if (motoristaEmViagem[0].total > 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Este motorista já está em viagem. Registre a chegada antes de fazer nova saída.",
          },
          { status: 400 },
        )
      }

      // Para saída, usar odômetro atual do carro
      odometroEvento = carro[0].odometro
    } else {
      // Chegada
      // Verificar se há saída sem chegada para este carro
      const saidaSemChegada = await executeQuery(
        `
        SELECT * FROM eventos 
        WHERE carro_id = ? AND tipo = 'Saída' 
        AND NOT EXISTS (
          SELECT 1 FROM eventos e2 
          WHERE e2.carro_id = eventos.carro_id 
          AND e2.tipo = 'Chegada' 
          AND e2.data_hora > eventos.data_hora
        )
        ORDER BY data_hora DESC LIMIT 1
      `,
        [carro_id],
      )

      if (saidaSemChegada.length === 0) {
        return NextResponse.json(
          { success: false, message: "Este carro não possui registro de saída. Registre a saída primeiro." },
          { status: 400 },
        )
      }

      // Verificar se o motorista é o mesmo da saída
      if (saidaSemChegada[0].motorista_id !== Number.parseInt(motorista_id)) {
        return NextResponse.json(
          { success: false, message: "O motorista deve ser o mesmo que fez a saída do veículo." },
          { status: 400 },
        )
      }

      // Validar odômetro obrigatório na chegada
      if (!odometro || Number.parseInt(odometro) <= 0) {
        return NextResponse.json(
          { success: false, message: "Odômetro é obrigatório para registrar a chegada" },
          { status: 400 },
        )
      }

      // Validar se odômetro é maior que o atual
      if (Number.parseInt(odometro) <= carro[0].odometro) {
        return NextResponse.json(
          {
            success: false,
            message: `Odômetro deve ser maior que ${carro[0].odometro.toLocaleString()} km (atual do veículo)`,
          },
          { status: 400 },
        )
      }

      odometroEvento = Number.parseInt(odometro)
    }

    // Inserir evento
    const result = await executeQuery(
      `
      INSERT INTO eventos (
        motorista_id, carro_id, gestor_id, tipo, odometro, 
        telefone_motorista, observacoes, data_hora
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `,
      [motorista_id, carro_id, gestor_id, tipo, odometroEvento, telefone_motorista, observacoes || null],
    )

    // Atualizar status do carro
    const novoStatusCarro = tipo === "Saída" ? "Em Uso" : "Disponível"
    const novoOdometro = tipo === "Chegada" ? Number.parseInt(odometro) : carro[0].odometro

    await executeQuery("UPDATE carros SET status = ?, odometro = ? WHERE id = ?", [
      novoStatusCarro,
      novoOdometro,
      carro_id,
    ])

    // Atualizar status do motorista baseado no tipo de evento
    if (tipo === "Saída") {
      // Quando sai, motorista fica "Em Viagem" (ou mantém como Ativo se preferir)
      await executeQuery("UPDATE motoristas SET status = 'Ativo' WHERE id = ?", [motorista_id])
    } else if (tipo === "Chegada") {
      // Quando chega, motorista fica "Ativo" (disponível)
      await executeQuery("UPDATE motoristas SET status = 'Ativo' WHERE id = ?", [motorista_id])
    }

    return NextResponse.json({
      success: true,
      message: `${tipo} registrada com sucesso`,
      data: {
        id: result.insertId,
        motorista_id,
        carro_id,
        gestor_id,
        tipo,
        odometro: odometroEvento,
        telefone_motorista,
        observacoes,
      },
    })
  } catch (error) {
    console.error("❌ Erro ao criar evento:", error)
    return NextResponse.json({ success: false, message: "Erro ao criar evento" }, { status: 500 })
  }
}

// PUT - Atualizar evento
export async function PUT(request) {
  try {
    const data = await request.json()
    const { id, motorista_id, carro_id, gestor_id, tipo, odometro, telefone_motorista, observacoes } = data

    if (!id) {
      return NextResponse.json({ success: false, message: "ID do evento é obrigatório" }, { status: 400 })
    }

    // Verificar se evento existe
    const eventoExistente = await executeQuery("SELECT * FROM eventos WHERE id = ?", [id])

    if (eventoExistente.length === 0) {
      return NextResponse.json({ success: false, message: "Evento não encontrado" }, { status: 404 })
    }

    // Validações obrigatórias
    if (!motorista_id || !carro_id || !gestor_id || !tipo || !telefone_motorista) {
      return NextResponse.json(
        { success: false, message: "Campos obrigatórios: motorista_id, carro_id, gestor_id, tipo, telefone_motorista" },
        { status: 400 },
      )
    }

    // Validar tipo de evento
    if (!["Saída", "Chegada"].includes(tipo)) {
      return NextResponse.json({ success: false, message: "Tipo deve ser 'Saída' ou 'Chegada'" }, { status: 400 })
    }

    // Atualizar evento
    await executeQuery(
      `
      UPDATE eventos SET 
        motorista_id = ?, carro_id = ?, gestor_id = ?, tipo = ?, 
        odometro = ?, telefone_motorista = ?, observacoes = ?
      WHERE id = ?
    `,
      [motorista_id, carro_id, gestor_id, tipo, odometro, telefone_motorista, observacoes, id],
    )

    return NextResponse.json({
      success: true,
      message: "Evento atualizado com sucesso",
    })
  } catch (error) {
    console.error("❌ Erro ao atualizar evento:", error)
    return NextResponse.json({ success: false, message: "Erro ao atualizar evento" }, { status: 500 })
  }
}

// DELETE - Remover evento
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, message: "ID do evento é obrigatório" }, { status: 400 })
    }

    // Verificar se evento existe
    const evento = await executeQuery("SELECT * FROM eventos WHERE id = ?", [id])

    if (evento.length === 0) {
      return NextResponse.json({ success: false, message: "Evento não encontrado" }, { status: 404 })
    }

    // Remover evento
    await executeQuery("DELETE FROM eventos WHERE id = ?", [id])

    return NextResponse.json({
      success: true,
      message: "Evento removido com sucesso",
    })
  } catch (error) {
    console.error("❌ Erro ao remover evento:", error)
    return NextResponse.json({ success: false, message: "Erro ao remover evento" }, { status: 500 })
  }
}
  