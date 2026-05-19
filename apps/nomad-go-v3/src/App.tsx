import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import QuestsPage from './pages/QuestsPage'
import QuestDetail from './pages/QuestDetail'
import MapPage from './pages/MapPage'
import ProfilePage from './pages/ProfilePage'
import Topbar from './components/layout/Topbar'
import BottomNav from './components/layout/BottomNav'

export default function App() {
  return (
    <div className="app-container bg-[var(--bg)] min-h-screen">
      <Topbar />
      <main className="pt-0">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/quests" element={<QuestsPage />} />
          <Route path="/quests/:id" element={<QuestDetail />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
