import React from 'react';
import {BrowserRouter, Routes, Route, Navigate, useParams} from "react-router-dom";
import MarketingPage from "./MarketingPage";
import SignUp from "./SignUp";
import SignIn from "./SignIn";
import ClubsList from "./Clubs";
import MembersList from "./Members";
import SignUpClub from "./SignUpClub";
import {AuthProvider} from "./AuthProvider";
import {PrivateRoute} from "./PrivateRoute";
import Dashboard from "./dashboard/Dashboard";
import DashboardHome from "./dashboard/DashboardHome";
import DashboardUsers from "./dashboard/DashboardUsers";
import DashboardClubs from "./dashboard/DashboardClubs";
import DashboardRatingPeriods from "./dashboard/DashboardRatingPeriods";
import DashboardTournaments from "./dashboard/DashboardTournaments";
import DashboardTournamentNew from "./dashboard/DashboardTournamentNew";
import DashboardTournamentDetail from "./dashboard/DashboardTournamentDetail";
import NewGame from "./NewGame";
import DashboardGames from "./dashboard/DashboardGames";
import Rating from "./Rating";
import ScoringRules from "./ScoringRules";
import Rules from "./Rules";
import ResetPassword from "./ResetPassword";
import {BudgetRedirect} from "./Budget";
import {CalendarRedirect} from "./Calendar";
import PublicTournamentPage from "./PublicTournamentPage";

/** Окремий інстанс NewGame на кожну гру турніру — після збереження / зміни URL форма не тягне стан попередньої гри. */
function DashboardTournamentGame() {
  const { tournamentId, gameIndex } = useParams<{ tournamentId: string; gameIndex: string }>();
  return <NewGame key={`tournament-${tournamentId}-${gameIndex}`} />;
}

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MarketingPage />}/>
          <Route path="register" element={<SignUp />} />
          <Route path="register-club" element={<SignUpClub />} />
          <Route path="login" element={<SignIn />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="members" element={<MembersList />} />
          <Route path="$" element={<BudgetRedirect />} />
          <Route path="calendar" element={<CalendarRedirect />} />
          <Route path="clubs-rating" element={<Rating />} />
          <Route path="scoring" element={<ScoringRules />} />
          <Route path="rules" element={<Rules />} />
          <Route path="clubs" element={<ClubsList />} />
          <Route path="tournaments/:id" element={<PublicTournamentPage />} />
          <Route path="new-game" element={<NewGame />} />
          <Route path="profile" element={<PrivateRoute Component={DashboardHome}/>} />
          <Route path="profile/users" element={<PrivateRoute Component={DashboardUsers}/>} />
          <Route path="profile/clubs" element={<PrivateRoute Component={DashboardClubs}/>} />
          <Route path="profile/games" element={<PrivateRoute Component={DashboardGames}/>} />
          <Route path="profile/rating-periods" element={<PrivateRoute Component={DashboardRatingPeriods}/>} />
          <Route path="profile/tournaments" element={<PrivateRoute Component={DashboardTournaments}/>} />
          <Route path="profile/tournaments/new" element={<PrivateRoute Component={DashboardTournamentNew}/>} />
          <Route path="profile/tournaments/:id" element={<PrivateRoute Component={DashboardTournamentDetail}/>} />
          <Route path="profile/tournament/:tournamentId/game/:gameIndex" element={<PrivateRoute Component={DashboardTournamentGame}/>} />
          <Route path="new-game-rating" element={<PrivateRoute Component={NewGame}/>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;