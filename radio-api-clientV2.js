// Radio API Client - Cliente dinámico para grabación de radios
class RadioAPIClient {
    constructor(baseURL = 'http://213.199.39.147:5000/api') {
        this.API_BASE = baseURL;
        this.currentRecordings = new Map(); // Para trackear grabaciones activas
    }

    // Función auxiliar para hacer requests
    async makeRequest(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.API_BASE}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error en la solicitud:', error);
            return {
                status: 'error',
                message: error.message || 'Error de conexión con el servidor'
            };
        }
    }

    // Obtener todas las radios disponibles desde Supabase
    async getAvailableRadios() {
        return await this.makeRequest('/radios');
    }

    // Iniciar grabación de una radio específica
    async startRecording(radioId, radioName = '') {
        const result = await this.makeRequest('/start-recording', {
            method: 'POST',
            body: JSON.stringify({ 
                radio_id: radioId,
                radio_name: radioName // Opcional, para logging
            })
        });

        if (result.status === 'success') {
            this.currentRecordings.set(radioId, {
                recording_id: result.recording_id,
                status: 'recording',
                startTime: new Date(),
                radioName: result.radio_name || radioName
            });
        }

        return result;
    }

    // Pausar grabación en curso
    async pauseRecording(radioId) {
        const result = await this.makeRequest('/pause-recording', {
            method: 'POST',
            body: JSON.stringify({ radio_id: radioId })
        });

        if (result.status === 'success' && this.currentRecordings.has(radioId)) {
            this.currentRecordings.get(radioId).status = 'paused';
        }

        return result;
    }

    // Reanudar grabación pausada
    async resumeRecording(radioId) {
        const result = await this.makeRequest('/resume-recording', {
            method: 'POST',
            body: JSON.stringify({ radio_id: radioId })
        });

        if (result.status === 'success' && this.currentRecordings.has(radioId)) {
            this.currentRecordings.get(radioId).status = 'recording';
        }

        return result;
    }

    // Detener grabación completamente
    async stopRecording(radioId) {
        const result = await this.makeRequest('/stop-recording', {
            method: 'POST',
            body: JSON.stringify({ radio_id: radioId })
        });

        if (result.status === 'success') {
            this.currentRecordings.delete(radioId);
        }

        return result;
    }

    // Obtener grabaciones activas actuales
    async getActiveRecordings() {
        const result = await this.makeRequest('/active-recordings');
        
        // Sincronizar nuestro estado local
        if (result.status === 'success') {
            this.currentRecordings.clear();
            Object.entries(result.active_recordings).forEach(([radioId, data]) => {
                this.currentRecordings.set(radioId, {
                    recording_id: data.recording_id,
                    status: data.status?.toLowerCase() || 'recording',
                    startTime: new Date(data.start_time),
                    radioName: data.radio_name
                });
            });
        }

        return result;
    }

    // Obtener lista de archivos grabados disponibles
    async getRecordingsList() {
        return await this.makeRequest('/recordings');
    }

    // Descargar un archivo específico
    async downloadRecording(filename) {
        try {
            const response = await fetch(`${this.API_BASE}/download/${filename}`);
            
            if (!response.ok) {
                throw new Error('Error descargando archivo');
            }

            // Crear enlace de descarga
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            return { status: 'success', message: 'Descarga iniciada' };
        } catch (error) {
            console.error('Error descargando:', error);
            return { status: 'error', message: 'Error en la descarga' };
        }
    }

    // Verificar estado del servidor
    async getServerStatus() {
        return await this.makeRequest('/status');
    }

    // Obtener estado local de las grabaciones
    getLocalRecordingState(radioId = null) {
        if (radioId) {
            return this.currentRecordings.get(radioId) || null;
        }
        return Object.fromEntries(this.currentRecordings);
    }

    // Verificar si una radio específica está grabando
    isRecording(radioId) {
        const recording = this.currentRecordings.get(radioId);
        return recording && recording.status === 'recording';
    }

    // Verificar si una radio específica está pausada
    isPaused(radioId) {
        const recording = this.currentRecordings.get(radioId);
        return recording && recording.status === 'paused';
    }
}

// Crear instancia global para uso fácil
const radioClient = new RadioAPIClient();

// Ejemplos de uso dinámico:

