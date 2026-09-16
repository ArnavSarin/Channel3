import { useState } from 'react';
import MuiImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import Button from '@mui/material/Button';
import Pagination from '../pagination/Pagination';
import { ImageListProps } from './types';
import styles from './ImageList.module.scss';

const ImageList = ({ items, onItemClick, pageSize = 100, paginationProps, ...props }: ImageListProps) => {
    const [internalPage, setInternalPage] = useState(1);
    const itemsPerPage = Number.isFinite(pageSize) ? Math.min(100, Math.max(1, Math.floor(pageSize))) : 100;
    const pageCount = Math.max(1, Math.ceil(items.length / itemsPerPage));
    const currentPage = Math.min(pageCount, Math.max(1, paginationProps?.page ?? internalPage));
    const startIndex = (currentPage - 1) * itemsPerPage;

    return (
        <div className={styles.container}>
            <MuiImageList
                {...props}
                className={styles.imageList}
            >
                {items.slice(startIndex, startIndex + itemsPerPage).map((item, pageIndex) => {
                    const index = startIndex + pageIndex;
                    return (
                        <ImageListItem
                            className={styles.imageListItem}
                            key={item.id ?? `${item.img}-${index}`}
                        >
                            <Button
                                className={styles.imageButton}
                                type="button"
                                onClick={() => onItemClick?.(item, index)}
                            >
                                <img
                                    className={styles.image}
                                    src={item.img}
                                    srcSet={item.srcSet}
                                    alt={item.alt ?? item.title}
                                    loading="lazy"
                                />
                                <ImageListItemBar
                                    className={styles.imageListItemBar}
                                    title={item.title}
                                    subtitle={item.subtitle}
                                    position="below"
                                />
                            </Button>
                        </ImageListItem>
                    );
                })}
            </MuiImageList>
            {pageCount > 1 && (
                <Pagination
                    {...paginationProps}
                    className={styles.pagination}
                    count={pageCount}
                    page={currentPage}
                    onChange={(event, nextPage) => {
                        if (paginationProps?.page === undefined) setInternalPage(nextPage);
                        paginationProps?.onChange?.(event, nextPage);
                    }}
                />
            )}
        </div>
    );
};

export default ImageList;
