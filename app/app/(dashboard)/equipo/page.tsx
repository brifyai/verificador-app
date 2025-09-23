
'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Mail, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddUserModal } from '@/components/ui/add-user-modal';
import { mockTeamMembers, TeamMember } from '@/lib/mock-data';
import { getDisplayRole, DatabaseRole } from '@/lib/types';

export default function Equipo() {
  const [members, setMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Función para cargar usuarios desde la API
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const users = await response.json();
        // Convertir usuarios de la API al formato TeamMember
        const teamMembers: TeamMember[] = users.map((user: any) => ({
          id: user.id,
          name: user.name || 'Sin nombre',
          email: user.email,
          role: getDisplayRole(user.role as DatabaseRole),
          lastLogin: user.updatedAt ? new Date(user.updatedAt).toLocaleDateString('es-CL') + ' ' + new Date(user.updatedAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : 'Nunca',
          status: user.active ? 'Activo' : 'Inactivo'
        }));
        setMembers(teamMembers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      // Mantener datos mock en caso de error
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers();
  }, []);

  const handleUserAdded = () => {
    loadUsers(); // Recargar la lista después de agregar un usuario
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'administrador': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'verificador': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'analista': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Equipo</h1>
          <p className="text-slate-400 mt-1">
            Gestión de usuarios y permisos del sistema
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsModalOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Invitar miembro
        </Button>
      </div>

      {/* Team stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white">Total Miembros</h3>
          <p className="text-3xl font-bold text-blue-400 mt-2">{members.length}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white">Activos</h3>
          <p className="text-3xl font-bold text-green-400 mt-2">
            {members.filter(m => m.status === 'Activo').length}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white">Administradores</h3>
          <p className="text-3xl font-bold text-purple-400 mt-2">
            {members.filter(m => m.role === 'Administrador').length}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white">Verificadores</h3>
          <p className="text-3xl font-bold text-yellow-400 mt-2">
            {members.filter(m => m.role === 'Verificador').length}
          </p>
        </div>
      </div>

      {/* Team members table */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-6 py-4 bg-slate-700/50 border-b border-slate-600">
          <h3 className="text-lg font-semibold text-white">Miembros del Equipo</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-700/30 border-b border-slate-600">
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Último Acceso
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-600">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white font-medium text-sm">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{member.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-300">{member.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getRoleColor(member.role)}`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{member.lastLogin}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      member.status === 'Activo' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full mr-1 mt-0.5 ${
                        member.status === 'Activo' ? 'bg-green-400' : 'bg-red-400'
                      }`}></div>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300">
                        <Mail className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-slate-400 hover:text-slate-300">
                        <Shield className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-6 h-6 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Administrador</h3>
          </div>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>• Acceso completo al sistema</li>
            <li>• Gestión de usuarios</li>
            <li>• Configuración avanzada</li>
            <li>• Reportes ejecutivos</li>
          </ul>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Verificador</h3>
          </div>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>• Verificar detecciones</li>
            <li>• Gestionar frases</li>
            <li>• Ver reportes básicos</li>
            <li>• Reproducir audios</li>
          </ul>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-6 h-6 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Analista</h3>
          </div>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>• Ver dashboard</li>
            <li>• Acceder a inteligencia</li>
            <li>• Generar reportes</li>
            <li>• Análisis de tendencias</li>
          </ul>
        </div>
      </div>

      {/* Modal para agregar usuario */}
      <AddUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUserAdded={handleUserAdded}
      />
    </div>
  );
}
