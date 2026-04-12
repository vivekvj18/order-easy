import ProtectedRoute from './ProtectedRoute';
import { ROLES } from '../utils/constants';

const DeliveryRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={[ROLES.DELIVERY_PARTNER]}>{children}</ProtectedRoute>
);
export default DeliveryRoute;
