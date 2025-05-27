"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { CalendarIcon, Car, TrendingUp, Download, Filter, BarChart3, PieChartIcon, Activity } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

export default function Relatorios() {
  const [eventos, setEventos] = useState([])
  const [motoristas, setMotoristas] = useState([])
  const [carros, setCarros] = useState([])
  const [dataInicio, setDataInicio] = useState(null)
  const [dataFim, setDataFim] = useState(null)
  const [motoristaFiltro, setMotoristaFiltro] = useState("todos")
  const [carroFiltro, setCarroFiltro] = useState("todos")
  const [tipoRelatorio, setTipoRelatorio] = useState("periodo")
  const { toast } = useToast()

  useEffect(() => {
    const eventosData = localStorage.getItem("eventos")
    const motoristasData = localStorage.getItem("motoristas")
    const carrosData = localStorage.getItem("carros")

    if (eventosData) setEventos(JSON.parse(eventosData))
    if (motoristasData) setMotoristas(JSON.parse(motoristasData))
    if (carrosData) setCarros(JSON.parse(carrosData))

    // Definir período padrão (últimos 30 dias)
    const hoje = new Date()
    const trintaDiasAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000)
    setDataInicio(trintaDiasAtras)
    setDataFim(hoje)
  }, [])

  // Filtrar eventos baseado nos critérios
  const eventosFiltrados = useMemo(() => {
    return eventos.filter((evento) => {
      const dataEvento = new Date(evento.dataHora.split(", ")[0].split("/").reverse().join("-"))

      const dentroDataInicio = !dataInicio || dataEvento >= dataInicio
      const dentroDataFim = !dataFim || dataEvento <= dataFim
      const motoristaMatch = motoristaFiltro === "todos" || evento.motoristaId === Number.parseInt(motoristaFiltro)
      const carroMatch = carroFiltro === "todos" || evento.carroId === Number.parseInt(carroFiltro)

      return dentroDataInicio && dentroDataFim && motoristaMatch && carroMatch
    })
  }, [eventos, dataInicio, dataFim, motoristaFiltro, carroFiltro])

  // Calcular estatísticas gerais
  const estatisticasGerais = useMemo(() => {
    const saidas = eventosFiltrados.filter((e) => e.tipo === "Saída")
    const chegadas = eventosFiltrados.filter((e) => e.tipo === "Chegada")

    let quilometragemTotal = 0
    let viagensCompletas = 0

    // Calcular quilometragem por viagem completa
    saidas.forEach((saida) => {
      const chegadaCorrespondente = chegadas.find(
        (chegada) => chegada.carroId === saida.carroId && new Date(chegada.dataHora) > new Date(saida.dataHora),
      )

      if (chegadaCorrespondente) {
        quilometragemTotal += chegadaCorrespondente.odometro - saida.odometro
        viagensCompletas++
      }
    })

    return {
      totalEventos: eventosFiltrados.length,
      totalSaidas: saidas.length,
      totalChegadas: chegadas.length,
      viagensCompletas,
      quilometragemTotal,
      mediaKmPorViagem: viagensCompletas > 0 ? quilometragemTotal / viagensCompletas : 0,
    }
  }, [eventosFiltrados])

  // Dados para gráfico de uso por período
  const dadosUsoPorPeriodo = useMemo(() => {
    const agrupamento = {}

    eventosFiltrados.forEach((evento) => {
      const data = evento.dataHora.split(", ")[0]
      if (!agrupamento[data]) {
        agrupamento[data] = { data, saidas: 0, chegadas: 0 }
      }
      if (evento.tipo === "Saída") {
        agrupamento[data].saidas++
      } else {
        agrupamento[data].chegadas++
      }
    })

    return Object.values(agrupamento).sort(
      (a, b) => new Date(a.data.split("/").reverse().join("-")) - new Date(b.data.split("/").reverse().join("-")),
    )
  }, [eventosFiltrados])

  // Dados para relatório por motorista
  const dadosPorMotorista = useMemo(() => {
    const agrupamento = {}

    eventosFiltrados.forEach((evento) => {
      if (!agrupamento[evento.motoristaId]) {
        agrupamento[evento.motoristaId] = {
          id: evento.motoristaId,
          nome: evento.motoristaNome,
          saidas: 0,
          chegadas: 0,
          quilometragem: 0,
          viagensCompletas: 0,
        }
      }

      if (evento.tipo === "Saída") {
        agrupamento[evento.motoristaId].saidas++
      } else {
        agrupamento[evento.motoristaId].chegadas++

        // Calcular quilometragem
        const saidaCorrespondente = eventosFiltrados.find(
          (e) =>
            e.motoristaId === evento.motoristaId &&
            e.carroId === evento.carroId &&
            e.tipo === "Saída" &&
            new Date(e.dataHora) < new Date(evento.dataHora),
        )

        if (saidaCorrespondente) {
          const km = evento.odometro - saidaCorrespondente.odometro
          agrupamento[evento.motoristaId].quilometragem += km
          agrupamento[evento.motoristaId].viagensCompletas++
        }
      }
    })

    return Object.values(agrupamento).sort((a, b) => b.quilometragem - a.quilometragem)
  }, [eventosFiltrados])

  // Dados para relatório de quilometragem por carro
  const dadosPorCarro = useMemo(() => {
    const agrupamento = {}

    eventosFiltrados.forEach((evento) => {
      if (!agrupamento[evento.carroId]) {
        const carro = carros.find((c) => c.id === evento.carroId)
        agrupamento[evento.carroId] = {
          id: evento.carroId,
          info: evento.carroInfo,
          marca: carro?.marca || "",
          modelo: carro?.modelo || "",
          placa: carro?.placa || "",
          saidas: 0,
          chegadas: 0,
          quilometragem: 0,
          viagensCompletas: 0,
        }
      }

      if (evento.tipo === "Saída") {
        agrupamento[evento.carroId].saidas++
      } else {
        agrupamento[evento.carroId].chegadas++

        // Calcular quilometragem
        const saidaCorrespondente = eventosFiltrados.find(
          (e) => e.carroId === evento.carroId && e.tipo === "Saída" && new Date(e.dataHora) < new Date(evento.dataHora),
        )

        if (saidaCorrespondente) {
          const km = evento.odometro - saidaCorrespondente.odometro
          agrupamento[evento.carroId].quilometragem += km
          agrupamento[evento.carroId].viagensCompletas++
        }
      }
    })

    return Object.values(agrupamento).sort((a, b) => b.quilometragem - a.quilometragem)
  }, [eventosFiltrados, carros])

  const exportarRelatorio = () => {
    const dados = {
      periodo: {
        inicio: dataInicio ? format(dataInicio, "dd/MM/yyyy") : "N/A",
        fim: dataFim ? format(dataFim, "dd/MM/yyyy") : "N/A",
      },
      estatisticas: estatisticasGerais,
      motoristas: dadosPorMotorista,
      carros: dadosPorCarro,
      eventos: eventosFiltrados,
    }

    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `relatorio-frota-${format(new Date(), "yyyy-MM-dd")}.json`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Sucesso",
      description: "Relatório exportado com sucesso",
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-1">Análise detalhada do uso da frota</p>
        </div>
        <Button onClick={exportarRelatorio} className="flex items-center space-x-2">
          <Download className="w-4 h-4" />
          <span>Exportar</span>
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataInicio ? format(dataInicio, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dataInicio} onSelect={setDataInicio} locale={ptBR} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataFim ? format(dataFim, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dataFim} onSelect={setDataFim} locale={ptBR} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Motorista</Label>
              <Select value={motoristaFiltro} onValueChange={setMotoristaFiltro}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Motoristas</SelectItem>
                  {motoristas.map((motorista) => (
                    <SelectItem key={motorista.id} value={motorista.id.toString()}>
                      {motorista.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Carro</Label>
              <Select value={carroFiltro} onValueChange={setCarroFiltro}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Carros</SelectItem>
                  {carros.map((carro) => (
                    <SelectItem key={carro.id} value={carro.id.toString()}>
                      {carro.marca} {carro.modelo} - {carro.placa}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Eventos</p>
                <p className="text-2xl font-bold">{estatisticasGerais.totalEventos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Saídas</p>
                <p className="text-2xl font-bold">{estatisticasGerais.totalSaidas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Chegadas</p>
                <p className="text-2xl font-bold">{estatisticasGerais.totalChegadas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Car className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Viagens</p>
                <p className="text-2xl font-bold">{estatisticasGerais.viagensCompletas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Total KM</p>
                <p className="text-2xl font-bold">{estatisticasGerais.quilometragemTotal.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <PieChartIcon className="w-8 h-8 text-indigo-600" />
              <div>
                <p className="text-sm text-gray-600">Média KM</p>
                <p className="text-2xl font-bold">{Math.round(estatisticasGerais.mediaKmPorViagem)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Relatórios Detalhados */}
      <Tabs value={tipoRelatorio} onValueChange={setTipoRelatorio}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="periodo">Por Período</TabsTrigger>
          <TabsTrigger value="motorista">Por Motorista</TabsTrigger>
          <TabsTrigger value="carro">Por Carro</TabsTrigger>
        </TabsList>

        <TabsContent value="periodo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Uso por Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosUsoPorPeriodo}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="saidas" fill="#ef4444" name="Saídas" />
                    <Bar dataKey="chegadas" fill="#22c55e" name="Chegadas" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Eventos por Data</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Saídas</TableHead>
                    <TableHead>Chegadas</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dadosUsoPorPeriodo.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.data}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">{item.saidas}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">{item.chegadas}</Badge>
                      </TableCell>
                      <TableCell>{item.saidas + item.chegadas}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="motorista" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ranking de Motoristas por Quilometragem</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosPorMotorista.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nome" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="quilometragem" fill="#3b82f6" name="Quilometragem (km)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalhes por Motorista</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Motorista</TableHead>
                    <TableHead>Saídas</TableHead>
                    <TableHead>Chegadas</TableHead>
                    <TableHead>Viagens Completas</TableHead>
                    <TableHead>Quilometragem Total</TableHead>
                    <TableHead>Média por Viagem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dadosPorMotorista.map((motorista) => (
                    <TableRow key={motorista.id}>
                      <TableCell className="font-medium">{motorista.nome}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">{motorista.saidas}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">{motorista.chegadas}</Badge>
                      </TableCell>
                      <TableCell>{motorista.viagensCompletas}</TableCell>
                      <TableCell>{motorista.quilometragem.toLocaleString()} km</TableCell>
                      <TableCell>
                        {motorista.viagensCompletas > 0
                          ? Math.round(motorista.quilometragem / motorista.viagensCompletas)
                          : 0}{" "}
                        km
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="carro" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Uso por Veículo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosPorCarro}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ placa, quilometragem }) => `${placa}: ${quilometragem}km`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="quilometragem"
                    >
                      {dadosPorCarro.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalhes por Veículo</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Saídas</TableHead>
                    <TableHead>Chegadas</TableHead>
                    <TableHead>Viagens Completas</TableHead>
                    <TableHead>Quilometragem Total</TableHead>
                    <TableHead>Média por Viagem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dadosPorCarro.map((carro) => (
                    <TableRow key={carro.id}>
                      <TableCell className="font-medium">
                        {carro.marca} {carro.modelo}
                      </TableCell>
                      <TableCell className="font-mono">{carro.placa}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">{carro.saidas}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">{carro.chegadas}</Badge>
                      </TableCell>
                      <TableCell>{carro.viagensCompletas}</TableCell>
                      <TableCell>{carro.quilometragem.toLocaleString()} km</TableCell>
                      <TableCell>
                        {carro.viagensCompletas > 0 ? Math.round(carro.quilometragem / carro.viagensCompletas) : 0} km
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
