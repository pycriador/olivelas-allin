import { Task, DayOfWeek } from '@/types';

let idCounter = 0;
const id = () => `task-${++idCounter}`;

export const DEFAULT_MORNING_TASKS: Omit<Task, 'id' | 'status' | 'date'>[] = [
  { title: 'Lavar louça deixada ontem', category: 'morning', estimatedMinutes: 5 },
  { title: 'Levar lixo separado', category: 'morning', estimatedMinutes: 3 },
  { title: 'Guardar itens fora do lugar', category: 'morning', estimatedMinutes: 5 },
  { title: 'Arrumar a cama', category: 'morning', estimatedMinutes: 2 },
  { title: 'Limpar bancada da cozinha', category: 'morning', estimatedMinutes: 3 },
];

export const DEFAULT_EVENING_TASKS: Omit<Task, 'id' | 'status' | 'date'>[] = [
  { title: 'Deixar louça de molho', category: 'evening', estimatedMinutes: 2, chainToNextDay: 'Lavar louça deixada ontem' },
  { title: 'Separar lixo reciclável', category: 'evening', estimatedMinutes: 3, chainToNextDay: 'Levar lixo separado' },
  { title: 'Preparar roupas do próximo dia', category: 'evening', estimatedMinutes: 3 },
  { title: 'Varredura rápida da cozinha', category: 'evening', estimatedMinutes: 5 },
  { title: 'Organizar itens da sala', category: 'evening', estimatedMinutes: 3 },
];

export const WEEKLY_TASKS: Record<DayOfWeek, Omit<Task, 'id' | 'status' | 'date'>[]> = {
  monday: [
    { title: 'Limpar espelho do banheiro', category: 'weekly', estimatedMinutes: 3, dayOfWeek: 'monday' },
    { title: 'Limpar vaso sanitário', category: 'weekly', estimatedMinutes: 5, dayOfWeek: 'monday' },
    { title: 'Organizar bancada do banheiro', category: 'weekly', estimatedMinutes: 3, dayOfWeek: 'monday' },
  ],
  tuesday: [
    { title: 'Limpar fogão', category: 'weekly', estimatedMinutes: 5, dayOfWeek: 'tuesday' },
    { title: 'Limpar micro-ondas', category: 'weekly', estimatedMinutes: 3, dayOfWeek: 'tuesday' },
    { title: 'Organizar geladeira', category: 'weekly', estimatedMinutes: 5, dayOfWeek: 'tuesday' },
  ],
  wednesday: [
    { title: 'Aspirar sofá', category: 'weekly', estimatedMinutes: 5, dayOfWeek: 'wednesday' },
    { title: 'Limpar mesa de centro', category: 'weekly', estimatedMinutes: 2, dayOfWeek: 'wednesday' },
    { title: 'Organizar estante', category: 'weekly', estimatedMinutes: 5, dayOfWeek: 'wednesday' },
  ],
  thursday: [
    { title: 'Trocar lençóis', category: 'weekly', estimatedMinutes: 5, dayOfWeek: 'thursday' },
    { title: 'Organizar guarda-roupa', category: 'weekly', estimatedMinutes: 5, dayOfWeek: 'thursday' },
    { title: 'Limpar criado-mudo', category: 'weekly', estimatedMinutes: 2, dayOfWeek: 'thursday' },
  ],
  friday: [
    { title: 'Limpar área dos pets', category: 'weekly', estimatedMinutes: 5, dayOfWeek: 'friday' },
    { title: 'Organizar brinquedos', category: 'weekly', estimatedMinutes: 3, dayOfWeek: 'friday' },
  ],
  saturday: [
    { title: 'Passar pano no chão', category: 'weekly', estimatedMinutes: 10, dayOfWeek: 'saturday' },
    { title: 'Limpar janelas', category: 'weekly', estimatedMinutes: 5, dayOfWeek: 'saturday' },
    { title: 'Aspirar tapetes', category: 'weekly', estimatedMinutes: 5, dayOfWeek: 'saturday' },
  ],
  sunday: [
    { title: 'Verificar produtos de limpeza', category: 'weekly', estimatedMinutes: 3, dayOfWeek: 'sunday' },
    { title: 'Planejar semana', category: 'weekly', estimatedMinutes: 5, dayOfWeek: 'sunday' },
  ],
};

