// Script para testar API do Supabase
// Execute no console do navegador para testar

async function testAPI() {
  console.log('🧪 Testando API do Supabase...');
  
  try {
    // Testar listar profiles
    console.log('📋 Testando listar profiles...');
    const profiles = await api.profiles.list('c0f89fbe-48b4-4d9f-a718-2031fc98c587');
    console.log('✅ Profiles:', profiles);
    
    // Testar criar profile
    console.log('👤 Testando criar profile...');
    const newProfile = await api.profiles.create({
      clinic_id: 'c0f89fbe-48b4-4d9f-a718-2031fc98c587',
      full_name: 'Teste Funcionário',
      email: 'teste@clinica.local'
    });
    console.log('✅ Profile criado:', newProfile);
    
    // Testar criar user role
    console.log('🔐 Testando criar user role...');
    const userRole = await api.userRoles.create({
      user_id: newProfile.id,
      clinic_id: 'c0f89fbe-48b4-4d9f-a718-2031fc98c587',
      role: 'doctor'
    });
    console.log('✅ User role criado:', userRole);
    
    console.log('🎉 Todos os testes passaram!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    console.error('Detalhes:', error.message);
  }
}

// Para executar: testAPI()
console.log('Script carregado. Execute testAPI() para testar a API.');
