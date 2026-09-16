import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { ReactHookFormProviderProps } from '../types';
import styles from './ReactHookFormProvider.module.scss';

export const ReactHookFormProvider = ({
    children,
    defaultValues = {},
    onSubmit = () => {},
}: ReactHookFormProviderProps) => {
    const methods = useForm({ defaultValues });

    return (
        <FormProvider {...methods}>
            <form
                className={styles.form}
                onSubmit={methods.handleSubmit(onSubmit!)}
            >
                {children}
            </form>
        </FormProvider>
    );
};
