import { createContext } from 'react';
import type { Restaurant, RestaurantMember, RoleId } from '@/types/restaurant';
import type { CreateRestaurantInput } from '@/services/restaurantService';

export interface RestaurantContextType {
  currentRestaurant: Restaurant | null;
  restaurants: Restaurant[];
  currentMember: RestaurantMember | null;
  userRole: RoleId | null;
  isAdmin: boolean;
  isGlobalAdmin: boolean;
  isLoading: boolean;
  can: (permission: string) => boolean;
  setCurrentRestaurant: (restaurant: Restaurant) => void;
  createRestaurant: (input: CreateRestaurantInput) => Promise<{ data?: Restaurant; error?: string }>;
  updateCurrentRestaurant: (data: Partial<Restaurant>) => Promise<{ error?: string }>;
  refreshRestaurants: () => Promise<void>;
}

export const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);
