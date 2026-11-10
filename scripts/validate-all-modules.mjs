#!/usr/bin/env node
const endpoints = [
  { port: 5174, name: 'Olivelas All In (Console Principal)', path: '/' },
  { port: 4101, name: '1. agendamento_simples', path: '/pages/dashboard.html?allin_sso=1&company_id=emp-olivelas-matriz&instance_id=inst_emp-olivelas-matriz_allin_agendamento_simples' },
  { port: 4102, name: '2. agendamentos', path: '/dashboard?allin_sso=1&company_id=emp-olivelas-matriz&instance_id=inst_emp-olivelas-matriz_allin_agendamentos' },
  { port: 4103, name: '3. app_condominio', path: '/?allin_sso=1&company_id=emp-olivelas-matriz&instance_id=inst_emp-olivelas-matriz_allin_condominio' },
  { port: 4104, name: '4. art_hub', path: '/admin?allin_sso=1&company_id=emp-olivelas-matriz&instance_id=inst_emp-olivelas-matriz_allin_art_hub' },
  { port: 4105, name: '5. casa_organizada', path: '/?allin_sso=1&company_id=emp-olivelas-matriz&instance_id=inst_emp-olivelas-matriz_allin_casa_organizada' },
  { port: 4106, name: '6. contratos', path: '/dashboard?allin_sso=1&company_id=emp-olivelas-matriz&instance_id=inst_emp-olivelas-matriz_allin_contratos_automacao' },
  { port: 4107, name: '7. especificacoes', path: '/projects?allin_sso=1&company_id=emp-olivelas-matriz&instance_id=inst_emp-olivelas-matriz_allin_especificacoes' },
  { port: 4108, name: '8. gestao_estoque', path: '/dashboard?allin_sso=1&company_id=emp-olivelas-matriz&instance_id=inst_emp-olivelas-matriz_allin_gestao_estoque' },
  { port: 4109, name: '9. ordem_de_servico', path: '/dashboard?allin_sso=1&company_id=emp-olivelas-matriz&instance_id=inst_emp-olivelas-matriz_allin_ordem_servico' },
  { port: 4110, name: '10. personal_treiner', path: '/personal/dashboard?allin_sso=1&company_id=emp-olivelas-matriz&instance_id=inst_emp-olivelas-matriz_allin_personal_trainer' },
  { port: 4111, name: '11. restaurante', path: '/app?allin_sso=1&company_id=emp-olivelas-matriz&instance_id=inst_emp-olivelas-matriz_allin_restaurante' },
  { port: 4112, name: '12. rifas', path: '/admin/dashboard?allin_sso=1&company_id=emp-olivelas-matriz&instance_id=inst_emp-olivelas-matriz_allin_rifas' },
  { port: 4113, name: '13. sistema_delivery', path: '/app/orders?allin_sso=1&company_id=emp-olivelas-matriz&instance_id=inst_emp-olivelas-matriz_allin_delivery' },
  { port: 4114, name: '14. sistema_mercado', path: '/admin/dashboard?allin_sso=1&company_id=emp-olivelas-matriz&instance_id=inst_emp-olivelas-matriz_allin_mercado' },
  { port: 4115, name: '15. suite_rifa', path: '/dashboard?allin_sso=1&company_id=emp-olivelas-matriz&instance_id=inst_emp-olivelas-matriz_allin_suite_rifa' },
  { port: 4116, name: '16. vitrine_digital', path: '/?view=analyzer&allin_sso=1&company_id=emp-olivelas-matriz&instance_id=inst_emp-olivelas-matriz_allin_vitrine_digital' },
];

let failed = 0;
for (const ep of endpoints) {
  const url = `http://localhost:${ep.port}${ep.path}`;
  try {
    const res = await fetch(url);
    const body = await res.text();
    const hasSsoBootstrap = ep.port === 5174 ? true : body.includes('olivelas-allin-sso-bootstrap');
    const ok = res.status === 200 && hasSsoBootstrap && body.length > 200;
    if (!ok) failed++;
    console.log(
      `${ok ? '✅' : '❌'} [HTTP ${res.status}] ${ep.name.padEnd(36)} -> ${url.split('?')[0]} (${body.length} bytes, SSO=${hasSsoBootstrap})`,
    );
  } catch (err) {
    failed++;
    console.error(`❌ [ERR] ${ep.name} -> ${err.message}`);
  }
}

if (failed > 0) {
  process.exit(1);
}
console.log('\n🎉 Todos os 16 projetos + Console Olivelas All In validados com HTTP 200 e SSO ativo!');
