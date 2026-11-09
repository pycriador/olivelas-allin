/**
 * SUPABASE DATABASE SERVICE
 * Camada unificada de persistência e operações CRUD no PostgreSQL do Supabase
 */

class DatabaseService {
  static get client() {
    return window.supabaseClient || null;
  }

  // ==========================================================================
  // PACIENTES (CRUD)
  // ==========================================================================
  static patients = {
    async getAll() {
      const client = DatabaseService.client;
      if (client) {
        try {
          const { data, error } = await client
            .from('patients')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && data && data.length > 0) {
            // Mapeia colunas para o padrão da aplicação
            const mapped = data.map(p => ({
              id: p.id,
              name: p.name,
              cpf: p.cpf || '',
              phone: p.phone || '',
              email: p.email || '',
              address: p.address || {},
              status: p.status || 'active',
              notes: p.notes || '',
              lastAppointment: p.last_appointment || '—',
              createdAt: p.created_at
            }));
            // Atualiza cache local
            StorageService.set('patients', mapped);
            return mapped;
          }
        } catch (err) {
          console.warn('Falha na consulta Supabase (patients), usando cache:', err);
        }
      }
      return StorageService.get('patients', []);
    },

    async getById(id) {
      const client = DatabaseService.client;
      if (client) {
        try {
          const { data, error } = await client
            .from('patients')
            .select('*')
            .eq('id', id)
            .single();

          if (!error && data) {
            return {
              id: data.id,
              name: data.name,
              cpf: data.cpf || '',
              phone: data.phone || '',
              email: data.email || '',
              address: data.address || {},
              status: data.status || 'active',
              notes: data.notes || '',
              lastAppointment: data.last_appointment || '—',
              createdAt: data.created_at
            };
          }
        } catch (err) {
          console.warn(`Falha na busca do paciente ${id} no Supabase:`, err);
        }
      }
      const list = StorageService.get('patients', []);
      return list.find(p => p.id === id) || null;
    },

    async save(patientData) {
      const client = DatabaseService.client;
      const list = StorageService.get('patients', []);
      let isNew = !patientData.id;

      if (isNew) {
        patientData.id = 'PAT-' + String(list.length + 1).padStart(3, '0');
        patientData.lastAppointment = '—';
      }

      // 1. Persistência no Supabase
      if (client) {
        try {
          const payload = {
            id: patientData.id,
            name: patientData.name,
            cpf: patientData.cpf || null,
            phone: patientData.phone || null,
            email: patientData.email || null,
            address: patientData.address || {},
            status: patientData.status || 'active',
            notes: patientData.notes || null,
            last_appointment: patientData.lastAppointment || null,
            updated_at: new Date().toISOString()
          };

          const { error } = await client
            .from('patients')
            .upsert(payload, { onConflict: 'id' });

          if (error) {
            console.error('Erro ao salvar paciente no Supabase:', error);
          } else {
            console.info(`Paciente ${patientData.id} gravado com sucesso no Supabase.`);
          }
        } catch (err) {
          console.error('Exceção ao gravar paciente no Supabase:', err);
        }
      }

      // 2. Atualização no cache local
      if (isNew) {
        list.unshift(patientData);
      } else {
        const index = list.findIndex(p => p.id === patientData.id);
        if (index !== -1) list[index] = { ...list[index], ...patientData };
      }
      StorageService.set('patients', list);
      StorageService.logActivity(isNew ? 'CREATE_PATIENT' : 'UPDATE_PATIENT', `Paciente: ${patientData.name}`, patientData.id);

      return { success: true, patient: patientData, isNew };
    },

