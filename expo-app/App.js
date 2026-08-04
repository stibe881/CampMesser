import React, { useRef } from 'react';
import { StyleSheet, BackHandler, SafeAreaView, Platform, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native'; // We won't use navigation yet, just basic WebView

export default function App() {
  const webViewRef = useRef(null);

  // Basis-URL der Web-App
  const CAMP_URL = 'https://campmesser.ch';

  return (
    <SafeAreaView style={styles.container}>
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
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // Passe dies an die Hintergrundfarbe der Web-App an
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  webview: {
    flex: 1,
  },
});
