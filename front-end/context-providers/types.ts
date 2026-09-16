import { ReactNode } from 'react';

export interface ReactHookFormProviderProps {
    children: ReactNode;
    defaultValues?: Record<string, any>;
    onSubmit?: (data: any) => void;
}

export interface ReactQueryClientProviderProps {
    children: ReactNode;
}
