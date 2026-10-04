import React from "react";
import { PATHS } from "../paths";
const Landing = React.lazy(() => import("../../features/common/pages/Landing"));
const Contact = React.lazy(() => import("../../features/common/pages/Contact"));
const Login = React.lazy(() => import("../../features/common/pages/Login"));
const ForgotPassword = React.lazy(() => import("../../features/common/pages/ForgotPassword"));
const Register = React.lazy(
  () => import("../../features/common/pages/Register"),
);
const PlatformLogin = React.lazy(
  () => import("../../features/common/pages/PlatformLogin"),
);
const Notifications = React.lazy(
  () => import("../../features/common/pages/Notifications"),
);
const Profile = React.lazy(() => import("../../features/common/pages/Profile"));
const Unauthorized = React.lazy(
  () => import("../../features/common/pages/Unauthorized"),
);
const NotFound = React.lazy(
  () => import("../../features/common/pages/NotFound"),
);

export const commonRoutes = [
  { path: PATHS.PUBLIC.LANDING, element: <Landing /> },
  { path: PATHS.PUBLIC.CONTACT, element: <Contact /> },
  { path: PATHS.PUBLIC.LOGIN, element: <Login /> },
  { path: PATHS.PUBLIC.FORGOT_PASSWORD, element: <ForgotPassword /> },
  { path: PATHS.PUBLIC.REGISTER, element: <Register /> },
  { path: PATHS.PUBLIC.PLATFORM_LOGIN, element: <PlatformLogin /> },
  { path: PATHS.COMMON.NOTIFICATIONS, element: <Notifications /> },
  { path: PATHS.COMMON.PROFILE, element: <Profile /> },
  { path: PATHS.COMMON.UNAUTHORIZED, element: <Unauthorized /> },
  { path: PATHS.COMMON.NOT_FOUND, element: <NotFound /> },
];
