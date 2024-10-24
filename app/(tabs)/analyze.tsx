import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Button } from 'react-native';
import Canvas from 'react-native-canvas';
import { Video } from 'expo-av';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as posenet from '@tensorflow-models/posenet';

export default function Analyze() {
  const [feedback, setFeedback] = useState<string[]>([]);
  const videoRef = useRef<Video | null>(null);
  const canvasRef = useRef<Canvas | null>(null);

  useEffect(() => {
    const initializeTf = async () => {
      await tf.ready();
      console.log('TensorFlow.js is ready');
    };

    const analyzeVideo = async () => {
      console.log('Analyzing video...');
      const net = await posenet.load();
      console.log('Model loaded', net);

      // Play the video
      await videoRef.current?.playAsync();
      console.log('Video playing');

      // Analyze each frame
      const analyzeFrame = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const ctx = canvasRef.current.getContext('2d');
        // Draw the video frame onto the canvas
        ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

        // Get image data from the canvas
        const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
        const videoTensor = tf.browser.fromPixels(imageData);

        // Estimate pose
        const pose = await net.estimateSinglePose(videoTensor, { flipHorizontal: false });

        // Generate feedback based on the pose
        const newFeedback = generateFeedback(pose);
        setFeedback(newFeedback);

        // Dispose of the tensor to free up memory
        videoTensor.dispose();

        // Continue analyzing frames
        requestAnimationFrame(analyzeFrame);
      };

      analyzeFrame();
    };

    initializeTf().then(analyzeVideo);
  }, []);

  const generateFeedback = (pose: posenet.Pose) => {
    const feedback = [];
    if (pose.keypoints[5].position.y > pose.keypoints[6].position.y) {
      feedback.push("Your left shoulder is higher than your right.");
    }
    return feedback;
  };

  return (
    <View style={{ flex: 1 }}>
      <Video
        ref={videoRef}
        source={{ uri: 'your-video-uri' }}
        style={{ width: '100%', height: 300 }}
        resizeMode="contain"
      />
      <Canvas ref={canvasRef} style={{ width: '100%', height: 300 }} />
      <View>
        {feedback.length > 0 ? (
          feedback.map((item, index) => <Text key={index}>{item}</Text>)
        ) : (
          <Text>Analyzing video...</Text>
        )}
      </View>
      <Button title="Back" onPress={() => console.log('Go back')} />
    </View>
  );
}
