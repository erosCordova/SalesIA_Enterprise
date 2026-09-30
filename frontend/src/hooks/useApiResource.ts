import {
  useCallback,
  useEffect,
  useState,
} from "react";


export function useApiResource<T>(
  loader: () => Promise<T>,
) {
  const [
    data,
    setData,
  ] = useState<T | null>(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  const reload = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const response =
          await loader();

        setData(response);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo cargar la información.",
        );
      } finally {
        setLoading(false);
      }
    },
    [
      loader,
    ],
  );


  useEffect(
    () => {
      void reload();
    },
    [
      reload,
    ],
  );


  return {
    data,
    setData,
    loading,
    error,
    reload,
  };
}
