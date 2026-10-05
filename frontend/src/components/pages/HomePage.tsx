import { useContext } from 'react';
import { Box, Container, Typography, CircularProgress } from '@mui/material';
import { UserContext } from '../../contexts/UserContext';
import { UserContextType } from '../../types';
import logoCae from '../../assets/images/logo_cae.png';
import TournamentTable from './tournaments/components/TournamentTable';
import { HomePageContext } from '../../contexts/HomePageContext';

const HomePage = () => {
  const { authenticatedUser } = useContext<UserContextType>(UserContext);
  const { tournaments, loading, error } = useContext(HomePageContext);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          overflow: 'hidden',
        }}
      />
      <Container maxWidth="sm" sx={{ mt: 0, position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            backgroundColor: '#0a143c',
            borderRadius: 4,
            padding: 5,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            component="img"
            src={logoCae}
            alt="Vinci Arena Logo"
            sx={{
              height: 150,
              mb: 1,
            }}
          />

          <Typography variant="h5" sx={{ color: '#F6F7FF', fontWeight: 700 }}>
            {authenticatedUser
              ? `Bienvenue ${authenticatedUser.tag} sur le site officiel de`
              : 'Bienvenu sur le site officiel de'}
          </Typography>

          <Typography
            variant="h4"
            sx={{ color: '#FFD96A', fontWeight: 900, letterSpacing: 1 }}
          >
            VINCI ARENA TOURNOIS
          </Typography>

          <Typography
            variant="body1"
            sx={{ color: '#C8CEDE', mt: 1, lineHeight: 1.8 }}
          >
            Qu'est-ce que Vinci ARENA? Un jeu vidéo compétitif pensé pour la
            scène e-sport.
          </Typography>

          <Typography
            variant="body1"
            sx={{ color: '#C8CEDE', lineHeight: 1.8 }}
          >
            Et sur ce site, vous pouvez officiellement participer à ses tournois
            amateurs et semi-professionnels.
          </Typography>
          <Typography
            variant="h6"
            sx={{ color: '#FFD96A', fontWeight: 700, mb: 1, mt: 2 }}
          >
            Tournois
          </Typography>
          <Box
            sx={{
              overflowX: 'auto',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: 1,
              borderColor: '#FFFFFF',
              paddingBottom: 1,
              width: '100%',
              maxHeight: '200px',
              padding: 3,
            }}
          >
            {loading && <CircularProgress sx={{ color: '#FFD96A' }} />}
            {error && (
              <Typography variant="body2" sx={{ color: '#ff6b6b' }}>
                {error}
              </Typography>
            )}
            {!loading && !error && (
              <TournamentTable
                tournamentList={tournaments}
                showOnlyName={true}
              />
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default HomePage;
