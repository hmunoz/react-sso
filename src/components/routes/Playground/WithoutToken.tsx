import { useQuery } from '@tanstack/react-query';
import { sleep } from '../../../utils';
import { Alert } from '../../Alert';

export const WithoutToken: React.FC = () => {
  const queryFn = async () => {
    // simulate slow network
    await sleep(500);

    const url = import.meta.env.VITE_API_BASE_URL + '/api/tests';

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Unexpected response status: ${response.status}`);
    }

    return await response.json();
  };

  const { isPending, error, data } = useQuery({
    queryKey: ['WithoutToken'],
    retry: false, // only setting to `false` for sake of demo, normally you'd want this `true`
    queryFn
  });

  return error ? (
    <Alert variant="error">{error.message}</Alert>
  ) : isPending ? (
    <>Loading...</>
  ) : (
    <Alert variant="success">{JSON.stringify(data, null, 2)}</Alert>
  );
};
