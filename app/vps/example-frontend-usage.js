// Ejemplo de cómo usar el endpoint desde el frontend
// Este código muestra cómo enviar datos desde un formulario al endpoint modificado

// Función para enviar programación de grabación
async function startMonitoringWithSchedule(formData) {
  try {
    console.log('📤 Enviando programación de monitoreo...');
    
    // Datos que debe enviar el frontend
    const requestData = {
      userId: formData.userId || 'user123', // ID del usuario actual
      radioIds: formData.selectedRadios, // Array de IDs de radios seleccionadas
      phraseId: formData.selectedPhraseId, // ID de la frase a detectar
      days: formData.selectedDays, // Array de días [0=Domingo, 1=Lunes, ..., 6=Sábado]
      startTime: formData.startTime, // "HH:MM" formato 24h
      endTime: formData.endTime, // "HH:MM" formato 24h
      aiModel: formData.aiModel || 'estandar', // 'estandar', 'premium', 'empresarial'
      description: formData.description || 'Monitoreo programado desde dashboard'
    };

    console.log('📋 Datos a enviar:', requestData);

    const response = await fetch('/api/monitoring/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ Programación enviada exitosamente');
      console.log('📄 Respuesta:', result);
      
      // Mostrar mensaje de éxito al usuario
      alert(`✅ Monitoreo programado correctamente!
      
📻 Radios: ${result.data.scheduledRadios}
🔍 Frase: "${result.data.phrase.text}" (${result.data.phrase.brand})
📅 Días: ${result.data.days.join(', ')}
⏰ Horario: ${result.data.timeRange}
⏱️ Duración: ${result.data.duration}
🤖 IA: ${result.data.detection.aiModel}
💰 Costo estimado: $${result.data.estimatedCost}`);
      
      return result;
    } else {
      console.error('❌ Error en la respuesta:', result);
      alert(`❌ Error: ${result.error}`);
      throw new Error(result.error);
    }

  } catch (error) {
    console.error('❌ Error enviando programación:', error);
    alert(`❌ Error de conexión: ${error.message}`);
    throw error;
  }
}

// Ejemplo de uso con datos del formulario
const exampleFormData = {
  userId: 'user123',
  selectedRadios: ['radio1', 'radio2', 'radio3'], // IDs de las radios seleccionadas
  selectedPhraseId: 'phrase123', // ID de la frase a detectar
  selectedDays: [1, 2, 3, 4, 5], // Lunes a Viernes
  startTime: '08:00',
  endTime: '09:00',
  aiModel: 'premium', // 'estandar', 'premium', 'empresarial'
  description: 'Monitoreo matutino de publicidad'
};

// Llamar la función
// startMonitoringWithSchedule(exampleFormData);

// Ejemplo de integración con React/Next.js
function MonitoringForm() {
  const [formData, setFormData] = useState({
    selectedRadios: [],
    selectedPhraseId: '',
    selectedDays: [],
    startTime: '',
    endTime: '',
    aiModel: 'estandar',
    description: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await startMonitoringWithSchedule({
        ...formData,
        userId: 'current-user-id' // Obtener del contexto de autenticación
      });
      
      // Limpiar formulario o redirigir
      setFormData({
        selectedRadios: [],
        selectedPhraseId: '',
        selectedDays: [],
        startTime: '',
        endTime: '',
        aiModel: 'estandar',
        description: ''
      });
      
    } catch (error) {
      // Manejar error
      console.error('Error en el formulario:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Aquí irían los campos del formulario */}
      <button type="submit">Iniciar Monitoreo</button>
    </form>
  );
}

// Validaciones que debe hacer el frontend antes de enviar
function validateFormData(formData) {
  const errors = [];

  if (!formData.selectedRadios || formData.selectedRadios.length === 0) {
    errors.push('Debe seleccionar al menos una radio');
  }

  if (!formData.selectedPhraseId) {
    errors.push('Debe seleccionar una frase a detectar');
  }

  if (!formData.selectedDays || formData.selectedDays.length === 0) {
    errors.push('Debe seleccionar al menos un día');
  }

  if (!formData.startTime || !formData.endTime) {
    errors.push('Debe especificar horario de inicio y fin');
  }

  // Validar que el horario de fin sea después del inicio
  if (formData.startTime && formData.endTime) {
    const [startHour, startMin] = formData.startTime.split(':').map(Number);
    const [endHour, endMin] = formData.endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    if (endMinutes <= startMinutes) {
      errors.push('El horario de fin debe ser posterior al de inicio');
    }
  }

  return errors;
}

module.exports = {
  startMonitoringWithSchedule,
  validateFormData
};
