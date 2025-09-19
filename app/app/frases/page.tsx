
'use client';

import { useState, useEffect } from 'react';
import { Upload, ToggleLeft, ToggleRight, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockPhrases, Phrase } from '@/lib/mock-data';

export default function MisFrases() {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newPhrase, setNewPhrase] = useState({
    phrase: '',
    marca: '',
    campaña: '',
    categoria: 'producto',
    descripcion: ''
  });

  // Cargar frases al montar el componente
  useEffect(() => {
    loadPhrases();
  }, []);

  const loadPhrases = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/phrases');
      if (response.ok) {
        const data = await response.json();
        setPhrases(data.phrases || []);
      } else {
        console.error('Error loading phrases');
        // Usar datos mock como fallback
        setPhrases(mockPhrases);
      }
    } catch (error) {
      console.error('Error loading phrases:', error);
      // Usar datos mock como fallback
      setPhrases(mockPhrases);
    } finally {
      setLoading(false);
    }
  };

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

      if (response.ok) {
        // Actualizar estado local
        setPhrases(phrases.map(p => 
          p.id === id ? { ...p, active: !p.active } : p
        ));
      } else {
        alert('❌ Error al actualizar la frase');
      }
    } catch (error) {
      console.error('Error toggling phrase:', error);
      alert('❌ Error al actualizar la frase');
    }
  };

  const handleAddPhrase = async () => {
    if (!newPhrase.phrase.trim() || !newPhrase.marca.trim()) {
      alert('Por favor completa al menos la frase y la marca');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/phrases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPhrase)
      });

      if (response.ok) {
        const data = await response.json();
        // Agregar nueva frase al estado
        setPhrases(prev => [...prev, data.phrase]);
        
        // Limpiar formulario y cerrar modal
        resetForm();
        setIsDialogOpen(false);
        
        alert('✅ Frase agregada exitosamente');
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding phrase:', error);
      alert('❌ Error al agregar la frase');
    } finally {
      setLoading(false);
    }
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
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Upload className="w-4 h-4 mr-2" />
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
                  className="text-slate-400 hover:text-white"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddPhrase}
                  className="bg-blue-600 hover:bg-blue-700"
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white">Total Frases</h3>
          <p className="text-3xl font-bold text-blue-400 mt-2">{phrases.length}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white">Frases Activas</h3>
          <p className="text-3xl font-bold text-green-400 mt-2">
            {phrases.filter(p => p.active).length}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white">Frases Inactivas</h3>
          <p className="text-3xl font-bold text-red-400 mt-2">
            {phrases.filter(p => !p.active).length}
          </p>
        </div>
      </div>

      {/* Phrases list */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-6 py-4 bg-slate-700/50 border-b border-slate-600">
          <h3 className="text-lg font-semibold text-white">Frases Activas</h3>
        </div>
        
        <div className="divide-y divide-slate-600">
          {phrases.map((phrase) => (
            <div key={phrase.id} className="p-6 hover:bg-slate-700/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-6">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-white font-medium truncate">
                      "{phrase.phrase}"
                    </h4>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      phrase.active 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {phrase.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-slate-400">
                    <span>Marca: <span className="text-slate-300">{phrase.marca}</span></span>
                    <span>Campaña: <span className="text-slate-300">{phrase.campaña}</span></span>
                    <span>Subida: <span className="text-slate-300">{phrase.uploaded}</span></span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={() => togglePhrase(phrase.id)}
                    variant="ghost"
                    size="sm"
                    className={phrase.active ? 'text-green-400 hover:text-green-300' : 'text-red-400 hover:text-red-300'}
                  >
                    {phrase.active ? (
                      <ToggleRight className="w-6 h-6" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {phrases.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 mb-4">No hay frases configuradas</p>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar primera frase
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
