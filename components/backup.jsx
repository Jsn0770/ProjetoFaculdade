"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Download,
  Upload,
  Save,
  RotateCcw,
  Trash2,
  Clock,
  Database,
  Shield,
  CheckCircle,
  AlertTriangle,
  Settings,
  FileText,
  Calendar,
  Cloud,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function Backup() {
  const [backups, setBackups] = useState([])
  const [configuracoes, setConfiguracoes] = useState({
    backupAutomatico: true,
    intervaloHoras: 24,
    manterBackups: 30,
    compressao: true,
    criptografia: false,
    incluirConfiguracoes: true,
    incluirHistorico: true,
  })
  const [progresso, setProgresso] = useState(0)
  const [operacaoAtiva, setOperacaoAtiva] = useState(false)
  const [tipoOperacao, setTipoOperacao] = useState("")
  const [dadosPreview, setDadosPreview] = useState(null)
  const [tabelasSelecionadas, setTabelasSelecionadas] = useState({
    gestores: true,
    motoristas: true,
    carros: true,
    eventos: true,
    configuracoes: true,
    historico: true,
  })

  const tabelas = [
    { key: "gestores", label: "Gestores", icon: Shield },
    { key: "motoristas", label: "Motoristas", icon: Database },
    { key: "carros", label: "Carros", icon: Database },
    { key: "eventos", label: "Eventos", icon: Calendar },
    { key: "configuracoes", label: "Configurações", icon: Settings },
    { key: "historico", label: "Histórico", icon: Clock },
  ]

  useEffect(() => {
    carregarBackups()
    carregarConfiguracoes()

    // Verificar se precisa fazer backup automático
    verificarBackupAutomatico()
  }, [])

  const carregarBackups = () => {
    const backupsSalvos = localStorage.getItem("sistema-backups")
    if (backupsSalvos) {
      setBackups(JSON.parse(backupsSalvos))
    }
  }

  const carregarConfiguracoes = () => {
    const configSalvas = localStorage.getItem("configuracoes-backup")
    if (configSalvas) {
      setConfiguracoes(JSON.parse(configSalvas))
    }
  }

  const salvarConfiguracoes = () => {
    localStorage.setItem("configuracoes-backup", JSON.stringify(configuracoes))
    toast({
      title: "Configurações salvas",
      description: "Configurações de backup atualizadas com sucesso.",
    })
  }

  const verificarBackupAutomatico = () => {
    if (!configuracoes.backupAutomatico) return

    const ultimoBackup = backups
      .filter((b) => b.tipo === "automatico")
      .sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora))[0]

    if (!ultimoBackup) {
      // Primeiro backup automático
      setTimeout(() => criarBackup("automatico"), 5000)
      return
    }

    const agora = new Date()
    const ultimaData = new Date(ultimoBackup.dataHora)
    const diferencaHoras = (agora - ultimaData) / (1000 * 60 * 60)

    if (diferencaHoras >= configuracoes.intervaloHoras) {
      setTimeout(() => criarBackup("automatico"), 5000)
    }
  }

  const obterDadosCompletos = () => {
    const dados = {}

    if (tabelasSelecionadas.gestores) {
      dados.gestores = JSON.parse(localStorage.getItem("gestores") || "[]")
    }
    if (tabelasSelecionadas.motoristas) {
      dados.motoristas = JSON.parse(localStorage.getItem("motoristas") || "[]")
    }
    if (tabelasSelecionadas.carros) {
      dados.carros = JSON.parse(localStorage.getItem("carros") || "[]")
    }
    if (tabelasSelecionadas.eventos) {
      dados.eventos = JSON.parse(localStorage.getItem("eventos") || "[]")
    }
    if (tabelasSelecionadas.configuracoes) {
      dados.configuracoes = {
        notificacoes: JSON.parse(localStorage.getItem("configuracoes-notificacoes") || "{}"),
        backup: JSON.parse(localStorage.getItem("configuracoes-backup") || "{}"),
      }
    }
    if (tabelasSelecionadas.historico) {
      dados.historico = {
        notificacoes: JSON.parse(localStorage.getItem("historico-notificacoes") || "[]"),
        emails: JSON.parse(localStorage.getItem("emails-enviados") || "[]"),
      }
    }

    return dados
  }

  const calcularEstatisticas = (dados) => {
    const stats = {
      totalRegistros: 0,
      tamanhoEstimado: 0,
      tabelas: {},
    }

    Object.keys(dados).forEach((tabela) => {
      const registros = Array.isArray(dados[tabela])
        ? dados[tabela].length
        : typeof dados[tabela] === "object"
          ? Object.keys(dados[tabela]).length
          : 1

      stats.totalRegistros += registros
      stats.tabelas[tabela] = registros
    })

    // Estimar tamanho em KB
    const jsonString = JSON.stringify(dados)
    stats.tamanhoEstimado = Math.round(jsonString.length / 1024)

    return stats
  }

  const criarBackup = async (tipo = "manual") => {
    setOperacaoAtiva(true)
    setTipoOperacao("backup")
    setProgresso(0)

    try {
      // Simular progresso
      for (let i = 0; i <= 100; i += 10) {
        setProgresso(i)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      const dados = obterDadosCompletos()
      const stats = calcularEstatisticas(dados)

      const backup = {
        id: Date.now(),
        nome: `Backup_${new Date().toISOString().split("T")[0]}_${new Date().toTimeString().split(" ")[0].replace(/:/g, "-")}`,
        tipo,
        dataHora: new Date().toISOString(),
        dados,
        estatisticas: stats,
        versao: "1.0",
        comprimido: configuracoes.compressao,
        criptografado: configuracoes.criptografia,
        checksum: gerarChecksum(dados),
      }

      const novosBackups = [backup, ...backups].slice(0, configuracoes.manterBackups)
      setBackups(novosBackups)
      localStorage.setItem("sistema-backups", JSON.stringify(novosBackups))

      toast({
        title: "Backup criado",
        description: `Backup ${tipo} criado com sucesso. ${stats.totalRegistros} registros salvos.`,
      })
    } catch (error) {
      toast({
        title: "Erro no backup",
        description: "Falha ao criar backup. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setOperacaoAtiva(false)
      setProgresso(0)
    }
  }

  const restaurarBackup = async (backup) => {
    setOperacaoAtiva(true)
    setTipoOperacao("restauracao")
    setProgresso(0)

    try {
      // Criar backup de segurança antes de restaurar
      await criarBackup("pre-restauracao")

      // Simular progresso de restauração
      for (let i = 0; i <= 100; i += 10) {
        setProgresso(i)
        await new Promise((resolve) => setTimeout(resolve, 150))
      }

      // Restaurar dados
      const { dados } = backup

      Object.keys(dados).forEach((tabela) => {
        if (tabelasSelecionadas[tabela]) {
          if (tabela === "configuracoes") {
            Object.keys(dados[tabela]).forEach((config) => {
              localStorage.setItem(`configuracoes-${config}`, JSON.stringify(dados[tabela][config]))
            })
          } else if (tabela === "historico") {
            Object.keys(dados[tabela]).forEach((hist) => {
              localStorage.setItem(
                `${hist === "notificacoes" ? "historico-notificacoes" : "emails-enviados"}`,
                JSON.stringify(dados[tabela][hist]),
              )
            })
          } else {
            localStorage.setItem(tabela, JSON.stringify(dados[tabela]))
          }
        }
      })

      toast({
        title: "Restauração concluída",
        description: `Dados restaurados do backup de ${new Date(backup.dataHora).toLocaleString()}`,
      })

      // Recarregar página para aplicar mudanças
      setTimeout(() => window.location.reload(), 2000)
    } catch (error) {
      toast({
        title: "Erro na restauração",
        description: "Falha ao restaurar backup. Dados não foram alterados.",
        variant: "destructive",
      })
    } finally {
      setOperacaoAtiva(false)
      setProgresso(0)
    }
  }

  const excluirBackup = (id) => {
    const novosBackups = backups.filter((b) => b.id !== id)
    setBackups(novosBackups)
    localStorage.setItem("sistema-backups", JSON.stringify(novosBackups))

    toast({
      title: "Backup excluído",
      description: "Backup removido com sucesso.",
    })
  }

  const downloadBackup = (backup) => {
    const dataStr = JSON.stringify(backup, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement("a")
    link.href = url
    link.download = `${backup.nome}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Download iniciado",
      description: `Backup ${backup.nome} baixado com sucesso.`,
    })
  }

  const uploadBackup = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target.result)

        // Validar estrutura do backup
        if (!backup.dados || !backup.dataHora || !backup.versao) {
          throw new Error("Formato de backup inválido")
        }

        // Adicionar à lista
        backup.id = Date.now()
        backup.tipo = "importado"

        const novosBackups = [backup, ...backups]
        setBackups(novosBackups)
        localStorage.setItem("sistema-backups", JSON.stringify(novosBackups))

        toast({
          title: "Backup importado",
          description: "Backup carregado com sucesso.",
        })
      } catch (error) {
        toast({
          title: "Erro na importação",
          description: "Arquivo de backup inválido ou corrompido.",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
  }

  const previewBackup = (backup) => {
    const stats = backup.estatisticas
    setDadosPreview({
      ...backup,
      preview: {
        gestores: backup.dados.gestores?.length || 0,
        motoristas: backup.dados.motoristas?.length || 0,
        carros: backup.dados.carros?.length || 0,
        eventos: backup.dados.eventos?.length || 0,
        configuracoes: backup.dados.configuracoes ? Object.keys(backup.dados.configuracoes).length : 0,
        historico: backup.dados.historico ? Object.keys(backup.dados.historico).length : 0,
      },
    })
  }

  const gerarChecksum = (dados) => {
    // Simular checksum MD5
    const str = JSON.stringify(dados)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16)
  }

  const validarIntegridade = (backup) => {
    const checksumAtual = gerarChecksum(backup.dados)
    return checksumAtual === backup.checksum
  }

  const formatarTamanho = (kb) => {
    if (kb < 1024) return `${kb} KB`
    return `${(kb / 1024).toFixed(1)} MB`
  }

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case "automatico":
        return <Clock className="w-4 h-4 text-blue-500" />
      case "manual":
        return <Save className="w-4 h-4 text-green-500" />
      case "pre-restauracao":
        return <Shield className="w-4 h-4 text-orange-500" />
      case "importado":
        return <Upload className="w-4 h-4 text-purple-500" />
      default:
        return <Database className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sistema de Backup</h1>
          <p className="text-gray-600 mt-1">Proteja e restaure os dados da sua frota</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-sm">
            {backups.length} backups
          </Badge>
          <Button onClick={() => criarBackup("manual")} disabled={operacaoAtiva}>
            <Save className="w-4 h-4 mr-2" />
            Criar Backup
          </Button>
        </div>
      </div>

      {/* Progresso da Operação */}
      {operacaoAtiva && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {tipoOperacao === "backup" ? "Criando backup..." : "Restaurando dados..."}
                  </span>
                  <span className="text-sm text-gray-500">{progresso}%</span>
                </div>
                <Progress value={progresso} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="backups" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="backups">
            <Database className="w-4 h-4 mr-2" />
            Backups ({backups.length})
          </TabsTrigger>
          <TabsTrigger value="configuracoes">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="restauracao">
            <RotateCcw className="w-4 h-4 mr-2" />
            Restauração
          </TabsTrigger>
          <TabsTrigger value="importacao">
            <Upload className="w-4 h-4 mr-2" />
            Importar/Exportar
          </TabsTrigger>
        </TabsList>

        {/* Lista de Backups */}
        <TabsContent value="backups" className="space-y-4">
          {backups.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum backup encontrado</h3>
                <p className="text-gray-500 mb-4">Crie seu primeiro backup para proteger os dados</p>
                <Button onClick={() => criarBackup("manual")}>
                  <Save className="w-4 h-4 mr-2" />
                  Criar Primeiro Backup
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {backups.map((backup) => (
                <Card key={backup.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getTipoIcon(backup.tipo)}
                          <h3 className="font-semibold text-lg">{backup.nome}</h3>
                          <Badge variant="outline" className="capitalize">
                            {backup.tipo}
                          </Badge>
                          {validarIntegridade(backup) ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                          <div>
                            <span className="font-medium">Data/Hora:</span>
                            <br />
                            {new Date(backup.dataHora).toLocaleString()}
                          </div>
                          <div>
                            <span className="font-medium">Registros:</span>
                            <br />
                            {backup.estatisticas.totalRegistros.toLocaleString()}
                          </div>
                          <div>
                            <span className="font-medium">Tamanho:</span>
                            <br />
                            {formatarTamanho(backup.estatisticas.tamanhoEstimado)}
                          </div>
                          <div>
                            <span className="font-medium">Versão:</span>
                            <br />
                            {backup.versao}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {Object.entries(backup.estatisticas.tabelas).map(([tabela, count]) => (
                            <Badge key={tabela} variant="secondary" className="text-xs">
                              {tabela}: {count}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => previewBackup(backup)}>
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => downloadBackup(backup)}>
                          <Download className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Restauração</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação irá substituir todos os dados atuais pelos dados do backup de{" "}
                                {new Date(backup.dataHora).toLocaleString()}. Um backup de segurança será criado
                                automaticamente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => restaurarBackup(backup)}>Restaurar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Backup</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir este backup? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => excluirBackup(backup.id)}>Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Configurações */}
        <TabsContent value="configuracoes" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Backup Automático */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>Backup Automático</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="backup-auto">Ativar backup automático</Label>
                  <Switch
                    id="backup-auto"
                    checked={configuracoes.backupAutomatico}
                    onCheckedChange={(checked) => setConfiguracoes({ ...configuracoes, backupAutomatico: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="intervalo">Intervalo (horas)</Label>
                  <Select
                    value={configuracoes.intervaloHoras.toString()}
                    onValueChange={(value) =>
                      setConfiguracoes({ ...configuracoes, intervaloHoras: Number.parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hora</SelectItem>
                      <SelectItem value="6">6 horas</SelectItem>
                      <SelectItem value="12">12 horas</SelectItem>
                      <SelectItem value="24">24 horas</SelectItem>
                      <SelectItem value="168">7 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manter">Manter backups</Label>
                  <Select
                    value={configuracoes.manterBackups.toString()}
                    onValueChange={(value) =>
                      setConfiguracoes({ ...configuracoes, manterBackups: Number.parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 backups</SelectItem>
                      <SelectItem value="30">30 backups</SelectItem>
                      <SelectItem value="50">50 backups</SelectItem>
                      <SelectItem value="100">100 backups</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Opções Avançadas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span>Opções Avançadas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="compressao">Compressão de dados</Label>
                  <Switch
                    id="compressao"
                    checked={configuracoes.compressao}
                    onCheckedChange={(checked) => setConfiguracoes({ ...configuracoes, compressao: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="criptografia">Criptografia</Label>
                  <Switch
                    id="criptografia"
                    checked={configuracoes.criptografia}
                    onCheckedChange={(checked) => setConfiguracoes({ ...configuracoes, criptografia: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="config">Incluir configurações</Label>
                  <Switch
                    id="config"
                    checked={configuracoes.incluirConfiguracoes}
                    onCheckedChange={(checked) => setConfiguracoes({ ...configuracoes, incluirConfiguracoes: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="historico">Incluir histórico</Label>
                  <Switch
                    id="historico"
                    checked={configuracoes.incluirHistorico}
                    onCheckedChange={(checked) => setConfiguracoes({ ...configuracoes, incluirHistorico: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button onClick={salvarConfiguracoes}>
              <Settings className="w-4 h-4 mr-2" />
              Salvar Configurações
            </Button>
          </div>
        </TabsContent>

        {/* Restauração */}
        <TabsContent value="restauracao" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Seleção de Dados para Restauração</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {tabelas.map((tabela) => {
                  const Icon = tabela.icon
                  return (
                    <div key={tabela.key} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id={tabela.key}
                        checked={tabelasSelecionadas[tabela.key]}
                        onCheckedChange={(checked) =>
                          setTabelasSelecionadas({ ...tabelasSelecionadas, [tabela.key]: checked })
                        }
                      />
                      <Icon className="w-4 h-4 text-gray-500" />
                      <Label htmlFor={tabela.key} className="flex-1 cursor-pointer">
                        {tabela.label}
                      </Label>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {dadosPreview && (
            <Card>
              <CardHeader>
                <CardTitle>Preview do Backup</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {Object.entries(dadosPreview.preview).map(([tabela, count]) => (
                    <div key={tabela} className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium capitalize">{tabela}</div>
                      <div className="text-gray-600">{count} registros</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <strong>Data do Backup:</strong> {new Date(dadosPreview.dataHora).toLocaleString()}
                    <br />
                    <strong>Total de Registros:</strong> {dadosPreview.estatisticas.totalRegistros}
                    <br />
                    <strong>Integridade:</strong> {validarIntegridade(dadosPreview) ? "✅ Válido" : "❌ Corrompido"}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Importação/Exportação */}
        <TabsContent value="importacao" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Importar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  <span>Importar Backup</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">Carregue um arquivo de backup (.json) para importar dados.</p>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Input type="file" accept=".json" onChange={uploadBackup} className="hidden" id="file-upload" />
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-gray-600">Clique para selecionar arquivo</span>
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Exportar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="w-5 h-5 text-green-600" />
                  <span>Exportar Dados</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">Exporte os dados atuais do sistema em formato JSON.</p>
                <Button
                  onClick={() => {
                    const dados = obterDadosCompletos()
                    const backup = {
                      nome: `Exportacao_${new Date().toISOString().split("T")[0]}`,
                      tipo: "exportacao",
                      dataHora: new Date().toISOString(),
                      dados,
                      estatisticas: calcularEstatisticas(dados),
                      versao: "1.0",
                      checksum: gerarChecksum(dados),
                    }
                    downloadBackup(backup)
                  }}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Dados Atuais
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sincronização Cloud (Simulada) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Cloud className="w-5 h-5 text-purple-600" />
                <span>Sincronização Cloud</span>
                <Badge variant="outline">Em Breve</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <Cloud className="h-4 w-4" />
                <AlertDescription>
                  A sincronização com serviços de nuvem estará disponível em uma próxima versão. Por enquanto, use a
                  exportação manual para backup externo.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
