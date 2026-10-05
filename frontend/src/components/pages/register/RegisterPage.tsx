import { RegisterContextProvider } from '../../../contexts/RegisterContext';
import RegisterPageContent from './RegisterPageContent';

const RegisterPage = () => (
  <RegisterContextProvider>
    <RegisterPageContent />
  </RegisterContextProvider>
);

export default RegisterPage;
