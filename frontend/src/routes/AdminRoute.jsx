import ProtectedRoute from './ProtectedRoute';
import { ROLES } from '../utils/constants';

const AdminRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>{children}</ProtectedRoute>
);
export default AdminRoute;
