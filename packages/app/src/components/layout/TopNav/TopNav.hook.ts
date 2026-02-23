import { useNavigate } from '@solidjs/router';

export const useTopNav = () => {
  const navigate = useNavigate();

  const handleNavigateToSettings = () => {
    navigate('/settings');
  };

  return { handleNavigateToSettings };
};
