
// Función para obtener datos completos de radio con URLs válidas
function getRadioData(radioId) {
  const validUrls = {
  "radio1": {
    "name": "Radio Cooperativa",
    "streamUrl": "http://playerservices.streamtheworld.com/api/livestream-redirect/COOPERATIVAAAC.aac",
    "region": "RM"
  },
  "radio2": {
    "name": "Radio Bío Bío",
    "streamUrl": "http://playerservices.streamtheworld.com/api/livestream-redirect/BIOBIOAAC.aac",
    "region": "RM"
  },
  "radio3": {
    "name": "Radio Duna",
    "streamUrl": "http://playerservices.streamtheworld.com/api/livestream-redirect/DUNAAAC.aac",
    "region": "RM"
  },
  "radio4": {
    "name": "Radio Concierto",
    "streamUrl": "http://playerservices.streamtheworld.com/api/livestream-redirect/CONCIERTOAAC.aac",
    "region": "RM"
  }
};
  
  return validUrls[radioId] || {
    id: radioId,
    name: `Radio ${radioId}`,
    streamUrl: 'http://playerservices.streamtheworld.com/api/livestream-redirect/COOPERATIVAAAC.aac',
    region: 'RM'
  };
}

// Actualizar el endpoint para usar URLs válidas
// En app/api/monitoring/start/route.ts línea ~120
const radios = radioIds.map(radioId => {
  const radioData = getRadioData(radioId);
  return {
    id: radioId,
    name: radioData.name,
    streamUrl: radioData.streamUrl,
    region: radioData.region,
    hasValidUrl: true
  };
});
