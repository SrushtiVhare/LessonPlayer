import { BrowserRouter, Route, Routes } from 'react-router'
import { ErrorBoundary } from '../components/ui/ErrorBoundary.tsx'
import { HomePage } from '../pages/HomePage.tsx'
import { LessonPage } from '../pages/LessonPage.tsx'
import { MissingAdventure } from '../components/layout/Screens.tsx'

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/lesson/:lessonId" element={<LessonPage />} />
          <Route path="*" element={<MissingAdventure />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
