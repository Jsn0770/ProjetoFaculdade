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
import { Search, Plus, Edit, Trash2, Car, Upload, ImageIcon, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import ConfirmDialog from "./confirm-dialog"

export default function Carros() {
  const [carros, setCarros] = useState([])
  const [modelo, setModelo] = useState("")
  const [marca, setMarca] = useState("")
  const [placa, setPlaca] = useState("")
  const [ano, setAno] = useState("")
  const [odometro, setOdometro] = useState("")
  const [status, setStatus] = useState("Disponível")
  const [ipva, setIpva] = useState("")
  const [seguro, setSeguro] = useState("")
  const [revisao, setRevisao] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [imagem, setImagem] = useState(null)
  const [busca, setBusca] = useState("")
  const [editandoId, setEditandoId] = useState(null)
  const { toast } = useToast()
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", message: "", onConfirm: null })

  useEffect(() => {
    const dados = localStorage.getItem("carros")
    if (dados) {
      setCarros(JSON.parse(dados))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("carros", JSON.stringify(carros))
  }, [carros])

  const resetForm = () => {
    setModelo("")
    setMarca("")
    setPlaca("")
    setAno("")
    setOdometro("")
    setStatus("Disponível")
    setIpva("")
    setSeguro("")
    setRevisao("")
    setObservacoes("")
    setImagem(null)
    setEditandoId(null)
  }

  const verificarDisponibilidade = (carroId = null) => {
    const eventos = JSON.parse(localStorage.getItem("eventos") || "[]")

    return carros.map((carro) => {
      if (carroId && carro.id !== carroId) return carro

      // Verificar se há saída sem chegada
      const saidasSemChegada = eventos.filter(
        (e) =>
          e.carroId === carro.id &&
          e.tipo === "Saída" &&
          !eventos.some(
            (chegada) =>
              chegada.carroId === carro.id &&
              chegada.tipo === "Chegada" &&
              new Date(chegada.dataHora) > new Date(e.dataHora),
          ),
      )

      // Verificar documentação vencida
      const hoje = new Date()
      const ipvaVencido = carro.ipva && new Date(carro.ipva) < hoje
      const seguroVencido = carro.seguro && new Date(carro.seguro) < hoje
      const revisaoVencida = carro.revisao && new Date(carro.revisao) < hoje

      let novoStatus = carro.status
      const motivo = []

      if (saidasSemChegada.length > 0) {
        novoStatus = "Em Uso"
        motivo.push("Veículo em uso")
      } else if (ipvaVencido || seguroVencido || revisaoVencida) {
        novoStatus = "Indisponível"
        if (ipvaVencido) motivo.push("IPVA vencido")
        if (seguroVencido) motivo.push("Seguro vencido")
        if (revisaoVencida) motivo.push("Revisão vencida")
      } else if (carro.status === "Manutenção") {
        novoStatus = "Manutenção"
        motivo.push("Em manutenção")
      } else {
        novoStatus = "Disponível"
      }

      return {
        ...carro,
        statusCalculado: novoStatus,
        motivoIndisponibilidade: motivo.join(", "),
      }
    })
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImagem(event.target?.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const validarDocumentacao = () => {
    const hoje = new Date()
    const alertas = []

    if (ipva && new Date(ipva) < hoje) {
      alertas.push("IPVA está vencido")
    }
    if (seguro && new Date(seguro) < hoje) {
      alertas.push("Seguro está vencido")
    }
    if (revisao && new Date(revisao) < hoje) {
      alertas.push("Revisão está vencida")
    }

    return alertas
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!modelo || !marca || !placa || !ano || !odometro) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    // Validar placa única
    const placaExistente = carros.find(
      (c) => c.placa.toUpperCase() === placa.toUpperCase() && (editandoId === null || c.id !== editandoId),
    )

    if (placaExistente) {
      toast({
        title: "Erro",
        description: "Já existe um carro com esta placa",
        variant: "destructive",
      })
      return
    }

    const alertasDoc = validarDocumentacao()
    if (alertasDoc.length > 0) {
      toast({
        title: "Atenção",
        description: `Documentação com problemas: ${alertasDoc.join(", ")}`,
        variant: "destructive",
      })
    }

    if (editandoId !== null) {
      setCarros(
        carros.map((c) =>
          c.id === editandoId
            ? {
                ...c,
                modelo,
                marca,
                placa: placa.toUpperCase(),
                ano: Number.parseInt(ano),
                odometro: Number.parseInt(odometro),
                status,
                ipva,
                seguro,
                revisao,
                observacoes,
                imagem,
              }
            : c,
        ),
      )
      toast({
        title: "Sucesso",
        description: "Carro editado com sucesso",
      })
    } else {
      const novoCarro = {
        id: Date.now(),
        modelo,
        marca,
        placa: placa.toUpperCase(),
        ano: Number.parseInt(ano),
        odometro: Number.parseInt(odometro),
        status,
        ipva,
        seguro,
        revisao,
        observacoes,
        imagem,
        renavam: Math.floor(10000000000 + Math.random() * 89999999999).toString(),
        dataCadastro: new Date().toISOString(),
      }
      setCarros([novoCarro, ...carros])
      toast({
        title: "Sucesso",
        description: "Carro adicionado com sucesso",
      })
    }

    resetForm()
  }

  const handleEdit = (carro) => {
    setModelo(carro.modelo)
    setMarca(carro.marca)
    setPlaca(carro.placa)
    setAno(carro.ano.toString())
    setOdometro(carro.odometro?.toString() || "")
    setStatus(carro.status)
    setIpva(carro.ipva || "")
    setSeguro(carro.seguro || "")
    setRevisao(carro.revisao || "")
    setObservacoes(carro.observacoes || "")
    setImagem(carro.imagem)
    setEditandoId(carro.id)
  }

  const handleDelete = (id, modelo, marca) => {
    // Verificar se o carro está em uso
    const eventos = JSON.parse(localStorage.getItem("eventos") || "[]")
    const carroEmUso = eventos.some(
      (e) =>
        e.carroId === id &&
        e.tipo === "Saída" &&
        !eventos.some(
          (chegada) =>
            chegada.carroId === id && chegada.tipo === "Chegada" && new Date(chegada.dataHora) > new Date(e.dataHora),
        ),
    )

    if (carroEmUso) {
      toast({
        title: "Erro",
        description: "Não é possível excluir um carro que está em uso",
        variant: "destructive",
      })
      return
    }

    setConfirmDialog({
      open: true,
      title: "Confirmar Exclusão",
      message: `Tem certeza que deseja excluir o veículo "${marca} ${modelo}"? Esta ação não pode ser desfeita.`,
      onConfirm: () => {
        setCarros(carros.filter((c) => c.id !== id))
        if (editandoId === id) resetForm()
        toast({
          title: "Sucesso",
          description: "Carro removido com sucesso",
        })
        setConfirmDialog({ open: false, title: "", message: "", onConfirm: null })
      },
    })
  }

  const carrosComStatus = verificarDisponibilidade()
  const carrosFiltrados = carrosComStatus.filter(
    (c) =>
      c.modelo.toLowerCase().includes(busca.toLowerCase()) ||
      c.marca.toLowerCase().includes(busca.toLowerCase()) ||
      c.placa.toLowerCase().includes(busca.toLowerCase()),
  )

  const getStatusBadge = (carro) => {
    const status = carro.statusCalculado || carro.status
    const motivo = carro.motivoIndisponibilidade

    switch (status) {
      case "Disponível":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            Disponível
          </Badge>
        )
      case "Em Uso":
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Em Uso
          </Badge>
        )
      case "Manutenção":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Manutenção
          </Badge>
        )
      case "Indisponível":
        return (
          <Badge variant="destructive" title={motivo}>
            <AlertTriangle className="w-3 h-3 mr-1" />
            Indisponível
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const verificarDocumentacaoVencida = (carro) => {
    const hoje = new Date()
    const alertas = []

    if (carro.ipva && new Date(carro.ipva) < hoje) alertas.push("IPVA")
    if (carro.seguro && new Date(carro.seguro) < hoje) alertas.push("Seguro")
    if (carro.revisao && new Date(carro.revisao) < hoje) alertas.push("Revisão")

    return alertas
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Carros</h1>
          <p className="text-gray-600 mt-1">Gerencie os veículos da frota com controle rigoroso</p>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <Car className="w-4 h-4" />
            <span>{carros.length} veículos</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>{carrosComStatus.filter((c) => c.statusCalculado === "Disponível").length} disponíveis</span>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>{editandoId ? "Editar Carro" : "Adicionar Carro"}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="modelo">
                  Modelo <span className="text-red-500">*</span>
                </Label>
                <Input id="modelo" value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="Ex: Civic" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="marca">
                  Marca <span className="text-red-500">*</span>
                </Label>
                <Input id="marca" value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Ex: Honda" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="placa">
                  Placa <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="placa"
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                  placeholder="ABC-1234"
                  maxLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ano">
                  Ano <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ano"
                  type="number"
                  value={ano}
                  onChange={(e) => setAno(e.target.value)}
                  placeholder="2023"
                  min="1900"
                  max="2030"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="odometro">
                  Odômetro (km) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="odometro"
                  type="number"
                  value={odometro}
                  onChange={(e) => setOdometro(e.target.value)}
                  placeholder="15000"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Disponível">Disponível</SelectItem>
                    <SelectItem value="Manutenção">Manutenção</SelectItem>
                    <SelectItem value="Indisponível">Indisponível</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ipva">Vencimento IPVA</Label>
                <Input id="ipva" type="date" value={ipva} onChange={(e) => setIpva(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seguro">Vencimento Seguro</Label>
                <Input id="seguro" type="date" value={seguro} onChange={(e) => setSeguro(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="revisao">Próxima Revisão</Label>
                <Input id="revisao" type="date" value={revisao} onChange={(e) => setRevisao(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imagem">Imagem do Veículo</Label>
                <div className="flex items-center space-x-2">
                  <Button type="button" variant="outline" asChild className="cursor-pointer">
                    <label htmlFor="imagem" className="flex items-center space-x-2">
                      <Upload className="w-4 h-4" />
                      <span>Escolher arquivo</span>
                    </label>
                  </Button>
                  <input id="imagem" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  {imagem && <span className="text-sm text-green-600">Imagem selecionada</span>}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações sobre o veículo, manutenções, etc..."
                rows={3}
              />
            </div>

            {imagem && (
              <div className="flex justify-center">
                <img
                  src={imagem || "/placeholder.svg"}
                  alt="Preview"
                  className="max-w-xs max-h-32 object-contain rounded-lg border"
                />
              </div>
            )}

            <div className="flex space-x-2">
              <Button type="submit">{editandoId ? "Salvar Alterações" : "Adicionar Carro"}</Button>
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
            <CardTitle>Lista de Carros</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar carros..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {carrosFiltrados.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Imagem</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Ano</TableHead>
                    <TableHead>Odômetro</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Documentação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {carrosFiltrados.map((carro) => {
                    const docsVencidas = verificarDocumentacaoVencida(carro)
                    return (
                      <TableRow key={carro.id}>
                        <TableCell>
                          {carro.imagem ? (
                            <img
                              src={carro.imagem || "/placeholder.svg"}
                              alt={carro.modelo}
                              className="w-12 h-8 object-contain rounded"
                            />
                          ) : (
                            <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {carro.marca} {carro.modelo}
                            </div>
                            <div className="text-sm text-gray-500">RENAVAM: {carro.renavam}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{carro.placa}</TableCell>
                        <TableCell>{carro.ano}</TableCell>
                        <TableCell>{carro.odometro?.toLocaleString()} km</TableCell>
                        <TableCell>
                          {getStatusBadge(carro)}
                          {carro.motivoIndisponibilidade && (
                            <div className="text-xs text-red-600 mt-1">{carro.motivoIndisponibilidade}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {docsVencidas.length > 0 ? (
                            <div className="flex items-center space-x-1 text-red-600">
                              <AlertTriangle className="w-4 h-4" />
                              <span className="text-xs">{docsVencidas.join(", ")} vencido(s)</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-xs">Em dia</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(carro)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(carro.id, carro.modelo, carro.marca)}
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
              <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum carro encontrado</p>
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
