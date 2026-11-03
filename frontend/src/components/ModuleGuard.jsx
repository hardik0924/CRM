import { Navigate } from 'react-router-dom'
import { hasModule } from '../utils/modules'

const ModuleGuard = ({ code, children }) =>
  hasModule(code) ? children : <Navigate to="/v2/dashboard" replace />

export default ModuleGuard
