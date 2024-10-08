import { useQuery } from '@tanstack/react-query';
import { useAuth } from 'react-oidc-context';
import { sleep } from '../../../utils';
import { Alert } from '../../Alert';

export const WithToken: React.FC = () => {
  const auth = useAuth();

  const queryFn = async () => {
    // simulate slow network
    await sleep(500);

    const url = import.meta.env.VITE_API_BASE_URL + '/api/tests';

    const response = await fetch(url, {
      headers: {
        accept: `application/json`,
        Authorization: `Bearer ${auth.user?.access_token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Unexpected response status: ${response.status}`);
    }

    return await response.json();
  };

  const { isPending, error, data } = useQuery({
    queryKey: ['WithToken'],
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
