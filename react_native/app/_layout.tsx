import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerTitle: '',
        headerTransparent: true,
        presentation: 'card',
      }}
    >
      <Stack.Screen 
        name="(tabs)" 
        options={{ 
          headerShown: false,
          headerTitle: '',
        }} 
      />
    </Stack>
  );
}
