// Mapeia nomes de ícone (persistidos nas categorias) para componentes lucide.

import {
  Briefcase, Laptop, PlusCircle, Home, ShoppingCart, Car, Utensils, HeartPulse,
  GraduationCap, Gamepad2, MonitorPlay, ShoppingBag, CircleEllipsis, Banknote,
  PiggyBank, Target, Gem, CalendarRange, TrendingUp, TrendingDown, CircleDollarSign,
} from 'lucide-react';

const MAP = {
  briefcase: Briefcase,
  laptop: Laptop,
  'plus-circle': PlusCircle,
  home: Home,
  'shopping-cart': ShoppingCart,
  car: Car,
  utensils: Utensils,
  'heart-pulse': HeartPulse,
  'graduation-cap': GraduationCap,
  'gamepad-2': Gamepad2,
  'monitor-play': MonitorPlay,
  'shopping-bag': ShoppingBag,
  'circle-ellipsis': CircleEllipsis,
  banknote: Banknote,
  'piggy-bank': PiggyBank,
  target: Target,
  gem: Gem,
  'calendar-range': CalendarRange,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'circle-dollar': CircleDollarSign,
};

export default function CategoryIcon({ name, size = 16, color, ...rest }) {
  const Icon = MAP[name] || CircleEllipsis;
  return <Icon size={size} color={color} aria-hidden {...rest} />;
}
