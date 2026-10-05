import { createContext, useEffect, useState, ReactNode } from 'react';
import { Tournament, HomePageContextType } from '../types';
import { fetchTournaments } from '../services/tournamentService';

const HomePageContext = createContext<HomePageContextType>({
  tournaments: null,
  loading: true,
  error: null,
});

const HomePageProvider = ({ children }: { children: ReactNode }) => {
  const [tournaments, setTournaments] = useState<Tournament[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchTournaments();
        const filtered = data
          .filter((t) => ['PLANIFIED', 'ONGOING'].includes(t.state))
          .sort(
            (a, b) =>
              new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
          );
        setTournaments(filtered);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Une erreur est survenue',
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <HomePageContext.Provider value={{ tournaments, loading, error }}>
      {children}
    </HomePageContext.Provider>
  );
};

export { HomePageContext, HomePageProvider };