    async delete(id) {
      const client = DatabaseService.client;
      if (client) {
        try {
          const { error } = await client
            .from('patients')
            .delete()
            .eq('id', id);

          if (error) console.error('Erro ao excluir paciente no Supabase:', error);
          else console.info(`Paciente ${id} removido do Supabase.`);
        } catch (err) {
          console.error('Exceção ao excluir paciente no Supabase:', err);
        }
      }

      const list = StorageService.get('patients', []);
      const patient = list.find(p => p.id === id);
      const filtered = list.filter(p => p.id !== id);
      StorageService.set('patients', filtered);
      if (patient) {
        StorageService.logActivity('DELETE_PATIENT', `Paciente removido: ${patient.name}`, id);
      }
      return true;
    }
  };

  // ==========================================================================
  // AGENDAMENTOS (CRUD)
  // ==========================================================================
  static appointments = {
    async getAll() {
      const client = DatabaseService.client;
      if (client) {
        try {
          const { data, error } = await client
            .from('appointments')
            .select('*')
            .order('date', { ascending: false });

          if (!error && data && data.length > 0) {
            const mapped = data.map(a => ({
              id: a.id,
              date: a.date,
              time: a.time,
              duration: a.duration || '30 min',
              patientId: a.patient_id,
              patientName: a.patient_name,
              service: a.service,
              professional: a.professional || 'Dra. Marta Gelsi Dias',
              status: a.status || 'confirmed',
              origin: a.origin || 'Online',
              notes: a.notes || '',
              googleEventId: a.google_event_id,
              createdAt: a.created_at
            }));
            StorageService.set('appointments', mapped);
            return mapped;
          }
        } catch (err) {
          console.warn('Falha na consulta Supabase (appointments):', err);
        }
      }
      return StorageService.get('appointments', []);
    },

    async save(aptData) {
      const client = DatabaseService.client;
      const list = StorageService.get('appointments', []);
      let isNew = !aptData.id;

      if (isNew) {
        aptData.id = 'APT-' + String(list.length + 1).padStart(3, '0');
        aptData.googleEventId = 'google-event-' + Date.now();
      }

      if (client) {
        try {
          const payload = {
            id: aptData.id,
            date: aptData.date,
            time: aptData.time,
            duration: aptData.duration || '30 min',
            patient_id: aptData.patientId || null,
            patient_name: aptData.patientName,
            service: aptData.service,
            professional: aptData.professional || 'Dra. Marta Gelsi Dias',
            status: aptData.status || 'confirmed',
            origin: aptData.origin || 'Online',
            notes: aptData.notes || null,
            google_event_id: aptData.googleEventId || null,
            updated_at: new Date().toISOString()
          };

          const { error } = await client
            .from('appointments')
            .upsert(payload, { onConflict: 'id' });

          if (error) console.error('Erro ao salvar agendamento no Supabase:', error);
          else console.info(`Agendamento ${aptData.id} gravado no Supabase.`);
        } catch (err) {
          console.error('Exceção ao gravar agendamento no Supabase:', err);
        }
      }

      if (isNew) {
        list.unshift(aptData);
      } else {
        const index = list.findIndex(a => a.id === aptData.id);
        if (index !== -1) list[index] = { ...list[index], ...aptData };
      }
      StorageService.set('appointments', list);
      StorageService.logActivity(isNew ? 'CREATE_APPOINTMENT' : 'UPDATE_APPOINTMENT', `Consulta: ${aptData.patientName} (${aptData.service})`, aptData.id);

      return { success: true, appointment: aptData, isNew };
    },

    async updateStatus(id, newStatus) {
      const client = DatabaseService.client;
      if (client) {
        try {
          const { error } = await client
            .from('appointments')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', id);

          if (error) console.error('Erro ao atualizar status no Supabase:', error);
        } catch (err) {
          console.error('Exceção ao atualizar status no Supabase:', err);
        }
      }

      const list = StorageService.get('appointments', []);
      const apt = list.find(a => a.id === id);
      if (apt) {
        apt.status = newStatus;
        StorageService.set('appointments', list);
        StorageService.logActivity('UPDATE_APPOINTMENT_STATUS', `Status '${newStatus}' no agendamento ${id}`, id);
        return true;
      }
      return false;
    },

    async delete(id) {
      const client = DatabaseService.client;
      if (client) {
        try {
          const { error } = await client
            .from('appointments')
            .delete()
            .eq('id', id);

          if (error) console.error('Erro ao excluir agendamento no Supabase:', error);
        } catch (err) {
          console.error('Exceção ao excluir agendamento no Supabase:', err);
        }
      }

      const list = StorageService.get('appointments', []);
      const apt = list.find(a => a.id === id);
      const filtered = list.filter(a => a.id !== id);
      StorageService.set('appointments', filtered);
      if (apt) {
        StorageService.logActivity('DELETE_APPOINTMENT', `Agendamento cancelado: ${apt.patientName}`, id);
      }
      return true;
    }
  };

  // ==========================================================================
  // SERVIÇOS (CRUD)
  // ==========================================================================
  static services = {
    async getAll() {
      const client = DatabaseService.client;
      if (client) {
        try {
          const { data, error } = await client.from('services').select('*').order('name');
          if (!error && data && data.length > 0) {
            StorageService.set('services', data);
            return data;
          }
        } catch (err) {
          console.warn('Falha na consulta Supabase (services):', err);
        }
      }
      const fallback = typeof initialMockData !== 'undefined' ? initialMockData.services : [];
      return StorageService.get('services', fallback);
    },

    async save(serviceData) {
      const client = DatabaseService.client;
      const fallback = typeof initialMockData !== 'undefined' ? initialMockData.services : [];
      const list = StorageService.get('services', fallback);
      let isNew = !serviceData.id;

      if (isNew) {
        serviceData.id = 'SRV-' + String(list.length + 1).padStart(3, '0');
      }

      if (client) {
        try {
          const { error } = await client
            .from('services')
            .upsert(serviceData, { onConflict: 'id' });

          if (error) console.error('Erro ao salvar serviço no Supabase:', error);
        } catch (err) {
          console.error('Exceção ao gravar serviço no Supabase:', err);
        }
      }

      if (isNew) list.push(serviceData);
      else {
        const idx = list.findIndex(s => s.id === serviceData.id);
        if (idx !== -1) list[idx] = serviceData;
      }
      StorageService.set('services', list);
      return { success: true, service: serviceData, isNew };
    },

    async delete(id) {
      const client = DatabaseService.client;
      if (client) {
        try {
          await client.from('services').delete().eq('id', id);
        } catch (err) {
          console.error(err);
        }
      }
      const fallback = typeof initialMockData !== 'undefined' ? initialMockData.services : [];
      const list = StorageService.get('services', fallback).filter(s => s.id !== id);
      StorageService.set('services', list);
      return true;
    }
  };

  // ==========================================================================
  // PLANOS (CRUD)
  // ==========================================================================
  static plans = {
    async getAll() {
      const client = DatabaseService.client;
      if (client) {
        try {
          const { data, error } = await client.from('plans').select('*').order('name');
          if (!error && data && data.length > 0) {
            StorageService.set('plans', data);
            return data;
          }
        } catch (err) {
          console.warn('Falha na consulta Supabase (plans):', err);
        }
      }
      const fallback = typeof initialMockData !== 'undefined' ? initialMockData.plans : [];
      return StorageService.get('plans', fallback);
    },

    async save(planData) {
      const client = DatabaseService.client;
      const fallback = typeof initialMockData !== 'undefined' ? initialMockData.plans : [];
      const list = StorageService.get('plans', fallback);
      let isNew = !planData.id;

      if (isNew) {
        planData.id = 'PLN-' + String(list.length + 1).padStart(3, '0');
      }

      // Normaliza features/services para consistência
      if (planData.features && !planData.services) planData.services = planData.features;
      if (planData.services && !planData.features) planData.features = planData.services;

      if (client) {
        try {
          // No banco salvamos payload compatível com schema SQL
          const dbPayload = {
            id: planData.id,
            name: planData.name,
            category: planData.category || planData.periodicity || 'Mensal',
            price: planData.price || 'Consultar',
            description: planData.description || '',
            features: Array.isArray(planData.features) ? planData.features : (planData.features ? [planData.features] : []),
            status: planData.status || (planData.active !== false ? 'active' : 'inactive')
          };
          await client.from('plans').upsert(dbPayload, { onConflict: 'id' });
        } catch (err) {
          console.error(err);
        }
      }

      if (isNew) list.push(planData);
      else {
        const idx = list.findIndex(p => p.id === planData.id);
        if (idx !== -1) list[idx] = planData;
      }
      StorageService.set('plans', list);
      return { success: true, plan: planData, isNew };
    },

    async delete(id) {
      const client = DatabaseService.client;
      if (client) {
        try {
          await client.from('plans').delete().eq('id', id);
        } catch (err) {
          console.error(err);
        }
      }
      const fallback = typeof initialMockData !== 'undefined' ? initialMockData.plans : [];
      const list = StorageService.get('plans', fallback).filter(p => p.id !== id);
      StorageService.set('plans', list);
      return true;
    }
  };

  // ==========================================================================
  // CONFIGURAÇÕES DA CLÍNICA
  // ==========================================================================
  static settings = {
    async get() {
      const client = DatabaseService.client;
      if (client) {
        try {
          const { data, error } = await client.from('clinic_settings').select('*').eq('id', 'main').single();
          if (!error && data) {
            StorageService.set('settings', data);
            return data;
          }
        } catch (err) {
          console.warn('Falha ao obter configurações no Supabase:', err);
        }
      }
      const fallback = typeof initialMockData !== 'undefined' ? initialMockData.settings : {};
      return StorageService.get('settings', fallback);
    },

    async save(settingsData) {
      const client = DatabaseService.client;
      const current = StorageService.get('settings', typeof initialMockData !== 'undefined' ? initialMockData.settings : {});
      const payload = { id: 'main', ...current, ...settingsData, updated_at: new Date().toISOString() };
      if (client) {
        try {
          await client.from('clinic_settings').upsert(payload, { onConflict: 'id' });
        } catch (err) {
          console.error(err);
        }
      }
      StorageService.set('settings', payload);
      return true;
    }
  };
}

window.DatabaseService = DatabaseService;
