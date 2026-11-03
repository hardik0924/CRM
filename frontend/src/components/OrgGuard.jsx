import { Navigate } from 'react-router-dom'
import { canManageOrganization } from '../utils/modules'

const OrgGuard = ({ children }) =>
  canManageOrganization() ? children : <Navigate to="/v2/dashboard" replace />

export default OrgGuard
