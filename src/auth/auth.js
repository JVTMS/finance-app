// Autenticação — agora delegada à API (mesmos nomes de export usados pelo AuthContext).

export {
  register,
  login,
  loginDemo,
  logout,
  fetchCurrentUser as currentUser,
} from '../api/api';
