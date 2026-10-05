import { useContext, useEffect, useState } from 'react';
import { Alert, Box, CircularProgress, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { MemberDetailsContext } from '../../../contexts/MemberDetailsContext';
import { UserContext } from '../../../contexts/UserContext';
import { MemberDetailsContextType, UserContextType } from '../../../types';
import MemberActivity from '../profile/components/MemberActivity';
import MemberInfo from './components/MemberInfo';
import BanMemberDialog from './components/BanMemberDialog';

/**
 * Shows the member profile, unavailabilities and ban button.
 * @return {JSX.Element} the page content
 */
const MemberDetailsPageContent = () => {
  const {
    loading,
    error,
    member,
    unavailabilities,
    canViewUnavailabilities,
    openBanModal,
    banError,
    setOpenBanModal,
    handleBanMember,
  } = useContext<MemberDetailsContextType>(MemberDetailsContext);
  const { jwtData, authenticatedUser } =
    useContext<UserContextType>(UserContext);
  const navigate = useNavigate();
  const [lastKnownTeam, setLastKnownTeam] = useState<{
    teamId: number;
    teamName: string | null;
  } | null>(null);

  const isAdmin = jwtData()?.isAdmin ?? false;
  const currentUserId = jwtData()?.id;

  useEffect(() => {
    if (member?.teamId != null) {
      setLastKnownTeam({ teamId: member.teamId, teamName: member.teamName });
    }
  }, [member?.teamId, member?.teamName]);

  if (error)
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="warning">{error}</Alert>
      </Container>
    );

  return (
    <Container
      component="main"
      maxWidth="md"
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
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {loading || !member ? (
          <CircularProgress />
        ) : (
          <MemberInfo
            member={member}
            isAdmin={isAdmin}
            currentUserId={currentUserId}
            canViewUnavailabilities={canViewUnavailabilities}
            unavailabilities={unavailabilities}
            onNavigateToTeam={(teamId) => navigate(`/teams/${teamId}`)}
            onOpenBanModal={() => setOpenBanModal(true)}
          />
        )}
      </Box>

      {member && (
        <MemberActivity
          token={authenticatedUser?.token ?? ''}
          userId={member.id}
          currentTeamId={member.teamId}
          currentTeamName={member.teamName}
          isMemberBanned={member.isBanned}
          fallbackPastTeam={
            member.teamId == null && lastKnownTeam
              ? {
                  teamId: lastKnownTeam.teamId,
                  teamName: lastKnownTeam.teamName,
                }
              : null
          }
          showCurrentTeamLabel={false}
          title="Activité du Membre"
        />
      )}

      <BanMemberDialog
        open={openBanModal}
        memberTag={member?.tag ?? ''}
        banError={banError}
        onClose={() => setOpenBanModal(false)}
        onConfirm={handleBanMember}
      />
    </Container>
  );
};

export default MemberDetailsPageContent;
