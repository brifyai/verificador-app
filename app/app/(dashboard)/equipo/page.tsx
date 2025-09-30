
'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Mail, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddUserModal } from '@/components/ui/add-user-modal';
import { TeamMember } from '@/lib/types';
import { getDisplayRole, DatabaseRole } from '@/lib/types';
import { useSession } from 'next-auth/react';
import { isAdmin } from '@/lib/permissions';
import { useEnhancedToast } from '@/hooks/use-enhanced-toast';
import { ConfirmationDialog, useConfirmationDialog } from '@/components/ui/confirmation-dialog';

export default function Equipo() {
  const { data: session } = useSession();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useEnhancedToast();
  const { confirm, ConfirmationDialog: ConfirmDialog } = useConfirmationDialog();

  // Función para cargar usuarios desde la API
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/usuarios');
      if (response.ok) {
        const result = await response.json();
        const users = result.data || [];
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

  // Función para abrir Gmail con el email del usuario
  const handleSendEmail = (email: string, name: string) => {
    const subject = encodeURIComponent(`Contacto desde OndaVerificada - ${name}`);
    const body = encodeURIComponent(`Hola ${name},\n\nEspero que te encuentres bien.\n\n\n\nSaludos,\n${session?.user?.name || 'Equipo OndaVerificada'}`);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${body}`;
    
    window.open(gmailUrl, '_blank');
    toast.success('Abriendo Gmail para enviar correo', {
      title: '📧 Correo',
      duration: 3000
    });
  };

  // Función para bloquear/desbloquear usuario
  const handleToggleUserStatus = async (userId: string, currentStatus: string, userName: string, userRole: string) => {
    // Verificar permisos de administrador
    if (!isAdmin(session?.user?.role)) {
      toast.error('No tienes permisos para realizar esta acción', {
        title: '🚫 Acceso Denegado',
        duration: 4000
      });
      return;
    }
    
    // No permitir bloquear a administradores
    if (userRole === 'Administrador') {
      toast.error('No es posible bloquear a un administrador', {
        title: '🚫 Operación no permitida',
        duration: 4000
      });
      return;
    }

    const action = currentStatus === 'Activo' ? 'bloquear' : 'desbloquear';
    const actionPast = currentStatus === 'Activo' ? 'bloqueado' : 'desbloqueado';
    
    const confirmed = await confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Usuario`,
      description: `¿Estás seguro de que deseas ${action} a ${userName}? Esta acción ${currentStatus === 'Activo' ? 'impedirá que el usuario acceda al sistema' : 'permitirá que el usuario acceda nuevamente al sistema'}.`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelText: 'Cancelar',
      variant: currentStatus === 'Activo' ? 'destructive' : 'success',
      onConfirm: () => {},
      onCancel: () => {}
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/usuarios/${userId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Recargar la lista de usuarios
        await loadUsers();
        toast.success(`Usuario ${actionPast} exitosamente`, {
          title: currentStatus === 'Activo' ? '🔒 Usuario Bloqueado' : '🔓 Usuario Desbloqueado',
          duration: 4000
        });
      } else {
        const error = await response.json();
        toast.error(error.message || `Error al ${action} usuario`, {
          title: '❌ Error',
          duration: 5000
        });
      }
    } catch (error) {
      console.error(`Error al ${action} usuario:`, error);
      toast.error(`Error de conexión al ${action} usuario`, {
        title: '🌐 Error de Conexión',
        duration: 5000
      });
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
                <tr key={member.id} className="hover:bg-slate-700/30">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                        member.role === 'Administrador' 
                          ? 'bg-gradient-to-br from-purple-500 to-indigo-600 ring-2 ring-purple-400' 
                          : 'bg-gradient-to-br from-blue-500 to-purple-600'
                      }`}>
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className={`text-sm font-medium ${
                          member.role === 'Administrador' ? 'text-purple-300' : 'text-white'
                        }`}>{member.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {member.email}
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
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-blue-400 hover:text-blue-300"
                        onClick={() => handleSendEmail(member.email, member.name)}
                        title="Enviar correo electrónico"
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className={`${
                          isAdmin(session?.user?.role) 
                            ? member.status === 'Activo' 
                              ? member.role === 'Administrador'
                                ? 'text-slate-600 cursor-not-allowed'
                                : 'text-red-400 hover:text-red-300' 
                              : 'text-green-400 hover:text-green-300'
                            : 'text-slate-600 cursor-not-allowed'
                        }`}
                        onClick={() => handleToggleUserStatus(member.id, member.status, member.name, member.role)}
                        disabled={!isAdmin(session?.user?.role) || member.role === 'Administrador'}
                        title={
                          !isAdmin(session?.user?.role) 
                            ? 'Solo administradores pueden bloquear usuarios' 
                            : member.role === 'Administrador'
                              ? 'No es posible bloquear administradores'
                              : member.status === 'Activo' 
                                ? 'Bloquear usuario' 
                                : 'Desbloquear usuario'
                        }
                      >
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

      {/* Componente de diálogo de confirmación */}
      <ConfirmDialog />
    </div>
  );
}
