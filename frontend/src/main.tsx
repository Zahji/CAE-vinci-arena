import React from 'react';
import ReactDOM from 'react-dom/client';

import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import App from './components/App/index.tsx';
import HomePage from './components/pages/HomePage.tsx';
import RegisterPage from './components/pages/register/RegisterPage.tsx';
import LoginPage from './components/pages/LoginPage.tsx';
import ProfilePage from './components/pages/profile/ProfilePage.tsx';
import NotificationPage from './components/pages/notification/NotificationPage.tsx';
import TeamsListPage from './components/pages/teamsList/TeamsListPage.tsx';
import TeamDetailsPage from './components/pages/teamsDetails/TeamDetailsPage.tsx';
import { UserContextProvider } from './contexts/UserContext.tsx';
import '@fontsource/roboto/700.css';
import CssBaseline from '@mui/material/CssBaseline';
import GlobalStyles from '@mui/material/GlobalStyles';
import { ThemeProvider } from '@mui/material/styles';
import theme from './themes.ts';
import AdministrationPage from './components/pages/administration/AdministrationPage.tsx';
import TournamentPage from './components/pages/tournaments/TournamentPage.tsx';
import TournamentDetailsPage from './components/pages/tournamentsDetails/TournamentDetailsPage.tsx';
import TournamentBracketPage from './components/pages/tournamentsDetails/TournamentBracketPage.tsx';
import SelectionPage from './components/pages/tournamentsDetails/SelectionPage.tsx';
import MatchSelectionPage from './components/pages/tournamentsDetails/MatchSelectionPage.tsx';
import MembersPage from './components/pages/membersList/MembersPage.tsx';
import MemberDetailsPage from './components/pages/membersDetails/MemberDetailsPage.tsx';
import { TournamentContextProvider } from './contexts/TournamentContext.tsx';
import { NavbarContextProvider } from './contexts/NavbarContext.tsx';
import { HomePageProvider } from './contexts/HomePageContext.tsx';
import { NotificationContextProvider } from './contexts/NotificationContext.tsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '',
        element: (
          <HomePageProvider>
            <HomePage />
          </HomePageProvider>
        ),
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      { path: 'profile', element: <ProfilePage /> },
      {
        path: 'notifications',
        element: (
          <NotificationContextProvider>
            <NotificationPage />
          </NotificationContextProvider>
        ),
      },
      {
        path: 'teams',
        element: <TeamsListPage />,
      },
      {
        path: 'teams/:teamId',
        element: <TeamDetailsPage />,
      },
      {
        path: 'administration',
        element: <AdministrationPage />,
      },
      {
        path: 'tournaments',
        element: <TournamentPage />,
      },
      {
        path: 'members',
        element: <MembersPage />,
      },
      {
        path: 'members/:memberId',
        element: <MemberDetailsPage />,
      },
      {
        path: 'tournaments/:tournamentId',
        element: <TournamentDetailsPage />,
      },
      {
        path: 'tournaments/:tournamentId/bracket',
        element: <TournamentBracketPage />,
      },
      {
        path: 'tournaments/:tournamentId/matches/:matchId/selections/:teamId',
        element: <SelectionPage />,
      },
      {
        path: 'tournaments/:tournamentId/matches/:matchId/selections',
        element: <MatchSelectionPage />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Global CSS reset from Material-UI */}
      <GlobalStyles
        styles={{ '#root': { width: '100%', display: 'inline-block' } }}
      />
      <UserContextProvider>
        <NavbarContextProvider>
          <TournamentContextProvider>
            <RouterProvider router={router} />
          </TournamentContextProvider>
        </NavbarContextProvider>
      </UserContextProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
