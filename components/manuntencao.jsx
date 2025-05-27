"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import {
  Wrench,
  Plus,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Edit,
  Trash2,
  BarChart3,
} from "lucide-react"
import ConfirmDialog from "./confirm-dialog"

export default function Manutencao() {
  const [manutencoes, setManutencoes] = useState([])
  const [carros, setCarros] = useState([])
  const [carroId, setCarroId] = useState("")
  const [tipo, setTipo] = useState("Preventiva")
  const [descricao, setDescricao] = useState("")
  const [dataRealizacao, setDataRealizacao] = useState("")
  const [dataAgendamento, setDataAgendamento] = useState("")
  const [odometroRealizacao, setOdometroRealizacao] = useState("")
  const [proximaManutencao, setProximaManutencao] = useState("")
  const [proximoOdometro, setProximoOdometro] = useState("")
  const [custo, setCusto] = useState("")
  const [fornecedor, setFornecedor] = useState("")
  const [status, setStatus] = useState("Agendada")
  const [observacoes, setObservacoes] = useState("")
  const [busca, setBusca] = useState("")
  const [editandoId, setEditandoId] = useState(null)
  const [filtroStatus, setFiltroStatus] = useState("todos")
  const [filtroCarro, setFiltroCarro] = useState("todos")
  const { toast } = useToast()
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", message: "", onConfirm: null })

  useEffect(() => {
    const manutencoesData = localStorage.getItem("manutencoes")
    const carrosData = localStorage.getItem("carros")

    if (manutencoesData) setManutencoes(JSON.parse(manutencoesData))
    if (carrosData) setCarros(JSON.parse(carrosData))
  }, [])

  useEffect(() => {
    localStorage.setItem("manutencoes", JSON.stringify(manutencoes))
  }, [manutencoes])

  const resetForm = () => {
    setCarroId("")
    setTipo("Preventiva")
    setDescricao("")
    setDataRealizacao("")
    setDataAgendamento("")
    setOdometroRealizacao("")
    setProximaManutencao("")
    setProximoOdometro("")
    setCusto("")
    setFornecedor("")
    setStatus("Agendada")
    setObservacoes("")
    setEditandoId(null)
  }

  const obterGestorLogado = () => {
    const usuarioLogado = localStorage.getItem("usuarioLogado")
    if (usuarioLogado) {
      const usuario = JSON.parse(usuarioLogado)
      if (usuario.email === "admin@fleetflow.com") {
        return "Admin"
      } else {
        const gestores = JSON.parse(localStorage.getItem("gestores") || "[]")
        const gestor = gestores.find((g) => g.email === usuario.email)
        return gestor?.nome || "Gestor"
      }
    }
    return "Sistema"
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!carroId || !tipo || !descricao || !fornecedor) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    // Validações específicas por status
    if (status === "Concluída" && (!dataRealizacao || !custo)) {
      toast({
        title: "Erro",
        description: "Para manutenção concluída, informe data de realização e custo",
        variant: "destructive",
      })
      return
    }

    if (status === "Agendada" && !dataAgendamento) {
      toast({
        title: "Erro",
        description: "Para manutenção agendada, informe a data do agendamento",
        variant: "destructive",
      })
      return
    }

    const carro = carros.find((c) => c.id === Number.parseInt(carroId))
    if (!carro) return

    const manutencaoData = {
      id: editandoId || Date.now(),
      carroId: Number.parseInt(carroId),
      carroInfo: `${carro.marca} ${carro.modelo} - ${carro.placa}`,
      tipo,
      descricao,
      dataRealizacao: dataRealizacao || null,
      dataAgendamento: dataAgendamento || null,
      odometroRealizacao: odometroRealizacao ? Number.parseInt(odometroRealizacao) : null,
      proximaManutencao: proximaManutencao || null,
      proximoOdometro: proximoOdometro ? Number.parseInt(proximoOdometro) : null,
      custo: custo ? Number.parseFloat(custo) : 0,
      fornecedor,
      status,
      observacoes,
      gestorResponsavel: obterGestorLogado(),
      dataCadastro: editandoId ? manutencoes.find((m) => m.id === editandoId)?.dataCadastro : new Date().toISOString(),
    }

    if (editandoId) {
      setManutencoes(manutencoes.map((m) => (m.id === editandoId ? manutencaoData : m)))
      toast({
        title: "Sucesso",
        description: "Manutenção editada com sucesso",
      })
    } else {
      setManutencoes([manutencaoData, ...manutencoes])
      toast({
        title: "Sucesso",
        description: "Manutenção registrada com sucesso",
      })
    }

    resetForm()
  }

  const handleEdit = (manutencao) => {
    setCarroId(manutencao.carroId.toString())
    setTipo(manutencao.tipo)
    setDescricao(manutencao.descricao)
    setDataRealizacao(manutencao.dataRealizacao || "")
    setDataAgendamento(manutencao.dataAgendamento || "")
    setOdometroRealizacao(manutencao.odometroRealizacao?.toString() || "")
    setProximaManutencao(manutencao.proximaManutencao || "")
    setProximoOdometro(manutencao.proximoOdometro?.toString() || "")
    setCusto(manutencao.custo?.toString() || "")
    setFornecedor(manutencao.fornecedor)
    setStatus(manutencao.status)
    setObservacoes(manutencao.observacoes || "")
    setEditandoId(manutencao.id)
  }

  const handleDelete = (id, descricao) => {
    setConfirmDialog({
      open: true,
      title: "Confirmar Exclusão",
      message: `Tem certeza que deseja excluir a manutenção "${descricao}"?`,
      onConfirm: () => {
        setManutencoes(manutencoes.filter((m) => m.id !== id))
        if (editandoId === id) resetForm()
        toast({
          title: "Sucesso",
          description: "Manutenção removida com sucesso",
        })
        setConfirmDialog({ open: false, title: "", message: "", onConfirm: null })
      },
    })
  }

  // Filtrar manutenções
  const manutencoesFiltradas = manutencoes.filter((m) => {
    const matchBusca =
      m.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      m.carroInfo.toLowerCase().includes(busca.toLowerCase()) ||
      m.fornecedor.toLowerCase().includes(busca.toLowerCase())
    const matchStatus = filtroStatus === "todos" || m.status === filtroStatus
    const matchCarro = filtroCarro === "todos" || m.carroId === Number.parseInt(filtroCarro)

    return matchBusca && matchStatus && matchCarro
  })

  // Alertas de manutenções vencidas
  const alertasManutencao = () => {
    const hoje = new Date()
    const alertas = []

    // Manutenções agendadas vencidas
    const agendadasVencidas = manutencoes.filter(
      (m) => m.status === "Agendada" && m.dataAgendamento && new Date(m.dataAgendamento) < hoje,
    )

    // Próximas manutenções vencidas por data
    const proximasVencidas = manutencoes.filter(
      (m) => m.proximaManutencao && new Date(m.proximaManutencao) < hoje && m.status === "Concluída",
    )

    // Próximas manutenções vencidas por odômetro
    const proximasOdometro = manutencoes.filter((m) => {
      if (!m.proximoOdometro || m.status !== "Concluída") return false
      const carro = carros.find((c) => c.id === m.carroId)
      return carro && carro.odometro >= m.proximoOdometro
    })

    return [...agendadasVencidas, ...proximasVencidas, ...proximasOdometro]
  }

  // Estatísticas
  const estatisticas = {
    total: manutencoes.length,
    agendadas: manutencoes.filter((m) => m.status === "Agendada").length,
    concluidas: manutencoes.filter((m) => m.status === "Concluída").length,
    custoTotal: manutencoes.reduce((total, m) => total + (m.custo || 0), 0),
    custoMedio:
      manutencoes.length > 0 ? manutencoes.reduce((total, m) => total + (m.custo || 0), 0) / manutencoes.length : 0,
  }

  const getStatusBadge = (status) => {
    const variants = {
      Agendada: { variant: "secondary", icon: Clock, color: "text-blue-600" },
      "Em Andamento": { variant: "default", icon: Wrench, color: "text-orange-600" },
      Concluída: { variant: "default", icon: CheckCircle, color: "text-green-600" },
      Cancelada: { variant: "destructive", icon: AlertTriangle, color: "text-red-600" },
    }

    const config = variants[status] || variants["Agendada"]
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center space-x-1 w-fit">
        <Icon className="w-3 h-3" />
        <span>{status}</span>
      </Badge>
    )
  }

  const alertas = alertasManutencao()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manutenção</h1>
          <p className="text-gray-600 mt-1">Controle completo de manutenções da frota</p>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <Wrench className="w-4 h-4" />
            <span>{estatisticas.total} manutenções</span>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4" />
            <span>R$ {estatisticas.custoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription>
            <span className="font-medium text-orange-800">{alertas.length} manutenção(ões) requer(em) atenção:</span>
            <ul className="mt-2 text-sm text-orange-700">
              {alertas.slice(0, 3).map((alerta, index) => (
                <li key={index}>
                  • {alerta.carroInfo} - {alerta.descricao}
                </li>
              ))}
              {alertas.length > 3 && <li>• E mais {alertas.length - 3} manutenção(ões)...</li>}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Wrench className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{estatisticas.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Agendadas</p>
                <p className="text-2xl font-bold">{estatisticas.agendadas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Concluídas</p>
                <p className="text-2xl font-bold">{estatisticas.concluidas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Custo Total</p>
                <p className="text-2xl font-bold">R$ {(estatisticas.custoTotal / 1000).toFixed(0)}k</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-8 h-8 text-indigo-600" />
              <div>
                <p className="text-sm text-gray-600">Custo Médio</p>
                <p className="text-2xl font-bold">R$ {estatisticas.custoMedio.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="registro" className="space-y-4">
        <TabsList>
          <TabsTrigger value="registro">Registrar Manutenção</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="registro">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>{editandoId ? "Editar Manutenção" : "Nova Manutenção"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="carro">
                      Veículo <span className="text-red-500">*</span>
                    </Label>
                    <Select value={carroId} onValueChange={setCarroId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o veículo" />
                      </SelectTrigger>
                      <SelectContent>
                        {carros.map((carro) => (
                          <SelectItem key={carro.id} value={carro.id.toString()}>
                            {carro.marca} {carro.modelo} - {carro.placa}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipo">
                      Tipo <span className="text-red-500">*</span>
                    </Label>
                    <Select value={tipo} onValueChange={setTipo}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Preventiva">Preventiva</SelectItem>
                        <SelectItem value="Corretiva">Corretiva</SelectItem>
                        <SelectItem value="Revisão">Revisão</SelectItem>
                        <SelectItem value="Troca de Óleo">Troca de Óleo</SelectItem>
                        <SelectItem value="Pneus">Pneus</SelectItem>
                        <SelectItem value="Freios">Freios</SelectItem>
                        <SelectItem value="Outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Agendada">Agendada</SelectItem>
                        <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                        <SelectItem value="Concluída">Concluída</SelectItem>
                        <SelectItem value="Cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">
                    Descrição <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="descricao"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Descreva a manutenção..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fornecedor">
                      Fornecedor/Oficina <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="fornecedor"
                      value={fornecedor}
                      onChange={(e) => setFornecedor(e.target.value)}
                      placeholder="Nome da oficina ou fornecedor"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="custo">Custo (R$)</Label>
                    <Input
                      id="custo"
                      type="number"
                      step="0.01"
                      value={custo}
                      onChange={(e) => setCusto(e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataAgendamento">Data Agendamento</Label>
                    <Input
                      id="dataAgendamento"
                      type="date"
                      value={dataAgendamento}
                      onChange={(e) => setDataAgendamento(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dataRealizacao">Data Realização</Label>
                    <Input
                      id="dataRealizacao"
                      type="date"
                      value={dataRealizacao}
                      onChange={(e) => setDataRealizacao(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="odometroRealizacao">Odômetro na Realização</Label>
                    <Input
                      id="odometroRealizacao"
                      type="number"
                      value={odometroRealizacao}
                      onChange={(e) => setOdometroRealizacao(e.target.value)}
                      placeholder="km"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="proximaManutencao">Próxima Manutenção</Label>
                    <Input
                      id="proximaManutencao"
                      type="date"
                      value={proximaManutencao}
                      onChange={(e) => setProximaManutencao(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="proximoOdometro">Próximo Odômetro</Label>
                    <Input
                      id="proximoOdometro"
                      type="number"
                      value={proximoOdometro}
                      onChange={(e) => setProximoOdometro(e.target.value)}
                      placeholder="km"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Observações adicionais..."
                    rows={3}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button type="submit">{editandoId ? "Salvar Alterações" : "Registrar Manutenção"}</Button>
                  {editandoId && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Histórico de Manutenções</CardTitle>
                <div className="flex items-center space-x-4">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar manutenções..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos Status</SelectItem>
                      <SelectItem value="Agendada">Agendada</SelectItem>
                      <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                      <SelectItem value="Concluída">Concluída</SelectItem>
                      <SelectItem value="Cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filtroCarro} onValueChange={setFiltroCarro}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos Veículos</SelectItem>
                      {carros.map((carro) => (
                        <SelectItem key={carro.id} value={carro.id.toString()}>
                          {carro.marca} {carro.modelo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {manutencoesFiltradas.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Veículo</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Custo</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {manutencoesFiltradas.map((manutencao) => (
                        <TableRow key={manutencao.id}>
                          <TableCell className="font-medium">{manutencao.carroInfo}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{manutencao.tipo}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{manutencao.descricao}</TableCell>
                          <TableCell>{getStatusBadge(manutencao.status)}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {manutencao.dataRealizacao && (
                                <div>Realizada: {new Date(manutencao.dataRealizacao).toLocaleDateString("pt-BR")}</div>
                              )}
                              {manutencao.dataAgendamento && (
                                <div>Agendada: {new Date(manutencao.dataAgendamento).toLocaleDateString("pt-BR")}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {manutencao.custo > 0 ? (
                              <span className="font-medium">
                                R$ {manutencao.custo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>{manutencao.fornecedor}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" size="sm" onClick={() => handleEdit(manutencao)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(manutencao.id, manutencao.descricao)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma manutenção encontrada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ open: false, title: "", message: "", onConfirm: null })}
      />
    </div>
  )
}
