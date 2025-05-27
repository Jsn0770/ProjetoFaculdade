"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Car, Users, Calendar, TrendingUp, Activity, MapPin, AlertTriangle, Clock, Settings, Gauge } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line } from "recharts"

export default function Dashboard() {
  const [stats, setStats] = useState({
    carros: 0,
    motoristas: 0,
    eventos: 0,
    carrosDisponiveis: 0,
    motoristasDisponiveis: 0,
    quilometragemTotal: 0,
    viagensHoje: 0,
    utilizacao: 0,
  })

  const [alerts, setAlerts] = useState([])
  const [chartData, setChartData] = useState({
    statusFrota: [],
    usoSemanal: [],
    quilometragemMensal: [],
  })

  useEffect(() => {
    const carros = JSON.parse(localStorage.getItem("carros") || "[]")
    const motoristas = JSON.parse(localStorage.getItem("motoristas") || "[]")
    const eventos = JSON.parse(localStorage.getItem("eventos") || "[]")

    // Calcular estatísticas
    const carrosDisponiveis = carros.filter((c) => getCarroStatus(c, eventos) === "Disponível").length
    const motoristasDisponiveis = motoristas.filter((m) => getMotoristaStatus(m, eventos) === "Disponível").length

    // Calcular quilometragem total
    const quilometragemTotal = eventos
      .filter((e) => e.tipo === "Chegada" && e.odometro)
      .reduce((total, chegada) => {
        const saida = eventos.find(
          (s) =>
            s.tipo === "Saída" &&
            s.carroId === chegada.carroId &&
            s.motoristaId === chegada.motoristaId &&
            new Date(s.dataHora) < new Date(chegada.dataHora),
        )
        if (saida && saida.odometro) {
          return total + (chegada.odometro - saida.odometro)
        }
        return total
      }, 0)

    // Viagens hoje
    const hoje = new Date().toISOString().split("T")[0]
    const viagensHoje = eventos.filter((e) => e.dataHora.startsWith(hoje) && e.tipo === "Saída").length

    // Taxa de utilização
    const utilizacao = carros.length > 0 ? ((carros.length - carrosDisponiveis) / carros.length) * 100 : 0

    setStats({
      carros: carros.length,
      motoristas: motoristas.length,
      eventos: eventos.length,
      carrosDisponiveis,
      motoristasDisponiveis,
      quilometragemTotal,
      viagensHoje,
      utilizacao,
    })

    // Gerar alertas
    generateAlerts(carros, motoristas, eventos)

    // Gerar dados dos gráficos
    generateChartData(carros, motoristas, eventos)
  }, [])

  const getCarroStatus = (carro, eventos) => {
    // Verificar se está em uso
    const ultimoEvento = eventos
      .filter((e) => e.carroId === carro.id)
      .sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora))[0]

    if (ultimoEvento && ultimoEvento.tipo === "Saída") {
      return "Em Uso"
    }

    // Verificar documentação
    const hoje = new Date()
    if (carro.vencimentoIPVA && new Date(carro.vencimentoIPVA) < hoje) return "Documentação Vencida"
    if (carro.vencimentoSeguro && new Date(carro.vencimentoSeguro) < hoje) return "Documentação Vencida"
    if (carro.proximaRevisao && new Date(carro.proximaRevisao) < hoje) return "Manutenção Pendente"

    return "Disponível"
  }

  const getMotoristaStatus = (motorista, eventos) => {
    // Verificar se está dirigindo
    const ultimoEvento = eventos
      .filter((e) => e.motoristaId === motorista.id)
      .sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora))[0]

    if (ultimoEvento && ultimoEvento.tipo === "Saída") {
      return "Em Viagem"
    }

    // Verificar CNH
    if (motorista.vencimentoCNH && new Date(motorista.vencimentoCNH) < new Date()) {
      return "CNH Vencida"
    }

    return "Disponível"
  }

  const generateAlerts = (carros, motoristas, eventos) => {
    const alertas = []
    const hoje = new Date()
    const em30Dias = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Alertas de carros
    carros.forEach((carro) => {
      // Documentação vencida
      if (carro.vencimentoIPVA && new Date(carro.vencimentoIPVA) < hoje) {
        alertas.push({
          tipo: "error",
          titulo: "IPVA Vencido",
          descricao: `${carro.marca} ${carro.modelo} (${carro.placa}) - IPVA vencido`,
          icone: AlertTriangle,
        })
      }
      if (carro.vencimentoSeguro && new Date(carro.vencimentoSeguro) < hoje) {
        alertas.push({
          tipo: "error",
          titulo: "Seguro Vencido",
          descricao: `${carro.marca} ${carro.modelo} (${carro.placa}) - Seguro vencido`,
          icone: AlertTriangle,
        })
      }

      // Documentação vencendo em 30 dias
      if (carro.vencimentoIPVA && new Date(carro.vencimentoIPVA) < em30Dias && new Date(carro.vencimentoIPVA) > hoje) {
        alertas.push({
          tipo: "warning",
          titulo: "IPVA Vencendo",
          descricao: `${carro.marca} ${carro.modelo} (${carro.placa}) - IPVA vence em breve`,
          icone: Clock,
        })
      }

      // Revisão pendente
      if (carro.proximaRevisao && new Date(carro.proximaRevisao) < hoje) {
        alertas.push({
          tipo: "warning",
          titulo: "Revisão Pendente",
          descricao: `${carro.marca} ${carro.modelo} (${carro.placa}) - Revisão em atraso`,
          icone: Settings,
        })
      }

      // Carro em uso há muito tempo
      const ultimaSaida = eventos
        .filter((e) => e.carroId === carro.id && e.tipo === "Saída")
        .sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora))[0]

      if (ultimaSaida) {
        const tempoUso = (hoje - new Date(ultimaSaida.dataHora)) / (1000 * 60 * 60)
        if (tempoUso > 24) {
          alertas.push({
            tipo: "warning",
            titulo: "Uso Prolongado",
            descricao: `${carro.marca} ${carro.modelo} em uso há ${Math.floor(tempoUso)}h`,
            icone: Clock,
          })
        }
      }
    })

    // Alertas de motoristas
    motoristas.forEach((motorista) => {
      // CNH vencida
      if (motorista.vencimentoCNH && new Date(motorista.vencimentoCNH) < hoje) {
        alertas.push({
          tipo: "error",
          titulo: "CNH Vencida",
          descricao: `${motorista.nome} - CNH vencida`,
          icone: AlertTriangle,
        })
      }

      // CNH vencendo em 30 dias
      if (
        motorista.vencimentoCNH &&
        new Date(motorista.vencimentoCNH) < em30Dias &&
        new Date(motorista.vencimentoCNH) > hoje
      ) {
        alertas.push({
          tipo: "warning",
          titulo: "CNH Vencendo",
          descricao: `${motorista.nome} - CNH vence em breve`,
          icone: Clock,
        })
      }
    })

    setAlerts(alertas.slice(0, 5)) // Mostrar apenas os 5 primeiros
  }

  const generateChartData = (carros, motoristas, eventos) => {
    // Status da frota
    const statusCount = {
      Disponível: 0,
      "Em Uso": 0,
      Manutenção: 0,
      "Documentação Vencida": 0,
    }

    carros.forEach((carro) => {
      const status = getCarroStatus(carro, eventos)
      if (status === "Disponível") statusCount["Disponível"]++
      else if (status === "Em Uso") statusCount["Em Uso"]++
      else if (status === "Manutenção Pendente") statusCount["Manutenção"]++
      else statusCount["Documentação Vencida"]++
    })

    const statusFrota = Object.entries(statusCount).map(([status, count]) => ({
      status,
      count,
      fill:
        status === "Disponível"
          ? "#22c55e"
          : status === "Em Uso"
            ? "#3b82f6"
            : status === "Manutenção"
              ? "#f59e0b"
              : "#ef4444",
    }))

    // Uso semanal (últimos 7 dias)
    const usoSemanal = []
    for (let i = 6; i >= 0; i--) {
      const data = new Date()
      data.setDate(data.getDate() - i)
      const dataStr = data.toISOString().split("T")[0]

      const saidas = eventos.filter((e) => e.tipo === "Saída" && e.dataHora.startsWith(dataStr)).length
      const chegadas = eventos.filter((e) => e.tipo === "Chegada" && e.dataHora.startsWith(dataStr)).length

      usoSemanal.push({
        data: data.toLocaleDateString("pt-BR", { weekday: "short" }),
        saidas,
        chegadas,
      })
    }

    // Quilometragem mensal (últimos 6 meses)
    const quilometragemMensal = []
    for (let i = 5; i >= 0; i--) {
      const data = new Date()
      data.setMonth(data.getMonth() - i)
      const ano = data.getFullYear()
      const mes = data.getMonth() + 1

      const eventosDoMes = eventos.filter((e) => {
        const eventoData = new Date(e.dataHora)
        return eventoData.getFullYear() === ano && eventoData.getMonth() + 1 === mes
      })

      const quilometragem = eventosDoMes
        .filter((e) => e.tipo === "Chegada" && e.odometro)
        .reduce((total, chegada) => {
          const saida = eventosDoMes.find(
            (s) =>
              s.tipo === "Saída" &&
              s.carroId === chegada.carroId &&
              s.motoristaId === chegada.motoristaId &&
              new Date(s.dataHora) < new Date(chegada.dataHora),
          )
          if (saida && saida.odometro) {
            return total + (chegada.odometro - saida.odometro)
          }
          return total
        }, 0)

      quilometragemMensal.push({
        mes: data.toLocaleDateString("pt-BR", { month: "short" }),
        quilometragem,
      })
    }

    setChartData({
      statusFrota,
      usoSemanal,
      quilometragemMensal,
    })
  }

  const kpis = [
    {
      title: "Taxa de Utilização",
      value: `${stats.utilizacao.toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "Carros em uso vs disponíveis",
      trend: stats.utilizacao > 70 ? "high" : stats.utilizacao > 40 ? "medium" : "low",
    },
    {
      title: "Viagens Hoje",
      value: stats.viagensHoje,
      icon: MapPin,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: "Saídas registradas hoje",
      trend: "neutral",
    },
    {
      title: "Quilometragem Total",
      value: `${stats.quilometragemTotal.toLocaleString()} km`,
      icon: Gauge,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: "Acumulado de todas as viagens",
      trend: "neutral",
    },
    {
      title: "Disponibilidade",
      value: `${stats.carrosDisponiveis}/${stats.carros}`,
      icon: Car,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      description: "Carros disponíveis",
      trend: stats.carrosDisponiveis > stats.carros * 0.7 ? "high" : "low",
    },
  ]

  const chartConfig = {
    saidas: {
      label: "Saídas",
      color: "#3b82f6",
    },
    chegadas: {
      label: "Chegadas",
      color: "#22c55e",
    },
    quilometragem: {
      label: "Quilometragem",
      color: "#8b5cf6",
    },
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Visão geral em tempo real da sua frota</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Activity className="w-4 h-4 animate-pulse text-green-500" />
          <span>Atualizado em tempo real</span>
        </div>
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
            Alertas Importantes
          </h2>
          <div className="grid gap-2">
            {alerts.map((alert, index) => {
              const Icon = alert.icone
              return (
                <Alert
                  key={index}
                  className={`border-l-4 ${
                    alert.tipo === "error" ? "border-red-500 bg-red-50" : "border-yellow-500 bg-yellow-50"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${alert.tipo === "error" ? "text-red-600" : "text-yellow-600"}`} />
                  <AlertDescription>
                    <span className="font-medium">{alert.titulo}:</span> {alert.descricao}
                  </AlertDescription>
                </Alert>
              )
            })}
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{kpi.title}</CardTitle>
                <div className={`p-2 rounded-lg ${kpi.bgColor} relative`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                  {kpi.trend === "high" && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                  {kpi.trend === "low" && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
                <p className="text-xs text-gray-500 mt-1">{kpi.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status da Frota */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Car className="w-5 h-5 text-blue-600" />
              <span>Status da Frota</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <PieChart>
                <Pie
                  data={chartData.statusFrota}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {chartData.statusFrota.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            <div className="flex flex-wrap gap-2 mt-4">
              {chartData.statusFrota.map((item, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: item.fill }}></div>
                  {item.status}: {item.count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Uso Semanal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-green-600" />
              <span>Uso Semanal</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={chartData.usoSemanal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="saidas" fill="#3b82f6" name="Saídas" />
                <Bar dataKey="chegadas" fill="#22c55e" name="Chegadas" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quilometragem Mensal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Gauge className="w-5 h-5 text-purple-600" />
            <span>Quilometragem Mensal</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <LineChart data={chartData.quilometragemMensal}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="quilometragem"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
                name="Quilometragem (km)"
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Resumo Rápido */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Motoristas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Disponíveis</span>
                <Badge variant="outline" className="text-green-600">
                  {stats.motoristasDisponiveis}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Em viagem</span>
                <Badge variant="outline" className="text-blue-600">
                  {stats.motoristas - stats.motoristasDisponiveis}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total</span>
                <Badge variant="outline">{stats.motoristas}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Car className="w-5 h-5 text-green-600" />
              <span>Veículos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Disponíveis</span>
                <Badge variant="outline" className="text-green-600">
                  {stats.carrosDisponiveis}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Em uso</span>
                <Badge variant="outline" className="text-blue-600">
                  {stats.carros - stats.carrosDisponiveis}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total</span>
                <Badge variant="outline">{stats.carros}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <span>Atividade</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Eventos hoje</span>
                <Badge variant="outline" className="text-purple-600">
                  {stats.viagensHoje * 2}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total eventos</span>
                <Badge variant="outline">{stats.eventos}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Km total</span>
                <Badge variant="outline">{stats.quilometragemTotal.toLocaleString()}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
