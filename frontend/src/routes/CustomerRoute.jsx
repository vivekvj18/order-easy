import ProtectedRoute from './ProtectedRoute';
import { ROLES } from '../utils/constants';

const CustomerRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>{children}</ProtectedRoute>
);
export default CustomerRoute;
