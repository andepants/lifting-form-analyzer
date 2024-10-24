import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Button } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { useRouter } from 'expo-router';

const RecordScreen = () => {
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const devices = useCameraDevices();
  const backCamera = devices.find(device => device.position === 'back');
  const [recording, setRecording] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkPermissions = async () => {
      const status = await Camera.getCameraPermissionStatus();
      setPermissionStatus(status);
    };

    checkPermissions();
  }, []);

  const requestPermission = async () => {
    const newStatus = await Camera.requestCameraPermission();
    setPermissionStatus(newStatus);
  };

  const startRecording = async () => {
    if (cameraRef.current) {
      await cameraRef.current.startRecording({
        onRecordingFinished: (videoFile) => {
          setVideoUri(videoFile.path);
          setRecording(false);
        },
        onRecordingError: (error) => console.error(error),
      });
      setRecording(true);
    }
  };

  const stopRecording = async () => {
    if (cameraRef.current) {
      await cameraRef.current.stopRecording();
      setRecording(false);
    }
  };

  if (permissionStatus !== 'granted') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Camera permission is {permissionStatus}.</Text>
        <Button title="Request Permission" onPress={requestPermission} />
      </View>
    );
  }

  if (!backCamera) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No back camera device available.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Camera
        style={{ flex: 1 }}
        device={backCamera}
        isActive={true}
        ref={cameraRef}
      />
      <Button
        title={recording ? "Stop Recording" : "Start Recording"}
        onPress={recording ? stopRecording : startRecording}
      />
      {videoUri && (
        <>
          <Button
            title="Use Video"
            onPress={() => router.push({ pathname: '/analyze', params: { videoUri } })}
          />
          <Button
            title="Retake Video"
            onPress={() => setVideoUri(null)}
          />
        </>
      )}
    </View>
  );
};

export default RecordScreen;
