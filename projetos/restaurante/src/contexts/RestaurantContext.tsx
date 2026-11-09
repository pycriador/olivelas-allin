import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { restaurantService, type CreateRestaurantInput } from '@/services/restaurantService';
import type { Restaurant, RestaurantMember, RoleId } from '@/types/restaurant';
import { isGlobalAdminEmail } from '@/constants/admin';
import { supabase } from '@/lib/supabase';
import { RestaurantContext } from './restaurant-context';

const ACTIVE_RESTAURANT_KEY = 'olivelas_active_restaurant_id';

const ROLE_PERMISSIONS: Record<RoleId, string[]> = {
  restaurant_admin: ['*'],
  manager: [
    'restaurant.view',
    'restaurant.update',
    'users.view',
    'products.view',
    'products.create',
    'products.update',
    'products.delete',
    'tables.view',
    'tables.create',
    'tables.update',
    'tables.delete',
    'orders.view',
    'orders.create',
    'orders.update',
    'orders.cancel',
    'kitchen.view',
    'kitchen.update',
    'cashier.view',
  ],
  waiter: [
    'restaurant.view',
    'tables.view',
    'orders.view',
    'orders.create',
    'orders.update',
    'products.view',
  ],
  kitchen: [
    'restaurant.view',
    'kitchen.view',
    'kitchen.update',
    'orders.view',
  ],
  cashier: [
    'restaurant.view',
    'tables.view',
    'orders.view',
    'cashier.view',
    'cashier.update',
  ],
};

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [currentRestaurant, setCurrentRestaurantState] = useState<Restaurant | null>(null);
  const [currentMember, setCurrentMember] = useState<RestaurantMember | null>(null);
  const [isFetchingRestaurants, setIsFetchingRestaurants] = useState(true);
  const [isDbGlobalAdmin, setIsDbGlobalAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!user) {
      setIsDbGlobalAdmin(false);
      return;
    }
    if (isGlobalAdminEmail(user.email)) {
      setIsDbGlobalAdmin(true);
      return;
    }

    const checkGlobalAdminRole = async () => {
      try {
        const { data } = await supabase
          .from('user_platform_roles')
          .select('role_id')
          .eq('user_id', user.id)
          .eq('role_id', 'global_admin')
          .eq('status', 'active')
          .maybeSingle();

        if (isMounted) {
          setIsDbGlobalAdmin(Boolean(data));
        }
      } catch {
        if (isMounted) setIsDbGlobalAdmin(false);
      }
    };

    void checkGlobalAdminRole();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const isGlobalAdmin = Boolean(user?.email && isGlobalAdminEmail(user.email)) || isDbGlobalAdmin;

  const fetchRestaurantsForUser = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      setRestaurants([]);
      setCurrentRestaurantState(null);
      setCurrentMember(null);
      setIsFetchingRestaurants(false);
      return;
    }

    setIsFetchingRestaurants(true);
    try {
      const isSuper = isGlobalAdminEmail(user.email) || isDbGlobalAdmin;
      const { data } = await restaurantService.getUserRestaurants(user.id, isSuper);
      const activeList = data || [];
      setRestaurants(activeList);

      const savedId = localStorage.getItem(ACTIVE_RESTAURANT_KEY);
      const matched = activeList.find((r) => r.id === savedId);

      if (matched) {
        setCurrentRestaurantState(matched);
      } else if (activeList.length > 0) {
        setCurrentRestaurantState(activeList[0]);
        try {
          localStorage.setItem(ACTIVE_RESTAURANT_KEY, activeList[0].id);
        } catch {
          // ignore
        }
      } else {
        setCurrentRestaurantState(null);
      }
    } catch (err) {
      console.error('Error loading restaurants:', err);
    } finally {
      setIsFetchingRestaurants(false);
    }
  }, [user, authLoading, isDbGlobalAdmin]);

  useEffect(() => {
    if (!authLoading) {
      void fetchRestaurantsForUser();
    }
  }, [authLoading, fetchRestaurantsForUser]);

  useEffect(() => {
    let isMounted = true;
    if (!user || !currentRestaurant) {
      return;
    }

    const isSuper = isGlobalAdmin;

    void restaurantService.getRestaurantMembers(currentRestaurant.id).then(({ data }) => {
      if (!isMounted) return;
      if (data) {
        const myMember = data.find((m) => m.user_id === user.id) || null;
        if (myMember) {
          setCurrentMember(myMember);
        } else if (isSuper) {
          // Virtual membership for Global Admin in support mode
          setCurrentMember({
            id: `global-admin-${user.id}`,
            restaurant_id: currentRestaurant.id,
            user_id: user.id,
            role_id: 'restaurant_admin',
            status: 'active',
            joined_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            profile: {
              id: user.id,
              full_name: user.name || 'Willian (Global Admin)',
              email: user.email,
              avatar_url: user.avatar_url || null,
            },
            role: {
              id: 'restaurant_admin',
              name: 'Global Admin (Modo Suporte)',
              description: 'Super Administrador com controle total da plataforma SaaS.',
            },
          });
        } else {
          setCurrentMember(null);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user, currentRestaurant]);

  const setCurrentRestaurant = (restaurant: Restaurant) => {
    setCurrentRestaurantState(restaurant);
    try {
      localStorage.setItem(ACTIVE_RESTAURANT_KEY, restaurant.id);
    } catch {
      // ignore
    }
  };

  const createRestaurant = async (input: CreateRestaurantInput) => {
    if (!user) return { error: 'Usuário não autenticado.' };
    const result = await restaurantService.createRestaurant(user.id, input);
    if (result.data) {
      await fetchRestaurantsForUser();
      setCurrentRestaurant(result.data);
    }
    return result;
  };

  const updateCurrentRestaurant = async (data: Partial<Restaurant>) => {
    if (!currentRestaurant || !user) return { error: 'Nenhum restaurante selecionado.' };
    const result = await restaurantService.updateRestaurant(currentRestaurant.id, data, user.id);
    if (result.data) {
      setCurrentRestaurantState(result.data);
      setRestaurants((prev) =>
        prev.map((r) => (r.id === result.data?.id ? result.data! : r))
      );
    }
    return result;
  };

  const userRole: RoleId | null = isGlobalAdmin
    ? 'restaurant_admin'
    : currentMember?.role_id || null;

  const isAdmin = isGlobalAdmin || userRole === 'restaurant_admin';

  const can = (permission: string): boolean => {
    if (isGlobalAdmin) return true;
    if (!userRole) return false;
    if (isAdmin) return true;
    const allowed = ROLE_PERMISSIONS[userRole] || [];
    return allowed.includes('*') || allowed.includes(permission);
  };

  const isLoading = authLoading || isFetchingRestaurants;

  return (
    <RestaurantContext.Provider
      value={{
        currentRestaurant,
        restaurants,
        currentMember,
        userRole,
        isAdmin,
        isGlobalAdmin,
        isLoading,
        can,
        setCurrentRestaurant,
        createRestaurant,
        updateCurrentRestaurant,
        refreshRestaurants: fetchRestaurantsForUser,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
}

export { useRestaurant } from '@/hooks/useRestaurant';
