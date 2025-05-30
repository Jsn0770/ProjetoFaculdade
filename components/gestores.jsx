"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Search, UserCog, User } from "lucide-react"
import ConfirmDialog from "./confirm-dialog"

export default function Gestores() {
  const [gestores, setGestores] = useState([])
  const [busca, setBusca] = useState("")
  const { toast } = useToast()
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", message: "", onConfirm: null })

  useEffect(() => {
    const dados = localStorage.getItem("gestores")
    if (dados) {
      setGestores(JSON.parse(dados))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("gestores", JSON.stringify(gestores))
  }, [gestores])

  const verificarEmailExistente = (email, idExcluir = null) => {
    return gestores.some((gestor) => gestor.email === email && gestor.id !== idExcluir)
  }

  const handleDelete = (id, nome) => {
    setConfirmDialog({
      open: true,
      title: "Confirmar Exclusão",
      message: `Tem certeza que deseja excluir o gestor "${nome}"? Esta ação não pode ser desfeita.`,
      onConfirm: () => {
        setGestores(gestores.filter((g) => g.id !== id))
        toast({
          title: "Sucesso",
          description: "Gestor removido com sucesso",
        })
        setConfirmDialog({ open: false, title: "", message: "", onConfirm: null })
      },
    })
  }

  const gestoresFiltrados = gestores.filter(
    (g) =>
      g.nome.toLowerCase().includes(busca.toLowerCase()) ||
      g.email.toLowerCase().includes(busca.toLowerCase()) ||
      g.telefone.includes(busca),
  )

  const contarEventosPorGestor = (gestorId, gestorEmail) => {
    const eventos = JSON.parse(localStorage.getItem("eventos") || "[]")
    if (gestorEmail === "admin@fleetflow.com") {
      return eventos.filter((e) => e.gestorId === "admin").length
    }
    return eventos.filter((e) => e.gestorId === gestorId).length
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestores</h1>
          <p className="text-gray-600 mt-1">Lista de gestores do sistema</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <UserCog className="w-4 h-4" />
          <span>{gestores.length + 1} gestores</span>
        </div>
      </div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Admin Card */}
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
                    <UserCog className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Administrador</h3>
                    <p className="text-sm text-gray-600">admin@fleetflow.com</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>{contarEventosPorGestor("admin", "admin@fleetflow.com")} eventos</span>
                      <span>Sistema</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gestores Cadastrados */}
            {gestoresFiltrados.map((gestor) => (
              <Card key={gestor.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                      {gestor.fotoPerfil ? (
                        <img
                          src={gestor.fotoPerfil || "/placeholder.svg"}
                          alt={gestor.nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{gestor.nome}</h3>
                      <p className="text-sm text-gray-600">{gestor.email}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>{contarEventosPorGestor(gestor.id, gestor.email)} eventos</span>
                        <span>{new Date(gestor.dataCadastro).toLocaleDateString("pt-BR")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Telefone:</span>
                      <span className="font-mono">{gestor.telefone}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {gestoresFiltrados.length === 0 && (
            <div className="text-center py-8">
              <UserCog className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum gestor encontrado</p>
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
