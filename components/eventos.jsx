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
import { Calendar, Plus, MapPin, Clock, User, Phone, Gauge, AlertCircle, Search, Loader2 } from "lucide-react"

export default function Eventos() {
  const [eventos, setEventos] = useState([])
  const [motoristas, setMotoristas] = useState([])
  const [carros, setCarros] = useState([])
  const [gestores, setGestores] = useState([])
  const [motoristaId, setMotoristaId] = useState("")
  const [carroId, setCarroId] = useState("")
  const [tipoEvento, setTipoEvento] = useState("Saída")
  const [odometro, setOdometro] = useState("")
  const [telefoneMotorista, setTelefoneMotorista] = useState("")
  const [gestorId, setGestorId] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [busca, setBusca] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [buscaLoading, setBuscaLoading] = useState(false)
  const { toast } = useToast()

  // Buscar dados iniciais
  useEffect(() => {
    carregarDados()
    carregarEventos()
    definirGestorLogado()
  }, [])

  // Busca com debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      carregarEventos()
    }, 300)

    return () => clearTimeout(timer)
  }, [busca])

  // Quando mudar o tipo de evento, resetar seleções
  useEffect(() => {
    setMotoristaId("")
    setCarroId("")
    setOdometro("")
  }, [tipoEvento])

  // Para chegada: quando selecionar motorista, preencher carro automaticamente
  useEffect(() => {
    if (tipoEvento === "Chegada" && motoristaId) {
      const ultimaSaida = eventos
        .filter((e) => e.motorista_id === Number.parseInt(motoristaId) && e.tipo === "Saída")
        .sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora))[0]

      if (ultimaSaida) {
        setCarroId(ultimaSaida.carro_id.toString())
      }
    }
  }, [motoristaId, tipoEvento, eventos])

  // Para chegada: quando selecionar carro, preencher motorista automaticamente
  useEffect(() => {
    if (tipoEvento === "Chegada" && carroId && !motoristaId) {
      const ultimaSaida = eventos
        .filter((e) => e.carro_id === Number.parseInt(carroId) && e.tipo === "Saída")
        .sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora))[0]

      if (ultimaSaida) {
        setMotoristaId(ultimaSaida.motorista_id.toString())
      }
    }
  }, [carroId, tipoEvento, eventos, motoristaId])

  const carregarDados = async () => {
    try {
      setLoading(true)

      // Carregar motoristas, carros e gestores
      const [motoristasRes, carrosRes, gestoresRes] = await Promise.all([
        fetch("/api/motoristas"),
        fetch("/api/carros"),
        fetch("/api/gestores"),
      ])

      if (motoristasRes.ok) {
        const motoristasData = await motoristasRes.json()
        setMotoristas(motoristasData.data || motoristasData.motoristas || [])
      }

      if (carrosRes.ok) {
        const carrosData = await carrosRes.json()
        setCarros(carrosData.carros || carrosData.data || [])
      }

      if (gestoresRes.ok) {
        const gestoresData = await gestoresRes.json()
        setGestores(gestoresData.gestores || gestoresData.data || [])
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados iniciais",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const carregarEventos = async () => {
    try {
      setBuscaLoading(true)
      const url = busca ? `/api/eventos?busca=${encodeURIComponent(busca)}` : "/api/eventos"
      const response = await fetch(url)

      if (response.ok) {
        const data = await response.json()
        setEventos(data.data || [])
      } else {
        throw new Error("Erro ao carregar eventos")
      }
    } catch (error) {
      console.error("Erro ao carregar eventos:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar eventos",
        variant: "destructive",
      })
    } finally {
      setBuscaLoading(false)
    }
  }

  const definirGestorLogado = () => {
    const usuarioLogado = localStorage.getItem("usuarioLogado")
    if (usuarioLogado) {
      const usuario = JSON.parse(usuarioLogado)
      if (usuario.email === "admin@fleetflow.com") {
        setGestorId("1") // ID do admin no banco
      }
      // Para outros gestores, seria necessário buscar pelo email
    }
  }

  // Verificar se motorista está em viagem (baseado nos eventos E status do banco)
  const verificarMotoristaEmViagem = (motoristaId) => {
    // Primeiro verificar o status no banco de dados
    const motorista = motoristas.find((m) => m.id === motoristaId)
    if (!motorista || motorista.status !== "Ativo") {
      return false // Motorista inativo não pode estar em viagem
    }

    // Buscar todas as saídas do motorista ordenadas por data (mais recente primeiro)
    const saidasMotorista = eventos
      .filter((e) => e.motorista_id === motoristaId && e.tipo === "Saída")
      .sort((a, b) => {
        // Converter as datas para comparação correta
        const dataA = new Date(
          a.data_hora.split(" ")[0].split("/").reverse().join("-") + " " + a.data_hora.split(" ")[1],
        )
        const dataB = new Date(
          b.data_hora.split(" ")[0].split("/").reverse().join("-") + " " + b.data_hora.split(" ")[1],
        )
        return dataB - dataA
      })

    if (saidasMotorista.length === 0) {
      return false // Não há saídas, motorista disponível
    }

    // Pegar a saída mais recente
    const ultimaSaida = saidasMotorista[0]

    // Converter data da última saída para comparação
    const dataUltimaSaida = new Date(
      ultimaSaida.data_hora.split(" ")[0].split("/").reverse().join("-") + " " + ultimaSaida.data_hora.split(" ")[1],
    )

    // Buscar chegadas do motorista posteriores à última saída
    const chegadasPosteriores = eventos.filter((e) => {
      if (e.motorista_id !== motoristaId || e.tipo !== "Chegada") {
        return false
      }

      // Converter data da chegada para comparação
      const dataChegada = new Date(
        e.data_hora.split(" ")[0].split("/").reverse().join("-") + " " + e.data_hora.split(" ")[1],
      )

      return dataChegada > dataUltimaSaida
    })

    // Se não há chegada posterior à última saída, motorista está em viagem
    return chegadasPosteriores.length === 0
  }

  // Formatar telefone automaticamente
  const formatarTelefone = (valor) => {
    const numero = valor.replace(/\D/g, "")
    if (numero.length <= 11) {
      return numero.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
    }
    return valor
  }

  // Obter odômetro atual do carro
  const obterOdometroAtual = (carroId) => {
    const carro = carros.find((c) => c.id === carroId)
    return carro?.odometro || 0
  }

  const resetForm = () => {
    setMotoristaId("")
    setCarroId("")
    setTipoEvento("Saída")
    setOdometro("")
    setTelefoneMotorista("")
    setObservacoes("")
    // Manter o gestor selecionado
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validações obrigatórias
    if (!motoristaId || !carroId || !gestorId) {
      toast({
        title: "Erro",
        description: "Selecione motorista, carro e gestor",
        variant: "destructive",
      })
      return
    }

    if (!telefoneMotorista || telefoneMotorista.replace(/\D/g, "").length < 10) {
      toast({
        title: "Erro",
        description: "Telefone do motorista é obrigatório e deve ter pelo menos 10 dígitos",
        variant: "destructive",
      })
      return
    }

    try {
      setLoadingSubmit(true)

      const eventData = {
        motorista_id: Number.parseInt(motoristaId),
        carro_id: Number.parseInt(carroId),
        gestor_id: Number.parseInt(gestorId),
        tipo: tipoEvento,
        telefone_motorista: telefoneMotorista,
        observacoes: observacoes || null,
      }

      // Adicionar odômetro apenas para chegada
      if (tipoEvento === "Chegada") {
        if (!odometro || Number.parseInt(odometro) <= 0) {
          toast({
            title: "Erro",
            description: "Odômetro é obrigatório para registrar a chegada",
            variant: "destructive",
          })
          return
        }
        eventData.odometro = Number.parseInt(odometro)
      }

      const response = await fetch("/api/eventos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: result.message,
        })
        resetForm()

        // Recarregar dados na ordem correta
        await carregarEventos() // Primeiro os eventos
        await carregarDados() // Depois motoristas e carros

        // Forçar re-render do componente
        setMotoristaId("")
        setCarroId("")
      } else {
        toast({
          title: "Erro",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao registrar evento:", error)
      toast({
        title: "Erro",
        description: "Erro ao registrar evento",
        variant: "destructive",
      })
    } finally {
      setLoadingSubmit(false)
    }
  }

  // Filtrar carros disponíveis baseado no tipo de evento
  const carrosDisponiveis = carros.filter((carro) => {
    if (tipoEvento === "Saída") {
      // Para saída: usar status do banco de dados
      return carro.status === "Disponível"
    } else {
      // Para chegada: usar status do banco de dados
      return carro.status === "Em Uso"
    }
  })

  // Filtrar motoristas disponíveis baseado no tipo de evento e status
  const motoristasDisponiveis = motoristas.filter((motorista) => {
    // Primeiro verificar se o motorista está ativo
    if (motorista.status !== "Ativo") {
      return false
    }

    // Depois verificar disponibilidade baseada nos eventos
    const emViagem = verificarMotoristaEmViagem(motorista.id)

    if (tipoEvento === "Saída") {
      // Para saída: motorista deve estar ativo e não em viagem
      return !emViagem
    } else {
      // Para chegada: motorista deve estar ativo e em viagem
      return emViagem
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Eventos</h1>
          <p className="text-gray-600 mt-1">Sistema de controle de saídas e chegadas da locadora</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>{eventos.length} eventos</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Registrar Evento</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gestor">
                  Gestor Responsável <span className="text-red-500">*</span>
                </Label>
                <Select value={gestorId} onValueChange={setGestorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o gestor" />
                  </SelectTrigger>
                  <SelectContent>
                    {gestores.map((gestor) => (
                      <SelectItem key={gestor.id} value={gestor.id.toString()}>
                        {gestor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Evento</Label>
                <Select value={tipoEvento} onValueChange={setTipoEvento}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Saída">Saída</SelectItem>
                    <SelectItem value="Chegada">Chegada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">
                  Telefone do Motorista <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="telefone"
                    value={telefoneMotorista}
                    onChange={(e) => setTelefoneMotorista(formatarTelefone(e.target.value))}
                    placeholder="(11) 99999-9999"
                    className="pl-10"
                    maxLength={15}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Para chegada: motorista primeiro, depois carro */}
              {tipoEvento === "Chegada" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="motorista">
                      Motorista <span className="text-red-500">*</span>
                    </Label>
                    <Select value={motoristaId} onValueChange={setMotoristaId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o motorista em viagem" />
                      </SelectTrigger>
                      <SelectContent>
                        {motoristasDisponiveis.map((motorista) => (
                          <SelectItem key={motorista.id} value={motorista.id.toString()}>
                            <div className="flex items-center justify-between w-full">
                              <span>{motorista.nome}</span>
                              <Badge variant="secondary">Em Viagem</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {motoristasDisponiveis.length === 0 && (
                      <div className="flex items-center space-x-2 text-amber-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>Nenhum motorista em viagem</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="carro">
                      Carro <span className="text-red-500">*</span>
                    </Label>
                    <Select value={carroId} onValueChange={setCarroId} disabled={!motoristaId}>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            motoristaId ? "Carro será preenchido automaticamente" : "Selecione o motorista primeiro"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {carrosDisponiveis.map((carro) => (
                          <SelectItem key={carro.id} value={carro.id.toString()}>
                            <div className="flex items-center justify-between w-full">
                              <span>
                                {carro.marca} {carro.modelo} - {carro.placa}
                              </span>
                              <div className="flex items-center space-x-2 ml-2">
                                <Badge variant="secondary">Em Uso</Badge>
                                <span className="text-xs text-gray-500">{carro.odometro?.toLocaleString()} km</span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                /* Para saída: ordem normal */
                <>
                  <div className="space-y-2">
                    <Label htmlFor="carro">
                      Carro <span className="text-red-500">*</span>
                    </Label>
                    <Select value={carroId} onValueChange={setCarroId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione carro disponível" />
                      </SelectTrigger>
                      <SelectContent>
                        {carrosDisponiveis.map((carro) => (
                          <SelectItem key={carro.id} value={carro.id.toString()}>
                            <div className="flex items-center justify-between w-full">
                              <span>
                                {carro.marca} {carro.modelo} - {carro.placa}
                              </span>
                              <div className="flex items-center space-x-2 ml-2">
                                <Badge variant="default">Disponível</Badge>
                                <span className="text-xs text-gray-500">{carro.odometro?.toLocaleString()} km</span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {carrosDisponiveis.length === 0 && (
                      <div className="flex items-center space-x-2 text-amber-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>Nenhum carro disponível para saída</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motorista">
                      Motorista <span className="text-red-500">*</span>
                    </Label>
                    <Select value={motoristaId} onValueChange={setMotoristaId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione motorista disponível" />
                      </SelectTrigger>
                      <SelectContent>
                        {motoristasDisponiveis.map((motorista) => (
                          <SelectItem key={motorista.id} value={motorista.id.toString()}>
                            <div className="flex items-center justify-between w-full">
                              <span>{motorista.nome}</span>
                              <Badge variant="default">Disponível</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {motoristasDisponiveis.length === 0 && (
                      <div className="flex items-center space-x-2 text-amber-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>Nenhum motorista disponível</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {tipoEvento === "Chegada" && (
              <div className="space-y-2">
                <Label htmlFor="odometro">
                  Novo Odômetro (km) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Gauge className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="odometro"
                    type="number"
                    value={odometro}
                    onChange={(e) => setOdometro(e.target.value)}
                    placeholder={
                      carroId
                        ? `Atual: ${obterOdometroAtual(Number.parseInt(carroId)).toLocaleString()} km`
                        : "Ex: 15500"
                    }
                    className="pl-10"
                    min={carroId ? obterOdometroAtual(Number.parseInt(carroId)) + 1 : 0}
                  />
                </div>
                {carroId && (
                  <p className="text-sm text-gray-600">
                    Odômetro atual do veículo: {obterOdometroAtual(Number.parseInt(carroId)).toLocaleString()} km
                  </p>
                )}
              </div>
            )}

            {tipoEvento === "Saída" && carroId && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2 text-blue-700">
                  <Gauge className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Odômetro na saída: {obterOdometroAtual(Number.parseInt(carroId)).toLocaleString()} km
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  O odômetro será registrado automaticamente com o valor atual do veículo
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações opcionais sobre o evento..."
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full md:w-auto" disabled={loadingSubmit}>
              {loadingSubmit ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Registrar {tipoEvento}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Histórico de Eventos</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar eventos..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
              {buscaLoading && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {eventos.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Gestor</TableHead>
                    <TableHead>Motorista</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Odômetro</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventos.map((evento) => (
                    <TableRow key={evento.id}>
                      <TableCell className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="font-mono text-sm">{evento.data_hora}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span>{evento.gestor_nome || "Admin"}</span>
                        </div>
                      </TableCell>
                      <TableCell>{evento.motorista_nome}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="font-mono text-sm">{evento.telefone_motorista}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{evento.carro_info}</TableCell>
                      <TableCell>
                        <Badge
                          variant={evento.tipo === "Saída" ? "destructive" : "default"}
                          className="flex items-center space-x-1 w-fit"
                        >
                          <MapPin className="w-3 h-3" />
                          <span>{evento.tipo}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Gauge className="w-4 h-4 text-gray-400" />
                          <span>{evento.odometro?.toLocaleString()} km</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{evento.observacoes || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {busca ? "Nenhum evento encontrado para a busca" : "Nenhum evento registrado ainda"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
