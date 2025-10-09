import { Tabs } from 'expo-router'
import React from 'react'
import { StyleSheet } from 'react-native'

const _layout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { display: 'none' },
        headerShown: false,
        headerTitle: '',
        headerTransparent: true,
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{
          headerShown: false,
          headerTitle: '',
          headerTransparent: true,
          tabBarButton: () => null,
          title: '',
        }} 
      />
      <Tabs.Screen
        name="firstscreen"
        options={{
          headerShown: false,
          headerTitle: '',
          headerTransparent: true,
          tabBarButton: () => null,
          title: '',
        }}
      />
      <Tabs.Screen
        name="videocall"
        options={{
          headerShown: false,
          headerTitle: '',
          headerTransparent: true,
          tabBarButton: () => null,
          title: '',
        }}
      />
    </Tabs>
  )
}

export default _layout

const styles = StyleSheet.create({})


