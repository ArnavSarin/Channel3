import MuiPagination from '@mui/material/Pagination';
import PaginationItem from '@mui/material/PaginationItem';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { PaginationProps } from './types';
import styles from './Pagination.module.scss';

const Pagination = ({ className, renderItem, ...props }: PaginationProps) => (
    <MuiPagination
        {...props}
        className={[styles.pagination, className].filter(Boolean).join(' ')}
        renderItem={renderItem ?? ((item) => (
            <PaginationItem
                slots={{ previous: ArrowBackIcon, next: ArrowForwardIcon }}
                {...item}
            />
        ))}
    />
);

export default Pagination;
