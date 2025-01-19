/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
import React, {useRef, useState, useEffect} from 'react';
import {
  StyleSheet,
  Platform,
  Text,
  View,
  TouchableOpacity,
  Image,
  Switch,
  TouchableHighlight,
} from 'react-native';
import {
  Icon,
  PaperProvider,
  Snackbar,
  Banner,
  Button,
  Modal,
  Portal,
} from 'react-native-paper';
import {Camera} from 'react-native-camera-kit';

import TestConsole from './TestConsole';

import _updateConfig from '../update.json';
import {PushyProvider, Pushy, usePushy} from 'react-native-update';
import * as Sentry from '@sentry/react-native';
const {appKey} = _updateConfig[Platform.OS];

function App() {
  const {
    client,
    checkUpdate,
    downloadUpdate,
    switchVersionLater,
    switchVersion,
    updateInfo,
    packageVersion,
    currentHash,
    parseTestQrCode,
    progress: {received, total} = {},
  } = usePushy();
  const [useDefaultAlert, setUseDefaultAlert] = useState(true);
  const [showTestConsole, setShowTestConsole] = useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [showUpdateSnackbar, setShowUpdateSnackbar] = useState(false);
  const snackbarVisible =
    !useDefaultAlert && showUpdateSnackbar && updateInfo?.update;
  const [showCamera, setShowCamera] = useState(false);
  const lastParsedCode = useRef('');

  const testError = () => {
    throw new Error('😁Sentry error!' + new Date().getTime());
  };

  useEffect(() => {
    Sentry.init({
      dsn: 'https://3809714074da476d40b0f68d84cdf84a@o562025.ingest.us.sentry.io/4508663331553280',
      // Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing.
      // We recommend adjusting this value in production.
      tracesSampleRate: 1.0,
      // profilesSampleRate is relative to tracesSampleRate.
      // Here, we'll capture profiles for 100% of transactions.
      profilesSampleRate: 1.0,
    });
  }, []);

  return (
    <View style={styles.container}>
      <TouchableHighlight
        style={{
          width: 100,
          height: 100,
          backgroundColor: 'red',
        }}
        onPress={testError}>
        <Text>触发sentry error</Text>
      </TouchableHighlight>
      {/* <Text style={styles.welcome}>😁Update success!</Text> */}
      <Text style={styles.welcome}>欢迎使用Pushy热更新服务</Text>
      <View style={{flexDirection: 'row'}}>
        <Text>
          {useDefaultAlert ? '当前使用' : '当前不使用'}默认的alert更新提示
        </Text>
        <Switch
          value={useDefaultAlert}
          onValueChange={v => {
            setUseDefaultAlert(v);
            client?.setOptions({
              updateStrategy: v ? null : 'alwaysAlert',
            });
            setShowUpdateSnackbar(!v);
          }}
        />
      </View>
      <Button onPress={() => setShowCamera(true)}>打开相机</Button>
      <Portal>
        <Modal visible={showCamera} onDismiss={() => setShowCamera(false)}>
          <Camera
            style={{minHeight: 320}}
            scanBarcode={true}
            onReadCode={({nativeEvent: {codeStringValue}}) => {
              // 防止重复扫码
              if (lastParsedCode.current === codeStringValue) {
                return;
              }
              lastParsedCode.current = codeStringValue;
              setTimeout(() => {
                lastParsedCode.current = '';
              }, 1000);
              setShowCamera(false);
              parseTestQrCode(codeStringValue);
            }} // optional
            showFrame={true} // (default false) optional, show frame with transparent layer (qr code or barcode will be read on this area ONLY), start animation for scanner, that stops when a code has been found. Frame always at center of the screen
            laserColor="red" // (default red) optional, color of laser in scanner frame
            frameColor="white" // (default white) optional, color of border of scanner frame
          />
        </Modal>
      </Portal>
      <Image
        resizeMode={'contain'}
        source={require('./assets/shezhi.png')}
        style={styles.image}
      />
      <Text style={styles.instructions}>
        这是版本一 {'\n'}
        当前原生包版本号: {packageVersion}
        {'\n'}
        当前热更新版本Hash: {currentHash || '(空)'}
        {'\n'}
      </Text>
      <Text>
        下载进度：{received} / {total}
      </Text>
      <TouchableOpacity
        onPress={() => {
          checkUpdate();
          setShowUpdateSnackbar(true);
        }}>
        <Text style={styles.instructions}>点击这里检查更新</Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="testcase"
        style={{marginTop: 15}}
        onLongPress={() => {
          setShowTestConsole(true);
        }}>
        <Text style={styles.instructions}>
          react-native-update版本：{client?.version}
        </Text>
      </TouchableOpacity>
      <TestConsole
        visible={showTestConsole}
        onClose={() => setShowTestConsole(false)}
      />
      {snackbarVisible && (
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => {
            setShowUpdateSnackbar(false);
          }}
          action={{
            label: '更新',
            onPress: async () => {
              setShowUpdateSnackbar(false);
              await downloadUpdate();
              setShowUpdateBanner(true);
            },
          }}>
          <Text style={{color: 'white'}}>
            有新版本({updateInfo.name})可用，是否更新？
          </Text>
        </Snackbar>
      )}
      <Banner
        style={{width: '100%', position: 'absolute', top: 0}}
        visible={showUpdateBanner}
        actions={[
          {
            label: '立即重启',
            onPress: switchVersion,
          },
          {
            label: '下次再说',
            onPress: () => {
              switchVersionLater();
              setShowUpdateBanner(false);
            },
          },
        ]}
        icon={({size}) => (
          <Icon name="checkcircleo" size={size} color="#00f" />
        )}>
        更新已完成，是否立即重启？
      </Banner>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  image: {},
});

const pushyClient = new Pushy({
  appKey,
  debug: true,
});

const Root = () => {
  return (
    <PushyProvider client={pushyClient}>
      <PaperProvider>
        <App />
      </PaperProvider>
    </PushyProvider>
  );
};

export default Sentry.wrap(Root);
