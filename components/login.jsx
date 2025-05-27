"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Car, Mail, Lock, Eye, EyeOff, UserPlus } from 'lucide-react'
import CadastroGestor from "./cadastro-gestor"

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showCadastro, setShowCadastro] = useState(false)
  const { toast } = useToast()

  const verificarCredenciais = (email, senha) => {
    // Verificar gestores cadastrados
    const gestores = JSON.parse(localStorage.getItem("gestores") || "[]")
    const gestorEncontrado = gestores.find(g => g.email === email && g.senha === senha)
    
    if (gestorEncontrado) {
      return { success: true, gestor: gestorEncontrado }
    }

    // Fallback para admin padrão (para compatibilidade)
    if (email === "admin@fleetflow.com" && senha === "123456") {
      return { 
        success: true, 
        gestor: { 
          id: 0, 
          nome: "Administrador", 
          email: "admin@fleetflow.com",
          telefone: "(11) 99999-9999"
        } 
      }
    }

    return { success: false }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 1000))

    const resultado = verificarCredenciais(email, password)

    if (resultado.success) {
      onLogin({ 
        email: resultado.gestor.email,
        nome: resultado.gestor.nome,
        id: resultado.gestor.id,
        telefone: resultado.gestor.telefone
      })
      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo, ${resultado.gestor.nome}!`,
      })
    } else {
      toast({
        title: "Erro no login",
        description: "Email ou senha incorretos",
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  const handleCadastroSuccess = () => {
    setShowCadastro(false)
    toast({
      title: "Cadastro concluído!",
      description: "Agora você pode fazer login com suas credenciais",
    })
  }

  if (showCadastro) {
    return (
      <CadastroGestor 
        onBackToLogin={() => setShowCadastro(false)}
        onCadastroSuccess={handleCadastroSuccess}
      />
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Car className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">FleetFlow</h1>
          <p className="text-gray-600 mt-2">Sistema de Gestão de Frota</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center">Entrar</CardTitle>
            <CardDescription className="text-center">Digite suas credenciais para acessar o sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
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

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Ou</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowCadastro(true)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Criar nova conta
              </Button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">Credenciais de teste:</p>
              <p className="text-xs text-gray-500 mt-1">Email: admin@fleetflow.com | Senha: 123456</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
