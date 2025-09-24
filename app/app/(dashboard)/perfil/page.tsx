
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
  avatar?: string;
}

interface BillingInfo {
  id?: string;
  companyName: string;
  legalName: string;
  taxId: string; // RUT
  address: string;
  city: string;
  region: string;
  postalCode: string;
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

interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  tax: number;
  total: number;
  lineItems: InvoiceLineItem[];
}

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Subscription {
  id: string;
  planId: string;
  status: 'active' | 'cancelled' | 'past_due';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  canceledAt?: string;
}

export default function PerfilPage() {
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    fullName: '',
    email: ''
  });

  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    companyName: '',
    legalName: '',
    taxId: '',
    address: '',
    city: '',
    region: '',
    postalCode: '',
    billingEmail: ''
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Cargar datos del perfil al montar el componente
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const profileData = await response.json();
          setProfile(profileData);
        } else {
          console.error('Error cargando perfil:', response.statusText);
        }
      } catch (error) {
        console.error('Error cargando perfil:', error);
      }
    };

    loadProfile();
  }, []);

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      
      if (response.ok) {
        const result = await response.json();
        setProfile(result.profile);
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
      const method = billingInfo.id ? 'PUT' : 'POST';
      const response = await fetch('/api/billing/profiles', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billingInfo)
      });
      
      if (response.ok) {
        const updatedProfile = await response.json();
        setBillingInfo(updatedProfile);
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

  const loadBillingProfile = async () => {
    try {
      const response = await fetch('/api/billing/profiles');
      if (response.ok) {
        const profiles = await response.json();
        if (profiles.length > 0) {
          setBillingInfo(profiles[0]);
        }
      }
    } catch (error) {
      console.error('Error cargando perfil de facturación:', error);
    }
  };

  const loadInvoices = async () => {
    try {
      const response = await fetch('/api/billing/invoices');
      if (response.ok) {
        const invoicesData = await response.json();
        setInvoices(invoicesData.invoices || []);
      }
    } catch (error) {
      console.error('Error cargando facturas:', error);
    }
  };

  const loadSubscription = async () => {
    try {
      const response = await fetch('/api/billing/subscriptions');
      if (response.ok) {
        const subscriptions = await response.json();
        if (subscriptions.length > 0) {
          setSubscription(subscriptions[0]);
        }
      }
    } catch (error) {
      console.error('Error cargando suscripción:', error);
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
    loadBillingProfile();
    loadInvoices();
    loadSubscription();
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
                  <Label className="text-white">Nombre de la Empresa</Label>
                  <Input
                    value={billingInfo.companyName}
                    onChange={(e) => setBillingInfo({...billingInfo, companyName: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Razón Social</Label>
                  <Input
                    value={billingInfo.legalName}
                    onChange={(e) => setBillingInfo({...billingInfo, legalName: e.target.value})}
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
                <div className="space-y-2">
                  <Label className="text-white">Email de Facturación</Label>
                  <Input
                    type="email"
                    value={billingInfo.billingEmail}
                    onChange={(e) => setBillingInfo({...billingInfo, billingEmail: e.target.value})}
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
                    value={billingInfo.postalCode}
                    onChange={(e) => setBillingInfo({...billingInfo, postalCode: e.target.value})}
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

        {/* Historial */}
        <TabsContent value="history" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Historial de Facturas</h2>
          </div>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="text-left p-4 text-white font-medium">Número</th>
                      <th className="text-left p-4 text-white font-medium">Fecha</th>
                      <th className="text-left p-4 text-white font-medium">Vencimiento</th>
                      <th className="text-left p-4 text-white font-medium">Total</th>
                      <th className="text-left p-4 text-white font-medium">Estado</th>
                      <th className="text-left p-4 text-white font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-slate-700">
                        <td className="p-4 text-white font-mono">{invoice.invoiceNumber}</td>
                        <td className="p-4 text-slate-300">
                          {new Date(invoice.issueDate).toLocaleDateString('es-CL')}
                        </td>
                        <td className="p-4 text-slate-300">
                          {new Date(invoice.dueDate).toLocaleDateString('es-CL')}
                        </td>
                        <td className="p-4 text-white font-medium">
                          {formatCurrency(invoice.total)}
                        </td>
                        <td className="p-4">
                          {getStatusBadge(invoice.status)}
                        </td>
                        <td className="p-4">
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" className="text-blue-400 hover:text-blue-300">
                              <Eye className="h-3 w-3 mr-1" />
                              Ver
                            </Button>
                            <Button variant="outline" size="sm" className="text-green-400 hover:text-green-300">
                              <Download className="h-3 w-3 mr-1" />
                              PDF
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {invoices.length === 0 && (
                  <div className="p-8 text-center text-slate-400">
                    No hay facturas disponibles
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Información de Suscripción */}
          {subscription && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Calendar className="h-5 w-5 text-purple-400 mr-2" />
                  Suscripción Actual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-slate-400">Plan</Label>
                    <p className="text-white font-medium">{subscription.planId}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400">Estado</Label>
                    <div className="mt-1">
                      <Badge variant={subscription.status === 'active' ? 'secondary' : 'destructive'}>
                        {subscription.status === 'active' ? 'Activa' : 
                         subscription.status === 'cancelled' ? 'Cancelada' : 'Vencida'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-400">Próximo Cobro</Label>
                    <p className="text-white">
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
