import type { Request, Response } from 'express';
const express = require('express');
const updateScheduleRouter = require('./update-schedule');

const app = express();
const port = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));

// Middleware para logging
app.use((req: Request, res: Response, next: any) => {
  console.log('Request recibida:', {
    method: req.method,
    path: req.path,
    contentType: req.headers['content-type']
  });
  next();
});

// Manejador para la ruta raíz
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'API de programación de radio activa' });
});

// Montar el router de actualización de horarios
app.use(updateScheduleRouter);

// Manejador para rutas no encontradas
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});