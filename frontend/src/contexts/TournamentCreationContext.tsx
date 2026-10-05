import { ReactNode } from 'react';
import { TournamentContext } from './TournamentContext';

// Transitional alias kept for compatibility during the context consolidation.
const TournamentCreationContext = TournamentContext;

const TournamentCreationContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  return <>{children}</>;
};

export { TournamentCreationContext, TournamentCreationContextProvider };
