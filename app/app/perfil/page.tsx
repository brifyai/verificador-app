
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Briefcase, 
  CreditCard,
  FileText,
  Calendar,
  DollarSign,
  Check,
  AlertTriangle,
  Eye,
  Download,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';
import AddPaymentMethodModal from '@/components/add-payment-method-modal';

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  avatar?: string;
}

interface BillingInfo {
  businessName: string;
  taxId: string; // RUT
  address: string;
  city: string;
  region: string;
  zipCode: string;
  billingEmail: string;
}

interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'bank_transfer' | 'mercado_pago';
  name: string;
  lastDigits?: string;
  expiryDate?: string;
  isDefault: boolean;
  status: 'active' | 'expired' | 'pending';
}

interface PaymentHistory {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  paymentMethod: string;
  invoiceUrl?: string;
}

export default function PerfilPage() {
  const [profile, setProfile] = useState<UserProfile>({
    id: '1',
    fullName: 'Carlos Mendoza Herrera',
    email: 'carlos@ondaverificada.cl',
    phone: '+56 9 1234 5678',
    company: 'Medios Digitales Chile SpA',
    position: 'Director de Operaciones'
  });

  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    businessName: 'Medios Digitales Chile SpA',
    taxId: '76.123.456-7',
    address: 'Av. Providencia 1234, Oficina 567',
    city: 'Santiago',
    region: 'Metropolitana',
    zipCode: '7500000',
    billingEmail: 'facturacion@ondaverificada.cl'
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'credit_card',
      name: 'Visa ****4532',
      lastDigits: '4532',
      expiryDate: '12/25',
      isDefault: true,
      status: 'active'
    },
    {
      id: '2',
      type: 'mercado_pago',
      name: 'Mercado Pago',
      isDefault: false,
      status: 'active'
    },
    {
      id: '3',
      type: 'bank_transfer',
      name: 'Transferencia Bancaria',
      isDefault: false,
      status: 'active'
    }
  ]);

  const [paymentHistory] = useState<PaymentHistory[]>([
    {
      id: '1',
      date: '2025-09-01',
      description: 'Suscripción Mensual OndaVerificada Pro',
      amount: 850000,
      status: 'paid',
      paymentMethod: 'Visa ****4532',
      invoiceUrl: '#'
    },
    {
      id: '2',
      date: '2025-08-01',
      description: 'Suscripción Mensual OndaVerificada Pro',
      amount: 850000,
      status: 'paid',
      paymentMethod: 'Mercado Pago',
      invoiceUrl: '#'
    },
    {
      id: '3',
      date: '2025-07-01',
      description: 'Suscripción Mensual OndaVerificada Pro',
      amount: 850000,
      status: 'paid',
      paymentMethod: 'Transferencia Bancaria',
      invoiceUrl: '#'
    },
    {
      id: '4',
      date: '2025-06-01',
      description: 'Suscripción Mensual OndaVerificada Pro',
      amount: 850000,
      status: 'failed',
      paymentMethod: 'Visa ****4532'
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Perfil actualizado exitosamente' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Error al actualizar el perfil' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al actualizar el perfil' });
    } finally {
      setLoading(false);
    }
  };

  const handleBillingUpdate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/billing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billingInfo)
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Datos de facturación actualizados exitosamente' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Error al actualizar los datos de facturación' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al actualizar los datos de facturación' });
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const response = await fetch('/api/payment-methods');
      if (response.ok) {
        const methods = await response.json();
        setPaymentMethods(methods);
      }
    } catch (error) {
      console.error('Error cargando métodos de pago:', error);
    }
  };

  const handleDeletePaymentMethod = async (methodId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este método de pago?')) {
      try {
        const response = await fetch(`/api/payment-methods?id=${methodId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          await loadPaymentMethods();
          setMessage({ type: 'success', text: 'Método de pago eliminado exitosamente' });
        } else {
          const error = await response.json();
          setMessage({ type: 'error', text: error.error || 'Error al eliminar método de pago' });
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Error al eliminar método de pago' });
      }
    }
  };

  const addMercadoPagoPayment = () => {
    // Integración con Mercado Pago SDK
    if (typeof window !== 'undefined' && (window as any).MercadoPago) {
      const mp = new (window as any).MercadoPago('TEST-your-public-key');
      // Lógica de integración con Mercado Pago
      console.log('Iniciando configuración de Mercado Pago...');
    } else {
      console.log('SDK de Mercado Pago no disponible');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Pagado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Falló</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  useEffect(() => {
    // Cargar script de Mercado Pago
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    document.head.appendChild(script);

    // Cargar datos iniciales
    loadPaymentMethods();
  }, []);

  // Limpiar mensajes después de 5 segundos
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Mi Perfil</h1>
          <p className="text-slate-400 mt-1">Gestiona tu información personal, facturación y métodos de pago</p>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <Alert className={message.type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
          {message.type === 'success' ? <Check className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-red-600" />}
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-700/50">
          <TabsTrigger value="profile" className="text-white data-[state=active]:bg-slate-600 data-[state=active]:text-white">
            <User className="h-4 w-4 mr-2" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="billing" className="text-white data-[state=active]:bg-slate-600 data-[state=active]:text-white">
            <FileText className="h-4 w-4 mr-2" />
            Facturación
          </TabsTrigger>
          <TabsTrigger value="payments" className="text-white data-[state=active]:bg-slate-600 data-[state=active]:text-white">
            <CreditCard className="h-4 w-4 mr-2" />
            Métodos de Pago
          </TabsTrigger>
          <TabsTrigger value="history" className="text-white data-[state=active]:bg-slate-600 data-[state=active]:text-white">
            <Calendar className="h-4 w-4 mr-2" />
            Historial
          </TabsTrigger>
        </TabsList>

        {/* Perfil Personal */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <User className="h-5 w-5 text-blue-400 mr-2" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Nombre Completo</Label>
                  <Input
                    value={profile.fullName}
                    onChange={(e) => setProfile({...profile, fullName: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Email</Label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Teléfono</Label>
                  <Input
                    value={profile.phone}
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Empresa</Label>
                  <Input
                    value={profile.company}
                    onChange={(e) => setProfile({...profile, company: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-white">Cargo</Label>
                  <Input
                    value={profile.position}
                    onChange={(e) => setProfile({...profile, position: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleProfileUpdate} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                  {loading ? 'Actualizando...' : 'Actualizar Perfil'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Datos de Facturación */}
        <TabsContent value="billing" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <FileText className="h-5 w-5 text-green-400 mr-2" />
                Datos de Facturación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Razón Social</Label>
                  <Input
                    value={billingInfo.businessName}
                    onChange={(e) => setBillingInfo({...billingInfo, businessName: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">RUT</Label>
                  <Input
                    value={billingInfo.taxId}
                    onChange={(e) => setBillingInfo({...billingInfo, taxId: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-white">Dirección</Label>
                  <Input
                    value={billingInfo.address}
                    onChange={(e) => setBillingInfo({...billingInfo, address: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Ciudad</Label>
                  <Input
                    value={billingInfo.city}
                    onChange={(e) => setBillingInfo({...billingInfo, city: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Región</Label>
                  <Input
                    value={billingInfo.region}
                    onChange={(e) => setBillingInfo({...billingInfo, region: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Código Postal</Label>
                  <Input
                    value={billingInfo.zipCode}
                    onChange={(e) => setBillingInfo({...billingInfo, zipCode: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Email de Facturación</Label>
                  <Input
                    type="email"
                    value={billingInfo.billingEmail}
                    onChange={(e) => setBillingInfo({...billingInfo, billingEmail: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleBillingUpdate} disabled={loading} className="bg-green-600 hover:bg-green-700">
                  {loading ? 'Actualizando...' : 'Actualizar Facturación'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Métodos de Pago */}
        <TabsContent value="payments" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Métodos de Pago</h2>
            <AddPaymentMethodModal onPaymentMethodAdded={loadPaymentMethods} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paymentMethods.map((method) => (
              <Card key={method.id} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5 text-blue-400" />
                      <span className="text-white font-medium">{method.name}</span>
                    </div>
                    {method.isDefault && (
                      <Badge className="bg-green-100 text-green-800 text-xs">Principal</Badge>
                    )}
                  </div>
                  
                  {method.expiryDate && (
                    <p className="text-slate-400 text-sm mb-2">Vence: {method.expiryDate}</p>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <Badge variant={method.status === 'active' ? 'secondary' : 'destructive'}>
                      {method.status === 'active' ? 'Activo' : 'Inactivo'}
                    </Badge>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-400 hover:text-red-300"
                        onClick={() => handleDeletePaymentMethod(method.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Nuevos Métodos de Pago */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mercado Pago */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                    <CreditCard className="w-4 h-4 text-white" />
                  </div>
                  Mercado Pago
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-sm mb-4">
                  Paga con tarjetas de crédito, débito o dinero en cuenta de Mercado Pago
                </p>
                <ul className="text-xs text-slate-400 space-y-1 mb-4">
                  <li>• Procesamiento instantáneo</li>
                  <li>• Protección al comprador</li>
                  <li>• Múltiples medios de pago</li>
                </ul>
                <Button 
                  onClick={addMercadoPagoPayment} 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Configurar Mercado Pago
                </Button>
              </CardContent>
            </Card>

            {/* Transferencia Bancaria */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  Transferencia Bancaria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-sm mb-4">
                  Paga directamente desde tu cuenta bancaria
                </p>
                <div className="text-xs text-slate-400 space-y-1 mb-4">
                  <p><strong className="text-slate-300">Banco:</strong> Banco de Chile</p>
                  <p><strong className="text-slate-300">Cuenta:</strong> 12345678-9</p>
                  <p><strong className="text-slate-300">RUT:</strong> 76.123.456-7</p>
                  <p><strong className="text-slate-300">Email:</strong> pagos@ondaverificada.cl</p>
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Ver Instrucciones
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Historial de Pagos */}
        <TabsContent value="history" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Historial de Pagos</h2>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-slate-700">
                    <tr className="text-left">
                      <th className="px-6 py-4 text-slate-300 font-medium">Fecha</th>
                      <th className="px-6 py-4 text-slate-300 font-medium">Descripción</th>
                      <th className="px-6 py-4 text-slate-300 font-medium">Monto</th>
                      <th className="px-6 py-4 text-slate-300 font-medium">Método</th>
                      <th className="px-6 py-4 text-slate-300 font-medium">Estado</th>
                      <th className="px-6 py-4 text-slate-300 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.map((payment) => (
                      <tr key={payment.id} className="border-b border-slate-700/50 hover:bg-slate-700/25">
                        <td className="px-6 py-4 text-slate-300">
                          {new Date(payment.date).toLocaleDateString('es-CL')}
                        </td>
                        <td className="px-6 py-4 text-white">{payment.description}</td>
                        <td className="px-6 py-4 text-white font-mono">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-6 py-4 text-slate-300">{payment.paymentMethod}</td>
                        <td className="px-6 py-4">{getStatusBadge(payment.status)}</td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            {payment.invoiceUrl && (
                              <Button variant="outline" size="sm">
                                <Eye className="h-3 w-3 mr-1" />
                                Ver
                              </Button>
                            )}
                            {payment.status === 'paid' && (
                              <Button variant="outline" size="sm">
                                <Download className="h-3 w-3 mr-1" />
                                PDF
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
