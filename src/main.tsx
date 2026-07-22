import createRoot from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import router from './router'; // <--- Sem chaves aqui
import './index.css'; // Ou './styles.css'

const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement);
  root.render(<RouterProvider router={router} />);
}
