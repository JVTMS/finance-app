// Categorias padrão criadas para cada novo usuário.
// icon: nome do ícone lucide-react; color usada em gráficos e timeline.

export const DEFAULT_CATEGORIES = [
  // Receitas
  { name: 'Salário', kind: 'receita', icon: 'briefcase', color: '#34d399' },
  { name: 'Freelance', kind: 'receita', icon: 'laptop', color: '#22d3ee' },
  { name: 'Outras receitas', kind: 'receita', icon: 'plus-circle', color: '#a3e635' },
  // Despesas
  { name: 'Moradia', kind: 'despesa', icon: 'home', color: '#818cf8' },
  { name: 'Mercado', kind: 'despesa', icon: 'shopping-cart', color: '#f472b6' },
  { name: 'Transporte', kind: 'despesa', icon: 'car', color: '#60a5fa' },
  { name: 'Alimentação', kind: 'despesa', icon: 'utensils', color: '#fb923c' },
  { name: 'Saúde', kind: 'despesa', icon: 'heart-pulse', color: '#f87171' },
  { name: 'Educação', kind: 'despesa', icon: 'graduation-cap', color: '#38bdf8' },
  { name: 'Lazer', kind: 'despesa', icon: 'gamepad-2', color: '#c084fc' },
  { name: 'Assinaturas', kind: 'despesa', icon: 'monitor-play', color: '#2dd4bf' },
  { name: 'Compras', kind: 'despesa', icon: 'shopping-bag', color: '#e879f9' },
  { name: 'Outros', kind: 'despesa', icon: 'circle-ellipsis', color: '#94a3b8' },
];

export const INVESTMENT_TYPES = [
  { id: 'CDB', name: 'CDB / Renda fixa', color: '#60a5fa' },
  { id: 'Tesouro', name: 'Tesouro Direto', color: '#34d399' },
  { id: 'ETF', name: 'ETF', color: '#c084fc' },
  { id: 'FII', name: 'Fundo imobiliário', color: '#f59e0b' },
  { id: 'Ação', name: 'Ações', color: '#f472b6' },
  { id: 'Fundo', name: 'Fundo de investimento', color: '#2dd4bf' },
];
