import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import sharp from "sharp"

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

    // Validar tamanho (10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, message: "Arquivo muito grande. Máximo 10MB." }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Redimensionar imagem mantendo proporção e sem fundo preto
    const resizedBuffer = await sharp(buffer)
      .resize(400, 300, {
        fit: "inside", // Mantém proporção sem cortar
        withoutEnlargement: true, // Não aumenta imagens pequenas
        background: { r: 255, g: 255, b: 255, alpha: 1 }, // Fundo branco se necessário
      })
      .flatten({ background: { r: 255, g: 255, b: 255 } }) // Remove transparência com fundo branco
      .jpeg({
        quality: 90, // Qualidade alta
        progressive: true,
        mozjpeg: true, // Melhor compressão
      })
      .toBuffer()

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const filename = `profile_${timestamp}.jpg` // Sempre salva como JPG

    // Caminho para salvar (em produção seria um serviço de storage como AWS S3)
    const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles")
    const filepath = path.join(uploadDir, filename)

    // Criar diretório se não existir
    try {
      // Cria a pasta se ela não existir
      await mkdir(uploadDir, { recursive: true })

      // Salvar o arquivo redimensionado
      await writeFile(filepath, resizedBuffer)
    } catch (error) {
      console.error("Erro ao salvar arquivo:", error)
      return NextResponse.json({ success: false, message: "Erro ao salvar arquivo" }, { status: 500 })
    }

    // URL pública do arquivo
    const fileUrl = `/uploads/profiles/${filename}`

    return NextResponse.json({
      success: true,
      message: "Arquivo enviado e otimizado com sucesso",
      data: {
        url: fileUrl,
        filename,
        size: resizedBuffer.length, // Tamanho do arquivo processado
        type: "image/jpeg", // Sempre JPG após processamento
        originalSize: file.size, // Tamanho original
        dimensions: "400x300", // Dimensões máximas
      },
    })
  } catch (error) {
    console.error("Erro no upload:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}
