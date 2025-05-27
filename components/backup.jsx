"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import ConfirmDialog from "./confirm-dialog"

export default function Backup() {
  const [backups, setBackups] = useState([])
  const [dadosRestauracao, setDadosRestauracao] = useState({
    carros: true,
    motoristas: true,
    gestores: true,
    eventos: true,
  })
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", message: "", onConfirm: null })

  useEffect(() => {
    const storedBackups = localStorage.getItem("backups")
    if (storedBackups) {
      setBackups(JSON.parse(storedBackups))
    }
  }, [])

  const criarBackup = (tipo = "manual") => {
    const carros = JSON.parse(localStorage.getItem("carros") || "[]")
    const motoristas = JSON.parse(localStorage.getItem("motoristas") || "[]")
    const gestores = JSON.parse(localStorage.getItem("gestores") || "[]")
    const eventos = JSON.parse(localStorage.getItem("eventos") || "[]")

    const backupData = {
      id: Date.now(),
      timestamp: Date.now(),
      tipo: tipo,
      data: {
        carros: carros,
        motoristas: motoristas,
        gestores: gestores,
        eventos: eventos,
      },
    }

    const novosBackups = [...backups, backupData]
    setBackups(novosBackups)
    localStorage.setItem("backups", JSON.stringify(novosBackups))

    toast({
      title: "Sucesso",
      description: "Backup criado com sucesso!",
    })
  }

  const handleDeleteBackup = (backupId, backupData) => {
    setConfirmDialog({
      open: true,
      title: "Confirmar Exclusão",
      message: `Tem certeza que deseja excluir o backup de ${new Date(backupData.timestamp).toLocaleString("pt-BR")}? Esta ação não pode ser desfeita.`,
      onConfirm: () => {
        const novosBackups = backups.filter((b) => b.id !== backupId)
        setBackups(novosBackups)
        localStorage.setItem("backups", JSON.stringify(novosBackups))
        toast({
          title: "Sucesso",
          description: "Backup excluído com sucesso",
        })
        setConfirmDialog({ open: false, title: "", message: "", onConfirm: null })
      },
    })
  }

  const handleRestore = (backupData) => {
    setConfirmDialog({
      open: true,
      title: "Confirmar Restauração",
      message: `Tem certeza que deseja restaurar o backup de ${new Date(backupData.timestamp).toLocaleString("pt-BR")}? Os dados atuais serão substituídos. Um backup de segurança será criado automaticamente.`,
      onConfirm: () => {
        // Criar backup de segurança antes da restauração
        criarBackup("pre-restauracao")

        // Restaurar dados selecionados
        const dadosParaRestaurar = backupData.data

        if (dadosRestauracao.carros) {
          localStorage.setItem("carros", JSON.stringify(dadosParaRestaurar.carros || []))
        }
        if (dadosRestauracao.motoristas) {
          localStorage.setItem("motoristas", JSON.stringify(dadosParaRestaurar.motoristas || []))
        }
        if (dadosRestauracao.gestores) {
          localStorage.setItem("gestores", JSON.stringify(dadosParaRestaurar.gestores || []))
        }
        if (dadosRestauracao.eventos) {
          localStorage.setItem("eventos", JSON.stringify(dadosParaRestaurar.eventos || []))
        }

        toast({
          title: "Sucesso",
          description: "Dados restaurados com sucesso! Recarregue a página para ver as alterações.",
        })

        setConfirmDialog({ open: false, title: "", message: "", onConfirm: null })
      },
    })
  }

  return (
    <div>
      <Button onClick={() => criarBackup("manual")}>Criar Backup</Button>
      <Table>
        <TableCaption>Lista de backups salvos.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {backups.map((backup) => (
            <TableRow key={backup.id}>
              <TableCell>{new Date(backup.timestamp).toLocaleString("pt-BR")}</TableCell>
              <TableCell>{backup.tipo}</TableCell>
              <TableCell className="text-right">
                <Button variant="secondary" size="sm" onClick={() => handleRestore(backup)} className="mr-2">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restaurar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteBackup(backup.id, backup)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
