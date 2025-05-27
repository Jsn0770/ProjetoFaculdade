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
import { useToast } from "@/hooks/use-toast"
import { Search, Plus, Edit, Trash2, Users, Phone, AlertTriangle, CheckCircle, Clock, CreditCard } from "lucide-react"
import ConfirmDialog from "./confirm-dialog"

export default function Motoristas() {
  const [motoristas, setMotoristas] = useState([])
  const [nome, setNome] = useState("")
  const [telefone, setTelefone] = useState("")
  const [cnh, setCnh] = useState("")
  const [vencimentoCnh, setVencimentoCnh] = useState("")
  const [categoria, setCategoria] = useState("B")
  const [status, setStatus] = useState("Ativo")
  const [observacoes, setObservacoes] = useState("")
  const [busca, setBusca] = useState("")
  const [editandoId, setEditandoId] = useState(null)
  const { toast } = useToast()
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", message: "", onConfirm: null })

  useEffect(() => {
    const dados = localStorage.getItem("motoristas")
    if (dados) {
      setMotoristas(JSON.parse(dados))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("motoristas", JSON.stringify(motoristas))
  }, [motoristas])

  const resetForm = () => {
    setNome("")
    setTelefone("")
    setCnh("")
    setVencimentoCnh("")
    setCategoria("B")
    setStatus("Ativo")
    setObservacoes("")
    setEditandoId(null)
  }

  const verificarDisponibilidade = () => {
    const eventos = JSON.parse(localStorage.getItem("eventos") || "[]")

    return motoristas.map((motorista) => {
      // Verificar se há saída sem chegada
      const saidasSemChegada = eventos.filter(
        (e) =>
          e.motoristaId === motorista.id &&
          e.tipo === "Saída" &&
          !eventos.some(
            (chegada) =>
              chegada.motoristaId === motorista.id &&
              chegada.tipo === "Chegada" &&
              new Date(chegada.dataHora) > new Date(e.dataHora),
          ),
      )

      // Verificar CNH vencida
      const hoje = new Date()
      const cnhVencida = motorista.vencimentoCnh && new Date(motorista.vencimentoCnh) < hoje

      let statusCalculado = motorista.status
      const motivo = []

      if (saidasSemChegada.length > 0) {
        statusCalculado = "Em Viagem"
        motivo.push("Motorista em viagem")
      } else if (cnhVencida) {
        statusCalculado = "Indisponível"
        motivo.push("CNH vencida")
      } else if (motorista.status === "Inativo") {
        statusCalculado = "Inativo"
        motivo.push("Motorista inativo")
      } else if (motorista.status === "Suspenso") {
        statusCalculado = "Suspenso"
        motivo.push("Motorista suspenso")
      } else {
        statusCalculado = "Disponível"
      }

      return {
        ...motorista,
        statusCalculado,
        motivoIndisponibilidade: motivo.join(", "),
        carroAtual: saidasSemChegada.length > 0 ? saidasSemChegada[0].carroInfo : null,
      }
    })
  }

  const formatarTelefone = (valor) => {
    const numero = valor.replace(/\D/g, "")
    if (numero.length <= 11) {
      return numero.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
    }
    return valor
  }

  const formatarCnh = (valor) => {
    const numero = valor.replace(/\D/g, "")
    return numero.slice(0, 11)
  }

  const validarCnh = () => {
    if (cnh && cnh.length !== 11) {
      return "CNH deve ter 11 dígitos"
    }

    const hoje = new Date()
    if (vencimentoCnh && new Date(vencimentoCnh) < hoje) {
      return "CNH está vencida"
    }

    return null
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!nome || !telefone || !cnh || !vencimentoCnh) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    const erroCnh = validarCnh()
    if (erroCnh) {
      toast({
        title: "Erro",
        description: erroCnh,
        variant: "destructive",
      })
      return
    }

    // Validar CNH única
    const cnhExistente = motoristas.find((m) => m.cnh === cnh && (editandoId === null || m.id !== editandoId))

    if (cnhExistente) {
      toast({
        title: "Erro",
        description: "Já existe um motorista com esta CNH",
        variant: "destructive",
      })
      return
    }

    if (editandoId !== null) {
      setMotoristas(
        motoristas.map((m) =>
          m.id === editandoId
            ? {
                ...m,
                nome,
                telefone,
                cnh,
                vencimentoCnh,
                categoria,
                status,
                observacoes,
              }
            : m,
        ),
      )
      toast({
        title: "Sucesso",
        description: "Motorista editado com sucesso",
      })
    } else {
      const novoMotorista = {
        id: Date.now(),
        nome,
        telefone,
        cnh,
        vencimentoCnh,
        categoria,
        status,
        observacoes,
        dataCadastro: new Date().toISOString(),
      }
      setMotoristas([novoMotorista, ...motoristas])
      toast({
        title: "Sucesso",
        description: "Motorista adicionado com sucesso",
      })
    }

    resetForm()
  }

  const handleEdit = (motorista) => {
    setNome(motorista.nome)
    setTelefone(motorista.telefone)
    setCnh(motorista.cnh || "")
    setVencimentoCnh(motorista.vencimentoCnh || "")
    setCategoria(motorista.categoria || "B")
    setStatus(motorista.status || "Ativo")
    setObservacoes(motorista.observacoes || "")
    setEditandoId(motorista.id)
  }

  const handleDelete = (id, nome) => {
    // Verificar se o motorista está em viagem
    const eventos = JSON.parse(localStorage.getItem("eventos") || "[]")
    const motoristaEmViagem = eventos.some(
      (e) =>
        e.motoristaId === id &&
        e.tipo === "Saída" &&
        !eventos.some(
          (chegada) =>
            chegada.motoristaId === id &&
            chegada.tipo === "Chegada" &&
            new Date(chegada.dataHora) > new Date(e.dataHora),
        ),
    )

    if (motoristaEmViagem) {
      toast({
        title: "Erro",
        description: "Não é possível excluir um motorista que está em viagem",
        variant: "destructive",
      })
      return
    }

    setConfirmDialog({
      open: true,
      title: "Confirmar Exclusão",
      message: `Tem certeza que deseja excluir o motorista "${nome}"? Esta ação não pode ser desfeita.`,
      onConfirm: () => {
        setMotoristas(motoristas.filter((m) => m.id !== id))
        if (editandoId === id) resetForm()
        toast({
          title: "Sucesso",
          description: "Motorista removido com sucesso",
        })
        setConfirmDialog({ open: false, title: "", message: "", onConfirm: null })
      },
    })
  }

  const motoristasComStatus = verificarDisponibilidade()
  const motoristasFiltrados = motoristasComStatus.filter(
    (m) =>
      m.nome.toLowerCase().includes(busca.toLowerCase()) ||
      m.telefone.toLowerCase().includes(busca.toLowerCase()) ||
      (m.cnh && m.cnh.includes(busca)),
  )

  const getStatusBadge = (motorista) => {
    const status = motorista.statusCalculado || motorista.status

    switch (status) {
      case "Disponível":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            Disponível
          </Badge>
        )
      case "Em Viagem":
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Em Viagem
          </Badge>
        )
      case "Suspenso":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Suspenso
          </Badge>
        )
      case "Inativo":
        return <Badge variant="outline">Inativo</Badge>
      case "Indisponível":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Indisponível
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const verificarCnhVencida = (motorista) => {
    if (!motorista.vencimentoCnh) return false
    const hoje = new Date()
    return new Date(motorista.vencimentoCnh) < hoje
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Motoristas</h1>
          <p className="text-gray-600 mt-1">Gerencie os condutores da frota com controle rigoroso</p>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>{motoristas.length} motoristas</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>{motoristasComStatus.filter((m) => m.statusCalculado === "Disponível").length} disponíveis</span>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>{editandoId ? "Editar Motorista" : "Adicionar Motorista"}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">
                  Nome <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome do motorista"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">
                  Telefone <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                    placeholder="(11) 99999-9999"
                    className="pl-10"
                    maxLength={15}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnh">
                  CNH <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="cnh"
                    value={cnh}
                    onChange={(e) => setCnh(formatarCnh(e.target.value))}
                    placeholder="12345678901"
                    className="pl-10"
                    maxLength={11}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vencimentoCnh">
                  Vencimento CNH <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="vencimentoCnh"
                  type="date"
                  value={vencimentoCnh}
                  onChange={(e) => setVencimentoCnh(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria CNH</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A - Motocicletas</SelectItem>
                    <SelectItem value="B">B - Carros</SelectItem>
                    <SelectItem value="C">C - Caminhões</SelectItem>
                    <SelectItem value="D">D - Ônibus</SelectItem>
                    <SelectItem value="E">E - Carretas</SelectItem>
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
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                    <SelectItem value="Suspenso">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações sobre o motorista, infrações, etc..."
                rows={3}
              />
            </div>

            <div className="flex space-x-2">
              <Button type="submit">{editandoId ? "Salvar Alterações" : "Adicionar Motorista"}</Button>
              {editandoId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Motoristas</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar motoristas..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {motoristasFiltrados.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>CNH</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Situação Atual</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {motoristasFiltrados.map((motorista) => {
                    const cnhVencida = verificarCnhVencida(motorista)
                    return (
                      <TableRow key={motorista.id}>
                        <TableCell className="font-medium">{motorista.nome}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{motorista.telefone}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{motorista.cnh}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{motorista.categoria}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center space-x-2 ${cnhVencida ? "text-red-600" : ""}`}>
                            {cnhVencida && <AlertTriangle className="w-4 h-4" />}
                            <span>
                              {motorista.vencimentoCnh
                                ? new Date(motorista.vencimentoCnh).toLocaleDateString("pt-BR")
                                : "-"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(motorista)}</TableCell>
                        <TableCell>
                          {motorista.carroAtual ? (
                            <div className="text-sm">
                              <div className="font-medium text-blue-600">Em viagem</div>
                              <div className="text-gray-500">{motorista.carroAtual}</div>
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                          {motorista.motivoIndisponibilidade && (
                            <div className="text-xs text-red-600 mt-1">{motorista.motivoIndisponibilidade}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(motorista)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(motorista.id, motorista.nome)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum motorista encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
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
