const mysql = require("mysql2/promise")

async function addMotoristaStatus() {
  let connection

  try {
    // Configuração do banco (ajuste conforme necessário)
    connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "", // Ajuste conforme sua configuração
      database: "fleetflow",
    })

    console.log("🔗 Conectado ao banco de dados")

    // Verificar se a coluna já existe
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'fleetflow' 
      AND TABLE_NAME = 'motoristas' 
      AND COLUMN_NAME = 'status'
    `)

    if (columns.length > 0) {
      console.log("✅ Coluna status já existe na tabela motoristas")
      return
    }

    // Adicionar a coluna status
    await connection.execute(`
      ALTER TABLE motoristas 
      ADD COLUMN status VARCHAR(20) DEFAULT 'Disponível'
    `)

    console.log("✅ Coluna status adicionada à tabela motoristas")

    // Atualizar todos os motoristas existentes para 'Disponível'
    const [result] = await connection.execute(`
      UPDATE motoristas 
      SET status = 'Disponível' 
      WHERE status IS NULL
    `)

    console.log(`✅ ${result.affectedRows} motoristas atualizados para status 'Disponível'`)

    // Criar índice para performance
    try {
      await connection.execute(`
        CREATE INDEX idx_motoristas_status ON motoristas(status)
      `)
      console.log("✅ Índice criado para a coluna status")
    } catch (indexError) {
      console.log("⚠️ Índice já existe ou erro ao criar:", indexError.message)
    }
  } catch (error) {
    console.error("❌ Erro ao adicionar coluna status:", error)
  } finally {
    if (connection) {
      await connection.end()
      console.log("🔌 Conexão fechada")
    }
  }
}

// Executar o script
addMotoristaStatus()
