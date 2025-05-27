"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Car, Mail, Lock, Eye, EyeOff, User, Phone, ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import { Progress } from "@/components/ui/progress"

export default function CadastroGestor({ onBackToLogin, onCadastroSuccess }) {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    senha: "",
    confirmarSenha: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Validações em tempo real
  const validacoes = {
    nome: formData.nome.length >= 2,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email),
    telefone: /^$$\d{2}$$\s\d{4,5}-\d{4}$/.test(formData.telefone),
    senha: formData.senha.length >= 6,
    senhaForte: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.senha),
    senhasIguais: formData.senha === formData.confirmarSenha && formData.confirmarSenha.length > 0
  }

  // Força da senha
  const calcularForcaSenha = () => {
    const senha = formData.senha
    let pontos = 0
    
    if (senha.length >= 6) pontos += 20
    if (senha.length >= 8) pontos += 20
    if (/[a-z]/.test(senha)) pontos += 20
    if (/[A-Z]/.test(senha)) pontos += 20
    if (/\d/.test(senha)) pontos += 10
    if (/[@$!%*?&]/.test(senha)) pontos += 10
    
    return pontos
  }

  const forcaSenha = calcularForcaSenha()
  const corForcaSenha = forcaSenha < 40 ? "bg-red-500" : forcaSenha < 70 ? "bg-yellow-500" : "bg-green-500"
  const textoForcaSenha = forcaSenha < 40 ? "Fraca" : forcaSenha < 70 ? "Média" : "Forte"

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const formatarTelefone = (value) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3')
    }
    return value
  }

  const verificarEmailExistente = (email) => {
    const gestores = JSON.parse(localStorage.getItem("gestores") || "[]")
    return gestores.some(gestor => gestor.email === email)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    // Validações
    if (!validacoes.nome) {
      toast({
        title: "Erro de validação",
        description: "Nome deve ter pelo menos 2 caracteres",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (!validacoes.email) {
      toast({
        title: "Erro de validação",
        description: "Email inválido",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (verificarEmailExistente(formData.email)) {
      toast({
        title: "Erro de validação",
        description: "Este email já está cadastrado",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (!validacoes.telefone) {
      toast({
        title: "Erro de validação",
        description: "Telefone deve estar no formato (XX) XXXXX-XXXX",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (!validacoes.senha) {
      toast({
        title: "Erro de validação",
        description: "Senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (!validacoes.senhasIguais) {
      toast({
        title: "Erro de validação",
        description: "As senhas não coincidem",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    // Simular delay de cadastro
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Salvar gestor
    const gestores = JSON.parse(localStorage.getItem("gestores") || "[]")
    const novoGestor = {
      id: Date.now(),
      nome: formData.nome,
      email: formData.email,
      telefone: formData.telefone,
      senha: formData.senha, // Em produção, seria hasheada
      dataCadastro: new Date().toISOString()
    }

    gestores.push(novoGestor)
    localStorage.setItem("gestores", JSON.stringify(gestores))

    toast({
      title: "Cadastro realizado com sucesso!",
      description: "Você já pode fazer login com suas credenciais",
    })

    setIsLoading(false)
    onCadastroSuccess?.()
  }

  const todosOsCamposValidos = Object.values(validacoes).every(Boolean)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Car className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">FleetFlow</h1>
          <p className="text-gray-600 mt-2">Cadastro de Gestor</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToLogin}
                className="p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <CardTitle className="text-2xl font-bold">Criar Conta</CardTitle>
                <CardDescription>Preencha os dados para se cadastrar como gestor</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="nome"
                    type="text"
                    placeholder="Seu nome completo"
                    value={formData.nome}
                    onChange={(e) => handleInputChange("nome", e.target.value)}
                    className={`pl-10 ${validacoes.nome ? 'border-green-500' : formData.nome ? 'border-red-500' : ''}`}
                    required
                  />
                  {formData.nome && (
                    <div className="absolute right-3 top-3">
                      {validacoes.nome ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`pl-10 ${validacoes.email ? 'border-green-500' : formData.email ? 'border-red-500' : ''}`}
                    required
                  />
                  {formData.email && (
                    <div className="absolute right-3 top-3">
                      {validacoes.email ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="telefone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={formData.telefone}
                    onChange={(e) => handleInputChange("telefone", formatarTelefone(e.target.value))}
                    className={`pl-10 ${validacoes.telefone ? 'border-green-500' : formData.telefone ? 'border-red-500' : ''}`}
                    maxLength={15}
                    required
                  />
                  {formData.telefone && (
                    <div className="absolute right-3 top-3">
                      {validacoes.telefone ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="senha"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={formData.senha}
                    onChange={(e) => handleInputChange("senha", e.target.value)}
                    className={`pl-10 pr-10 ${validacoes.senha ? 'border-green-500' : formData.senha ? 'border-red-500' : ''}`}
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
                
                {/* Indicador de força da senha */}
                {formData.senha && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Força da senha:</span>
                      <span className={`font-medium ${forcaSenha < 40 ? 'text-red-600' : forcaSenha < 70 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {textoForcaSenha}
                      </span>
                    </div>
                    <Progress value={forcaSenha} className={`h-2 ${corForcaSenha}`} />
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>A senha deve conter:</p>
                      <ul className="space-y-1 ml-2">
                        <li className={`flex items-center space-x-1 ${formData.senha.length >= 6 ? 'text-green-600' : 'text-gray-400'}`}>
                          <span>•</span><span>Pelo menos 6 caracteres</span>
                        </li>
                        <li className={`flex items-center space-x-1 ${/[A-Z]/.test(formData.senha) ? 'text-green-600' : 'text-gray-400'}`}>
                          <span>•</span><span>Uma letra maiúscula</span>
                        </li>
                        <li className={`flex items-center space-x-1 ${/\d/.test(formData.senha) ? 'text-green-600' : 'text-gray-400'}`}>
                          <span>•</span><span>Um número</span>
                        </li>
                        <li className={`flex items-center space-x-1 ${/[@$!%*?&]/.test(formData.senha) ? 'text-green-600' : 'text-gray-400'}`}>
                          <span>•</span><span>Um caractere especial</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirmar Senha */}
              <div className="space-y-2">
                <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmarSenha"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirme sua senha"
                    value={formData.confirmarSenha}
                    onChange={(e) => handleInputChange("confirmarSenha", e.target.value)}
                    className={`pl-10 pr-10 ${validacoes.senhasIguais ? 'border-green-500' : formData.confirmarSenha ? 'border-red-500' : ''}`}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {formData.confirmarSenha && !validacoes.senhasIguais && (
                  <p className="text-xs text-red-600">As senhas não coincidem</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                disabled={isLoading || !todosOsCamposValidos}
              >
                {isLoading ? "Cadastrando..." : "Criar Conta"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Já tem uma conta?{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto font-medium text-blue-600 hover:text-blue-700"
                  onClick={onBackToLogin}
                >
                  Fazer login
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
