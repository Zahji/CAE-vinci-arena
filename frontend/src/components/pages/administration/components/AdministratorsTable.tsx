import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { useState } from 'react';
import { UserProfile } from '../../../../types';

type AdministratorsTableProps = {
  administrationList: UserProfile[] | null;
  demoteError: string;
  currentUserId?: number;
  onDemoteUser: (userId: number) => void;
};

const AdministratorsTable = ({
  administrationList,
  demoteError,
  currentUserId,
  onDemoteUser,
}: AdministratorsTableProps) => {
  const [confirmUserId, setConfirmUserId] = useState<number | null>(null);

  if (administrationList && administrationList.length === 0) {
    return (
      <Box sx={{ padding: 2, textAlign: 'center' }}>
        <p>Aucun administrateur actuellement.</p>
      </Box>
    );
  }

  const isLastAdmin =
    administrationList !== null && administrationList.length === 1;
  const isSelfDemotion = confirmUserId === currentUserId;

  const handleConfirm = () => {
    if (confirmUserId !== null) {
      onDemoteUser(confirmUserId);
    }
    setConfirmUserId(null);
  };

  return (
    <>
      {demoteError && <Alert severity="error">{demoteError}</Alert>}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>email</TableCell>
            <TableCell>tag</TableCell>
            <TableCell>spécialité</TableCell>
            <TableCell>date</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {administrationList?.map((admin) => {
            const isSelf = admin.id === currentUserId;
            const disabled = isSelf && isLastAdmin;
            return (
              <TableRow key={admin.id}>
                <TableCell>{admin.email}</TableCell>
                <TableCell>{admin.tag}</TableCell>
                <TableCell>{admin.speciality}</TableCell>
                <TableCell>{admin.date}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    disabled={disabled}
                    onClick={() => setConfirmUserId(admin.id)}
                  >
                    Rétrograder
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog
        open={confirmUserId !== null}
        onClose={() => setConfirmUserId(null)}
      >
        <DialogTitle>Confirmer la rétrogradation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {isSelfDemotion
              ? "Êtes-vous sûr de vouloir vous rétrograder ? Vous n'aurez plus accès à cette page."
              : 'Êtes-vous sûr de vouloir rétrograder cet administrateur ?'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmUserId(null)}>Annuler</Button>
          <Button color="error" onClick={handleConfirm}>
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdministratorsTable;
