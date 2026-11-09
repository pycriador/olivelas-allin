import { useContext } from 'react';
import { RestaurantContext, type RestaurantContextType } from '@/contexts/restaurant-context';

export function useRestaurant(): RestaurantContextType {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
}