export const LAUNDRY_SCHEDULE: Record<DayOfWeek, string> = {
  monday: 'Roupas gerais',
  tuesday: 'Toalhas',
  wednesday: 'Roupa de cama',
  thursday: 'Roupas delicadas / bebê',
  friday: 'Roupas de pets',
  saturday: 'Extra',
  sunday: 'Descanso 😌',
};

export const LAUNDRY_TASKS: Record<DayOfWeek, Omit<Task, 'id' | 'status' | 'date'>[]> = {
  monday: [
    { title: 'Separar roupas gerais', category: 'laundry', estimatedMinutes: 3, dayOfWeek: 'monday', chainToNextDay: 'Estender roupas gerais' },
    { title: 'Colocar na máquina', category: 'laundry', estimatedMinutes: 2, dayOfWeek: 'monday' },
    { title: 'Estender/secar', category: 'laundry', estimatedMinutes: 5, dayOfWeek: 'monday' },
  ],
  tuesday: [
    { title: 'Recolher toalhas usadas', category: 'laundry', estimatedMinutes: 2, dayOfWeek: 'tuesday' },
    { title: 'Lavar toalhas', category: 'laundry', estimatedMinutes: 2, dayOfWeek: 'tuesday' },
    { title: 'Colocar toalhas limpas', category: 'laundry', estimatedMinutes: 3, dayOfWeek: 'tuesday' },
  ],
  wednesday: [
    { title: 'Tirar roupa de cama', category: 'laundry', estimatedMinutes: 3, dayOfWeek: 'wednesday' },
    { title: 'Lavar roupa de cama', category: 'laundry', estimatedMinutes: 2, dayOfWeek: 'wednesday' },
    { title: 'Colocar roupa de cama limpa', category: 'laundry', estimatedMinutes: 5, dayOfWeek: 'wednesday' },
  ],
  thursday: [
    { title: 'Separar roupas delicadas', category: 'laundry', estimatedMinutes: 3, dayOfWeek: 'thursday' },
    { title: 'Lavar no modo delicado', category: 'laundry', estimatedMinutes: 2, dayOfWeek: 'thursday' },
  ],
  friday: [
    { title: 'Lavar roupas/caminhas dos pets', category: 'laundry', estimatedMinutes: 5, dayOfWeek: 'friday' },
  ],
  saturday: [
    { title: 'Lavagem extra se necessário', category: 'laundry', estimatedMinutes: 5, dayOfWeek: 'saturday' },
    { title: 'Dobrar e guardar roupas da semana', category: 'laundry', estimatedMinutes: 10, dayOfWeek: 'saturday' },
  ],
  sunday: [],
};

export const PET_DAILY_TASKS: Omit<Task, 'id' | 'status' | 'date'>[] = [
  { title: 'Trocar água dos pets', category: 'pet', estimatedMinutes: 2 },
  { title: 'Alimentar pets', category: 'pet', estimatedMinutes: 3 },
  { title: 'Limpar área de alimentação', category: 'pet', estimatedMinutes: 2 },
  { title: 'Recolher pelos visíveis', category: 'pet', estimatedMinutes: 3 },
];

export const PET_WEEKLY_TASKS: Record<string, Omit<Task, 'id' | 'status' | 'date'>[]> = {
  friday: [
    { title: 'Limpeza profunda área dos pets', category: 'pet', estimatedMinutes: 10, dayOfWeek: 'friday' },
    { title: 'Lavar comedouros e bebedouros', category: 'pet', estimatedMinutes: 5, dayOfWeek: 'friday' },
    { title: 'Lavar brinquedos dos pets', category: 'pet', estimatedMinutes: 5, dayOfWeek: 'friday' },
  ],
};

export const BABY_DAILY_TASKS: Omit<Task, 'id' | 'status' | 'date'>[] = [
  { title: 'Higienizar superfícies tocáveis', category: 'baby', estimatedMinutes: 5 },
  { title: 'Verificar itens do bebê', category: 'baby', estimatedMinutes: 3 },
  { title: 'Organizar fraldas e produtos', category: 'baby', estimatedMinutes: 2 },
];

export function generateId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
