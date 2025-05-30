const { initializeDatabase } = require("../lib/database.js")

async function main() {
  try {
    console.log("🚀 Inicializando banco de dados...")
    await initializeDatabase()
    console.log("✅ Banco de dados inicializado com sucesso!")
    process.exit(0)
  } catch (error) {
    console.error("❌ Erro ao inicializar banco:", error)
    process.exit(1)
  }
}

main()
