// Cliente directo de Supabase usando API REST
// Solución temporal mientras resolvemos las credenciales de PostgreSQL

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

class SupabaseDirectClient {
  constructor() {
    this.baseUrl = SUPABASE_URL;
    this.apiKey = SUPABASE_ANON_KEY;
    this.serviceKey = SUPABASE_SERVICE_ROLE_KEY;
    
    // Verificar si service key es idéntico a anon key (caso especial)
    this.isServiceKeyIdentical = this.serviceKey === this.apiKey;
    
    console.log('DEBUG SupabaseDirectClient:');
    console.log('- URL:', this.baseUrl ? '✓ Configurada' : '✗ Vacía');
    console.log('- ANON KEY:', this.apiKey ? '✓ Configurada' : '✗ Vacía');
    console.log('- SERVICE KEY:', this.serviceKey ? '✓ Configurada' : '✗ Vacía');
    console.log('- Service Key Idéntico:', this.isServiceKeyIdentical ? '⚠️ SÍ (usando workaround)' : '✅ NO');
    
    this.headers = {
      'Content-Type': 'application/json',
      'apikey': this.apiKey,
      'Authorization': `Bearer ${this.apiKey}`,
      'Prefer': 'return=minimal'
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}/rest/v1/${endpoint}`;
    
    // Usar siempre ANON KEY si los keys son idénticos (caso especial del usuario)
    let headers;
    if (options.useServiceKey && this.serviceKey && this.serviceKey !== this.apiKey) {
      console.log('DEBUG: Usando SERVICE ROLE KEY para:', endpoint);
      headers = {
        'Content-Type': 'application/json',
        'apikey': this.serviceKey,
        'Authorization': `Bearer ${this.serviceKey}`,
        'Prefer': 'return=minimal',
        ...options.headers
      };
    } else {
      // Usar ANON KEY (incluso si useServiceKey está true pero los keys son idénticos)
      const keyType = options.useServiceKey ? 'ANON (service key idéntico)' : 'ANON';
      console.log(`DEBUG: Usando ${keyType} KEY para:`, endpoint);
      headers = {
        ...this.headers,
        ...options.headers
      };
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
      method: options.method || 'GET'
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase API Error: ${response.status} - ${error}`);
    }

    // Para operaciones DELETE y otras que no devuelven contenido, verificar si hay body
    const contentType = response.headers.get('content-type');
    const hasContent = response.headers.get('content-length') !== '0';
    
    if (!contentType || !contentType.includes('application/json') || !hasContent || response.status === 204) {
      return null; // o return {} dependiendo de lo que esperes
    }

    return response.json();
  }

  // Tabla: radios
  async getRadios(options = {}) {
    let query = 'radios?select=*';
    if (options.limit) query += `&limit=${options.limit}`;
    if (options.offset) query += `&offset=${options.offset}`;
    if (options.order) query += `&order=${options.order}`;
    
    return this.request(query);
  }

  async createRadio(data) {
    return this.request('radios', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Prefer': 'return=representation' }
    });
  }

  // Tabla: users
  async getUsers(options = {}) {
    let query = 'users?select=*';
    if (options.limit) query += `&limit=${options.limit}`;
    if (options.email) query += `&email=eq.${options.email}`;
    
    return this.request(query);
  }

  async createUser(data) {
    return this.request('users', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Prefer': 'return=representation' }
    });
  }

  async updateRadio(id, data) {
    return this.request(`radios?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: { 'Prefer': 'return=representation' }
    });
  }

  async deleteRadio(id) {
    return this.request(`radios?id=eq.${id}`, {
      method: 'DELETE'
    });
  }

  // Tabla: phrases
  async getPhrases(options = {}) {
    let query = 'phrases?select=*';
    if (options.active !== undefined) query += `&active=eq.${options.active}`;
    if (options.limit) query += `&limit=${options.limit}`;
    
    return this.request(query);
  }

  async createPhrase(data) {
    return this.request('phrases', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Prefer': 'return=representation' }
    });
  }

  // Tabla: detections
  async getDetections(options = {}) {
    let query = 'detections?select=*';
    if (options.limit) query += `&limit=${options.limit}`;
    if (options.order) query += `&order=${options.order}`;
    if (options.verified !== undefined) query += `&verified=eq.${options.verified}`;
    
    const detections = await this.request(query);
    
    // Si necesitamos datos relacionados, hacemos consultas separadas
    if (options.includeRelated && detections.length > 0) {
      const radioIds = [...new Set(detections.map(d => d.radio_id).filter(Boolean))];
      const phraseIds = [...new Set(detections.map(d => d.phrase_id).filter(Boolean))];
      
      const [radios, phrases] = await Promise.all([
        radioIds.length > 0 ? this.getRadiosByIds(radioIds) : [],
        phraseIds.length > 0 ? this.getPhrasesByIds(phraseIds) : []
      ]);
      
      // Agregar datos relacionados
      return detections.map(detection => ({
        ...detection,
        radio: radios.find(r => r.id === detection.radio_id),
        phrase: phrases.find(p => p.id === detection.phrase_id)
      }));
    }
    
    return detections;
  }

  async createDetection(data) {
    return this.request('detections', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Prefer': 'return=representation' }
    });
  }

  async updateDetection(id, data) {
    return this.request(`detections?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: { 'Prefer': 'return=representation' }
    });
  }

  async deleteDetection(id) {
    return this.request(`detections?id=eq.${id}`, {
      method: 'DELETE'
    });
  }

  // Tabla: monitoring_sessions
  async getMonitoringSessions(options = {}) {
    let query = 'monitoring_sessions?select=*';
    if (options.status) query += `&status=eq.${options.status}`;
    if (options.limit) query += `&limit=${options.limit}`;
    
    const sessions = await this.request(query);
    
    // Si necesitamos datos relacionados
    if (options.includeRelated && sessions.length > 0) {
      const radioIds = [...new Set(sessions.map(s => s.radio_id).filter(Boolean))];
      const userIds = [...new Set(sessions.map(s => s.user_id).filter(Boolean))];
      
      const [radios, users] = await Promise.all([
        radioIds.length > 0 ? this.getRadiosByIds(radioIds) : [],
        userIds.length > 0 ? this.getUsersByIds(userIds) : []
      ]);
      
      return sessions.map(session => ({
        ...session,
        radio: radios.find(r => r.id === session.radio_id),
        user: users.find(u => u.id === session.user_id)
      }));
    }
    
    return sessions;
  }

  async createMonitoringSession(data) {
    return this.request('monitoring_sessions', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Prefer': 'return=representation' }
    });
  }

  // Tabla: captures
  async getCaptures(options = {}) {
    let query = 'captures?select=*';
    if (options.sessionId) query += `&session_id=eq.${options.sessionId}`;
    if (options.status) query += `&status=eq.${options.status}`;
    if (options.limit) query += `&limit=${options.limit}`;
    
    return this.request(query);
  }

  async createCapture(data) {
    return this.request('captures', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Prefer': 'return=representation' }
    });
  }

  // Métodos auxiliares para obtener datos por IDs
  async getRadiosByIds(ids) {
    if (ids.length === 0) return [];
    const query = `radios?id=in.(${ids.join(',')})`;
    return this.request(query);
  }

  async getPhrasesByIds(ids) {
    if (ids.length === 0) return [];
    const query = `phrases?id=in.(${ids.join(',')})`;
    return this.request(query);
  }

  async getUsersByIds(ids) {
    if (ids.length === 0) return [];
    const query = `users?id=in.(${ids.join(',')})`;
    return this.request(query);
  }

  // Tabla: jobs
  async getJobs(options = {}) {
    let query = 'jobs?select=*';
    if (options.status) query += `&status=eq.${options.status}`;
    if (options.limit) query += `&limit=${options.limit}`;
    if (options.orderBy) query += `&order=${options.orderBy}`;
    
    return this.request(query);
  }

  async getJobById(id) {
    const query = `jobs?id=eq.${id}`;
    const result = await this.request(query);
    return result[0] || null;
  }

  async createJob(data) {
    return this.request('jobs', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Prefer': 'return=representation' }
    });
  }

  async updateJob(id, data) {
    return this.request(`jobs?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: { 'Prefer': 'return=representation' }
    });
  }

  async deleteJob(id) {
    return this.request(`jobs?id=eq.${id}`, {
      method: 'DELETE'
    });
  }

  // Tabla: captures
  async updateCapture(id, data) {
    return this.request(`captures?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: { 'Prefer': 'return=representation' }
    });
  }

  // Tabla: monitoring_sessions
  async updateMonitoringSession(id, data) {
    return this.request(`monitoring_sessions?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: { 'Prefer': 'return=representation' }
    });
  }

  // Estadísticas para dashboard
  async getDashboardStats() {
    try {
      const [radios, phrases, detections, captures] = await Promise.all([
        this.getRadios(),
        this.getPhrases(),
        this.getDetections({ limit: 1000, includeRelated: true }),
        this.getCaptures({ limit: 1000 })
      ]);

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const todayDetections = detections.filter(d => new Date(d.timestamp) >= today).length;
      const weekDetections = detections.filter(d => new Date(d.timestamp) >= weekAgo).length;
      const monthDetections = detections.filter(d => new Date(d.timestamp) >= monthAgo).length;

      return {
        overview: {
          totalDetections: detections.length,
          todayDetections,
          weekDetections,
          monthDetections,
          totalRadios: radios.length,
          totalPhrases: phrases.length,
        },
        activity: {
          hourlyData: [], // TODO: Implementar si es necesario
          recentDetections: detections.slice(0, 10).map(d => ({
            id: d.id,
            phrase: d.phrase?.phrase || 'Unknown',
            radio: d.radio?.name || 'Unknown',
            timestamp: d.timestamp,
            confidence: d.confidence,
            verified: d.verified,
          })),
        },
        rankings: {
          topPhrases: [], // TODO: Implementar si es necesario
          topRadios: [], // TODO: Implementar si es necesario
          regionData: [], // TODO: Implementar si es necesario
        },
        costs: {
          totalCosts: 0, // TODO: Implementar si es necesario
          detectionCosts: 0,
          captureCosts: 0,
          costPerDetection: 0,
        },
        verification: {
          verifiedDetections: detections.filter(d => d.verified).length,
          unverifiedHighConfidence: detections.filter(d => !d.verified && d.confidence >= 0.8).length,
          verificationRate: detections.length > 0 ? (detections.filter(d => d.verified).length / detections.length) * 100 : 0,
        },
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  // Verificar conexión
  async testConnection() {
    try {
      const result = await this.request('radios?select=count&limit=1');
      return { success: true, message: 'Conexión exitosa a Supabase API' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export const supabaseDirect = new SupabaseDirectClient();
export default supabaseDirect;