import { Suspense, lazy, useCallback, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { Layout } from "./containers/Layout.jsx";
import { Preloader } from "./components/Preloader/Preloader.jsx";

/* Cada ruta es su propio chunk: entrar a la home no descarga el código de
   About, Work ni Lab. Vite los separa solo gracias a estos import dinámicos. */
const Home = lazy(() => import("./pages/Home/Home.jsx"));
const About = lazy(() => import("./pages/About/About.jsx"));
const Work = lazy(() => import("./pages/Work/Work.jsx"));
const WorkProject = lazy(() => import("./pages/WorkProject/WorkProject.jsx"));
const Lab = lazy(() => import("./pages/Lab/Lab.jsx"));
const LabProject = lazy(() => import("./pages/LabProject/LabProject.jsx"));
const NotFound = lazy(() => import("./pages/NotFound/NotFound.jsx"));

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
            <Route path="work" element={<Work />} />
            <Route path="work/:slug" element={<WorkProject />} />
            <Route path="lab" element={<Lab />} />
            <Route path="lab/:slug" element={<LabProject />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
