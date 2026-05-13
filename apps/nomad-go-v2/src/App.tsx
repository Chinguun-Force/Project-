import { Routes, Route } from "react-router";
import AppLayout from "./components/AppLayout";
import Home from "./pages/Dashboard";
import Quests from "./pages/Quests";
import Missions from "./pages/Missions";
import TourPlans from "./pages/TourPlans";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quests" element={<Quests />} />
        <Route path="/missions" element={<Missions />} />
        <Route path="/tours" element={<TourPlans />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}
