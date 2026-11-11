import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { Layout } from './components/Layout';
import AdminSongs from './pages/AdminSongs';
import Favorites from './pages/Favorites';
import Home from './pages/Home';
import Hymnal from './pages/Hymnal';
import ListDetail from './pages/ListDetail';
import Lists from './pages/Lists';
import Settings from './pages/Settings';
import ThemeDetail from './pages/ThemeDetail';
import Themes from './pages/Themes';
import SongEditor from './pages/SongEditor';
import SongPage from './pages/SongPage';
import { LibraryProvider } from './state/library';
import { SettingsProvider } from './state/settings';
import { SyncProvider } from './state/sync';
import { ToastProvider } from './state/toast';

/** Remonta el editor al cambiar de canción (p. ej. de «nueva» a una existente). */
function EditorRoute() {
  const { id } = useParams();
  return <SongEditor key={id} />;
}

export default function App() {
  return (
    <SettingsProvider>
      <LibraryProvider>
        <ToastProvider>
          <SyncProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="himnario" element={<Hymnal />} />
                <Route path="cancion/:id" element={<SongPage />} />
                <Route path="categorias" element={<Themes />} />
                <Route path="categorias/:id" element={<ThemeDetail />} />
                <Route path="favoritos" element={<Favorites />} />
                <Route path="listas" element={<Lists />} />
                <Route path="listas/:id" element={<ListDetail />} />
                <Route path="ajustes" element={<Settings />} />
                <Route path="ajustes/canciones" element={<AdminSongs />} />
                <Route path="editar/:id" element={<EditorRoute />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
          </SyncProvider>
        </ToastProvider>
      </LibraryProvider>
    </SettingsProvider>
  );
}
