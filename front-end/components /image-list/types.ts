import { ReactNode } from 'react';
import { ImageListProps as MuiImageListProps } from '@mui/material/ImageList';
import { PaginationProps } from '../pagination/types';

export interface ImageListEntry {
    id?: string;
    img: string;
    title: string;
    subtitle?: ReactNode;
    alt?: string;
    srcSet?: string;
}

export interface ImageListProps extends Omit<MuiImageListProps, 'children'> {
    items: ImageListEntry[];
    onItemClick?: (item: ImageListEntry, index: number) => void;
    pageSize?: number;
    paginationProps?: Omit<PaginationProps, 'count'>;
}
