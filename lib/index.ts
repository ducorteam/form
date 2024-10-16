import { useCallback, useMemo, useState } from 'react';
import feach, { AnyMethod, HttpRequestConfig } from '@ducor/http-client';

type FormDataType = {
    [key: string]: string | number | boolean;
};

type FormErrorType = {
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
}

export const useForm = (initialValues: FormDataType = {}): any => {
    const [defaults, setDefaults] = useState<FormDataType>(initialValues);
    const [data, setData] = useState<FormDataType>({});
    const [isDirty, setIsDirty] = useState<boolean>(false); // form value change
    const [errors, setErrors] = useState<FormErrorType>({});
    const [processing, setProcessing] = useState<boolean>(false);
    const [hasErrors, setHasErrors] = useState<boolean>(false);

    useMemo(() => {
        setData(defaults);
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
        return feach[method](url, { data }) // Adjusted for typical feach usage
            .then((response: any) => {
                options?.onSuccess?.(response); // Call the onSuccess hook
            })
            .catch((error: any) => {

                console.log("sdafsdfsd", error);
                console.log("sdafsdfsd", error);
                options?.onError?.(error); // Call the onError hook
            })
            .finally(() => {
                options?.onFinish?.(); // Call the onFinish hook
            });
    };

    // Proxy to intercept and dynamically handle HTTP methods
    const http = new Proxy<Record<string, AnyMethod>>({}, {
        get(target, method: string) {
            console.log("___", target, method);
            if (typeof feach[method] === 'function') {
                return (url: string, data?: any, options?: OptionsOrConfig) => {
                    return request(method, url, data, options);
                };
            }
            throw new Error(`Method ${method} is not supported.`);
        }
    });

    return {
        isDirty,
        processing,
        data,
        setDefaults: (fieldOrFields?: keyof FormDataType | FormDataType, maybeValue?: FormDataType[keyof FormDataType]): void => {
            if (typeof fieldOrFields === 'undefined') {
                setDefaults(() => data);
            } else if (typeof fieldOrFields === 'string' && typeof maybeValue !== 'undefined') {
                setData({ ...defaults, [fieldOrFields]: maybeValue });
            } else if (typeof fieldOrFields === 'object') {
                const newData: FormDataType = {};
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
        setData: (keyOrData: keyof FormDataType | FormDataType, maybeValue: FormDataType[keyof FormDataType] = ""): void => {
            if (typeof keyOrData === 'string' && typeof maybeValue !== 'undefined') {
                setData({ ...data, [keyOrData]: typeof maybeValue === 'undefined'? "": maybeValue });
            } else if (typeof keyOrData === 'object') {
                const newData: FormDataType = {};
                for (const key in keyOrData) {
                    if (keyOrData.hasOwnProperty(key)) {
                        newData[key] = typeof keyOrData[key] === 'undefined'?"": keyOrData[key] ;
                    }
                }
                setData({
                    ...data,
                    ...newData,
                });
            }
        },
        reset(...fields: Array<keyof FormDataType>) {
            if (fields.length === 0) {
                setData(defaults);
            } else {
                setData(
                    (Object.keys(defaults) as Array<keyof FormDataType>)
                        .filter((key) => fields.includes(key))
                        .reduce(
                            (carry, key) => {
                                carry[key] = defaults[key];
                                return carry;
                            },
                            { ...data },
                        ),
                );
            }
        },
        errors,
        hasErrors,
        setError: (fieldErrorOrErrros: keyof FormErrorType | FormErrorType, maybeValue?: string | string[]): void => {
            setErrors((errors: FormErrorType) => {
                const newErrors: FormErrorType = {
                    ...errors,
                    ...((typeof fieldErrorOrErrros === 'string' && typeof maybeValue === 'string') || (typeof fieldErrorOrErrros === 'string' && typeof maybeValue === 'object' && Array.isArray(maybeValue))
                        ? { [fieldErrorOrErrros]: maybeValue }
                        : (fieldErrorOrErrros as Record<keyof FormErrorType, string | string[]>)),
                };
                setHasErrors(Object.keys(newErrors).length > 0);
                return newErrors;
            });
        },
        clearErrors(...fields: Array<keyof FormErrorType>): void {
            setErrors((errors) => {
                const newErrors = (Object.keys(errors) as Array<keyof FormErrorType>).reduce(
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
        http,
    };
};

export default useForm;