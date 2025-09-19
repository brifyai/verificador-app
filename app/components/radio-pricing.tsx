
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, 
  Edit, 
  History, 
  Calendar,
  ChevronDown,
  ChevronUp,
  Save,
  AlertTriangle
} from 'lucide-react';
import { Radio, PriceHistory } from '@/lib/mock-data';

interface RadioPricingProps {
  radio: Radio;
  onUpdatePrice?: (radioId: string, newPrice: number, reason?: string, effectiveDate?: string, applyRetroactively?: boolean) => void;
}

interface PriceChangeForm {
  newPrice: number;
  effectiveDate: string;
  reason: string;
  applyRetroactively: boolean;
  retroactiveFromDate?: string;
}

export default function RadioPricing({ radio, onUpdatePrice }: RadioPricingProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [priceForm, setPriceForm] = useState<PriceChangeForm>({
    newPrice: radio.pricePerDetection || 0,
    effectiveDate: new Date().toISOString().split('T')[0],
    reason: '',
    applyRetroactively: false,
    retroactiveFromDate: ''
  });

  const handleSavePrice = async () => {
    if (!priceForm.newPrice || priceForm.newPrice <= 0) {
      alert('El precio debe ser mayor a 0');
      return;
    }

    if (!priceForm.reason.trim()) {
      alert('Debe proporcionar una razón para el cambio de precio');
      return;
    }

    try {
      const response = await fetch('/api/pricing/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          radioId: radio.id,
          newPrice: priceForm.newPrice,
          effectiveDate: priceForm.effectiveDate,
          reason: priceForm.reason,
          applyRetroactively: priceForm.applyRetroactively,
          retroactiveFromDate: priceForm.retroactiveFromDate,
          pricingRuleId: radio.pricingRuleId
        })
      });

      const result = await response.json();

      if (result.success) {
        setIsEditDialogOpen(false);
        alert(`✅ ${result.message}${result.affectedDetections ? ` (${result.affectedDetections} detecciones afectadas)` : ''}`);
        
        // Llamar callback si existe
        onUpdatePrice?.(
          radio.id,
          priceForm.newPrice,
          priceForm.reason,
          priceForm.effectiveDate,
          priceForm.applyRetroactively
        );
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error actualizando precio:', error);
      alert('❌ Error de conexión al actualizar el precio');
    }
  };

  const currentPrice = radio.pricePerDetection || 0;
  const hasPrice = currentPrice > 0;
  const priceHistory = radio.priceHistory || [];

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader 
        className="pb-2 cursor-pointer hover:bg-gray-750 transition-colors rounded-t-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <DollarSign className="h-4 w-4" style={{ color: hasPrice ? '#22c55e' : '#6b7280' }} />
            <div>
              <CardTitle className="text-sm font-medium text-white flex items-center space-x-2">
                <span>Valorización</span>
                {hasPrice ? (
                  <Badge 
                    style={{
                      backgroundColor: '#22c55e',
                      color: 'white',
                      border: '1px solid #22c55e'
                    }}
                    className="text-xs font-medium"
                  >
                    ${currentPrice.toLocaleString()} CLP
                  </Badge>
                ) : (
                  <Badge 
                    style={{
                      backgroundColor: 'transparent',
                      color: '#9ca3af',
                      border: '1px solid #6b7280'
                    }}
                    className="text-xs font-medium"
                  >
                    Sin precio
                  </Badge>
                )}
              </CardTitle>
              <div className="text-xs" style={{ color: '#9ca3af' }}>
                Precio por detección publicitaria
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 hover:bg-gray-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-800 max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-white">Actualizar Precio - {radio.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPrice">Nuevo precio por detección (CLP)*</Label>
                    <Input
                      id="newPrice"
                      type="number"
                      value={priceForm.newPrice}
                      onChange={(e) => setPriceForm({...priceForm, newPrice: parseFloat(e.target.value) || 0})}
                      placeholder="1500"
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="effectiveDate">Fecha efectiva*</Label>
                    <Input
                      id="effectiveDate"
                      type="date"
                      value={priceForm.effectiveDate}
                      onChange={(e) => setPriceForm({...priceForm, effectiveDate: e.target.value})}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Razón del cambio*</Label>
                    <Textarea
                      id="reason"
                      value={priceForm.reason}
                      onChange={(e) => setPriceForm({...priceForm, reason: e.target.value})}
                      placeholder="Ej: Actualización según nueva categoría de audiencia"
                      className="bg-gray-800 border-gray-700 text-white"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-4 border-t border-gray-700 pt-4">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="retroactive"
                        checked={priceForm.applyRetroactively}
                        onChange={(e) => setPriceForm({...priceForm, applyRetroactively: e.target.checked})}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label htmlFor="retroactive" className="text-sm font-medium text-white">
                          Aplicar retroactivamente
                        </Label>
                        <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
                          Aplicar el nuevo precio a detecciones anteriores desde una fecha específica
                        </p>
                      </div>
                    </div>

                    {priceForm.applyRetroactively && (
                      <div className="ml-6 space-y-2">
                        <Label htmlFor="retroactiveFrom">Aplicar desde fecha</Label>
                        <Input
                          id="retroactiveFrom"
                          type="date"
                          value={priceForm.retroactiveFromDate || ''}
                          onChange={(e) => setPriceForm({...priceForm, retroactiveFromDate: e.target.value})}
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                        <div className="flex items-center space-x-2 text-xs text-yellow-400">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Esto recalculará las valoraciones existentes</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSavePrice}>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Precio
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 hover:bg-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-2 animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-4">
            {/* Información actual */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs" style={{ color: '#9ca3af' }}>Precio actual</div>
                <div className="text-white font-medium">
                  {hasPrice ? `$${currentPrice.toLocaleString()} CLP` : 'No configurado'}
                </div>
              </div>
              <div>
                <div className="text-xs" style={{ color: '#9ca3af' }}>Regla asignada</div>
                <div className="text-white font-medium">
                  {radio.pricingRuleId ? `Regla ${radio.pricingRuleId}` : 'Manual'}
                </div>
              </div>
            </div>

            {/* Historial de precios */}
            {priceHistory.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-xs" style={{ color: '#9ca3af' }}>
                  <History className="h-3 w-3" />
                  <span>Historial de cambios</span>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {priceHistory.slice(0, 3).map((change, index) => (
                    <div key={change.id} className="bg-gray-900/50 rounded p-2 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white">
                          ${change.pricePerDetection.toLocaleString()} CLP
                        </span>
                        <div className="flex items-center space-x-1" style={{ color: '#9ca3af' }}>
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(change.effectiveDate).toLocaleDateString('es-CL')}</span>
                        </div>
                      </div>
                      <div style={{ color: '#9ca3af' }}>
                        {change.reason}
                      </div>
                      {change.appliedRetroactively && (
                        <div className="text-yellow-400 text-[10px] mt-1">
                          ⟲ Aplicado retroactivamente
                        </div>
                      )}
                    </div>
                  ))}
                  {priceHistory.length > 3 && (
                    <div className="text-center text-xs" style={{ color: '#9ca3af' }}>
                      +{priceHistory.length - 3} cambios más
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Proyección de ingresos */}
            {hasPrice && (
              <div className="bg-blue-900/20 border border-blue-700/30 rounded p-3">
                <div className="text-xs text-blue-300 mb-1">Proyección mensual</div>
                <div className="text-sm text-white">
                  Estimado: ${(currentPrice * 30).toLocaleString()} - ${(currentPrice * 100).toLocaleString()} CLP
                </div>
                <div className="text-xs" style={{ color: '#9ca3af' }}>
                  Basado en 30-100 detecciones promedio/mes
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
