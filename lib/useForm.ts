import { useMemo, useState } from 'react';
import http from '@ducor/http-client';

export type AnyMethod = (...args: any[]) => any;

type FormFiledData = {
    [key: string]: string | number | boolean;
};

type FormFieldsError = {
    [key: string]: string | string[];
};

interface OptionsOrConfig {
    onStart?: () => void;
    onSuccess?: (response: any) => void;
    onError?: (error: any) => void;
    onFinish?: () => void;
}

interface HttpInterface {
    get: (url: string, params?: any, options?: OptionsOrConfig) => Promise<void>;
    post: (url: string, data?: any, options?: OptionsOrConfig) => Promise<void>;
    put: (url: string, data?: any, options?: OptionsOrConfig) => Promise<void>;
    patch: (url: string, data?: any, options?: OptionsOrConfig) => Promise<void>;
    delete: (url: string, data?: any, options?: OptionsOrConfig) => Promise<void>;
    [key: string]: (url: string, data?: any, options?: OptionsOrConfig) => Promise<void>;
}

interface UseFormReturn {
    isDirty: boolean;
    processing: boolean;
    filedData: FormFiledData;
    setDefaults: (fieldOrFields?: string | FormFiledData, maybeValue?: FormFiledData[keyof FormFiledData]) => void;
    setFiledData: (data: FormFiledData) => void;
    reset: (...fields: Array<keyof FormFiledData>) => void;
    errors: FormFieldsError;
    hasErrors: boolean;
    clearErrors: () => void;
    setError: (fieldErrorOrErrros: keyof FormFieldsError | FormFieldsError, maybeValue?: string | string[]) => void;
    req: Record<string, AnyMethod>; // Proxy-like object for dynamic method handling
}

export const useForm = (initialValues: FormFiledData = {}): UseFormReturn => {
    const [defaults, setDefaults] = useState<FormFiledData>(initialValues);
    const [filedData, setFiledData] = useState<FormFiledData>({});
    const [isDirty, setIsDirty] = useState<boolean>(false); // form value change
    const [errors, setErrors] = useState<FormFieldsError>({});
    const [processing, setProcessing] = useState<boolean>(false);
    const [hasErrors, setHasErrors] = useState<boolean>(false);

    useMemo(() => {
        setFiledData(defaults);
        setErrors({});
    }, [defaults]);

    // Common request handler function
    const request = (
        method: string,
        url: string,
        data: any = {},
        options: OptionsOrConfig = {}
    ) => {
        options?.onStart?.(); // Call the onStart hook
        // Call the method dynamically on feach and chain promises
        
        return http[method](url, { data }) // Adjusted for typical feach usage
            .then((response: any) => {
                options?.onSuccess?.(response); // Call the onSuccess hook
            })
            .catch((error: any) => {

                if (error?.response?.status === 422) {
                    const { errors } = error;
                    let hasErrors = false;
                    const filteredErrors: Record<string, string | string[]> = {};
                  
                    if (typeof errors === 'object' && errors !== null) {
                      Object.entries(errors).forEach(([fieldName, maybeValue]) => {
                        if (typeof fieldName !== 'string') return;
                  
                        if (typeof maybeValue === 'string') {
                          filteredErrors[fieldName] = maybeValue;
                          hasErrors = true;
                          return;
                        }
                  
                        if (Array.isArray(maybeValue) && maybeValue.length > 0) {
                          const errorValue = maybeValue.filter((value) => typeof value === 'string') as string[];
                  
                          if (errorValue.length > 0) {
                            filteredErrors[fieldName] = errorValue;
                            hasErrors = true;
                          }
                        }
                      });
                    }
                  
                    if (hasErrors) {
                      setErrors(filteredErrors);
                    }
                  }
                  
                options?.onError?.(error); // Call the onError hook
            })
            .finally(() => {
                options?.onFinish?.(); // Call the onFinish hook
            });
    };

    return {
        isDirty,
        processing,
        filedData,
        setDefaults: (fieldOrFields?: keyof FormFiledData | FormFiledData, maybeValue?: FormFiledData[keyof FormFiledData]): void => {
            if (typeof fieldOrFields === 'undefined') {
                setDefaults(() => filedData);
            } else if (typeof fieldOrFields === 'string' && typeof maybeValue !== 'undefined') {
                setFiledData({ ...defaults, [fieldOrFields]: maybeValue });
            } else if (typeof fieldOrFields === 'object') {
                const newData: FormFiledData = {};
                for (const key in fieldOrFields) {
                    if (fieldOrFields.hasOwnProperty(key)) {
                        newData[key] = fieldOrFields[key];
                    }
                }
                setDefaults({
                    ...defaults,
                    ...newData,
                });
            }
        },
        setFiledData: (keyOrData: keyof FormFiledData | FormFiledData, maybeValue: FormFiledData[keyof FormFiledData] = ""): void => {
            if (typeof keyOrData === 'string' && typeof maybeValue !== 'undefined') {
                setFiledData({ ...filedData, [keyOrData]: typeof maybeValue === 'undefined'? "": maybeValue });
            } else if (typeof keyOrData === 'object') {
                const newData: FormFiledData = {};
                for (const key in keyOrData) {
                    if (keyOrData.hasOwnProperty(key)) {
                        newData[key] = typeof keyOrData[key] === 'undefined'?"": keyOrData[key] ;
                    }
                }
                setFiledData({
                    ...filedData,
                    ...newData,
                });
            }
        },
        reset(...fields: Array<keyof FormFiledData>) {
            if (fields.length === 0) {
                setFiledData(defaults);
            } else {
                setFiledData(
                    (Object.keys(defaults) as Array<keyof FormFiledData>)
                        .filter((key) => fields.includes(key))
                        .reduce(
                            (carry, key) => {
                                carry[key] = defaults[key];
                                return carry;
                            },
                            { ...filedData },
                        ),
                );
            }
        },
        errors,
        hasErrors,
        setError: (fieldErrorOrErrros: keyof FormFieldsError | FormFieldsError, maybeValue?: string | string[]): void => {
            setErrors((errors: FormFieldsError) => {
                const newErrors: FormFieldsError = {
                    ...errors,
                    ...((typeof fieldErrorOrErrros === 'string' && typeof maybeValue === 'string') || (typeof fieldErrorOrErrros === 'string' && typeof maybeValue === 'object' && Array.isArray(maybeValue))
                        ? { [fieldErrorOrErrros]: maybeValue }
                        : (fieldErrorOrErrros as Record<keyof FormFieldsError, string | string[]>)),
                };
                setHasErrors(Object.keys(newErrors).length > 0);
                return newErrors;
            });
        },
        clearErrors(...fields: Array<keyof FormFieldsError>): void {
            setErrors((errors) => {
                const newErrors = (Object.keys(errors) as Array<keyof FormFieldsError>).reduce(
                    (carry, field) => ({
                        ...carry,
                        ...(fields.length > 0 && !fields.includes(field) ? { [field]: errors[field] } : {}),
                    }),
                    {},
                );
                setHasErrors(Object.keys(newErrors).length > 0);
                return newErrors;
            });
        },
            // Proxy to intercept and dynamically handle HTTP methods
        req: new Proxy<Record<string, AnyMethod>>({}, {
            get(target, method: string) {
                console.log("___", target, method);
                if (typeof http[method] === 'function') {
                    return (url: string, data?: any, options?: OptionsOrConfig) => {
                        return request(method, url, data, options);
                    };
                }
                throw new Error(`Method ${method} is not supported.`);
            }
        }),
    };
};

export default useForm;