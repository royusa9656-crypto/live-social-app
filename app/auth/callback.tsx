import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../services/supabase';

export default function AuthCallback() {
  const { code } = useLocalSearchParams<{ code?: string }>();

  useEffect(() => {
    const finishAuth = async () => {
      if (!code) {
        router.replace('/');
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Auth callback error:', error);
        router.replace('/');
        return;
      }

      router.replace('/');
    };

    finishAuth();
  }, [code]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#07070b',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ActivityIndicator color="#fff" />
    </View>
  );
}
