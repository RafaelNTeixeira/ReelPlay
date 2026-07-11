import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AdminProvider } from './context/AdminContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import FilmGrain from './components/FilmGrain';
import Home from './pages/Home';
import MovieDetail from './pages/MovieDetail';
import GameDetail from './pages/GameDetail';
import AdminLogin from './pages/AdminLogin';
import Stats from './pages/Stats';
import AdminManage from './pages/AdminManage';

export default function App() {
  return (
    <BrowserRouter>
      <AdminProvider>
        <ThemeProvider>
          <FilmGrain />
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movie/:id" element={<MovieDetail mediaType="movie" />} />
            <Route path="/tv/:id" element={<MovieDetail mediaType="tv" />} />
            <Route path="/game/:id" element={<GameDetail />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/admin/manage" element={<AdminManage />} />
            <Route path="/admin" element={<AdminLogin />} />
          </Routes>
        </ThemeProvider>
      </AdminProvider>
    </BrowserRouter>
  );
}