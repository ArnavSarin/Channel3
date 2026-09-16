import { AppBarProps } from '@mui/material/AppBar';
import { ReactNode } from 'react';

export interface HeaderProps extends Omit<AppBarProps, 'content'> {
    children?: ReactNode;
    content?: ReactNode;
    containerClassName?: string;
    open?: boolean;
}
