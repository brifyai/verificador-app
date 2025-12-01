const fs = require('fs');
const path = require('path');

// Leer el archivo .env para obtener la JWT_SECRET
const envPath = path.join(__dirname, '.env');
let jwtSecret = 'your-secret-key';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const secretMatch = envContent.match(/JWT_SECRET=(.+)/);
  if (secretMatch) {
    jwtSecret = secretMatch[1].trim();
  }
}

console.log('JWT_SECRET encontrada:', jwtSecret);

// Generar un token válido para el usuario admin
const jwt = require('jsonwebtoken');

const payload = {
  id: 'admin-user-id',
  email: 'admin@example.com',
  role: 'admin'
};

const token = jwt.sign(payload, jwtSecret, { expiresIn: '24h' });

console.log('\n🎫 Token JWT válido generado:');
console.log(token);
console.log('\n📋 Copia este token para usarlo en las pruebas');

// También crear un archivo con el token
const tokenFile = path.join(__dirname, 'valid-token.txt');
fs.writeFileSync(tokenFile, token);
console.log(`\n✅ Token guardado en: ${tokenFile}`);