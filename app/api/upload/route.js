import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function POST(request) {
  try {
    const data = await request.formData()
    const file = data.get("file")

    if (!file) {
      return NextResponse.json({ success: false, message: "Nenhum arquivo enviado" }, { status: 400 })
    }

    // Validar tipo de arquivo
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Tipo de arquivo não permitido. Use JPG, PNG ou WebP." },
        { status: 400 },
      )
    }

    // Validar tamanho (5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, message: "Arquivo muito grande. Máximo 5MB." }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const extension = path.extname(file.name)
    const filename = `profile_${timestamp}${extension}`

    // Caminho para salvar (em produção seria um serviço de storage como AWS S3)
    const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles")
    const filepath = path.join(uploadDir, filename)

    // Criar diretório se não existir
    try {
      // Cria a pasta se ela não existir
      await mkdir(uploadDir, { recursive: true })

      // Salvar o arquivo
      await writeFile(filepath, buffer)
    } catch (error) {
      console.error("Erro ao salvar arquivo:", error)
      return NextResponse.json({ success: false, message: "Erro ao salvar arquivo" }, { status: 500 })
    }

    // URL pública do arquivo
    const fileUrl = `/uploads/profiles/${filename}`

    return NextResponse.json({
      success: true,
      message: "Arquivo enviado com sucesso",
      data: {
        url: fileUrl,
        filename,
        size: file.size,
        type: file.type,
      },
    })
  } catch (error) {
    console.error("Erro no upload:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}
