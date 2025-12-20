// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import React from 'react';

// Mock react-router-dom to avoid ESM resolution issues in CRA jest
jest.mock('react-router-dom', () => {
  const navigateMock = jest.fn();

  const RouterStub = ({ children }) => <div>{children}</div>;

  const Link = ({ to, children, ...rest }) => (
    <a href={typeof to === 'string' ? to : '#'} {...rest}>
      {children}
    </a>
  );

  const Routes = ({ children }) => <div>{children}</div>;
  const Route = ({ element }) => element;

  return {
    __esModule: true,
    BrowserRouter: RouterStub,
    MemoryRouter: RouterStub,
    Routes,
    Route,
    Link,
    useNavigate: () => navigateMock,
    useLocation: () => ({ pathname: '/' }),
    Outlet: ({ children }) => <div>{children}</div>,
  };
}, { virtual: true });
