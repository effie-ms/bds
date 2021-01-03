import { useRef, useEffect } from 'react';

export const usePrevious = value => {
    const ref = useRef(null);
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
};

export const useCompare = val => {
    const prevVal = usePrevious(val);
    return prevVal !== val;
};
