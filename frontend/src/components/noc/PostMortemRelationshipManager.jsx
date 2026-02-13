import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { GitBranch, Link2, Unlink, Plus, Search, AlertCircle, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import PostMortemCard from './PostMortemCard'

export default function PostMortemRelationshipManager({
  postMortem,
  allPostMortems,
  onLink,
  onUnlink,
  onClose,
  getRelated
}) {
  const [related, setRelated] = useState({ parent: null, children: [], is_primary: false, is_secondary: false })
  const [searchTerm, setSearchTerm] = useState('')
  const [linkDescription, setLinkDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Obtener usuario actual de sessionStorage
  const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}')
  const linkedBy = currentUser?.username || 'admin'

  useEffect(() => {
    loadRelated()
  }, [postMortem.id])

  const loadRelated = async () => {
    try {
      setLoading(true)
      const data = await getRelated(postMortem.id)
      setRelated(data)
    } catch (err) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar las relaciones',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLink = async (parentId, childId) => {
    try {
      await onLink(parentId, childId, {
        description: linkDescription,
        linked_by: linkedBy
      })
      toast({
        title: '✅ Vinculado',
        description: 'Post-mortem vinculado exitosamente'
      })
      setLinkDescription('')
      await loadRelated()
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message || 'No se pudo vincular',
        variant: 'destructive'
      })
    }
  }

  const handleUnlink = async (parentId, childId) => {
    if (!confirm('¿Seguro que deseas desvincular este post-mortem?')) return

    try {
      await onUnlink(parentId, childId)
      toast({
        title: '✅ Desvinculado',
        description: 'Post-mortem desvinculado exitosamente'
      })
      await loadRelated()
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message || 'No se pudo desvincular',
        variant: 'destructive'
      })
    }
  }

  // Filtrar PMs disponibles
  const availablePostMortems = allPostMortems.filter(pm => {
    if (pm.id === postMortem.id) return false
    if (related.parent && pm.id === related.parent.id) return false
    if (related.children.find(c => c.id === pm.id)) return false
    if (!pm.title.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  if (loading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cargando...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestionar Incidentes Relacionados</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Post-Mortem Actual */}
          <div className="p-3 rounded-lg border-2 border-blue-500 bg-blue-50">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-blue-900" />
              <span className="font-medium text-blue-900">Post-Mortem Actual</span>
            </div>
            <PostMortemCard postMortem={postMortem} compact />
          </div>

          {/* Advertencia si es secundario */}
          {related.is_secondary && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 border border-orange-200">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="text-sm text-orange-900">
                <p className="font-medium">Este es un incidente secundario</p>
                <p>Ya está vinculado a un incidente principal. Un PM solo puede tener un padre.</p>
              </div>
            </div>
          )}

          {/* Padre (si es secundario) */}
          {related.parent && (
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Incidente Principal
              </h3>
              <div className="relative">
                <PostMortemCard postMortem={related.parent} compact />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={() => handleUnlink(related.parent.id, postMortem.id)}
                >
                  <Unlink className="h-4 w-4 mr-1" />
                  Desvincular
                </Button>
              </div>
            </div>
          )}

          {/* Hijos (si es primario) */}
          {related.children.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Incidentes Secundarios ({related.children.length})
              </h3>
              {related.children.map(child => (
                <div key={child.id} className="relative">
                  <PostMortemCard postMortem={child} compact />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => handleUnlink(postMortem.id, child.id)}
                  >
                    <Unlink className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Vincular nuevos (solo si NO es secundario) */}
          {!related.is_secondary && (
            <div className="space-y-3 pt-4 border-t">
              <h3 className="font-semibold flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Vincular Incidentes Secundarios
              </h3>

              <div>
                <Label>Razón del vínculo (opcional)</Label>
                <Textarea
                  placeholder="Ej: Todos causados por corte de fibra en Avenida Principal..."
                  value={linkDescription}
                  onChange={(e) => setLinkDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar post-mortem..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availablePostMortems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay post-mortems disponibles para vincular
                  </p>
                ) : (
                  availablePostMortems.map(pm => (
                    <div key={pm.id} className="relative group">
                      <PostMortemCard postMortem={pm} compact />
                      <Button
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleLink(postMortem.id, pm.id)}
                      >
                        <Link2 className="h-4 w-4 mr-1" />
                        Vincular
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
