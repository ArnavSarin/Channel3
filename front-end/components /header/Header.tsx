import { AppBar, Box } from '@mui/material';
import { HeaderProps } from './types';
import styles from './Header.module.scss';

const Header = ({ content, containerClassName, className, ...props }: HeaderProps) => {
    return (
        <Box className={[styles.headerBox, containerClassName].filter(Boolean).join(' ')} id={'headerBox'}>
            <AppBar
                position="static"
                {...props}
                className={[styles.headerAppBar, className].filter(Boolean).join(' ')}
            >
                {content}
            </AppBar>
        </Box>
    );
};
export default Header;
