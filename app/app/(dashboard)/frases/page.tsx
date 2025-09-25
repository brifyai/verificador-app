
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Search, Filter, Download, Trash2, Edit } from 'lucide-react';

interface Phrase {
  id: string;
  phrase: string;
  marca: string;
  campaña: string;
  categoria: string;
  descripcion: string;
  uploaded: string;
  active: boolean;
  detections?: number;
  priority?: number;
  confidence?: number;
}

interface PhraseStats {
  total: number;
  active: number;
  inactive: number;
}

interface PhraseResponse {
  success: boolean;
  phrases: Phrase[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: PhraseStats;
}

export default function Frases() {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [stats, setStats] = useState<PhraseStats>({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para filtros y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Estados para el diálogo de agregar frase
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPhrase, setNewPhrase] = useState({
    phrase: '',
    marca: '',
    campaña: '',
    categoria: 'producto',
    descripcion: ''
  });

  // Estados para el diálogo de editar frase
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPhrase, setEditingPhrase] = useState<Phrase | null>(null);
  const [editPhrase, setEditPhrase] = useState({
    phrase: '',
    marca: '',
    campaña: '',
    categoria: 'producto',
    descripcion: ''
  });

  // Función para cargar frases
  const loadPhrases = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: limit.toString(),
      ...(searchTerm && { search: searchTerm }),
      ...(categoryFilter !== 'all' && { category: categoryFilter }),
      ...(statusFilter !== 'all' && { status: statusFilter }),
    });

      const response = await fetch(`/api/phrases?${params}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar las frases');
      }

      const data: PhraseResponse = await response.json();
      
      if (data.success) {
        setPhrases(data.phrases);
        setStats(data.stats);
        setTotalPages(data.totalPages);
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
    } catch (error) {
      console.error('Error loading phrases:', error);
      setError('Error al cargar las frases');
      toast.error('Error al cargar las frases');
    } finally {
      setLoading(false);
    }
  };

  // Cargar frases al montar el componente y cuando cambien los filtros
  useEffect(() => {
    loadPhrases();
  }, [currentPage, searchTerm, categoryFilter, statusFilter]);

  // Función para agregar nueva frase
  const handleAddPhrase = async () => {
    if (!newPhrase.phrase.trim() || !newPhrase.marca.trim()) {
      toast.error('Frase y marca son requeridos');
      return;
    }

    try {
      const response = await fetch('/api/phrases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPhrase),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Frase agregada exitosamente');
        setIsDialogOpen(false);
        setNewPhrase({
          phrase: '',
          marca: '',
          campaña: '',
          categoria: 'producto',
          descripcion: ''
        });
        loadPhrases(); // Recargar la lista
      } else {
        toast.error(data.error || 'Error al agregar la frase');
      }
    } catch (error) {
      console.error('Error adding phrase:', error);
      toast.error('Error al agregar la frase');
    }
  };

  // Función para alternar estado activo/inactivo de una frase
  const togglePhrase = async (id: string) => {
    const phrase = phrases.find(p => p.id === id);
    if (!phrase) return;

    try {
      const response = await fetch('/api/phrases', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          active: !phrase.active
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Frase ${!phrase.active ? 'activada' : 'desactivada'} exitosamente`);
        loadPhrases(); // Recargar la lista para actualizar estadísticas
      } else {
        toast.error(data.error || 'Error al actualizar la frase');
      }
    } catch (error) {
      console.error('Error toggling phrase:', error);
      toast.error('Error al actualizar la frase');
    }
  };

  // Función para abrir el diálogo de edición
  const openEditDialog = (phrase: Phrase) => {
    setEditingPhrase(phrase);
    setEditPhrase({
      phrase: phrase.phrase,
      marca: phrase.marca,
      campaña: phrase.campaña,
      categoria: phrase.categoria,
      descripcion: phrase.descripcion || ''
    });
    setIsEditDialogOpen(true);
  };

  // Función para editar una frase
  const handleEditPhrase = async () => {
    if (!editingPhrase || !editPhrase.phrase.trim() || !editPhrase.marca.trim()) {
      toast.error('Frase y marca son requeridos');
      return;
    }

    try {
      const response = await fetch('/api/phrases', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingPhrase.id,
          ...editPhrase
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Frase actualizada exitosamente');
        setIsEditDialogOpen(false);
        setEditingPhrase(null);
        setEditPhrase({
          phrase: '',
          marca: '',
          campaña: '',
          categoria: 'producto',
          descripcion: ''
        });
        loadPhrases(); // Recargar la lista
      } else {
        toast.error(data.error || 'Error al actualizar la frase');
      }
    } catch (error) {
      console.error('Error editing phrase:', error);
      toast.error('Error al actualizar la frase');
    }
  };

  // Función para eliminar una frase
  const deletePhrase = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta frase?')) {
      return;
    }

    try {
      const response = await fetch(`/api/phrases?id=${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Frase eliminada exitosamente');
        loadPhrases(); // Recargar la lista
      } else {
        toast.error(data.error || 'Error al eliminar la frase');
      }
    } catch (error) {
      console.error('Error deleting phrase:', error);
      toast.error('Error al eliminar la frase');
    }
  };

  // Función para exportar frases a CSV
  const exportToCSV = () => {
    const headers = ['Frase', 'Marca', 'Campaña', 'Categoría', 'Descripción', 'Estado', 'Fecha de Subida', 'Detecciones'];
    const csvContent = [
      headers.join(','),
      ...phrases.map(phrase => [
        `"${phrase.phrase}"`,
        `"${phrase.marca}"`,
        `"${phrase.campaña}"`,
        `"${phrase.categoria}"`,
        `"${phrase.descripcion}"`,
        phrase.active ? 'Activa' : 'Inactiva',
        phrase.uploaded,
        phrase.detections || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `frases_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Función para manejar búsqueda con debounce
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Resetear a la primera página
  };

  // Función para cambiar página
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const resetForm = () => {
    setNewPhrase({ phrase: '', marca: '', campaña: '', categoria: 'producto', descripcion: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Mis Frases</h1>
          <p className="text-slate-400 mt-1">
            Gestión de frases publicitarias para monitoreo
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-blue-500/25 transition-all duration-200">
              <Plus className="w-4 h-4 mr-2" />
              Subir nueva frase
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Agregar Nueva Frase Publicitaria</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="phrase" className="text-slate-300">Frase Publicitaria *</Label>
                <Textarea
                  id="phrase"
                  placeholder="Ej: Descuentos especiales en Falabella..."
                  value={newPhrase.phrase}
                  onChange={(e) => setNewPhrase(prev => ({ ...prev, phrase: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white resize-none"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="marca" className="text-slate-300">Marca *</Label>
                  <Input
                    id="marca"
                    placeholder="Ej: Falabella"
                    value={newPhrase.marca}
                    onChange={(e) => setNewPhrase(prev => ({ ...prev, marca: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="campaña" className="text-slate-300">Campaña</Label>
                  <Input
                    id="campaña"
                    placeholder="Ej: Cyber Monday"
                    value={newPhrase.campaña}
                    onChange={(e) => setNewPhrase(prev => ({ ...prev, campaña: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoria" className="text-slate-300">Categoría</Label>
                <Select
                  value={newPhrase.categoria}
                  onValueChange={(value) => setNewPhrase(prev => ({ ...prev, categoria: value }))}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="producto" className="text-white hover:bg-slate-600 focus:bg-slate-600">Producto</SelectItem>
                    <SelectItem value="servicio" className="text-white hover:bg-slate-600 focus:bg-slate-600">Servicio</SelectItem>
                    <SelectItem value="promocion" className="text-white hover:bg-slate-600 focus:bg-slate-600">Promoción</SelectItem>
                    <SelectItem value="evento" className="text-white hover:bg-slate-600 focus:bg-slate-600">Evento</SelectItem>
                    <SelectItem value="marca" className="text-white hover:bg-slate-600 focus:bg-slate-600">Marca</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion" className="text-slate-300">Descripción (Opcional)</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Descripción adicional de la frase o contexto..."
                  value={newPhrase.descripcion}
                  onChange={(e) => setNewPhrase(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white resize-none"
                  rows={2}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    resetForm();
                    setIsDialogOpen(false);
                  }}
                  className="text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddPhrase}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-emerald-500/25 transition-all duration-200"
                  disabled={loading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {loading ? 'Agregando...' : 'Agregar Frase'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total de Frases</CardTitle>
            <div className="p-2 bg-slate-700/50 rounded-lg">
              <Plus className="h-4 w-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <p className="text-xs text-slate-400">
              Frases registradas en el sistema
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Frases Activas</CardTitle>
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Search className="h-4 w-4 text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{stats.active}</div>
            <p className="text-xs text-slate-400">
              Frases en monitoreo activo
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Frases Inactivas</CardTitle>
            <div className="p-2 bg-red-500/20 rounded-lg">
              <Filter className="h-4 w-4 text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{stats.inactive}</div>
            <p className="text-xs text-slate-400">
              Frases pausadas o desactivadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-white">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search" className="text-slate-300">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="search"
                  placeholder="Buscar frases, marcas..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
            </div>
            <div className="space-y-2">
               <Label htmlFor="category" className="text-slate-300">Categoría</Label>
               <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                 <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                   <SelectValue placeholder="Todas las categorías" />
                 </SelectTrigger>
                 <SelectContent className="bg-slate-700 border-slate-600">
                   <SelectItem value="all" className="text-white hover:bg-slate-600 focus:bg-slate-600">Todas las categorías</SelectItem>
                   <SelectItem value="PRODUCT" className="text-white hover:bg-slate-600 focus:bg-slate-600">Producto</SelectItem>
                   <SelectItem value="SERVICE" className="text-white hover:bg-slate-600 focus:bg-slate-600">Servicio</SelectItem>
                   <SelectItem value="PROMOTION" className="text-white hover:bg-slate-600 focus:bg-slate-600">Promoción</SelectItem>
                   <SelectItem value="EVENT" className="text-white hover:bg-slate-600 focus:bg-slate-600">Evento</SelectItem>
                   <SelectItem value="BRAND" className="text-white hover:bg-slate-600 focus:bg-slate-600">Marca</SelectItem>
                   <SelectItem value="INSTITUTIONAL" className="text-white hover:bg-slate-600 focus:bg-slate-600">Institucional</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             <div className="space-y-2">
               <Label htmlFor="status" className="text-slate-300">Estado</Label>
               <Select value={statusFilter} onValueChange={setStatusFilter}>
                 <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                   <SelectValue placeholder="Todos los estados" />
                 </SelectTrigger>
                 <SelectContent className="bg-slate-700 border-slate-600">
                   <SelectItem value="all" className="text-white hover:bg-slate-600 focus:bg-slate-600">Todos los estados</SelectItem>
                   <SelectItem value="active" className="text-white hover:bg-slate-600 focus:bg-slate-600">Activas</SelectItem>
                   <SelectItem value="inactive" className="text-white hover:bg-slate-600 focus:bg-slate-600">Inactivas</SelectItem>
                 </SelectContent>
               </Select>
             </div>
            <div className="flex items-end">
              <Button
                 variant="outline"
                 onClick={() => {
                   setSearchTerm('');
                   setCategoryFilter('all');
                   setStatusFilter('all');
                   setCurrentPage(1);
                 }}
                 className="w-full border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white hover:border-slate-500 transition-all duration-200"
               >
                <Filter className="h-4 w-4 mr-2" />
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de frases */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-white">Lista de Frases</CardTitle>
          <CardDescription className="text-slate-400">
            {phrases.length > 0 ? `Mostrando ${phrases.length} de ${stats.total} frases` : 'No hay frases configuradas'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-center py-8">
              <p className="text-red-400">{error}</p>
              <Button onClick={loadPhrases} className="mt-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                Reintentar
              </Button>
            </div>
          )}
          
          {!error && phrases.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-slate-400 mb-4">
                <Plus className="h-12 w-12 mx-auto mb-4" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                No hay frases configuradas
              </h3>
              <p className="text-slate-400 mb-6">
                Comienza agregando tu primera frase publicitaria para monitoreo
              </p>
              <Button onClick={() => setIsDialogOpen(true)} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-blue-500/25 transition-all duration-200">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Primera Frase
              </Button>
            </div>
          )}

          {phrases.length > 0 && (
            <div className="space-y-4">
              {phrases.map((phrase) => (
                <div
                  key={phrase.id}
                  className="border border-slate-600 rounded-lg p-4 hover:bg-slate-700/30 transition-colors bg-slate-800/30"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant={phrase.active ? "default" : "secondary"}
                          className={phrase.active 
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30" 
                            : "bg-slate-500/20 text-slate-400 border-slate-500/30 hover:bg-slate-500/30"
                          }
                        >
                          {phrase.active ? 'Activa' : 'Inactiva'}
                        </Badge>
                        <Badge 
                          variant="outline"
                          className={`border-blue-500/30 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20`}
                        >
                          {phrase.categoria}
                        </Badge>
                        {phrase.detections !== undefined && (
                          <Badge 
                            variant="outline"
                            className="border-purple-500/30 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20"
                          >
                            {phrase.detections} detecciones
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-medium text-white mb-1">
                        {phrase.phrase}
                      </h3>
                      <div className="text-sm text-slate-300 space-y-1">
                        <p><span className="font-medium text-slate-200">Marca:</span> {phrase.marca}</p>
                        <p><span className="font-medium text-slate-200">Campaña:</span> {phrase.campaña}</p>
                        {phrase.descripcion && (
                          <p><span className="font-medium text-slate-200">Descripción:</span> {phrase.descripcion}</p>
                        )}
                        <p><span className="font-medium text-slate-200">Fecha de subida:</span> {phrase.uploaded}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Switch
                        checked={phrase.active}
                        onCheckedChange={() => togglePhrase(phrase.id)}
                      />
                      <Button
                        onClick={() => openEditDialog(phrase)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/30 transition-all duration-200"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => deletePhrase(phrase.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginación */}
      {totalPages > 1 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-400">
                Página {currentPage} de {totalPages} ({stats.total} frases en total)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-500 transition-all duration-200"
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-500 transition-all duration-200"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diálogo de Editar Frase */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Frase Publicitaria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-phrase" className="text-slate-300">Frase Publicitaria *</Label>
              <Textarea
                id="edit-phrase"
                placeholder="Ej: Descuentos especiales en Falabella..."
                value={editPhrase.phrase}
                onChange={(e) => setEditPhrase(prev => ({ ...prev, phrase: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white resize-none"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-marca" className="text-slate-300">Marca *</Label>
                <Input
                  id="edit-marca"
                  placeholder="Ej: Falabella"
                  value={editPhrase.marca}
                  onChange={(e) => setEditPhrase(prev => ({ ...prev, marca: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-campaña" className="text-slate-300">Campaña</Label>
                <Input
                  id="edit-campaña"
                  placeholder="Ej: Cyber Monday"
                  value={editPhrase.campaña}
                  onChange={(e) => setEditPhrase(prev => ({ ...prev, campaña: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-categoria" className="text-slate-300">Categoría</Label>
              <Select
                value={editPhrase.categoria}
                onValueChange={(value) => setEditPhrase(prev => ({ ...prev, categoria: value }))}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="producto" className="text-white hover:bg-slate-600 focus:bg-slate-600">Producto</SelectItem>
                  <SelectItem value="servicio" className="text-white hover:bg-slate-600 focus:bg-slate-600">Servicio</SelectItem>
                  <SelectItem value="promocion" className="text-white hover:bg-slate-600 focus:bg-slate-600">Promoción</SelectItem>
                  <SelectItem value="evento" className="text-white hover:bg-slate-600 focus:bg-slate-600">Evento</SelectItem>
                  <SelectItem value="marca" className="text-white hover:bg-slate-600 focus:bg-slate-600">Marca</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-descripcion" className="text-slate-300">Descripción (Opcional)</Label>
              <Textarea
                id="edit-descripcion"
                placeholder="Descripción adicional de la frase o contexto..."
                value={editPhrase.descripcion}
                onChange={(e) => setEditPhrase(prev => ({ ...prev, descripcion: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white resize-none"
                rows={2}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingPhrase(null);
                  setEditPhrase({
                    phrase: '',
                    marca: '',
                    campaña: '',
                    categoria: 'producto',
                    descripcion: ''
                  });
                }}
                className="text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEditPhrase}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-blue-500/25 transition-all duration-200"
                disabled={loading}
              >
                <Edit className="w-4 h-4 mr-2" />
                {loading ? 'Actualizando...' : 'Actualizar Frase'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
