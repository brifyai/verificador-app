const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qvdnepdcgzhadvaktdhq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2ZG5lcGRjZ3poYWR2YWt0ZGhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5NzI0NzQsImV4cCI6MjA0ODU0ODQ3NH0.4U2uxC8eQqXJ3kMJlCJtMDhLHEt8f2mYxmdOxmLBnP0'
);

async function checkRadios() {
  console.log('🔍 Verificando radios en tabla...');
  
  try {
    // Buscar radios específicas
    const { data: radio1, error: error1 } = await supabase
      .from('radios')
      .select('id, name, region')
      .eq('id', 'mijm9xci')
      .single();
    
    console.log('Radio mijm9xci:', radio1);
    if (error1) console.log('Error mijm9xci:', error1.message);
    
    const { data: radio2, error: error2 } = await supabase
      .from('radios')
      .select('id, name, region')
      .eq('id', 'mijm9xsi')
      .single();
    
    console.log('Radio mijm9xsi:', radio2);
    if (error2) console.log('Error mijm9xsi:', error2.message);
    
    // Listar algunas radios para ver el formato
    const { data: allRadios, error: error3 } = await supabase
      .from('radios')
      .select('id, name, region')
      .limit(5);
    
    console.log('\nAlgunas radios existentes:');
    allRadios?.forEach(radio => {
      console.log(`- ID: "${radio.id}" | Nombre: "${radio.name}" | Región: "${radio.region}"`);
    });
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

checkRadios();