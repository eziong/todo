---
name: mobile-offline-patterns
description: Offline-first patterns for React Native mobile apps using @react-native-community/netinfo and AsyncStorage. Use when implementing network status detection, offline sync queues, cached data for offline reading, offline banners, or assertOnline guards in React Native or Expo mobile applications.
user-invocable: false
---

# Mobile Offline-First Patterns

## Network Status Detection

```tsx
// hooks/useNetworkStatus.ts
import NetInfo from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? true);
    });
    return unsubscribe;
  }, []);

  return { isOnline };
}

// Guard function for mutations
export async function assertOnline(): Promise<void> {
  const state = await NetInfo.fetch();
  if (!state.isConnected) {
    throw new OfflineError('No network connection');
  }
}
```

## Offline Provider

```tsx
// providers/OfflineProvider.tsx
interface OfflineContextValue {
  isOnline: boolean;
  pendingActions: number;
  syncNow: () => Promise<void>;
}

export function OfflineProvider({ children }) {
  const { isOnline } = useNetworkStatus();
  const [pendingActions, setPendingActions] = useState(0);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline) {
      processSyncQueue().then(() => {
        setPendingActions(0);
      });
    }
  }, [isOnline]);

  return (
    <OfflineContext.Provider value={{ isOnline, pendingActions, syncNow }}>
      {children}
    </OfflineContext.Provider>
  );
}
```

## Sync Action Queue

```tsx
// services/offline.ts
interface SyncAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  endpoint: string;
  payload: unknown;
  timestamp: number;
  retryCount: number;
}

class SyncQueue {
  private queue: SyncAction[] = [];

  async add(action: Omit<SyncAction, 'id' | 'timestamp' | 'retryCount'>) {
    const syncAction: SyncAction = {
      ...action,
      id: generateId(),
      timestamp: Date.now(),
      retryCount: 0,
    };
    this.queue.push(syncAction);
    await this.persist();
  }

  async processAll(): Promise<void> {
    const actions = [...this.queue].sort((a, b) => a.timestamp - b.timestamp);

    for (const action of actions) {
      try {
        await this.execute(action);
        this.queue = this.queue.filter((a) => a.id !== action.id);
      } catch (error) {
        action.retryCount++;
        if (action.retryCount >= MAX_RETRIES) {
          this.queue = this.queue.filter((a) => a.id !== action.id);
          // Log failed action for manual recovery
        }
      }
    }
    await this.persist();
  }

  private async persist() {
    await AsyncStorage.setItem('sync_queue', JSON.stringify(this.queue));
  }

  private async execute(action: SyncAction) {
    switch (action.type) {
      case 'CREATE': return api.post(action.endpoint, action.payload);
      case 'UPDATE': return api.put(action.endpoint, action.payload);
      case 'DELETE': return api.delete(action.endpoint);
    }
  }
}

export const syncQueue = new SyncQueue();
```

## Mutation with Offline Guard

```tsx
export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createItem,
    onMutate: async () => {
      await assertOnline(); // Throws if offline → prevents mutation
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
    },
  });
}
```

## Offline Banner UI

```tsx
function OfflineBanner() {
  const { isOnline, pendingActions } = useOffline();

  if (isOnline) return null;

  return (
    <Animated.View
      entering={SlideInUp.springify()}
      exiting={SlideOutUp}
      className="bg-warning-500 px-4 py-2"
    >
      <Text className="text-center text-sm font-medium text-white">
        {t('offline.banner')}
        {pendingActions > 0 &&
          ` (${t('offline.pendingActions', { count: pendingActions })})`}
      </Text>
    </Animated.View>
  );
}
```

## Cached Data for Offline Reading

```tsx
// Cache trip data for offline access
async function cacheTripData(trip: Trip): Promise<void> {
  await AsyncStorage.setItem(
    `cached_trip_${trip.id}`,
    JSON.stringify({
      data: trip,
      cachedAt: Date.now(),
    }),
  );
}

async function getCachedTrip(id: string): Promise<Trip | null> {
  const cached = await AsyncStorage.getItem(`cached_trip_${id}`);
  if (!cached) return null;

  const { data, cachedAt } = JSON.parse(cached);
  const isStale = Date.now() - cachedAt > CACHE_TTL;
  return isStale ? null : data;
}
```

## Rules

1. **assertOnline() in onMutate** → Guard write operations at mutation start
2. **Sync queue FIFO** → Process oldest actions first to maintain order
3. **Max retries** → Discard after N failures, log for manual recovery
4. **Cache critical data** → Allow read-only access to key data when offline
5. **Visual feedback** → Show offline banner and pending action count
6. **Auto-sync on reconnect** → Process queue automatically when network returns
7. **React Query persister** → Consider `persistQueryClient` for query cache persistence
