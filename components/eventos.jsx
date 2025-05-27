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
import { Calendar, Plus, MapPin, Clock, User, Phone, Gauge } from "lucide-react"

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
  const { toast } = useToast()

  useEffect(() => {
    const eventosData = localStorage.getItem("eventos")
    const motoristasData = localStorage.getItem("motoristas")
    const carrosData = localStorage.getItem("carros")
    const gestoresData = localStorage.getItem("gestores")
    const usuarioLogado = localStorage.getItem("usuarioLogado")

    if (eventosData) setEventos(JSON.parse(eventosData))
    if (motoristasData) setMotoristas(JSON.parse(motoristasData))
    if (carrosData) setCarros(JSON.parse(carrosData))
    if (gestoresData) setGestores(JSON.parse(gestoresData))

    // Definir gestor automaticamente como o usuário logado
    if (usuarioLogado) {
      const usuario = JSON.parse(usuarioLogado)
      if (usuario.email === "admin@fleetflow.com") {
        setGestorId("admin")
      } else {
        const gestorLogado = JSON.parse(gestoresData || "[]").find((g) => g.email === usuario.email)
        if (gestorLogado) {
          setGestorId(gestorLogado.id.toString())
        }
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("eventos", JSON.stringify(eventos))
  }, [eventos])

  // Formatar telefone automaticamente
  const formatarTelefone = (valor) => {
    const numero = valor.replace(/\D/g, "")
    if (numero.length <= 11) {
      return numero.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
    }
    return valor
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

  const handleSubmit = (e) => {
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

    if (!odometro || Number.parseInt(odometro) <= 0) {
      toast({
        title: "Erro",
        description: "Odômetro é obrigatório para todos os eventos",
        variant: "destructive",
      })
      return
    }

    // Validação de disponibilidade do carro
    const carroSelecionado = carros.find((c) => c.id === Number.parseInt(carroId))
    if (tipoEvento === "Saída" && carroSelecionado?.statusCalculado === "Em Uso") {
      toast({
        title: "Erro",
        description: "Este carro já está em uso",
        variant: "destructive",
      })
      return
    }

    if (tipoEvento === "Chegada" && carroSelecionado?.statusCalculado === "Disponível") {
      toast({
        title: "Erro",
        description: "Este carro não possui registro de saída",
        variant: "destructive",
      })
      return
    }

    // Validação de odômetro na chegada (deve ser maior que na saída)
    if (tipoEvento === "Chegada") {
      const ultimaSaida = eventos
        .filter((e) => e.carroId === Number.parseInt(carroId) && e.tipo === "Saída")
        .sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora))[0]

      if (ultimaSaida && Number.parseInt(odometro) <= ultimaSaida.odometro) {
        toast({
          title: "Erro",
          description: "Odômetro na chegada deve ser maior que na saída",
          variant: "destructive",
        })
        return
      }
    }

    const motorista = motoristas.find((m) => m.id === Number.parseInt(motoristaId))

    // Remover estas linhas:
    // if (!motorista.cnhValida) {
    //   toast({
    //     title: "Erro",
    //     description: "O motorista selecionado não possui CNH válida.",
    //     variant: "destructive",
    //   })
    //   return
    // }

    const carro = carros.find((c) => c.id === Number.parseInt(carroId))

    let gestorNome = "Admin"
    if (gestorId !== "admin") {
      const gestor = gestores.find((g) => g.id === Number.parseInt(gestorId))
      gestorNome = gestor?.nome || "Gestor"
    }

    if (!motorista || !carro) return

    const novoEvento = {
      id: Date.now(),
      motoristaId: Number.parseInt(motoristaId),
      carroId: Number.parseInt(carroId),
      gestorId: gestorId === "admin" ? "admin" : Number.parseInt(gestorId),
      motoristaNome: motorista.nome,
      carroInfo: `${carro.marca} ${carro.modelo} - ${carro.placa}`,
      gestorNome,
      telefoneMotorista,
      tipo: tipoEvento,
      odometro: Number.parseInt(odometro),
      observacoes,
      dataHora: new Date().toLocaleString("pt-BR"),
    }

    setEventos([novoEvento, ...eventos])

    // Atualizar status do carro
    const carrosAtualizados = carros.map((c) =>
      c.id === Number.parseInt(carroId) ? { ...c, status: tipoEvento === "Saída" ? "Em Uso" : "Disponível" } : c,
    )
    setCarros(carrosAtualizados)
    localStorage.setItem("carros", JSON.stringify(carrosAtualizados))

    toast({
      title: "Sucesso",
      description: `Evento de ${tipoEvento.toLowerCase()} registrado com sucesso`,
    })

    resetForm()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Eventos</h1>
          <p className="text-gray-600 mt-1">Registre saídas e chegadas dos veículos</p>
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
                    <SelectItem value="admin">Admin (Padrão)</SelectItem>
                    {gestores.map((gestor) => (
                      <SelectItem key={gestor.id} value={gestor.id.toString()}>
                        {gestor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="motorista">
                  Motorista <span className="text-red-500">*</span>
                </Label>
                <Select value={motoristaId} onValueChange={setMotoristaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motorista" />
                  </SelectTrigger>
                  <SelectContent>
                    {motoristas.map((motorista) => (
                      <SelectItem
                        key={motorista.id}
                        value={motorista.id.toString()}
                        disabled={motorista.statusCalculado === "Em Uso"}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{motorista.nome}</span>
                          {motorista.statusCalculado === "Em Uso" && <Badge variant="destructive">Indisponível</Badge>}
                        </div>
                      </SelectItem>
                    ))}
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="carro">
                  Carro <span className="text-red-500">*</span>
                </Label>
                <Select value={carroId} onValueChange={setCarroId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o carro" />
                  </SelectTrigger>
                  <SelectContent>
                    {carros.map((carro) => (
                      <SelectItem
                        key={carro.id}
                        value={carro.id.toString()}
                        disabled={
                          tipoEvento === "Saída"
                            ? carro.statusCalculado === "Em Uso"
                            : carro.statusCalculado === "Disponível"
                        }
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>
                            {carro.marca} {carro.modelo} - {carro.placa}
                          </span>
                          <Badge
                            variant={carro.statusCalculado === "Disponível" ? "default" : "secondary"}
                            className="ml-2"
                          >
                            {carro.statusCalculado}
                          </Badge>
                        </div>
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
                <Label htmlFor="odometro">
                  Odômetro (km) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Gauge className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="odometro"
                    type="number"
                    value={odometro}
                    onChange={(e) => setOdometro(e.target.value)}
                    placeholder="Ex: 15000"
                    className="pl-10"
                    min="0"
                  />
                </div>
              </div>
            </div>

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

            <Button type="submit" className="w-full md:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Registrar {tipoEvento}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Eventos</CardTitle>
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
                        <span className="font-mono text-sm">{evento.dataHora}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span>{evento.gestorNome}</span>
                        </div>
                      </TableCell>
                      <TableCell>{evento.motoristaNome}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="font-mono text-sm">{evento.telefoneMotorista}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{evento.carroInfo}</TableCell>
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
              <p className="text-gray-500">Nenhum evento registrado ainda</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
