import { Box, Container, Typography } from '@mui/material';
import logo from '../../assets/images/js-logo.png';
import { Copyright } from '@mui/icons-material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{ py: 1.5, bgcolor: 'primary.main', color: '#fff' }}
    >
      <Container
        maxWidth="sm"
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Copyright />
            CAE Vinci Groupe 21
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <img src={logo} alt="" width={30} />
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
