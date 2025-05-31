const mysql = require("mysql2/promise")
require("dotenv").config()

async function updateMotoristasStatus() {
  let connection

  try {
    // Usar as variáveis de ambiente para conexão
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
    })

    console.log("🔗 Conectado ao banco de dados")

    // Verificar se a coluna já existe
    const [columns] = await connection.execute(
      `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'motoristas' 
      AND COLUMN_NAME = 'status'
    `,
      [process.env.DB_NAME],
    )

    if (columns.length > 0) {
      console.log("✅ Coluna status já existe na tabela motoristas")
    } else {
      // Adicionar a coluna status
      await connection.execute(`
        ALTER TABLE motoristas 
        ADD COLUMN status VARCHAR(20) DEFAULT 'Disponível'
      `)
      console.log("✅ Coluna status adicionada à tabela motoristas")
    }

    // Atualizar todos os motoristas existentes para 'Disponível'
    const [result] = await connection.execute(`
      UPDATE motoristas 
      SET status = 'Disponível' 
      WHERE status IS NULL OR status = ''
    `)

    console.log(`✅ ${result.affectedRows} motoristas atualizados para status 'Disponível'`)

    // Verificar motoristas em viagem e atualizar status
    const [eventos] = await connection.execute(`
      SELECT m.id, m.nome
      FROM motoristas m
      WHERE EXISTS (
        SELECT 1 FROM eventos e
        WHERE e.motorista_id = m.id
        AND e.tipo = 'Saída'
        AND NOT EXISTS (
          SELECT 1 FROM eventos e2
          WHERE e2.motorista_id = e.motorista_id
          AND e2.tipo = 'Chegada'
          AND e2.data_hora > e.data_hora
        )
      )
    `)

    if (eventos.length > 0) {
      for (const motorista of eventos) {
        await connection.execute(
          `
          UPDATE motoristas SET status = 'Em Viagem' WHERE id = ?
        `,
          [motorista.id],
        )
        console.log(`✅ Motorista ${motorista.nome} (ID: ${motorista.id}) atualizado para 'Em Viagem'`)
      }
    } else {
      console.log("ℹ️ Nenhum motorista em viagem encontrado")
    }

    // Criar índice para performance se não existir
    try {
      await connection.execute(`
        CREATE INDEX idx_motoristas_status ON motoristas(status)
      `)
      console.log("✅ Índice criado para a coluna status")
    } catch (indexError) {
      if (indexError.code === "ER_DUP_KEYNAME") {
        console.log("ℹ️ Índice já existe para a coluna status")
      } else {
        console.error("⚠️ Erro ao criar índice:", indexError.message)
      }
    }

    // Listar motoristas para verificação
    const [motoristas] = await connection.execute(`
      SELECT id, nome, status FROM motoristas ORDER BY id
    `)

    console.log("\n📋 Lista de motoristas e seus status:")
    motoristas.forEach((m) => {
      console.log(`ID: ${m.id}, Nome: ${m.nome}, Status: ${m.status || "Não definido"}`)
    })
  } catch (error) {
    console.error("❌ Erro ao atualizar status dos motoristas:", error)
  } finally {
    if (connection) {
      await connection.end()
      console.log("🔌 Conexão fechada")
    }
  }
}

// Executar o script
updateMotoristasStatus()
