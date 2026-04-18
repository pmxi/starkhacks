import { RouterProvider, createBrowserRouter, Outlet } from 'react-router';
import Home from './components/Home';
import CreateTeam from './components/CreateTeam';
import JoinTeam from './components/JoinTeam';
import Lobby from './components/Lobby';
import GameSettings from './components/GameSettings';
import Gameplay from './components/Gameplay';
import GameResults from './components/GameResults';
import FriendsList from './components/FriendsList';

function Root() {
  return (
    <div className="size-full">
      <Outlet />
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      {
        index: true,
        Component: Home,
      },
      {
        path: 'create-team',
        Component: CreateTeam,
      },
      {
        path: 'join-team',
        Component: JoinTeam,
      },
      {
        path: 'lobby',
        Component: Lobby,
      },
      {
        path: 'game-settings',
        Component: GameSettings,
      },
      {
        path: 'gameplay',
        Component: Gameplay,
      },
      {
        path: 'results',
        Component: GameResults,
      },
      {
        path: 'friends',
        Component: FriendsList,
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
