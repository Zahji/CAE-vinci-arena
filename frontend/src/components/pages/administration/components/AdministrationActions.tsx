import { Box, Button } from '@mui/material';

type AdministrationActionsProps = {
  onOpenPromoteModal: () => void;
};

const AdministrationActions = ({
  onOpenPromoteModal,
}: AdministrationActionsProps) => {
  return (
    <>
      <h1>Administration</h1>
      <Box sx={{ marginBottom: 2 }}>
        <Button variant="contained" onClick={onOpenPromoteModal}>
          Nommer un nouvel administrateur
        </Button>
      </Box>
    </>
  );
};

export default AdministrationActions;
