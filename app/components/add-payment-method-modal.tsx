
'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  CreditCard, 
  Building2, 
  Smartphone,
  Shield,
  Zap,
  Users,
  Clock
} from 'lucide-react';

interface AddPaymentMethodModalProps {
  onPaymentMethodAdded?: () => void;
}

export default function AddPaymentMethodModal({ onPaymentMethodAdded }: AddPaymentMethodModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    bankAccount: '',
    bankName: '',
    accountType: 'checking'
  });

  const paymentTypes = [
    {
      id: 'credit_card',
      name: 'Tarjeta de Crédito/Débito',
      icon: CreditCard,
      description: 'Visa, Mastercard, American Express',
      features: ['Pago instantáneo', 'Aceptada mundialmente', 'Protección al comprador'],
      popular: true
    },
    {
      id: 'mercado_pago',
      name: 'Mercado Pago',
      icon: Smartphone,
      description: 'Billetera digital con múltiples opciones',
      features: ['Dinero en cuenta', 'Tarjetas', 'Transferencias', 'Cuotas sin interés'],
      popular: true
    },
    {
      id: 'bank_transfer',
      name: 'Transferencia Bancaria',
      icon: Building2,
      description: 'Transferencia directa desde tu banco',
      features: ['Sin comisiones extra', 'Mayor seguridad', 'Proceso verificado']
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let paymentMethodData;

      switch (selectedType) {
        case 'credit_card':
          paymentMethodData = {
            type: 'credit_card',
            name: `${formData.cardName} ****${formData.cardNumber.slice(-4)}`,
            lastDigits: formData.cardNumber.slice(-4),
            expiryDate: formData.expiryDate
          };
          break;
        case 'mercado_pago':
          // Aquí se abriría el flujo de Mercado Pago
          paymentMethodData = {
            type: 'mercado_pago',
            name: 'Mercado Pago'
          };
          break;
        case 'bank_transfer':
          paymentMethodData = {
            type: 'bank_transfer',
            name: `${formData.bankName} - ${formData.bankAccount.slice(-4)}`
          };
          break;
        default:
          return;
      }

      const response = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentMethodData)
      });

      if (response.ok) {
        setOpen(false);
        setSelectedType('');
        setFormData({
          cardNumber: '',
          expiryDate: '',
          cvv: '',
          cardName: '',
          bankAccount: '',
          bankName: '',
          accountType: 'checking'
        });
        onPaymentMethodAdded?.();
      } else {
        console.error('Error agregando método de pago');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPaymentForm = () => {
    switch (selectedType) {
      case 'credit_card':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Número de Tarjeta</Label>
              <Input
                placeholder="1234 5678 9012 3456"
                value={formData.cardNumber}
                onChange={(e) => setFormData({...formData, cardNumber: e.target.value.replace(/\s/g, '')})}
                maxLength={16}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Fecha de Vencimiento</Label>
                <Input
                  placeholder="MM/YY"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                  maxLength={5}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">CVV</Label>
                <Input
                  placeholder="123"
                  value={formData.cvv}
                  onChange={(e) => setFormData({...formData, cvv: e.target.value})}
                  maxLength={4}
                  type="password"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white">Nombre en la Tarjeta</Label>
              <Input
                placeholder="Juan Pérez"
                value={formData.cardName}
                onChange={(e) => setFormData({...formData, cardName: e.target.value.toUpperCase()})}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
        );

      case 'bank_transfer':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Banco</Label>
              <Select onValueChange={(value) => setFormData({...formData, bankName: value})}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Selecciona tu banco" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="banco-chile" className="text-white hover:bg-slate-600 focus:bg-slate-600">Banco de Chile</SelectItem>
                  <SelectItem value="banco-estado" className="text-white hover:bg-slate-600 focus:bg-slate-600">BancoEstado</SelectItem>
                  <SelectItem value="santander" className="text-white hover:bg-slate-600 focus:bg-slate-600">Santander</SelectItem>
                  <SelectItem value="bci" className="text-white hover:bg-slate-600 focus:bg-slate-600">BCI</SelectItem>
                  <SelectItem value="scotiabank" className="text-white hover:bg-slate-600 focus:bg-slate-600">Scotiabank</SelectItem>
                  <SelectItem value="itau" className="text-white hover:bg-slate-600 focus:bg-slate-600">Itaú</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white">Número de Cuenta</Label>
              <Input
                placeholder="12345678"
                value={formData.bankAccount}
                onChange={(e) => setFormData({...formData, bankAccount: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Tipo de Cuenta</Label>
              <Select onValueChange={(value) => setFormData({...formData, accountType: value})}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Tipo de cuenta" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="checking" className="text-white hover:bg-slate-600 focus:bg-slate-600">Cuenta Corriente</SelectItem>
                  <SelectItem value="savings" className="text-white hover:bg-slate-600 focus:bg-slate-600">Cuenta de Ahorros</SelectItem>
                  <SelectItem value="vista" className="text-white hover:bg-slate-600 focus:bg-slate-600">Cuenta Vista</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'mercado_pago':
        return (
          <div className="space-y-4">
            <Card className="bg-blue-900/30 border-blue-500/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Smartphone className="h-6 w-6 text-blue-400" />
                  <h3 className="text-white font-medium">Configuración de Mercado Pago</h3>
                </div>
                <p className="text-slate-300 text-sm mb-4">
                  Serás redirigido a Mercado Pago para autorizar los pagos automáticos.
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center space-x-1 text-green-400">
                    <Shield className="h-3 w-3" />
                    <span>Seguro</span>
                  </div>
                  <div className="flex items-center space-x-1 text-blue-400">
                    <Zap className="h-3 w-3" />
                    <span>Instantáneo</span>
                  </div>
                  <div className="flex items-center space-x-1 text-purple-400">
                    <Users className="h-3 w-3" />
                    <span>Confiable</span>
                  </div>
                  <div className="flex items-center space-x-1 text-orange-400">
                    <Clock className="h-3 w-3" />
                    <span>24/7</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Método
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Agregar Método de Pago</DialogTitle>
        </DialogHeader>

        {!selectedType ? (
          <div className="space-y-4">
            <p className="text-slate-400">Selecciona el método de pago que deseas agregar:</p>
            <div className="grid gap-4">
              {paymentTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Card 
                    key={type.id} 
                    className="cursor-pointer hover:bg-slate-700/50 bg-slate-700/20 border-slate-600 transition-colors"
                    onClick={() => setSelectedType(type.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <Icon className="h-6 w-6 text-blue-400" />
                          <div>
                            <h3 className="text-white font-medium flex items-center">
                              {type.name}
                              {type.popular && <Badge className="ml-2 bg-green-100 text-green-800 text-xs">Popular</Badge>}
                            </h3>
                            <p className="text-slate-400 text-sm">{type.description}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {type.features.map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-700">
              {(() => {
                const selectedPaymentType = paymentTypes.find(type => type.id === selectedType);
                if (!selectedPaymentType) return null;
                const Icon = selectedPaymentType.icon;
                return (
                  <>
                    <Icon className="h-5 w-5 text-blue-400" />
                    <h3 className="text-white font-medium">{selectedPaymentType.name}</h3>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedType('')}
                    >
                      Cambiar
                    </Button>
                  </>
                );
              })()}
            </div>

            {renderPaymentForm()}

            <div className="flex justify-end space-x-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Agregando...' : 'Agregar Método'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
