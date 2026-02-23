import { useNavigate } from '@solidjs/router';
import type { AuditResultsProps } from './AuditResults.type';

export const useAuditResults = (props: Pick<AuditResultsProps, 'onContinue' | 'entryId'>) => {
  const navigate = useNavigate();

  const handleViewEntry = () => {
    props.onContinue();
    navigate(`/knowledge/${props.entryId}`);
  };

  return { handleViewEntry };
};
