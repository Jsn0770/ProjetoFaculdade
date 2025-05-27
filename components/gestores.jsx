"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Search, Plus, Edit, Trash2, UserCog, Phone, Mail, Eye, EyeOff } from "lucide-react"

export default function Gestores() {
  const [gestores, setGestores] = useState([])
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [telefone, setTelefone] = useState("")
  const [senha, setSenha] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [busca, setBusca] = useState("")
  const [editandoId, setEditandoId] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    const dados = localStorage.getItem("gestores")
    if (dados) {
      setGestores(JSON.parse(dados))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("gestores", JSON.stringify(gestores))
  }, [gestores])

  const resetForm = () => {
    setNome("")
    setEmail("")
    setTelefone("")
    setSenha("")
    setEditandoId(null)
  }

  const formatarTelefone = (value) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{4,5})(\d{4})/, "($1) $2-$3")
    }
    return value
  }

  const validarEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const verificarEmailExistente = (email, idExcluir = null) => {
    return gestores.some((gestor) => gestor.email === email && gestor.id !== idExcluir)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!nome || !email || !telefone || (!editandoId && !senha)) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    if (!validarEmail(email)) {
      toast({
        title: "Erro",
        description: "Email inválido",
        variant: "destructive",
      })
      return
    }

    if (verificarEmailExistente(email, editandoId)) {
      toast({
        title: "Erro",
        description: "Este email já está cadastrado",
        variant: "destructive",
      })
      return
    }

    if (!editandoId && senha.length < 6) {
      toast({
        title: "Erro",
        description: "Senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      })
      return
    }

    if (editandoId !== null) {
      setGestores(
        gestores.map((g) =>
          g.id === editandoId
            ? {
                ...g,
                nome,
                email,
                telefone,
                ...(senha && { senha }), // Só atualiza senha se foi informada
              }
            : g,
        ),
      )
      toast({
        title: "Sucesso",
        description: "Gestor editado com sucesso",
      })
    } else {
      const novoGestor = {
        id: Date.now(),
        nome,
        email,
        telefone,
        senha,
        dataCadastro: new Date().toISOString(),
      }
      setGestores([novoGestor, ...gestores])
      toast({
        title: "Sucesso",
        description: "Gestor adicionado com sucesso",
      })
    }

    resetForm()
  }

  const handleEdit = (gestor) => {
    setNome(gestor.nome)
    setEmail(gestor.email)
    setTelefone(gestor.telefone)
    setSenha("") // Não preenche a senha por segurança
    setEditandoId(gestor.id)
  }

  const handleDelete = (id) => {
    setGestores(gestores.filter((g) => g.id !== id))
    if (editandoId === id) resetForm()
    toast({
      title: "Sucesso",
      description: "Gestor removido com sucesso",
    })
  }

  const gestoresFiltrados = gestores.filter(
    (g) =>
      g.nome.toLowerCase().includes(busca.toLowerCase()) ||
      g.email.toLowerCase().includes(busca.toLowerCase()) ||
      g.telefone.includes(busca),
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestores</h1>
          <p className="text-gray-600 mt-1">Gerencie os gestores do sistema</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <UserCog className="w-4 h-4" />
          <span>{gestores.length} gestores</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>{editandoId ? "Editar Gestor" : "Adicionar Gestor"}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do gestor" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
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
                <Label htmlFor="senha">{editandoId ? "Nova Senha (deixe vazio para manter)" : "Senha"}</Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={showPassword ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder={editandoId ? "Nova senha (opcional)" : "Senha do gestor"}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button type="submit">{editandoId ? "Salvar Alterações" : "Adicionar Gestor"}</Button>
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
            <CardTitle>Lista de Gestores</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar gestores..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {gestoresFiltrados.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Data Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gestoresFiltrados.map((gestor) => (
                  <TableRow key={gestor.id}>
                    <TableCell className="font-medium">{gestor.nome}</TableCell>
                    <TableCell>{gestor.email}</TableCell>
                    <TableCell>{gestor.telefone}</TableCell>
                    <TableCell>
                      {gestor.dataCadastro ? new Date(gestor.dataCadastro).toLocaleDateString("pt-BR") : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(gestor)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(gestor.id)}
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
          ) : (
            <div className="text-center py-8">
              <UserCog className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum gestor encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