// 1. Cargar y mostrar radios dinámicamente
async function loadAndDisplayRadios() {
    const result = await radioClient.getAvailableRadios();
    
    if (result.status === 'success') {
        const radiosContainer = document.getElementById('radios-container');
        
        result.radios.forEach(radio => {
            const radioElement = document.createElement('div');
            radioElement.className = 'radio-item';
            radioElement.innerHTML = `
                <h3>${radio.name}</h3>
                <p>Plataforma: ${radio.platform} | Región: ${radio.region || 'N/A'}</p>
                <button onclick="toggleRecording('${radio.id}', '${radio.name}')">
                    Iniciar Grabación
                </button>
                <div id="status-${radio.id}"></div>
            `;
            radiosContainer.appendChild(radioElement);
        });
    }
}

// 2. Control dinámico de grabación
async function toggleRecording(radioId, radioName) {
    const currentState = radioClient.getLocalRecordingState(radioId);
    
    if (!currentState) {
        // No está grabando, iniciar
        await startRadioRecording(radioId, radioName);
    } else if (currentState.status === 'recording') {
        // Está grabando, pausar
        await pauseRadioRecording(radioId);
    } else if (currentState.status === 'paused') {
        // Está pausado, reanudar
        await resumeRadioRecording(radioId);
    }
}

// 3. Iniciar grabación específica
async function startRadioRecording(radioId, radioName) {
    const result = await radioClient.startRecording(radioId, radioName);
    
    if (result.status === 'success') {
        updateUI(radioId, 'recording', '🔴 Grabando...');
        console.log(`✅ Grabación iniciada: ${radioName}`);
    } else {
        alert(`Error: ${result.message}`);
    }
}

// 4. Pausar grabación
async function pauseRadioRecording(radioId) {
    const result = await radioClient.pauseRecording(radioId);
    
    if (result.status === 'success') {
        updateUI(radioId, 'paused', '⏸️ Pausada');
        console.log('⏸️ Grabación pausada');
    }
}

// 5. Reanudar grabación
async function resumeRadioRecording(radioId) {
    const result = await radioClient.resumeRecording(radioId);
    
    if (result.status === 'success') {
        updateUI(radioId, 'recording', '🔴 Grabando...');
        console.log('▶️ Grabación reanudada');
    }
}

// 6. Detener grabación
async function stopRadioRecording(radioId) {
    const result = await radioClient.stopRecording(radioId);
    
    if (result.status === 'success') {
        updateUI(radioId, 'stopped', '⏹️ Detenida');
        console.log('⏹️ Grabación detenida');
    }
}

// 7. Actualizar UI dinámicamente
function updateUI(radioId, status, message) {
    const statusElement = document.getElementById(`status-${radioId}`);
    if (statusElement) {
        statusElement.innerHTML = `
            <span class="status-${status}">${message}</span>
            ${status !== 'stopped' ? 
                `<button onclick="stopRadioRecording('${radioId}')">Detener</button>` : ''
            }
        `;
    }
}

// 8. Cargar y mostrar grabaciones disponibles
async function loadRecordings() {
    const result = await radioClient.getRecordingsList();
    
    if (result.status === 'success') {
        const recordingsContainer = document.getElementById('recordings-container');
        recordingsContainer.innerHTML = '';
        
        result.recordings.forEach(recording => {
            const recordingElement = document.createElement('div');
            recordingElement.className = 'recording-item';
            recordingElement.innerHTML = `
                <p>📁 ${recording.filename}</p>
                <p>Tamaño: ${(recording.size / 1024 / 1024).toFixed(2)} MB</p>
                <button onclick="radioClient.downloadRecording('${recording.filename}')">
                    📥 Descargar
                </button>
            `;
            recordingsContainer.appendChild(recordingElement);
        });
    }
}

// 9. Monitorear estado en tiempo real
async function startStatusMonitoring() {
    setInterval(async () => {
        await radioClient.getActiveRecordings();
        updateAllUIStatus();
    }, 5000); // Actualizar cada 5 segundos
}

// 10. Actualizar todos los estados de UI
function updateAllUIStatus() {
    const recordings = radioClient.getLocalRecordingState();
    
    Object.entries(recordings).forEach(([radioId, data]) => {
        const statusMessage = data.status === 'recording' ? '🔴 Grabando...' : '⏸️ Pausada';
        updateUI(radioId, data.status, statusMessage);
    });
}

// Inicializar cuando la página cargue
document.addEventListener('DOMContentLoaded', function() {
    loadAndDisplayRadios();
    loadRecordings();
    startStatusMonitoring();
});

// Hacer disponible globalmente
window.radioClient = radioClient;
window.toggleRecording = toggleRecording;
window.startRadioRecording = startRadioRecording;
window.pauseRadioRecording = pauseRadioRecording;
window.resumeRadioRecording = resumeRadioRecording;
window.stopRadioRecording = stopRadioRecording;
window.loadRecordings = loadRecordings;