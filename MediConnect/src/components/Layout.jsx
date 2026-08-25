import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';
import FloatingHealthAssistant from './FloatingHealthAssistant';

export default function Layout() {
  return (
    <>
      <NavBar />
      <Outlet />
      <FloatingHealthAssistant />
    </>
  );
}