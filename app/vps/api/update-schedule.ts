import type { Request, Response, Router } from 'express';
const express = require('express');
const fs = require('fs');
const path = require('path');

const router: Router = express.Router();

// Interfaz para la configuración de cada radio
interface RadioSchedule {
  name: string;
  url: string;
  start_time: string;
  end_time: string;
  days: number[];
  duration: number;
}

// Ruta para actualizar los horarios
router.post('/update-schedule', async (req: Request, res: Response) => {
  try {
    console.log('Body recibido:', JSON.stringify(req.body, null, 2));
    
    // Extraer schedules del body
    const schedules = req.body?.schedules || [];
    
    // Validar que tengamos un array
    if (!Array.isArray(schedules)) {
      console.error('Formato inválido - no es un array:', schedules);
      return res.status(400).json({ error: 'El formato de los datos es inválido' });
    }

    // Validar cada configuración de radio
    for (const schedule of schedules) {
      if (!schedule.name || !schedule.url || !schedule.start_time || 
          !schedule.end_time || !Array.isArray(schedule.days)) {
        console.error('Configuración inválida:', schedule);
        return res.status(400).json({ 
          error: 'Configuración de radio incompleta o inválida',
          schedule: schedule
        });
      }
    }

    // Crear directorio config si no existe
    const configDir = path.join(__dirname, '../../config');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Guardar la configuración en el archivo
    const configPath = path.join(configDir, 'radio_schedules.json');
    await fs.promises.writeFile(
      configPath,
      JSON.stringify(schedules, null, 2),
      'utf8'
    );

    res.json({ 
      success: true,
      message: 'Horarios actualizados correctamente',
      schedules: schedules
    });
  } catch (error: any) { // Tipamos el error como 'any' para acceder a sus propiedades
    console.error('Error al actualizar los horarios:', error);
    res.status(500).json({ 
      error: 'Error al guardar la configuración',
      details: error?.message || 'Error desconocido'
    });
  }
});

module.exports = router;