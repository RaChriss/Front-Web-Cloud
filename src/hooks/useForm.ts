import { useState, useCallback, type ChangeEvent, type FormEvent } from 'react';

interface UseFormOptions<T> {
    initialValues: T;
    validate?: (values: T) => Partial<Record<keyof T, string>>;
    onSubmit: (values: T) => Promise<void> | void;
}

interface UseFormReturn<T> {
    values: T;
    errors: Partial<Record<keyof T, string>>;
    isSubmitting: boolean;
    handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
    setFieldValue: (field: keyof T, value: T[keyof T]) => void;
    setFieldError: (field: keyof T, error: string) => void;
    setValues: React.Dispatch<React.SetStateAction<T>>;
    resetForm: () => void;
}

export function useForm<T extends object>({
    initialValues,
    validate,
    onSubmit,
}: UseFormOptions<T>): UseFormReturn<T> {
    const [values, setValues] = useState<T>(initialValues);
    const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setValues((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        // Clear error when user starts typing
        setErrors((prev) => ({ ...prev, [name]: undefined }));
    }, []);

    const setFieldValue = useCallback((field: keyof T, value: T[keyof T]) => {
        setValues((prev) => ({ ...prev, [field]: value }));
    }, []);

    const setFieldError = useCallback((field: keyof T, error: string) => {
        setErrors((prev) => ({ ...prev, [field]: error }));
    }, []);

    const resetForm = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setIsSubmitting(false);
    }, [initialValues]);

    const handleSubmit = useCallback(
        async (e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();

            if (validate) {
                const validationErrors = validate(values);
                if (Object.keys(validationErrors).length > 0) {
                    setErrors(validationErrors);
                    return;
                }
            }

            setIsSubmitting(true);
            try {
                await onSubmit(values);
            } finally {
                setIsSubmitting(false);
            }
        },
        [values, validate, onSubmit]
    );

    return {
        values,
        errors,
        isSubmitting,
        handleChange,
        handleSubmit,
        setFieldValue,
        setFieldError,
        setValues,
        resetForm,
    };
}
