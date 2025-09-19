
'use client';

import { useState } from 'react';
import { Play, MessageCircle, Filter, Download, DollarSign, BarChart3, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockRadioDetections, getStatusColor, RadioDetection, mockRadios } from '@/lib/mock-data';

export default function Reportes() {
  const [detections, setDetections] = useState<RadioDetection[]>(mockRadioDetections);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [regionFilter, setRegionFilter] = useState('all');

  const filteredDetections = detections.filter(detection => {
    const matchesStatus = statusFilter === 'all' || detection.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      Object.values(detection).some(value => 
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesRegion = regionFilter === 'all' || detection.region === regionFilter;
    return matchesStatus && matchesSearch && matchesRegion;
  });

  const uniqueStatuses = [...new Set(detections.map(d => d.status))];
  const uniqueRegions = [...new Set(detections.map(d => d.region))];

  // Calcular KPIs
  const calculateDetectionValue = (detection: RadioDetection) => {
    const radio = mockRadios.find(r => r.name === detection.radio);
    return radio?.pricePerDetection || 0;
  };

  const totalValue = filteredDetections.reduce((sum, detection) => {
    return sum + calculateDetectionValue(detection);
  }, 0);

  const completedDetections = filteredDetections.filter(d => 
    d.status === 'Finalizada' || d.status === 'Solucionado'
  ).length;

  const pendingDetections = filteredDetections.filter(d => 
    d.status === 'Pendiente'
  ).length;

  // Función para exportar datos
  const handleExport = () => {
    try {
      // Verificar que estemos en el cliente
      if (typeof window === 'undefined') return;
      
      const csvContent = [
        ['Fecha', 'Hora', 'Programadora', 'Radio', 'Región', 'Comuna', 'Marca', 'Campaña', 'Estado', 'Valor (CLP)'],
        ...filteredDetections.map(detection => [
          detection.date,
          detection.time,
          detection.programadora,
          detection.radio,
          detection.region,
          detection.comuna,
          detection.marca,
          detection.campaña,
          detection.status,
          `$${calculateDetectionValue(detection).toLocaleString()}`
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      const today = new Date();
      const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      link.setAttribute('download', `reportes_detecciones_${dateString}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('Exportación completada exitosamente');
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar el archivo. Intenta nuevamente.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Reportes</h1>
          <p className="text-slate-400 mt-1">
            Gestión y seguimiento de detecciones publicitarias
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Detecciones</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{filteredDetections.length}</div>
            <p className="text-xs text-slate-400">detecciones filtradas</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Valor Total $</CardTitle>
            <DollarSign className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-slate-400">CLP en detecciones</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Completadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{completedDetections}</div>
            <p className="text-xs text-slate-400">finalizadas/solucionadas</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{pendingDetections}</div>
            <p className="text-xs text-slate-400">por procesar</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por programadora, radio, marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px] bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all" className="text-white hover:bg-gray-700">Todos los estados</SelectItem>
                {uniqueStatuses.map(status => (
                  <SelectItem key={status} value={status} className="text-white hover:bg-gray-700">{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={isAdvancedFiltersOpen} onOpenChange={setIsAdvancedFiltersOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-white">Filtros Avanzados</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="region-filter" className="text-white">Región</Label>
                    <Select value={regionFilter} onValueChange={setRegionFilter}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Todas las regiones" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="all" className="text-white hover:bg-gray-700">Todas las regiones</SelectItem>
                        {uniqueRegions.map(region => (
                          <SelectItem key={region} value={region} className="text-white hover:bg-gray-700">{region}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date-start" className="text-white">Fecha inicio</Label>
                      <Input
                        id="date-start"
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date-end" className="text-white">Fecha fin</Label>
                      <Input
                        id="date-end"
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => {
                      setRegionFilter('all');
                      setDateRange({ start: '', end: '' });
                    }}>
                      Limpiar
                    </Button>
                    <Button onClick={() => setIsAdvancedFiltersOpen(false)}>
                      Aplicar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-700/50 border-b border-slate-600">
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Fecha/Hora
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Programadora
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Radio
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Región
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Comuna
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Marca
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Campaña
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Valor $
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-600">
              {filteredDetections.map((detection) => (
                <tr key={detection.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{detection.date}</div>
                    <div className="text-xs text-slate-400">{detection.time}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {detection.programadora}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {detection.radio}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {detection.region}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {detection.comuna}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                    {detection.marca}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {detection.campaña}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full text-white ${getStatusColor(detection.status)}`}>
                      {detection.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400 font-medium">
                    ${calculateDetectionValue(detection).toLocaleString()} CLP
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300">
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-slate-400 hover:text-slate-300">
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDetections.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400">No se encontraron resultados</p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="text-sm text-slate-400">
        Mostrando {filteredDetections.length} de {detections.length} detecciones
      </div>
    </div>
  );
}
