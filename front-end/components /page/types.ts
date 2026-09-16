import { BoxProps } from '@mui/material/Box';
import { Product } from '../../api/types';

export interface PageProps extends Omit<BoxProps, 'children' | 'className'> {
    product: Product;
}
