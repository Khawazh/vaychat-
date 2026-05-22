import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { api } from '../lib/api';
import type { User } from '../types';

export function ChatsScreen({
  user,
  token,
  onLogout,
}: {
  user: User;
  token: string;
  onLogout: () => void;
}) {
  const [chats, setChats] = useState<Array<{ id: string; title?: string; type: string }>>([]);

  useEffect(() => {
    api<{ chats: Array<{ id: string; title?: string; type: string }> }>('/api/chats', {
      token,
    })
      .then((r) => setChats(r.chats))
      .catch(() => setChats([]));
  }, [token]);

  async function logout() {
    await SecureStore.deleteItemAsync('user');
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    onLogout();
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Image source={require('../../assets/logo.png')} style={styles.logoSm} />
        <View style={styles.headerText}>
          <Text style={styles.h1}>Чаты</Text>
          <Text style={styles.sub}>{user.displayName ?? user.phone}</Text>
        </View>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.out}>Выйти</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>Пока нет чатов. Создайте диалог в веб-версии.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(item.title ?? item.type)[0]}</Text>
            </View>
            <Text style={styles.name}>{item.title ?? item.type}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  logoSm: { width: 40, height: 40, borderRadius: 20 },
  headerText: { flex: 1, marginLeft: 12 },
  h1: { color: '#fff', fontSize: 20, fontWeight: '700' },
  sub: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  out: { color: '#D11F1F', fontSize: 14 },
  empty: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40, padding: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#111',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(15,143,61,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#0F8F3D', fontWeight: '700', fontSize: 18 },
  name: { color: '#fff', marginLeft: 12, fontSize: 16 },
});
