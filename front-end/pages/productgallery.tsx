import { Box, Button, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/router';
import { Channel3Icon } from '../assets/Icons';
import { useGetBrands, useGetBrandProducts, useGetProduct } from '../api/BrandsService';
import { ReactHookFormProvider } from '../context-providers/react-hook-form/ReactHookFormProvider';
import { ReactQueryClientProvider } from '../context-providers/ReactQueryClientProvider';
import baseTheme from '../theme/baseTheme';
import styles from './ProductGallery.module.scss';
import Header from '../components /header/Header';
import ImageList from '../components /image-list/ImageList';
import { ImageListEntry } from '../components /image-list/types';
import Page from '../components /page/Page';

const Content = () => {
    const router = useRouter();
    const productName = typeof router.query.product === 'string'
        ? router.query.product
        : undefined;
    const { data: brandsResponse, isLoading: brandsLoading, isError: brandsError } = useGetBrands();
    const brands = brandsResponse?.data ?? [];
    const brandProductQueries = useGetBrandProducts(brands, 100);
    const products = brandProductQueries.flatMap(({ data }) => data?.data ?? []);
    const productsLoading = brandProductQueries.some(({ isLoading }) => isLoading);
    const productsError = brandProductQueries.some(({ isError }) => isError);
    const { data: productResponse, isLoading: productLoading, isError: productError } = useGetProduct(true, productName);
    const selectedProduct = productResponse?.data ?? products.find((product) =>
        product.name.trim().toLowerCase() === productName?.trim().toLowerCase());
    const items: ImageListEntry[] = products.map((product) => ({
        id: product.name,
        img: product.image_urls[0],
        title: product.name,
        subtitle: product.brand,
    }));
    const handleSubmit = () => {};
    const loading = brandsLoading || productsLoading || productLoading;
    const error = brandsError || productsError || (productError && !selectedProduct);

    return (
        <ReactHookFormProvider onSubmit={handleSubmit}>
            <Box className={styles.background}>
                <Box className={styles.productGalleryBox}>
                    <Header
                        containerClassName={styles.headerBox}
                        className={`${styles.headerBar} ${styles.headerWidth}`}
                        content={
                            <Box className={styles.headerContent}>
                                <Channel3Icon className={styles.channel3Logo} titleAccess="Channel3" />
                                {productName && (
                                    <Button
                                        className={styles.backButton}
                                        type="button"
                                        aria-label="Back to products"
                                        startIcon={<ArrowBackIcon />}
                                        onClick={() => void router.push('/productgallery', undefined, { shallow: true })}
                                    >
                                        <span className={styles.backLabel}>Back to products</span>
                                    </Button>
                                )}
                            </Box>
                        }
                    />
                    <Box className={styles.pageArea}>
                        {loading ? (
                            <Typography>Loading products...</Typography>
                        ) : error ? (
                            <Typography>Unable to load products.</Typography>
                        ) : selectedProduct ? (
                            <Page product={selectedProduct} />
                        ) : (
                            <ImageList
                                items={items}
                                cols={4}
                                gap={16}
                                pageSize={100}
                                onItemClick={(item) => void router.push({
                                    pathname: '/productgallery',
                                    query: { product: item.id },
                                }, undefined, { shallow: true })}
                            />
                        )}
                    </Box>
                </Box>
            </Box>
        </ReactHookFormProvider>
    );
};

export default function ProductGallery() {
    return (
        <ThemeProvider theme={baseTheme}>
            <ReactQueryClientProvider>
                <Content />
            </ReactQueryClientProvider>
        </ThemeProvider>
    );
}
