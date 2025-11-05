import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { Button, Card } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { setVideoToPlay, selectRandomVideosFromSubscenes } from "../store";
import { SafeAreaView } from "react-native-safe-area-context";
import SubSceneSection from "./SubSceneSection";
import StitchedPreviewScreen from "./StitchedPreviewScreen";
import * as WebBrowser from "expo-web-browser";

const colors = {
  primaryBg: "#1C2526",
  secondaryBg: "#2A3435",
  text: "#F5F6F5",
  accent: "#FFD700",
  primaryAction: "#D32F2F",
  secondaryAction: "#455A64",
};

const screenWidth = Dimensions.get("window").width;

const SceneSection = ({
  scene,
  allScenes,
  uploadVideo,
  captureVideo,
  setUploadModalVisible,
  setCurrentSubSceneId,
}) => {
  const dispatch = useDispatch();

  const selectedMovie = useSelector((state) => state.movie.selectedMovie);

  const selectedSceneStitch = useSelector(
    (state) => state.movie.selectedSceneStitch
  );
  const [showStitchedModal, setShowStitchedModal] = useState(false);
  const [aiStitchedVideo, setAiStitchedVideo] = useState(null);
  const [showAiStitchedModal, setShowAiStitchedModal] = useState(false);
  const [showPdf, setShowPdf] = useState(false);

  const getSelectedSubmissionsCount = () => {
    if (!scene.subscenes || !selectedSceneStitch) return 0;

    return scene.subscenes.reduce((count, subscene) => {
      const subsceneSelections = selectedSceneStitch[subscene.id];
      if (subsceneSelections) {
        return count + Object.keys(subsceneSelections).length;
      }
      return count;
    }, 0);
  };
  const handleAIStitch = () => {
    dispatch(selectRandomVideosFromSubscenes({ sceneId: scene.id }));
    setShowStitchedModal(true);
  };
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.sceneScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.sceneTitleContainer}>
          <Card.Content>
            <Text style={styles.title}>{scene.title}</Text>
          </Card.Content>

          <Button
            mode="text"
            textColor={colors.accent}
            contentStyle={styles.buttonContent}
            style={styles.previewButton}
            onPress={() => {
              if (selectedMovie?.type === "movies") {
                dispatch(
                  setVideoToPlay({
                    videoUrl: scene.videoUrl,
                    startTime: 1,
                    endTime: null,
                  })
                );
              } else if (selectedMovie?.type === "scripts") {
                if (scene.pdfFileKey) {
                  WebBrowser.openBrowserAsync(scene.pdfFileKey);
                }
              }
            }}
          >
            {selectedMovie?.type === "movies" &&
              (scene?.thumbnail || scene?.imageFile) && (
                <View style={[styles.imageContainer, styles.previewImage]}>
                  <ExpoImage
                    source={{
                      uri:
                        scene.thumbnail?.includes("main_file") &&
                        scene.imageFile
                          ? scene.imageFile
                          : scene.thumbnail,
                    }}
                    style={styles.previewImage}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                  />
                  <View style={styles.playIconContainer}>
                    <Ionicons
                      name="play-circle"
                      size={40}
                      color="rgba(255, 255, 255, 0.9)"
                      style={styles.playIcon}
                    />
                  </View>
                </View>
              )}

            {selectedMovie?.type === "scripts" && scene?.imageFile && (
              <View style={[styles.imageContainer, styles.previewImage]}>
                <ExpoImage
                  source={{ uri: scene.imageFile }}
                  style={styles.previewImage}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                />
                <View style={styles.pdfIconContainer}>
                  <Ionicons
                    name="document"
                    size={40}
                    color="rgba(255, 255, 255, 0.9)"
                    style={styles.playIcon}
                  />
                </View>
              </View>
            )}
          </Button>
        </Card>

        {!scene.subscenes || scene.subscenes.length === 0 ? (
          <View style={styles.emptyScene}>
            <Text style={styles.emptySceneText}>No subscenes yet.</Text>
            <Button
              mode="contained"
              onPress={() => {
                setCurrentSceneId(scene.id);
                setUploadModalVisible(true);
              }}
              style={styles.uploadButton}
              labelStyle={styles.uploadText}
            >
              Add Subscene
            </Button>
          </View>
        ) : (
          <View style={styles.sceneContainer}>
            <Text style={styles.submissionTitle}>Submissions</Text>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true}>
              {scene.subscenes?.map((subscene) => (
                <SubSceneSection
                  key={subscene.id}
                  sceneId={scene.id}
                  scene={scene}
                  subscene={subscene}
                  uploadVideo={uploadVideo}
                  captureVideo={captureVideo}
                  setUploadModalVisible={setUploadModalVisible}
                  setCurrentSubSceneId={setCurrentSubSceneId}
                />
              ))}
            </ScrollView>
          </View>
        )}
        <Button
          mode="contained"
          style={styles.AIstitchButton}
          labelStyle={styles.AIstitchButtonText}
          onPress={handleAIStitch}
        >
          🎬 AI Stitch
        </Button>
        <Button
          mode="contained"
          onPress={() => {
            setShowStitchedModal(true);
          }}
          style={styles.stitchButton}
          labelStyle={styles.stitchButtonText}
        >
          {getSelectedSubmissionsCount() > 0
            ? `🎬 Stitch Scene (${getSelectedSubmissionsCount()})`
            : "🎬 Stitch Scene"}
        </Button>
      </ScrollView>
      <StitchedPreviewScreen
        visible={showStitchedModal}
        onClose={() => setShowStitchedModal(false)}
        sceneId={scene.id}
      />
      <StitchedPreviewScreen
        visible={showAiStitchedModal}
        onClose={() => setShowAiStitchedModal(false)}
        sceneId={scene.id}
        videoUrl={aiStitchedVideo?.videoUrl}
        AiMode={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 14,
  },
  imageContainer: {
    position: "relative",
  },
  playIconContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -20 }, { translateY: -20 }],
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },

  pdfIconContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -20 }, { translateY: -20 }],
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 10,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },

  sceneScrollContent: {
    width: screenWidth,
    alignSelf: "center",
    paddingBottom: 40,
  },
  title: {
    fontSize: 17,
    fontWeight: "500",
  },
  submissionTitle: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 12,
    letterSpacing: 1.2,
    paddingHorizontal: 16,
  },

  sceneContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 16,
    marginHorizontal: 16,
  },

  stitchButton: {
    backgroundColor: colors.primaryBg,
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginVertical: 20,
  },
  stitchButtonText: {
    color: "#fdbd18",
  },
  AIstitchButton: {
    backgroundColor: "#fdbd18",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginVertical: 20,
  },
  AIstitchButtonText: {
    color: colors.primaryBg,
  },

  emptyScene: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  emptySceneText: {
    color: colors.secondaryBg,
    fontSize: 16,
    marginBottom: 12,
  },
  uploadButton: {
    backgroundColor: "#1f1f1f",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FFD700",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  uploadText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  sceneTitleContainer: {
    marginVertical: 26,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "#fff",
  },

  previewButton: {
    width: "100%",
    paddingBottom: 4,
  },

  buttonContent: {
    padding: 0,
  },

  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 20,
    backgroundColor: "#000",
  },
});

export default SceneSection;
