import { useContext } from 'react';
import { Box, Container, TextField, Typography } from '@mui/material';
import { MembersContext } from '../../../contexts/MembersContext';
import { MembersContextType } from '../../../types';
import MemberCard from './components/MemberCard';

const MembersPageContent = () => {
  const { loading, error, filteredMembers, search, setSearch, currentUserId } =
    useContext<MembersContextType>(MembersContext);

  if (error) return <p>Erreur : {error}</p>;

  return (
    <Container
      component="main"
      maxWidth="lg"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        backgroundColor: '#F0F0F0',
        borderRadius: 2.5,
        marginTop: 2,
        marginBottom: 2,
      }}
    >
      <Box
        sx={{
          padding: 3,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" sx={{ mb: 2, textAlign: 'center', mt: 2 }}>
          Liste des membres
        </Typography>
        <Typography
          variant="body2"
          sx={{
            mb: 2,
            textAlign: 'center',
            whiteSpace: 'pre-line',
            color: 'text.secondary',
          }}
        >
          Cliquez sur un membre pour consulter son profil et son activité.
        </Typography>
        <TextField
          label="Rechercher par tag"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 3, width: 300 }}
        />
        {!loading && filteredMembers.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Aucun membre trouvé.
          </Typography>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 3,
              width: '100%',
            }}
          >
            {filteredMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                isCurrentUser={member.id === currentUserId}
              />
            ))}
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default MembersPageContent;
