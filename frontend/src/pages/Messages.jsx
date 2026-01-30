import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { messagesApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { RefreshCw, MessageSquare, Save, Eye } from 'lucide-react'

export default function Messages() {
  const [messages, setMessages] = useState({})
  const [editingMessage, setEditingMessage] = useState(null)
  const [editedContent, setEditedContent] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await messagesApi.getCurrentMessages()
      setMessages(response.data.messages)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar mensajes',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [])

  const handleEdit = (messageKey, content) => {
    setEditingMessage(messageKey)
    setEditedContent(content)
    setShowPreview(false)
  }

  const handleSave = async (messageKey) => {
    toast({
      title: 'Información',
      description: 'Los mensajes se actualizarán en una próxima versión. Por ahora puedes ver y copiar los textos.',
    })
    setEditingMessage(null)
  }

  const handleCancel = () => {
    setEditingMessage(null)
    setEditedContent('')
    setShowPreview(false)
  }

  const handleCopy = (content) => {
    navigator.clipboard.writeText(content)
    toast({
      title: 'Copiado',
      description: 'Mensaje copiado al portapapeles'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mensajes de WhatsApp</h1>
          <p className="text-muted-foreground">
            Visualiza y copia los mensajes que se envían a los operadores
          </p>
        </div>
        <Button onClick={fetchMessages} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Información</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>• Los mensajes mostrados son los que actualmente envía el sistema</p>
          <p>• Puedes copiar los textos para usarlos como referencia</p>
          <p>• Las variables entre llaves {'{}'} se reemplazan automáticamente con datos reales</p>
          <p>• Ejemplo: {'{operator_name}'} se reemplaza por "Gabriel Romero"</p>
        </CardContent>
      </Card>

      {/* Messages Grid */}
      <div className="grid gap-6">
        {Object.entries(messages).map(([key, message]) => (
          <Card key={key}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    {message.name}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {message.description}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {editingMessage === key ? (
                    <>
                      <Button
                        onClick={() => setShowPreview(!showPreview)}
                        variant="outline"
                        size="sm"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {showPreview ? 'Editar' : 'Vista Previa'}
                      </Button>
                      <Button
                        onClick={() => handleSave(key)}
                        variant="default"
                        size="sm"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Guardar
                      </Button>
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        size="sm"
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => handleCopy(message.content)}
                        variant="outline"
                        size="sm"
                      >
                        Copiar
                      </Button>
                      <Button
                        onClick={() => handleEdit(key, message.content)}
                        variant="default"
                        size="sm"
                      >
                        Ver/Editar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editingMessage === key ? (
                <div className="space-y-4">
                  {showPreview ? (
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <h4 className="font-medium mb-2">Vista Previa:</h4>
                      <pre className="whitespace-pre-wrap text-sm">{message.example}</pre>
                    </div>
                  ) : (
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full h-64 p-4 border rounded-lg font-mono text-sm"
                      placeholder="Contenido del mensaje..."
                    />
                  )}
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Variables disponibles:</h4>
                    <div className="flex flex-wrap gap-2">
                      {message.variables.map((variable) => (
                        <span
                          key={variable}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-mono bg-gray-100 text-gray-800"
                        >
                          {'{' + variable + '}'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <pre className="whitespace-pre-wrap text-sm">{message.content}</pre>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm mb-2">Ejemplo de mensaje real:</h4>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <pre className="whitespace-pre-wrap text-sm">{message.example}</pre>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Variables disponibles:</h4>
                    <div className="flex flex-wrap gap-2">
                      {message.variables.map((variable) => (
                        <span
                          key={variable}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-mono bg-blue-100 text-blue-800"
                        >
                          {'{' + variable + '}'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
