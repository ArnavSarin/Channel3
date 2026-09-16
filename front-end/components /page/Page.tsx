import { useState } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import * as currencyFormatter from 'currency-formatter';
import { PageProps } from './types';
import { ProductVariant } from '../../api/types';
import styles from './Page.module.scss';

const Page = ({ product, ...props }: PageProps) => {
    const [imageIndex, setImageIndex] = useState(0);
    const images = product.image_urls;
    const currentIndex = Math.min(imageIndex, Math.max(images.length - 1, 0));
    const formatPrice = (value: number) => {
        const currency = product.price?.currency.trim() ?? '';
        const code = currency.toUpperCase();

        return currencyFormatter.format(
            value,
            currencyFormatter.findCurrency(code) ? { code } : { symbol: currency }
        );
    };

    return (
        <Box {...props} className={styles.page}>
            <Box className={styles.gallery}>
                <Box className={styles.mainImageRow}>
                    {images.length > 0 ? (
                        <img
                            className={styles.mainImage}
                            src={images[currentIndex]}
                            alt={`${product.name}, image ${currentIndex + 1} of ${images.length}`}
                        />
                    ) : (
                        <Box className={styles.emptyImage}>No image available</Box>
                    )}
                    <Box className={styles.imageControls}>
                        <IconButton
                            className={styles.imageArrow}
                            aria-label="Previous image"
                            disabled={images.length < 2}
                            onClick={() => setImageIndex((currentIndex - 1 + images.length) % images.length)}
                        >
                            <ArrowBackIcon />
                        </IconButton>
                        <IconButton
                            className={styles.imageArrow}
                            aria-label="Next image"
                            disabled={images.length < 2}
                            onClick={() => setImageIndex((currentIndex + 1) % images.length)}
                        >
                            <ArrowForwardIcon />
                        </IconButton>
                    </Box>
                </Box>
                {images.length > 1 && (
                    <Box className={styles.thumbnails}>
                        {images.map((url, index) => (
                            <button
                                className={`${styles.thumbnailButton} ${currentIndex === index ? styles.activeThumbnail : ''}`}
                                type="button"
                                aria-label={`Show image ${index + 1} of ${images.length}`}
                                aria-pressed={currentIndex === index}
                                onClick={() => setImageIndex(index)}
                                key={`${url}-${index}`}
                            >
                                <img src={url} alt="" loading="lazy" />
                            </button>
                        ))}
                    </Box>
                )}
            </Box>
            <Box className={styles.details}>
                <Box className={styles.heading}>
                    <Typography component="h1" variant="h1">{product.name}</Typography>
                    <Typography>{product.brand}{product.category ? ` · ${product.category.name}` : ''}</Typography>
                </Box>
                <Typography>{product.description}</Typography>
                <Box className={styles.price}>
                    {product.price ? (
                        <>
                            <Typography component="span" variant="h2">{formatPrice(product.price.price)}</Typography>
                            {product.price.compare_at_price != null && product.price.compare_at_price > product.price.price && (
                                <Typography component="s">{formatPrice(product.price.compare_at_price)}</Typography>
                            )}
                        </>
                    ) : <Typography>Price unavailable</Typography>}
                </Box>
                {product.key_features.length > 0 && (
                    <Box className={styles.section}>
                        <Typography component="h2" variant="h3">Key features</Typography>
                        <ul className={styles.features}>
                            {product.key_features.map((feature, index) => <li key={`${feature}-${index}`}>{feature}</li>)}
                        </ul>
                    </Box>
                )}
                {product.colors.length > 0 && (
                    <Box className={styles.section}>
                        <Typography component="h2" variant="h3">Colors</Typography>
                        <ul className={styles.colorsList}>
                            {product.colors.map((color, index) => <li className={styles.colorItem} key={`${color}-${index}`}>{color}</li>)}
                        </ul>
                    </Box>
                )}
                {product.variants.length > 0 && (
                    <Box className={styles.section}>
                        <Typography component="h2" variant="h3">Variants</Typography>
                        <Box className={styles.variantBox}>
                            {product.variants.map((variant, index) => <VariantCard variant={variant} key={`${variant.sku ?? variant.mpn ?? variant.name ?? variant.size ?? index}`} formatPrice={formatPrice} />)}
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

const VariantCard = ({ variant, formatPrice }: { variant: ProductVariant; formatPrice: (value: number) => string }) => {
    const price = typeof variant.price === 'number' ? variant.price : variant.price?.price;
    const details = [
        variant.size && `Size: ${variant.size}`,
        variant.sku && `SKU: ${variant.sku}`,
        variant.mpn && `MPN: ${variant.mpn}`,
        variant.availability != null && `Availability: ${variant.availability ? 'Available' : 'Unavailable'}`,
    ].filter(Boolean).join(' · ');
    return <Box className={styles.variant}>
        <Box className={styles.variantHeader}>
            <Typography component="strong" className={styles.variantName}>{variant.name || variant.size || 'Variant'}</Typography>
            {price != null && <Typography className={styles.variantPrice}>{formatPrice(price)}</Typography>}
        </Box>
        {details && <Typography className={styles.variantMeta}>{details}</Typography>}
    </Box>;
};

export default Page;
