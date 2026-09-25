import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { supabase } from '../services/supabase';

type AuthScreenProps = {
  onAuthenticated: () => void;
};

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();
    const cleanDisplayName = displayName.trim();

    if (!cleanEmail || !password) {
      Alert.alert('Missing information', 'Please enter email and password.');
      return;
    }

    if (mode === 'signup' && !cleanUsername) {
      Alert.alert('Missing username', 'Please enter a username.');
      return;
    }

    try {
      setLoading(true);

      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) throw error;

        if (!data.session) {
          Alert.alert(
            'Login incomplete',
            'Please check your email and complete verification if required.'
          );
          return;
        }

        onAuthenticated();
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: 'livesocial://auth/callback',
        },
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error('Could not create account.');
      }

      if (!data.session) {
        Alert.alert(
          'Check your email',
          'Your account was created. Please verify your email, then return and log in.'
        );
        setMode('login');
        return;
      }

      const response = await fetch(
        'https://live-social-app-five.vercel.app/api/users/profile',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify({
            username: cleanUsername,
            display_name: cleanDisplayName || cleanUsername,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        await supabase.auth.signOut();
        throw new Error(result?.error || 'Could not create profile.');
      }

      onAuthenticated();
    } catch (error: any) {
      console.error('Auth error:', error);
      Alert.alert(
        mode === 'login' ? 'Login failed' : 'Signup failed',
        error?.message || 'Something went wrong.'
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logo}>
          <Text style={styles.logoText}>LS</Text>
        </View>

        <Text style={styles.title}>Live Social</Text>
        <Text style={styles.subtitle}>
          {mode === 'login'
            ? 'Welcome back'
            : 'Create your Live Social account'}
        </Text>

        {mode === 'signup' && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#777"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={styles.input}
              placeholder="Display Name"
              placeholderTextColor="#777"
              value={displayName}
              onChangeText={setDisplayName}
            />
          </>
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#777"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#777"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <Pressable
          style={[styles.authButton, loading && styles.disabledButton]}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.authButtonText}>
              {mode === 'login' ? 'Log In' : 'Create Account'}
            </Text>
          )}
        </Pressable>

        <Pressable style={styles.switchButton} onPress={switchMode}>
          <Text style={styles.switchText}>
            {mode === 'login'
              ? "Don't have an account? "
              : 'Already have an account? '}
            <Text style={styles.switchHighlight}>
              {mode === 'login' ? 'Sign Up' : 'Log In'}
            </Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#07070b',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 50,
  },
  logo: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#ff2d78',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  logoText: {
    color: '#fff',
    fontSize: 25,
    fontWeight: '800',
  },
  title: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#999',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 7,
    marginBottom: 28,
  },
  input: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#14141b',
    borderWidth: 1,
    borderColor: '#272731',
    color: '#fff',
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 15,
  },
  authButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#ff2d78',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.65,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  switchButton: {
    alignItems: 'center',
    marginTop: 22,
  },
  switchText: {
    color: '#888',
    fontSize: 14,
  },
  switchHighlight: {
    color: '#ff4b91',
    fontWeight: '700',
  },
});
