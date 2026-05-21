import { useEffect, useState } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import { AuthScreen } from './src/screens/AuthScreen';
import { ChatsScreen } from './src/screens/ChatsScreen';
import type { User } from './src/types';

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const u = await SecureStore.getItemAsync('user');
      const t = await SecureStore.getItemAsync('accessToken');
      if (u && t) {
        setUser(JSON.parse(u));
        setToken(t);
      }
      setReady(true);
    })();
  }, []);

  if (!ready) return null;

  return (
    <NavigationContainer theme={{ ...DarkTheme, colors: { ...DarkTheme.colors, background: '#000', card: '#111', primary: '#D11F1F' } }}>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user && token ? (
          <Stack.Screen name="Chats">
            {() => <ChatsScreen user={user} token={token} onLogout={() => { setUser(null); setToken(null); }} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Auth">
            {() => (
              <AuthScreen
                onAuth={async (u, access, refresh) => {
                  await SecureStore.setItemAsync('user', JSON.stringify(u));
                  await SecureStore.setItemAsync('accessToken', access);
                  await SecureStore.setItemAsync('refreshToken', refresh);
                  setUser(u);
                  setToken(access);
                }}
              />
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
