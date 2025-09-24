'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CreditCard, 
  FileText, 
  Calendar, 
  DollarSign, 
  Building, 
  Mail, 
  Phone,
  MapPin,
  Download,
  Eye,
  Plus,
  Edit
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BillingProfile {
  id: string;
  companyName: string;
  rut: string;
  address: string;
  city: string;
  country: string;
  phone?: string;
  email: string;
  taxId?: string;
  paymentMethod: string;
  paymentDetails: any;
  subscription?: Subscription;
  invoices?: Invoice[];
}

interface Subscription {
  id: string;
  planName: string;
  planDescription: string;
  monthlyPrice: number;
  currency: string;
  status: string;
  startDate: string;
  nextBillingDate: string;
  features: any;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  paymentDate?: string;
  paymentMethod?: string;
  notes?: string;
  lineItems: InvoiceLineItem[];
}

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  radio?: { name: string };
}

export default function FacturacionPage() {
  const [billingProfile, setBillingProfile] = useState<BillingProfile | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    companyName: '',
    rut: '',
    address: '',
    city: '',
    country: 'Chile',
    phone: '',
    email: '',
    taxId: '',
    paymentMethod: 'CREDIT_CARD'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      
      // Obtener perfil de facturación
      const profileResponse = await fetch('/api/billing/profiles');
      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        setBillingProfile(profile);
        if (profile) {
          setProfileForm({
            companyName: profile.companyName || '',
            rut: profile.rut || '',
            address: profile.address || '',
            city: profile.city || '',
            country: profile.country || 'Chile',
            phone: profile.phone || '',
            email: profile.email || '',
            taxId: profile.taxId || '',
            paymentMethod: profile.paymentMethod || 'CREDIT_CARD'
          });
        }
      }

      // Obtener facturas
      const invoicesResponse = await fetch('/api/billing/invoices');
      if (invoicesResponse.ok) {
        const data = await invoicesResponse.json();
        setInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información de facturación',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const method = billingProfile ? 'PUT' : 'POST';
      const response = await fetch('/api/billing/profiles', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setBillingProfile(updatedProfile);
        setEditingProfile(false);
        toast({
          title: 'Éxito',
          description: 'Perfil de facturación guardado correctamente'
        });
      } else {
        throw new Error('Error al guardar el perfil');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo guardar el perfil de facturación',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PAID: { label: 'Pagada', variant: 'default' as const },
      PENDING: { label: 'Pendiente', variant: 'secondary' as const },
      OVERDUE: { label: 'Vencida', variant: 'destructive' as const },
      CANCELLED: { label: 'Cancelada', variant: 'outline' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number, currency: string = 'CLP') => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando información de facturación...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Facturación</h1>
          <p className="text-gray-600">Gestiona tu información de facturación, suscripciones y pagos</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Perfil de Facturación</TabsTrigger>
          <TabsTrigger value="subscription">Suscripción</TabsTrigger>
          <TabsTrigger value="invoices">Facturas</TabsTrigger>
          <TabsTrigger value="payment-methods">Métodos de Pago</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Información de Facturación
                  </CardTitle>
                  <CardDescription>
                    Configura los datos de tu empresa para la facturación
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setEditingProfile(!editingProfile)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {editingProfile ? 'Cancelar' : 'Editar'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingProfile ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nombre de la Empresa</Label>
                    <Input
                      id="companyName"
                      value={profileForm.companyName}
                      onChange={(e) => setProfileForm({ ...profileForm, companyName: e.target.value })}
                      placeholder="Ej: Mi Empresa S.A."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rut">RUT</Label>
                    <Input
                      id="rut"
                      value={profileForm.rut}
                      onChange={(e) => setProfileForm({ ...profileForm, rut: e.target.value })}
                      placeholder="12.345.678-9"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      placeholder="Av. Providencia 1234, Oficina 567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                      placeholder="Santiago"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">País</Label>
                    <Select value={profileForm.country} onValueChange={(value) => setProfileForm({ ...profileForm, country: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Chile">Chile</SelectItem>
                        <SelectItem value="Argentina">Argentina</SelectItem>
                        <SelectItem value="Peru">Perú</SelectItem>
                        <SelectItem value="Colombia">Colombia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="+56 2 2345 6789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email de Facturación</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      placeholder="facturacion@empresa.cl"
                    />
                  </div>
                  <div className="md:col-span-2 flex gap-2">
                    <Button onClick={handleSaveProfile}>
                      Guardar Cambios
                    </Button>
                    <Button variant="outline" onClick={() => setEditingProfile(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : billingProfile ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="font-medium">{billingProfile.companyName}</p>
                        <p className="text-sm text-gray-600">RUT: {billingProfile.rut}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                      <div>
                        <p className="text-sm">{billingProfile.address}</p>
                        <p className="text-sm text-gray-600">{billingProfile.city}, {billingProfile.country}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <p className="text-sm">{billingProfile.email}</p>
                    </div>
                    {billingProfile.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <p className="text-sm">{billingProfile.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No tienes un perfil de facturación configurado</p>
                  <Button onClick={() => setEditingProfile(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Perfil de Facturación
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Suscripción Actual
              </CardTitle>
              <CardDescription>
                Información sobre tu plan actual y próxima facturación
              </CardDescription>
            </CardHeader>
            <CardContent>
              {billingProfile?.subscription ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{billingProfile.subscription.planName}</h3>
                      <p className="text-gray-600">{billingProfile.subscription.planDescription}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {formatCurrency(billingProfile.subscription.monthlyPrice, billingProfile.subscription.currency)}
                      </p>
                      <p className="text-sm text-gray-600">por mes</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Estado</p>
                      <Badge variant={billingProfile.subscription.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {billingProfile.subscription.status === 'ACTIVE' ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Inicio</p>
                      <p className="font-medium">
                        {new Date(billingProfile.subscription.startDate).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Próxima facturación</p>
                      <p className="font-medium">
                        {new Date(billingProfile.subscription.nextBillingDate).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                  </div>

                  {billingProfile.subscription.features && (
                    <div>
                      <h4 className="font-medium mb-2">Características del Plan</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {Object.entries(billingProfile.subscription.features).map(([key, value]) => (
                          <div key={key} className="text-sm">
                            <span className="text-gray-600">{key}:</span> {String(value)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No tienes una suscripción activa</p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Contratar Plan
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Historial de Facturas
              </CardTitle>
              <CardDescription>
                Revisa y descarga tus facturas anteriores
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length > 0 ? (
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-medium">{invoice.invoiceNumber}</p>
                            <p className="text-sm text-gray-600">
                              Emitida: {new Date(invoice.issueDate).toLocaleDateString('es-CL')}
                            </p>
                          </div>
                          {getStatusBadge(invoice.status)}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold">
                            {formatCurrency(invoice.total, invoice.currency)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Vence: {new Date(invoice.dueDate).toLocaleDateString('es-CL')}
                          </p>
                        </div>
                      </div>
                      
                      {invoice.lineItems && invoice.lineItems.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium mb-2">Conceptos:</p>
                          {invoice.lineItems.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm text-gray-600">
                              <span>{item.description}</span>
                              <span>{formatCurrency(item.total, invoice.currency)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalle
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Descargar PDF
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No tienes facturas disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment-methods" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Métodos de Pago
              </CardTitle>
              <CardDescription>
                Gestiona tus métodos de pago para las suscripciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              {billingProfile?.paymentDetails ? (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="font-medium">
                            {billingProfile.paymentMethod === 'CREDIT_CARD' ? 'Tarjeta de Crédito' : 'Transferencia Bancaria'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {billingProfile.paymentMethod === 'CREDIT_CARD' 
                              ? `${billingProfile.paymentDetails.cardType} **** ${billingProfile.paymentDetails.lastFour}`
                              : `${billingProfile.paymentDetails.bankName} - ${billingProfile.paymentDetails.accountNumber}`
                            }
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No tienes métodos de pago configurados</p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Método de Pago
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}