import { Suspense, lazy, useCallback, useState } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { Layout } from "./containers/Layout.jsx";
import { Preloader } from "./components/Preloader/Preloader.jsx";

/* Cada ruta es su propio chunk: entrar a la home no descarga el código de
   About, Favorites ni Lab. Vite los separa solo gracias a estos imports. */
const Home = lazy(() => import("./pages/Home/Home.jsx"));
const About = lazy(() => import("./pages/About/About.jsx"));
const Favorites = lazy(() => import("./pages/Favorites/Favorites.jsx"));
const Project = lazy(() => import("./pages/Project/Project.jsx"));
const Lab = lazy(() => import("./pages/Lab/Lab.jsx"));
const LabProject = lazy(() => import("./pages/LabProject/LabProject.jsx"));
const NotFound = lazy(() => import("./pages/NotFound/NotFound.jsx"));

/* La sección se llamaba Work. Este redirect conserva el slug para que un
   enlace viejo a un proyecto puntual siga aterrizando en ese proyecto y no en
   el índice. */
function LegacyWorkRedirect() {
  const { slug } = useParams();
  return <Navigate to={slug ? `/favorites/${slug}` : "/favorites"} replace />;
}

export default function App() {
  const [introDone, setIntroDone] = useState(false);
  const handleIntroDone = useCallback(() => setIntroDone(true), []);

  return (
    <>
      {/* El preloader tapa la pantalla mientras corre, así que hace de
          fallback natural de Suspense: las rutas se descargan detrás de él y
          no hace falta un spinner extra. */}
      {!introDone && <Preloader onDone={handleIntroDone} />}

      <Suspense fallback={null}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="favorites/:slug" element={<Project />} />
            <Route path="lab" element={<Lab />} />
            <Route path="lab/:slug" element={<LabProject />} />

            <Route path="work" element={<LegacyWorkRedirect />} />
            <Route path="work/:slug" element={<LegacyWorkRedirect />} />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
