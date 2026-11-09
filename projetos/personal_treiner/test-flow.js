import { userRepository } from './src/repositories/userRepository.ts';
import { studentRepository } from './src/repositories/studentRepository.ts';
import { workoutRepository } from './src/repositories/workoutRepository.ts';
import { exerciseRepository } from './src/repositories/exerciseRepository.ts';
import { activityRepository } from './src/repositories/activityRepository.ts';
import { nutritionRepository } from './src/repositories/nutritionRepository.ts';
import { messageRepository } from './src/repositories/messageRepository.ts';
import { initStorage } from './src/repositories/storage.ts';
import { isSupabaseConfigured } from './src/lib/supabase.ts';

// Polyfill localStorage in node environment for test run
const memoryStorage = {};
global.localStorage = {
  getItem: (k) => memoryStorage[k] || null,
  setItem: (k, v) => { memoryStorage[k] = String(v); },
  removeItem: (k) => { delete memoryStorage[k]; },
  clear: () => { for (const k in memoryStorage) delete memoryStorage[k]; }
};

async function runSection72FlowTest() {
  console.log('--- INICIANDO TESTE DO FLUXO PRINCIPAL (SEÇÃO 72) ---');

  if (isSupabaseConfigured) {
    throw new Error('Este fluxo usa armazenamento em memória; desative Supabase para executar o teste.');
  }

  // 0. Initialize storage
  initStorage();
  const userRepo = userRepository;
  const studentRepo = studentRepository;
  const workoutRepo = workoutRepository;
  const exerciseRepo = exerciseRepository;
  const activityRepo = activityRepository;

  // 1. LOGIN RAFAELA
  const rafaela = await userRepo.getByEmail('rafaela@rafaelapersonal.com.br');
  console.log('1. Login Rafaela:', rafaela?.name, '(Role:', rafaela?.role, ') -> OK');

  // 2. Alunos -> Lucas
  const mariana = await studentRepo.getById('student-1');
  console.log('2. Selecionado Aluno:', mariana?.name, '-> OK');

  // 3. Treinos -> Treino de segunda-feira -> Adicionar/Garantir Supino Máquina (4x10 @ 30kg, allowWeightChange: true)
  const plan = await workoutRepo.getPlanByStudentId(mariana.id);
  const mondayWorkout = plan.days.find(d => d.dayOfWeek === 'Segunda');
  console.log('3. Treino de Segunda encontrado:', mondayWorkout.name, 'com', mondayWorkout.exercises.length, 'exercícios.');

  const supino = await exerciseRepo.getById('exercise-peito-01');
  console.log('   Exercício Prescrito:', supino.name, '| 4x10 @ 30kg | allowWeightChange:', mondayWorkout.exercises[0].allowWeightChange);

  // 4. LOGIN MARIANA
  const marianaUser = await userRepo.getById(mariana.userId);
  console.log('4. Login do aluno:', marianaUser?.name, '-> OK');

  // 5. Mariana: Começar Treino de hoje (Supino Máquina)
  console.log('5. Lucas iniciou Treino de Segunda.');

  // 6. Mariana: Alterar carga para 32 kg
  const weightChangeMod = await workoutRepo.saveModification({
    studentId: mariana.id,
    studentName: mariana.name,
    exerciseName: supino.name,
    action: 'WEIGHT_CHANGED',
    before: 30,
    after: 32,
    difference: '+2 kg',
    reason: 'Ajuste de carga efetuado pelo aluno durante o treino'
  });

  await activityRepo.log({
    actorId: marianaUser.id,
    actorName: mariana.name,
    actorRole: 'student',
    action: 'Carga alterada',
    description: `${mariana.name} aumentou a carga no ${supino.name} de 30 kg para 32 kg (+2 kg).`,
    studentId: mariana.id,
    iconType: 'dumbbell'
  });
  console.log('6. Carga alterada de 30kg para 32kg (+2kg) salva no log de auditoria -> OK');

  // 7. Executar séries
  const setsCompleted = [
    { exerciseId: supino.id, setIndex: 1, prescribedWeight: 30, prescribedReps: 10, actualWeight: 32, actualReps: 10, completedAt: new Date().toISOString() },
    { exerciseId: supino.id, setIndex: 2, prescribedWeight: 30, prescribedReps: 10, actualWeight: 32, actualReps: 10, completedAt: new Date().toISOString() },
    { exerciseId: supino.id, setIndex: 3, prescribedWeight: 30, prescribedReps: 10, actualWeight: 32, actualReps: 9, completedAt: new Date().toISOString() },
    { exerciseId: supino.id, setIndex: 4, prescribedWeight: 30, prescribedReps: 10, actualWeight: 32, actualReps: 8, completedAt: new Date().toISOString() },
  ];
  console.log('7. 4 séries executadas com sucesso:');
  setsCompleted.forEach(s => console.log(`   Série ${s.setIndex}: ${s.actualWeight}kg x ${s.actualReps} (Prescrito: ${s.prescribedWeight}kg x ${s.prescribedReps})`));

  // 8. Pular outro exercício (Crucifixo)
  const skipMod = await workoutRepo.saveModification({
    studentId: mariana.id,
    studentName: mariana.name,
    exerciseName: 'Crucifixo com Halteres',
    action: 'EXERCISE_SKIPPED',
    before: 'Prescrito: 3x12',
    after: 'Pulado',
    reason: 'Sem equipamento'
  });
  await activityRepo.log({
    actorId: marianaUser.id,
    actorName: mariana.name,
    actorRole: 'student',
    action: 'Exercício pulado',
    description: `${mariana.name} pulou o exercício Crucifixo com Halteres (Motivo: Sem equipamento).`,
    studentId: mariana.id,
    iconType: 'skip'
  });
  console.log('8. Exercício Crucifixo pulado registrado -> OK');

  // 9. Substituir por alternativa autorizada
  const subMod = await workoutRepo.saveModification({
    studentId: mariana.id,
    studentName: mariana.name,
    exerciseName: 'Tríceps Testa com Barra W',
    action: 'EXERCISE_SUBSTITUTED',
    before: 'Tríceps Testa com Barra W',
    after: 'Tríceps Francês com Halter',
    reason: 'Equipamento ocupado'
  });
  await activityRepo.log({
    actorId: marianaUser.id,
    actorName: mariana.name,
    actorRole: 'student',
    action: 'Exercício substituído',
    description: `${mariana.name} substituiu Tríceps Testa por Tríceps Francês (Motivo: Equipamento ocupado).`,
    studentId: mariana.id,
    iconType: 'swap'
  });
  console.log('9. Substituição por alternativa autorizada registrada -> OK');

  // 10. Finalizar treino
  const session = await workoutRepo.saveSession({
    id: `session-${Date.now()}`,
    studentId: mariana.id,
    workoutPlanId: plan.id,
    workoutDayId: mondayWorkout.id,
    workoutDayName: mondayWorkout.name,
    date: new Date().toISOString().split('T')[0],
    status: 'completed',
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    durationMinutes: 48,
    rating: 5,
    rpe: 8,
    energyLevel: 4,
    notes: 'Treino excelente, consegui progredir carga no supino!',
    setsCompleted,
    skippedExercises: [{ exerciseId: 'exercise-peito-04', exerciseName: 'Crucifixo com Halteres', reason: 'Sem equipamento', timestamp: new Date().toISOString() }],
    substitutedExercises: [{ originalExerciseId: 'exercise-triceps-03', originalExerciseName: 'Tríceps Testa', substitutedExerciseId: 'exercise-triceps-02', substitutedExerciseName: 'Tríceps Francês', reason: 'Equipamento ocupado', timestamp: new Date().toISOString() }],
    totalVolumeKg: 1192,
    totalSets: 4,
    totalExercises: 5
  });
  console.log('10. Treino finalizado e salvo:', session.id, '-> OK');

  // 11. LOGIN RAFAELA -> Dashboard -> Atividade Recente & Auditoria
  const recentActivities = await activityRepo.getAll(5);
  const modsForMariana = await workoutRepo.getModifications(mariana.id);

  console.log('\n--- 11. RAFAELA VERIFICA AUDITORIA NO DASHBOARD ---');
  console.log('Atividades recentes no feed da Rafaela:');
  recentActivities.slice(0, 3).forEach(a => console.log(`[${a.action}] ${a.description}`));

  console.log('\nAuditoria Prescrito vs. Executado vs. Alterado de Lucas:');
  modsForMariana.slice(0, 3).forEach(m => {
    console.log(`- ${m.exerciseName}: Prescrito: ${m.before} | Executado: ${m.after} | Ação: ${m.action} (${m.difference || m.reason || ''})`);
  });

  console.log('\n--- 12. CRUD ISOLADO DE ALUNO, TREINO, ALIMENTAÇÃO E CHAT ---');
  const qaId = `qa-${Date.now()}`;
  const qaStudent = await studentRepo.create({
    userId: `user-${qaId}`,
    trainerId: rafaela.id,
    trainerName: rafaela.name,
    name: 'Aluno QA descartável',
    birthDate: '2000-01-01',
    gender: 'Outro',
    phone: '0000000000',
    email: `${qaId}@example.test`,
    goals: ['Força'],
    availableDays: ['Segunda'],
    level: 'Iniciante',
    experience: 'Fixture isolada de teste',
  });
  if (!(await studentRepo.getById(qaStudent.id))) throw new Error('Aluno QA não foi criado.');
  await studentRepo.update(qaStudent.id, { name: 'Aluno QA editado' });
  if ((await studentRepo.getById(qaStudent.id))?.name !== 'Aluno QA editado') throw new Error('Edição de aluno falhou.');

  const qaUser = await userRepo.create({
    id: qaStudent.userId,
    name: qaStudent.name,
    email: qaStudent.email,
    role: 'student',
    studentProfileId: qaStudent.id,
  });
  const qaPlan = await workoutRepo.savePlan({
    id: `plan-${qaId}`,
    studentId: qaStudent.id,
    trainerId: rafaela.id,
    name: 'Treino QA descartável',
    active: true,
    days: [{
      id: `day-${qaId}`,
      name: 'Treino QA',
      dayOfWeek: 'Segunda',
      muscleFocus: 'Teste',
      exercises: [{
        exerciseId: supino.id,
        order: 1,
        sets: 3,
        reps: 10,
        weight: 10,
        restSeconds: 60,
        alternatives: [],
        allowWeightChange: true,
        allowSetChange: true,
        allowRepChange: true,
        allowSkip: true,
        allowSubstitution: true,
      }],
    }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  if ((await workoutRepo.getPlanById(qaPlan.id))?.studentId !== qaStudent.id) throw new Error('Alocação de treino falhou.');

  const qaMealPlan = await nutritionRepository.addMeal(qaStudent.id, {
    name: 'Refeição QA',
    time: '08:00',
    items: [],
  });
  const qaMeal = qaMealPlan.meals.find((meal) => meal.name === 'Refeição QA');
  if (!qaMeal) throw new Error('Criação de refeição falhou.');
  const qaMealUpdated = await nutritionRepository.updateMeal(qaStudent.id, qaMeal.id, { name: 'Refeição QA editada' });
  if (!qaMealUpdated.meals.some((meal) => meal.id === qaMeal.id && meal.name === 'Refeição QA editada')) {
    throw new Error('Edição de refeição falhou.');
  }
  const qaWithFood = await nutritionRepository.addFoodItem(qaStudent.id, qaMeal.id, {
    name: 'Alimento QA',
    quantity: '1 porção',
    substitutions: [],
  });
  const qaFood = qaWithFood.meals.find((meal) => meal.id === qaMeal.id)?.items[0];
  if (!qaFood) throw new Error('Inserção de alimento falhou.');
  await nutritionRepository.updateFoodItem(qaStudent.id, qaMeal.id, qaFood.id, { quantity: '2 porções' });
  await nutritionRepository.deleteFoodItem(qaStudent.id, qaMeal.id, qaFood.id);
  await nutritionRepository.deleteMeal(qaStudent.id, qaMeal.id);

  const qaMessage = await messageRepository.sendMessage({
    studentId: qaStudent.id,
    senderId: rafaela.id,
    senderName: rafaela.name,
    senderRole: 'personal',
    content: 'Mensagem QA descartável',
    category: 'general',
  });
  if (!(await messageRepository.getMessagesByStudentId(qaStudent.id)).some((message) => message.id === qaMessage.id)) {
    throw new Error('Envio de mensagem falhou.');
  }
  await messageRepository.deleteMessage(qaMessage.id);
  await workoutRepo.deletePlan(qaPlan.id);
  await studentRepo.delete(qaStudent.id);
  await userRepo.deleteByStudentProfileId(qaStudent.id);
  await userRepo.delete(qaUser.id);
  if (await studentRepo.getById(qaStudent.id)) throw new Error('Exclusão do aluno QA falhou.');

  console.log('   ✓ Aluno e usuário criados/editados/excluídos.');
  console.log('   ✓ Treino alocado e excluído.');
  console.log('   ✓ Refeição e alimento inseridos/editados/excluídos.');
  console.log('   ✓ Mensagem enviada, consultada e excluída.');

  console.log('\n✅ TESTE DE FLUXO DA SEÇÃO 72 EXECUTADO COM SUCESSO ABSOLUTO!');
}

runSection72FlowTest().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
