import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import AuthProvider from '../Context/AuthContext';
import ShopContextProvider from '../Context/ShopContext';

// Render helper to wrap components with the required providers.
// Optionally skip adding an extra router when the component already renders one.
export const renderWithProviders = (
  ui,
  { route = '/', withRouter = true } = {}
) => {
  window.history.pushState({}, 'Test page', route);

  const content = withRouter ? <BrowserRouter>{ui}</BrowserRouter> : ui;

  return render(
    <AuthProvider>
      <ShopContextProvider>{content}</ShopContextProvider>
    </AuthProvider>
  );
};
