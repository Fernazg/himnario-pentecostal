import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import AdminSongs from './pages/AdminSongs';
import Favorites from './pages/Favorites';
import Home from './pages/Home';
import Hymnal from './pages/Hymnal';
import ListDetail from './pages/ListDetail';
import Lists from './pages/Lists';
import Settings from './pages/Settings';
import SongEditor from './pages/SongEditor';
import SongPage from './pages/SongPage';
import { LibraryProvider } from './state/library';
import { SettingsProvider } from './state/settings';
import { ToastProvider } from './state/toast';

export default function App() {
  return (
    <SettingsProvider>
      <LibraryProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="himnario" element={<Hymnal />} />
                <Route path="cancion/:id" element={<SongPage />} />
                <Route path="favoritos" element={<Favorites />} />
                <Route path="listas" element={<Lists />} />
                <Route path="listas/:id" element={<ListDetail />} />
                <Route path="ajustes" element={<Settings />} />
                <Route path="ajustes/canciones" element={<AdminSongs />} />
                <Route path="editar/:id" element={<SongEditor />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </LibraryProvider>
    </SettingsProvider>
  );
}
