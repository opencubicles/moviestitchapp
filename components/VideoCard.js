import React, { useRef, useState } from "react";
import { TouchableWithoutFeedback, Animated, StyleSheet } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { useDispatch, useSelector } from "react-redux";
import { setVideoToPlay, toggleVideoSelection } from "../store";

const VideoCard = ({ video, sceneId, subSceneId }) => {
  const dispatch = useDispatch();

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isHovered, setIsHovered] = useState(false);

  const { selectedSceneStitch, selectedMovie } = useSelector(
    (state) => state.movie
  );
  const isSelected = !!selectedSceneStitch?.[subSceneId]?.[video.id];
  const movieType = selectedMovie?.type;

  /** Single Tap → Play video */
  const handlePress = () => {
    dispatch(
      setVideoToPlay({
        videoUrl: video.videoUrl,
        startTime: video.startTime || 1,
        endTime: video.endTime,
        isSubscene: false,
      })
    );
  };

  /** Long Press → Toggle select/deselect */
  const handleLongPress = () => {
    dispatch(toggleVideoSelection({ video, subSceneId, movieType }));
  };

  const handlePressIn = () => {
    setIsHovered(true);
    Animated.spring(scaleAnim, {
      toValue: 1.08,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsHovered(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPress={handlePress}
      onLongPress={handleLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.videoCard,
          { transform: [{ scale: scaleAnim }] },
          isSelected && styles.highlightCard,
        ]}
      >
        <ExpoImage
          source={{ uri: video.thumbnail }}
          style={styles.thumbnail}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  videoCard: {
    width: 60,
    height: 40,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 2,
    borderColor: "transparent",
  },
  highlightCard: {
    borderColor: "#FFD700",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
});

export default VideoCard;
