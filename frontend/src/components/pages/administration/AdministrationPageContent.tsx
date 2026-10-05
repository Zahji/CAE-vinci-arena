import { useContext, SyntheticEvent } from 'react';
import { Box } from '@mui/material';
import { AdministrationContextType } from '../../../types';
import { AdministrationContext } from '../../../contexts/AdministrationContext';
import AdministrationActions from './components/AdministrationActions';
import AdministratorsTable from './components/AdministratorsTable';
import PromoteAdministratorDialog from './components/PromoteAdministratorDialog';

const AdministrationPageContent = () => {
  const {
    loading,
    error,
    administrationList,
    nonAdmins,
    openPromoteModal,
    selectedUserId,
    promoteError,
    demoteError,
    currentUserId,
    openPromoteModalAndLoadUsers,
    closePromoteModal,
    setSelectedUserId,
    promoteSelectedUser,
    demoteUser,
  } = useContext<AdministrationContextType>(AdministrationContext);

  const handleUserSelectChange = (e: SyntheticEvent) => {
    const input = e.target as HTMLInputElement;
    setSelectedUserId(Number(input.value));
  };

  if (loading) return <p>Chargement...</p>;
  if (error) return <p>Erreur : {error}</p>;

  return (
    <Box
      sx={{
        margin: 2,
        padding: 3,
        textAlign: 'center',
        backgroundColor: '#F0F0F0',
        borderRadius: 2.5,
        marginTop: 2,
        marginBottom: 2,
      }}
    >
      <AdministrationActions
        onOpenPromoteModal={openPromoteModalAndLoadUsers}
      />
      <AdministratorsTable
        administrationList={administrationList}
        demoteError={demoteError}
        currentUserId={currentUserId}
        onDemoteUser={demoteUser}
      />
      <PromoteAdministratorDialog
        open={openPromoteModal}
        nonAdmins={nonAdmins}
        selectedUserId={selectedUserId}
        promoteError={promoteError}
        onClose={closePromoteModal}
        onConfirm={promoteSelectedUser}
        onUserChange={handleUserSelectChange}
      />
    </Box>
  );
};

export default AdministrationPageContent;
