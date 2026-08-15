import Badge from './Badge';
import { getStatusBadgeClass, formatStatus } from '../../styles/theme';

export default function StatusBadge({ status }) {
    return (
        <Badge className={getStatusBadgeClass(status)}>
            {formatStatus(status)}
        </Badge>
    );
}
