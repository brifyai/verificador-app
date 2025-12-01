import { NextResponse } from 'next/server';

export async function GET() {
  const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prueba de Actualización de Plataforma de Streaming</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .form-group { margin-bottom: 15px; }
        label { display: inline-block; width: 150px; font-weight: bold; }
        input, select { width: 300px; padding: 8px; margin: 5px; }
        button { padding: 10px 20px; margin: 10px; cursor: pointer; }
        .result { margin-top: 20px; padding: 15px; border-radius: 5px; }
        .success { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .error { background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .info { background-color: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
        .radio-info { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>🎵 Prueba de Actualización de Plataforma de Streaming</h1>
    <p>Esta página te permite probar la actualización de la plataforma de streaming de una radio.</p>
    
    <div id="auth-section">
        <h2>1. Autenticación</h2>
        <div class="form-group">
            <label>Email:</label>
            <input type="email" id="email" value="admin@radioverificador.cl" />
        </div>
        <div class="form-group">
            <label>Contraseña:</label>
            <input type="password" id="password" value="Admin123!" />
        </div>
        <button onclick="login()">Iniciar Sesión</button>
        <div id="auth-result"></div>
    </div>

    <div id="radio-section" style="display: none;">
        <h2>2. Seleccionar Radio</h2>
        <button onclick="loadRadios()">Cargar Radios</button>
        <div id="radio-list"></div>
        
        <div id="selected-radio" style="display: none;">
            <h3>3. Actualizar Plataforma de Streaming</h3>
            <div class="radio-info" id="current-info"></div>
            
            <div class="form-group">
                <label>Nueva Plataforma:</label>
                <select id="new-platform">
                    <option value="">Seleccionar plataforma...</option>
                    <option value="icecast">Icecast</option>
                    <option value="shoutcast">Shoutcast</option>
                    <option value="streaming-chile">Streaming Chile</option>
                    <option value="audio-streaming">Audio Streaming</option>
                    <option value="otro">Otro</option>
                </select>
            </div>
            
            <button onclick="updatePlatform()">Actualizar Plataforma</button>
            <div id="update-result"></div>
        </div>
    </div>

    <script>
        let authToken = null;
        let selectedRadio = null;

        async function login() {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch('/api/auth/login-direct', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();
                
                if (response.ok) {
                    authToken = data.token;
                    document.getElementById('auth-result').innerHTML = 
                        '<div class="result success">✅ Login exitoso</div>';
                    document.getElementById('auth-section').style.display = 'none';
                    document.getElementById('radio-section').style.display = 'block';
                } else {
                    document.getElementById('auth-result').innerHTML = 
                        '<div class="result error">❌ Error: ' + (data.error || 'Login fallido') + '</div>';
                }
            } catch (error) {
                document.getElementById('auth-result').innerHTML = 
                    '<div class="result error">❌ Error de conexión: ' + error.message + '</div>';
            }
        }

        async function loadRadios() {
            try {
                const response = await fetch('/api/radios-direct?limit=10', {
                    headers: {
                        'Authorization': 'Bearer ' + authToken,
                    },
                });

                const data = await response.json();
                
                if (response.ok) {
                    displayRadios(data.radios || data);
                } else {
                    document.getElementById('radio-list').innerHTML = 
                        '<div class="result error">❌ Error al cargar radios: ' + (data.error || 'Error desconocido') + '</div>';
                }
            } catch (error) {
                document.getElementById('radio-list').innerHTML = 
                    '<div class="result error">❌ Error de conexión: ' + error.message + '</div>';
            }
        }

        function displayRadios(radios) {
            let html = '<h3>Radios disponibles:</h3>';
            radios.forEach(radio => {
                const metadata = radio.metadata || {};
                html += '<div class="radio-info">' +
                    '<strong>' + radio.name + '</strong> - ' + radio.region +
                    '<br>ID: ' + radio.id +
                    '<br>Ciudad: ' + (metadata.city || 'N/A') +
                    '<br>Plataforma actual: ' + (metadata.streamPlatform || 'No definida') +
                    '<br>URL del stream: ' + (radio.streamUrl || 'No definida') +
                    '<br>' +
                    '<button onclick="selectRadio(' + JSON.stringify(radio).replace(/"/g, '"') + ')">Seleccionar esta radio</button>' +
                    '</div>';
            });
            document.getElementById('radio-list').innerHTML = html;
        }

        function selectRadio(radio) {
            selectedRadio = radio;
            const metadata = radio.metadata || {};
            
            document.getElementById('current-info').innerHTML = 
                '<strong>Radio seleccionada:</strong> ' + radio.name +
                '<br><strong>Región:</strong> ' + radio.region +
                '<br><strong>Plataforma actual:</strong> ' + (metadata.streamPlatform || 'No definida') +
                '<br><strong>URL del stream:</strong> ' + (radio.streamUrl || 'No definida');
            
            document.getElementById('selected-radio').style.display = 'block';
            document.getElementById('new-platform').value = metadata.streamPlatform || '';
        }

        async function updatePlatform() {
            const newPlatform = document.getElementById('new-platform').value;
            
            if (!newPlatform) {
                document.getElementById('update-result').innerHTML = 
                    '<div class="result error">❌ Por favor selecciona una plataforma</div>';
                return;
            }

            if (!selectedRadio) {
                document.getElementById('update-result').innerHTML = 
                    '<div class="result error">❌ No hay radio seleccionada</div>';
                return;
            }

            const updateData = {
                name: selectedRadio.name,
                region: selectedRadio.region,
                streamUrl: selectedRadio.streamUrl || '',
                streamPlatform: newPlatform,
                city: selectedRadio.metadata?.city || '',
                programadora: selectedRadio.metadata?.programadora || '',
                website: selectedRadio.metadata?.website || '',
                frequency: selectedRadio.metadata?.frequency || ''
            };

            try {
                document.getElementById('update-result').innerHTML = 
                    '<div class="result info">⏳ Actualizando plataforma...</div>';

                const response = await fetch('/api/radios-direct/' + selectedRadio.id, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + authToken,
                    },
                    body: JSON.stringify(updateData),
                });

                const data = await response.json();
                
                if (response.ok) {
                    document.getElementById('update-result').innerHTML = 
                        '<div class="result success">✅ Plataforma actualizada exitosamente</div>';
                    
                    // Actualizar la información mostrada
                    selectedRadio.metadata = selectedRadio.metadata || {};
                    selectedRadio.metadata.streamPlatform = newPlatform;
                    selectRadio(selectedRadio);
                    
                    // Recargar la lista de radios después de un segundo
                    setTimeout(() => {
                        loadRadios();
                    }, 1000);
                    
                } else {
                    document.getElementById('update-result').innerHTML = 
                        '<div class="result error">❌ Error al actualizar: ' + (data.error || 'Error desconocido') + '</div>';
                }
            } catch (error) {
                document.getElementById('update-result').innerHTML = 
                    '<div class="result error">❌ Error de conexión: ' + error.message + '</div>';
            }
        }

        // Auto-login para pruebas rápidas
        window.onload = function() {
            // Descomenta la siguiente línea para auto-login en desarrollo
            // login();
        };
    </script>
</body>
</html>`;

  return new NextResponse(htmlContent, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}