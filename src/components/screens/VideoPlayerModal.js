import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Text,
} from "react-native";
import React, { useEffect, useState } from "react";
import { VideoView, useVideoPlayer } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import * as ScreenOrientation from "expo-screen-orientation";
import { clearVideoToPlay } from "../../store/index";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const VideoPlayerModal = () => {
  const dispatch = useDispatch();
  const video = useSelector((state) => state.movie.videoToPlay);
  const visible = !!video;

  const [orientation, setOrientation] = useState("PORTRAIT");
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const player = useVideoPlayer(video?.videoUrl, (player) => {
    player.loop = false;
    player.staysActiveInBackground = false;
  });

  const formatTime = (seconds) => {
    if (!seconds || seconds === 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimestampText = () => {
    if (!video) return "";
    const totalDuration = video.endTime || 0;
    return `${formatTime(currentTime)} / ${formatTime(totalDuration)}`;
  };

  useEffect(() => {
    if (!player) return;

    const subscription = player.addListener("playingChange", ({ isPlaying }) =>
      setIsPlaying(isPlaying)
    );

    const progressSubscription = player.addListener(
      "progressUpdate",
      ({ currentTime: time }) => {
        setCurrentTime(time / 1000);
        if (video?.endTime && time / 1000 >= video.endTime) {
          player.pause();
          dispatch(clearVideoToPlay());
        }
      }
    );

    const errorSubscription = player.addListener("error", (error) => {
      console.log("Video error:", error);
    });

    return () => {
      subscription.remove();
      progressSubscription.remove();
      errorSubscription.remove();
    };
  }, [player, video]);

  useEffect(() => {
    const subscribe = ScreenOrientation.addOrientationChangeListener(
      (event) => {
        const o = event.orientationInfo.orientation;
        if (
          o === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
          o === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
        ) {
          setOrientation("LANDSCAPE");
        } else {
          setOrientation("PORTRAIT");
        }
      }
    );

    return () => ScreenOrientation.removeOrientationChangeListener(subscribe);
  }, []);

  // 🔐 Lock orientation only inside modal
  useEffect(() => {
    if (visible) {
      ScreenOrientation.unlockAsync(); // allow user rotation
    } else {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
    }
  }, [visible]);

  const closePlayer = async () => {
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP
    );
    dispatch(clearVideoToPlay());
  };

  const isLandscape = orientation === "LANDSCAPE";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      supportedOrientations={["portrait", "landscape"]}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            isLandscape ? styles.landscapeModal : null,
          ]}
        >
          <View
            style={[
              styles.videoContainer,
              isLandscape ? styles.landscapeVideo : null,
            ]}
          >
            {video && (
              <VideoView
                player={player}
                contentFit="cover"
                allowsPictureInPicture
                nativeControls={true}
                style={StyleSheet.absoluteFillObject}
              />
            )}

            <TouchableOpacity onPress={closePlayer} style={styles.closeButton}>
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {!isLandscape && video?.isSubscene && (
            <View style={styles.timestampContainer}>
              <Text style={styles.timestampText}>{getTimestampText()}</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    // height: screenHeight,
    // width: screenWidth,
  },
  modalContainer: {
    width: screenWidth,
    alignItems: "center",
  },
  landscapeModal: {
    transform: [{ rotate: "0deg" }],
    width: screenHeight,
    height: screenWidth,
  },
  videoContainer: {
    width: screenWidth,
    height: screenHeight * 0.3,
    backgroundColor: "#000",
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderColor: "#fab81e",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  landscapeVideo: {
    width: screenHeight,
    height: screenWidth,
  },
  timestampContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: screenWidth,
    alignItems: "center",
  },
  timestampText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  closeButton: {
    position: "absolute",
    right: 5,
    top: 5,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#dc3545",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default VideoPlayerModal;
