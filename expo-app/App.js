import React, { useRef } from 'react';
import { StyleSheet, SafeAreaView, Platform, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return null;
    }
    // Wichtig für EAS Build
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;
  }

  return token;
}

export default function App() {
  const webViewRef = useRef(null);
  const [themeBg, setThemeBg] = React.useState('#09090b');

  // Basis-URL der Web-App
  const CAMP_URL = 'https://campmesser.ch';

  const onMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'THEME_UPDATE') {
        setThemeBg(data.value === 'light' ? '#ffffff' : '#09090b');
      }
      if (data.type === 'REQUEST_PUSH_TOKEN') {
        const token = await registerForPushNotificationsAsync();
        if (token && webViewRef.current) {
          // Send the token back to the web view
          webViewRef.current.injectJavaScript(
            `window.dispatchEvent(new CustomEvent("ExpoPushToken", { detail: "${token}" })); true;`
          );
        } else {
          // Error or denied
          webViewRef.current.injectJavaScript(
            `window.dispatchEvent(new CustomEvent("ExpoPushTokenError")); true;`
          );
        }
      }
    } catch (e) {
      console.log('Error parsing message from webview', e);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeBg }]}>
      <WebView
        ref={webViewRef}
        source={{ uri: CAMP_URL }}
        style={styles.webview}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        onMessage={onMessage}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  webview: {
    flex: 1,
  },
});
